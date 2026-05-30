import { Request, Response } from "express";
import { isFallback, db, fallbackDb } from "../db/db";
import {
  groupRooms,
  groupMembers,
  votes,
  users,
  movies,
  theatres,
  shows,
  screens,
} from "../db/schema";
import { eq, and } from "drizzle-orm";
import crypto from "crypto";

// CREATE GROUP ROOM
export const createGroupRoom = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { name } = req.body;

    if (!name) {
      return res.status(400).json({ error: "Room name is required" });
    }

    const inviteCode = crypto.randomBytes(3).toString("hex").toUpperCase(); // 6 character code

    let newRoom: any = null;

    if (isFallback) {
      const roomId = fallbackDb.groupRooms.length + 1;
      newRoom = {
        id: roomId,
        name,
        creatorId: user.id,
        inviteCode,
        status: "voting",
        createdAt: new Date().toISOString(),
      };
      fallbackDb.groupRooms.push(newRoom);

      // Creator automatically joins as member
      fallbackDb.groupMembers.push({
        id: fallbackDb.groupMembers.length + 1,
        roomId,
        userId: user.id,
        joinedAt: new Date().toISOString(),
      });

      fallbackDb.save();
    } else {
      const inserted = await db
        .insert(groupRooms)
        .values({
          name,
          creatorId: user.id,
          inviteCode,
          status: "voting",
        })
        .returning();
      newRoom = inserted[0];

      // Add creator as member
      await db.insert(groupMembers).values({
        roomId: newRoom.id,
        userId: user.id,
      });
    }

    res.status(201).json({
      message: "Group room created successfully",
      room: newRoom,
      inviteLink: `/group/${inviteCode}`,
    });
  } catch (err) {
    console.error("Create group room error:", err);
    res
      .status(500)
      .json({ error: "Internal server error creating group room" });
  }
};

// GET GROUP ROOM BY INVITE CODE / ID
export const getGroupRoom = async (req: Request, res: Response) => {
  try {
    const { inviteCode } = req.params;
    let room: any = null;
    let membersList: any[] = [];
    let votesList: any[] = [];

    if (isFallback) {
      room = fallbackDb.groupRooms.find(
        (r) => r.inviteCode === inviteCode || String(r.id) === inviteCode,
      );
      if (!room) return res.status(404).json({ error: "Group room not found" });

      membersList = fallbackDb.groupMembers
        .filter((m) => m.roomId === room.id)
        .map((m) => {
          const u = fallbackDb.users.find((user) => user.id === m.userId);
          return {
            id: m.id,
            joinedAt: m.joinedAt,
            user: u
              ? {
                  id: u.id,
                  fullName: u.fullName,
                  email: u.email,
                  profilePic: u.profilePic,
                }
              : null,
          };
        });

      votesList = fallbackDb.votes.filter((v) => v.roomId === room.id);
    } else {
      const dbRooms = await db
        .select()
        .from(groupRooms)
        .where(eq(groupRooms.inviteCode, inviteCode))
        .limit(1);
      room = dbRooms[0];
      if (!room) {
        // Check by ID if invite code didn't match
        const dbRoomsId = await db
          .select()
          .from(groupRooms)
          .where(eq(groupRooms.id, parseInt(inviteCode)))
          .limit(1);
        room = dbRoomsId[0];
      }

      if (!room) return res.status(404).json({ error: "Group room not found" });

      const dbMembers = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.roomId, room.id));
      for (const m of dbMembers) {
        const u = await db
          .select()
          .from(users)
          .where(eq(users.id, m.userId))
          .limit(1);
        membersList.push({
          id: m.id,
          joinedAt: m.joinedAt,
          user: u[0]
            ? {
                id: u[0].id,
                fullName: u[0].fullName,
                email: u[0].email,
                profilePic: u[0].profilePic,
              }
            : null,
        });
      }

      votesList = await db
        .select()
        .from(votes)
        .where(eq(votes.roomId, room.id));
    }

    // CALCULATE VOTE TALLIES FOR MOVIES, THEATRES, SHOWTIMES
    const movieVotes: Record<number, number> = {};
    const theatreVotes: Record<number, number> = {};
    const showtimeVotes: Record<number, number> = {};

    votesList.forEach((v) => {
      if (v.voteType === "movie") {
        movieVotes[v.votedId] = (movieVotes[v.votedId] || 0) + 1;
      } else if (v.voteType === "theatre") {
        theatreVotes[v.votedId] = (theatreVotes[v.votedId] || 0) + 1;
      } else if (v.voteType === "showtime") {
        showtimeVotes[v.votedId] = (showtimeVotes[v.votedId] || 0) + 1;
      }
    });

    // Hydrate options with their names
    const hydratedMovies = Object.entries(movieVotes).map(([mId, count]) => {
      const movie = isFallback
        ? fallbackDb.movies.find((m) => m.id === parseInt(mId))
        : null; // Hydration will occur frontend, but sending details helps
      return {
        id: parseInt(mId),
        title: movie?.title || `Movie #${mId}`,
        votes: count,
      };
    });

    const hydratedTheatres = Object.entries(theatreVotes).map(
      ([tId, count]) => {
        const theatre = isFallback
          ? fallbackDb.theatres.find((t) => t.id === parseInt(tId))
          : null;
        return {
          id: parseInt(tId),
          name: theatre?.name || `Theatre #${tId}`,
          votes: count,
        };
      },
    );

    const hydratedShowtimes = Object.entries(showtimeVotes).map(
      ([sId, count]) => {
        const show = isFallback
          ? fallbackDb.shows.find((s) => s.id === parseInt(sId))
          : null;
        return {
          id: parseInt(sId),
          startTime: show?.startTime || `Showtime #${sId}`,
          date: show?.date,
          votes: count,
        };
      },
    );

    res.status(200).json({
      room,
      members: membersList,
      votingResults: {
        movies: hydratedMovies,
        theatres: hydratedTheatres,
        showtimes: hydratedShowtimes,
      },
      rawVotes: votesList,
    });
  } catch (err) {
    console.error("Fetch group room error:", err);
    res
      .status(500)
      .json({ error: "Internal server error fetching group room details" });
  }
};

// JOIN GROUP ROOM
export const joinGroupRoom = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const { inviteCode } = req.body;

    if (!inviteCode) {
      return res
        .status(400)
        .json({ error: "inviteCode is required to join a room" });
    }

    let room: any = null;

    if (isFallback) {
      room = fallbackDb.groupRooms.find(
        (r) => r.inviteCode === inviteCode.toUpperCase(),
      );
      if (!room) return res.status(404).json({ error: "Invalid invite code" });

      // Check if already a member
      const existing = fallbackDb.groupMembers.find(
        (m) => m.roomId === room.id && m.userId === user.id,
      );
      if (!existing) {
        fallbackDb.groupMembers.push({
          id: fallbackDb.groupMembers.length + 1,
          roomId: room.id,
          userId: user.id,
          joinedAt: new Date().toISOString(),
        });
        fallbackDb.save();
      }
    } else {
      const dbRooms = await db
        .select()
        .from(groupRooms)
        .where(eq(groupRooms.inviteCode, inviteCode.toUpperCase()))
        .limit(1);
      room = dbRooms[0];
      if (!room) return res.status(404).json({ error: "Invalid invite code" });

      const existing = await db
        .select()
        .from(groupMembers)
        .where(
          and(
            eq(groupMembers.roomId, room.id),
            eq(groupMembers.userId, user.id),
          ),
        )
        .limit(1);
      if (!existing[0]) {
        await db.insert(groupMembers).values({
          roomId: room.id,
          userId: user.id,
        });
      }
    }

    res.status(200).json({
      message: "Joined group room successfully",
      roomId: room.id,
      roomName: room.name,
      inviteCode: room.inviteCode,
    });
  } catch (err) {
    console.error("Join group room error:", err);
    res.status(500).json({ error: "Internal server error joining group room" });
  }
};

// CAST VOTE
export const castVote = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const roomId = parseInt(req.params.id);
    const { voteType, votedId } = req.body; // voteType: 'movie' | 'theatre' | 'showtime'

    if (isNaN(roomId) || !voteType || votedId === undefined) {
      return res
        .status(400)
        .json({ error: "roomId, voteType, and votedId are required" });
    }

    if (isFallback) {
      const room = fallbackDb.groupRooms.find((r) => r.id === roomId);
      if (!room) return res.status(404).json({ error: "Room not found" });

      // Remove existing vote of same type by this user in this room
      const existingVoteIdx = fallbackDb.votes.findIndex(
        (v) =>
          v.roomId === roomId &&
          v.userId === user.id &&
          v.voteType === voteType,
      );
      if (existingVoteIdx !== -1) {
        fallbackDb.votes.splice(existingVoteIdx, 1);
      }

      // Add new vote
      fallbackDb.votes.push({
        id: fallbackDb.votes.length + 1,
        roomId,
        userId: user.id,
        voteType,
        votedId: parseInt(votedId),
      });
      fallbackDb.save();
    } else {
      // Remove existing vote first in pg
      // We will perform deletion first
      await db
        .delete(votes)
        .where(
          and(
            eq(votes.roomId, roomId),
            eq(votes.userId, user.id),
            eq(votes.voteType, voteType),
          ),
        );
      await db.insert(votes).values({
        roomId,
        userId: user.id,
        voteType,
        votedId: parseInt(votedId),
      });
    }

    res.status(200).json({ message: "Vote submitted successfully" });
  } catch (err) {
    console.error("Cast vote error:", err);
    res.status(500).json({ error: "Internal server error casting vote" });
  }
};

// FINALIZE GROUP ROOM SELECTIONS
export const finalizeSelections = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    const roomId = parseInt(req.params.id);
    const { movieId, theatreId, showId } = req.body;

    if (isNaN(roomId) || !movieId || !theatreId || !showId) {
      return res.status(400).json({
        error:
          "roomId, movieId, theatreId, and showId are required to finalize room bookings",
      });
    }

    let room: any = null;

    if (isFallback) {
      room = fallbackDb.groupRooms.find((r) => r.id === roomId);
      if (!room) return res.status(404).json({ error: "Room not found" });
      if (room.creatorId !== user.id) {
        return res
          .status(403)
          .json({ error: "Only the room creator can finalize plans" });
      }

      room.status = "finalizing";
      room.selectedMovieId = parseInt(movieId);
      room.selectedTheatreId = parseInt(theatreId);
      room.selectedShowId = parseInt(showId);
      fallbackDb.save();
    } else {
      const dbRooms = await db
        .select()
        .from(groupRooms)
        .where(eq(groupRooms.id, roomId))
        .limit(1);
      room = dbRooms[0];
      if (!room) return res.status(404).json({ error: "Room not found" });
      if (room.creatorId !== user.id) {
        return res
          .status(403)
          .json({ error: "Only the room creator can finalize plans" });
      }

      const updated = await db
        .update(groupRooms)
        .set({
          status: "finalizing",
          selectedMovieId: parseInt(movieId),
          selectedTheatreId: parseInt(theatreId),
          selectedShowId: parseInt(showId),
        })
        .where(eq(groupRooms.id, roomId))
        .returning();
      room = updated[0];
    }

    res.status(200).json({
      message: "Group selections finalized. Redirecting to seat booking!",
      room,
    });
  } catch (err) {
    console.error("Finalize selections error:", err);
    res
      .status(500)
      .json({ error: "Internal server error finalizing selections" });
  }
};

// GET USER'S JOINED GROUP ROOMS
export const getMyGroupRooms = async (req: Request, res: Response) => {
  try {
    const user = (req as any).user;
    let list: any[] = [];

    if (isFallback) {
      const memberRooms = fallbackDb.groupMembers.filter(
        (m) => m.userId === user.id,
      );
      const roomIds = memberRooms.map((m) => m.roomId);
      const rooms = fallbackDb.groupRooms.filter((r) => roomIds.includes(r.id));

      list = rooms.map((r) => {
        const creator = fallbackDb.users.find((u) => u.id === r.creatorId)!;
        const membersCount = fallbackDb.groupMembers.filter(
          (gm) => gm.roomId === r.id,
        ).length;
        const movie = r.selectedMovieId
          ? fallbackDb.movies.find((m) => m.id === r.selectedMovieId)
          : null;
        return {
          ...r,
          creator: { id: creator.id, fullName: creator.fullName },
          membersCount,
          movie,
        };
      });
    } else {
      const memberRooms = await db
        .select()
        .from(groupMembers)
        .where(eq(groupMembers.userId, user.id));
      const rIds = memberRooms.map((m) => m.roomId);

      const allRooms = await db.select().from(groupRooms);
      const filteredRooms = allRooms.filter((r) => rIds.includes(r.id));

      for (const r of filteredRooms) {
        const creator = await db
          .select()
          .from(users)
          .where(eq(users.id, r.creatorId))
          .limit(1);
        const membersCount = (
          await db
            .select()
            .from(groupMembers)
            .where(eq(groupMembers.roomId, r.id))
        ).length;
        let movie = null;
        if (r.selectedMovieId) {
          const dbMovie = await db
            .select()
            .from(movies)
            .where(eq(movies.id, r.selectedMovieId))
            .limit(1);
          movie = dbMovie[0] || null;
        }

        list.push({
          ...r,
          creator: creator[0]
            ? { id: creator[0].id, fullName: creator[0].fullName }
            : null,
          membersCount,
          movie,
        });
      }
    }

    res.status(200).json({ rooms: list });
  } catch (err) {
    console.error("Fetch my group rooms error:", err);
    res
      .status(500)
      .json({ error: "Internal server error fetching your group rooms" });
  }
};
