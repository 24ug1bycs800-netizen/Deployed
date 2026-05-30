import React, { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext.js";
import { useCityStore } from "../store/useCityStore.js";
import {
  Users,
  Vote,
  CheckCircle,
  Trophy,
  Play,
  Copy,
  Check,
  MessageSquare,
  AlertCircle,
  Compass,
  ShieldAlert,
} from "lucide-react";
import api from "../services/api.js";

interface Room {
  id: number;
  name: string;
  creatorId: number;
  inviteCode: string;
  status: string; // 'voting' | 'finalizing' | 'booked'
  selectedMovieId?: number;
  selectedTheatreId?: number;
  selectedShowId?: number;
}

interface Member {
  id: number;
  joinedAt: string;
  user: { id: number; fullName: string; email: string; profilePic?: string };
}

interface VoteCount {
  id: number;
  title?: string;
  name?: string;
  startTime?: string;
  date?: string;
  votes: number;
}

export const GroupBooking: React.FC = () => {
  const { inviteCode } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  const { selectedCity } = useCityStore();

  const [room, setRoom] = useState<Room | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [moviesList, setMoviesList] = useState<any[]>([]);
  const [theatresList, setTheatresList] = useState<any[]>([]);
  const [showsList, setShowsList] = useState<any[]>([]);

  // Voting tallies
  const [movieVotes, setMovieVotes] = useState<VoteCount[]>([]);
  const [theatreVotes, setTheatreVotes] = useState<VoteCount[]>([]);
  const [showtimeVotes, setShowtimeVotes] = useState<VoteCount[]>([]);
  const [rawVotes, setRawVotes] = useState<any[]>([]);

  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  // Dropdown options for voting pool
  const [selectedMovieVote, setSelectedMovieVote] = useState<number | "">("");
  const [selectedTheatreVote, setSelectedTheatreVote] = useState<number | "">(
    "",
  );
  const [selectedShowtimeVote, setSelectedShowtimeVote] = useState<number | "">(
    "",
  );

  const fetchRoomData = async () => {
    try {
      const res = await api.get(`/groups/${inviteCode}`);
      setRoom(res.data.room);
      setMembers(res.data.members);
      setMovieVotes(res.data.votingResults.movies);
      setTheatreVotes(res.data.votingResults.theatres);
      setShowtimeVotes(res.data.votingResults.showtimes);
      setRawVotes(res.data.rawVotes);

      const r = res.data.room as Room;

      // Automatically fetch supporting seed options for user dropdown selections
      const nowMovies = await api.get("/movies?isNowShowing=true");
      setMoviesList(nowMovies.data.movies);

      const localTheatres = await api.get(
        `/theatres?citySlug=${selectedCity.slug}`,
      );
      setTheatresList(localTheatres.data.theatres);

      // Fetch shows for the top voted movie or any selected now-showing movie
      // In a group room, shows list are computed based on city and top movie
      const topMovie = res.data.votingResults.movies.sort(
        (a: any, b: any) => b.votes - a.votes,
      )[0];
      if (topMovie || r.selectedMovieId) {
        const mId = r.selectedMovieId || topMovie.id;
        const showsRes = await api.get(
          `/shows?movieId=${mId}&citySlug=${selectedCity.slug}`,
        );
        setShowsList(showsRes.data.shows);
      }
    } catch (err) {
      console.error(err);
      setError("Unable to retrieve group room. Verify code correctness.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user) {
      navigate("/auth", { state: { from: `/group/${inviteCode}` } });
      return;
    }
    fetchRoomData();
  }, [inviteCode, user, selectedCity]);

  // Long poll or trigger every 8 seconds to mock real-time syncing of choices between peers
  useEffect(() => {
    if (!room || room.status !== "voting") return;
    const interval = setInterval(() => {
      fetchRoomData();
    }, 8000);
    return () => clearInterval(interval);
  }, [room]);

  const handleCopyLink = () => {
    const link = `${window.location.origin}/group/${inviteCode}`;
    navigator.clipboard.writeText(link);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  };

  const handleCastVote = async (
    type: "movie" | "theatre" | "showtime",
    votedId: number,
  ) => {
    try {
      await api.post(`/groups/${room?.id}/vote`, { voteType: type, votedId });
      await fetchRoomData(); // reload
    } catch (err) {
      console.error(err);
    }
  };

  const handleFinalizeRoom = async () => {
    // Creator locks choices based on highest votes
    const topMovie = movieVotes.sort((a, b) => b.votes - a.votes)[0];
    const topTheatre = theatreVotes.sort((a, b) => b.votes - a.votes)[0];
    const topShow = showtimeVotes.sort((a, b) => b.votes - a.votes)[0];

    if (!topMovie || !topTheatre || !topShow) {
      setError(
        "At least one vote must be submitted for Movie, Theatre, and Showtime before finalization.",
      );
      setTimeout(() => setError(""), 5000);
      return;
    }

    try {
      await api.post(`/groups/${room?.id}/finalize`, {
        movieId: topMovie.id,
        theatreId: topTheatre.id,
        showId: topShow.id,
      });
      await fetchRoomData();
    } catch (err: any) {
      setError(err.response?.data?.error || "Failed to finalize choices.");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white">
        <div className="w-12 h-12 border-t-2 border-primary border-solid rounded-full animate-spin"></div>
      </div>
    );
  }

  if (!room) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center text-white p-6 text-center">
        <div className="bg-card border border-gray-700 max-w-md p-8 rounded-2xl border border-neutral-900">
          <AlertCircle className="w-12 h-12 text-error mx-auto mb-4" />
          <h3 className="text-xl font-bold">Room Not Found</h3>
          <p className="text-sm text-neutral-500 font-inter mt-2">
            The collaborative planning room code is either invalid or expired.
          </p>
          <button
            onClick={() => navigate("/")}
            className="mt-6 px-6 py-2.5 bg-primary text-white font-bold rounded-xl text-sm"
          >
            Return Home
          </button>
        </div>
      </div>
    );
  }

  const isCreator = room.creatorId === user?.id;

  // Calculate vote percentage bars
  const totalMovieVotes = movieVotes.reduce((sum, v) => sum + v.votes, 0) || 1;
  const totalTheatreVotes =
    theatreVotes.reduce((sum, v) => sum + v.votes, 0) || 1;
  const totalShowtimeVotes =
    showtimeVotes.reduce((sum, v) => sum + v.votes, 0) || 1;

  return (
    <div className="min-h-screen bg-background text-white pb-20 font-poppins relative">
      <div className="max-w-7xl mx-auto px-6 sm:px-12 py-12 space-y-8">
        {/* 1. ROOM HEADER & INVITE BADGE */}
        <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative">
          <div className="absolute top-0 right-0 w-80 h-48 rounded-full bg-primary opacity-5 blur-[90px]"></div>
          <div>
            <span className="px-2.5 py-0.5 bg-primary bg-opacity-15 border border-primary border-opacity-35 rounded text-[10px] font-bold text-primary uppercase tracking-wide">
              {room.status === "voting"
                ? "🗳️ Voting Phase Active"
                : "🏆 Selections Finalized"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black mt-2">
              {room.name}
            </h1>
            <p className="text-xs text-neutral-500 font-inter mt-1.5 flex items-center gap-1">
              <Compass className="w-3.5 h-3.5 text-neutral-600" /> City Context:{" "}
              <strong>{selectedCity.name}</strong>
            </p>
          </div>

          <div className="flex flex-wrap gap-3 items-center">
            {/* INVITE CODE BADGE */}
            <div className="p-3 bg-neutral-950 bg-opacity-50 border border-neutral-900 rounded-xl flex items-center gap-4">
              <div>
                <span className="block text-[8px] text-neutral-600 font-bold uppercase">
                  ROOM CODE
                </span>
                <strong className="text-base text-accent font-mono tracking-wider">
                  {room.inviteCode}
                </strong>
              </div>
              <button
                onClick={handleCopyLink}
                className="p-2 rounded-lg bg-neutral-900 hover:bg-neutral-800 text-muted hover:text-white border border-neutral-850 hover:border-primary transition-all flex items-center gap-1 text-xs"
              >
                {copied ? (
                  <Check className="w-4 h-4 text-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
                {copied ? "Copied" : "Share Link"}
              </button>
            </div>
          </div>
        </div>

        {error && (
          <div className="p-4 bg-error bg-opacity-10 border border-error border-opacity-30 rounded-xl flex items-center gap-2.5 text-sm text-red-400 font-inter">
            <AlertCircle className="w-4 h-4 flex-shrink-0" />
            {error}
          </div>
        )}

        {/* 2. MAIN LAYOUT GRID */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* VOTING BOARDS PANEL (Left 2 columns) */}
          <div className="lg:col-span-2 space-y-6">
            {room.status === "voting" ? (
              <>
                <h2 className="text-xl font-bold border-l-4 border-primary pl-3 flex items-center gap-2">
                  <Vote className="w-5 h-5 text-primary text-premium-card" />{" "}
                  Cast Your Votes
                </h2>

                {/* A. MOVIE VOTING BOARD */}
                <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 space-y-4">
                  <h3 className="font-bold text-sm text-white">
                    1. Select Preferred Movie
                  </h3>
                  <div className="flex gap-2.5 mb-4 font-inter text-xs">
                    <select
                      value={selectedMovieVote}
                      onChange={(e) =>
                        setSelectedMovieVote(
                          e.target.value === "" ? "" : parseInt(e.target.value),
                        )
                      }
                      className="flex-grow p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Choose Now Showing Movies --</option>
                      {moviesList.map((m) => (
                        <option key={m.id} value={m.id}>
                          {m.title} ({m.language})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        selectedMovieVote !== "" &&
                        handleCastVote("movie", selectedMovieVote)
                      }
                      disabled={selectedMovieVote === ""}
                      className="px-5 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-xl disabled:opacity-35 transition-all text-xs"
                    >
                      Cast Movie Vote
                    </button>
                  </div>

                  {/* Movie Vote Progress Lists */}
                  <div className="space-y-3 pt-2">
                    {movieVotes.map((mv) => {
                      const percent = Math.round(
                        (mv.votes / totalMovieVotes) * 100,
                      );
                      const userHasVoted = rawVotes.some(
                        (rv) =>
                          rv.userId === user?.id &&
                          rv.voteType === "movie" &&
                          rv.votedId === mv.id,
                      );

                      return (
                        <div key={mv.id} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white flex items-center gap-1.5">
                              {mv.title}
                              {userHasVoted && (
                                <span className="text-[9px] bg-success bg-opacity-15 border border-success border-opacity-35 rounded px-1.5 py-0.5 text-success">
                                  My Vote
                                </span>
                              )}
                            </span>
                            <span className="text-neutral-500 font-inter">
                              {mv.votes} Votes ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                            <div
                              className="h-full bg-primary rounded-full transition-all duration-500 shadow-xl"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* B. THEATRE VOTING BOARD */}
                <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 space-y-4">
                  <h3 className="font-bold text-sm text-white">
                    2. Select Preferred Theatre
                  </h3>
                  <div className="flex gap-2.5 mb-4 font-inter text-xs">
                    <select
                      value={selectedTheatreVote}
                      onChange={(e) =>
                        setSelectedTheatreVote(
                          e.target.value === "" ? "" : parseInt(e.target.value),
                        )
                      }
                      className="flex-grow p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Choose Local Theatres --</option>
                      {theatresList.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name}
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        selectedTheatreVote !== "" &&
                        handleCastVote("theatre", selectedTheatreVote)
                      }
                      disabled={selectedTheatreVote === ""}
                      className="px-5 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-xl disabled:opacity-35 transition-all text-xs"
                    >
                      Cast Theatre Vote
                    </button>
                  </div>

                  {/* Theatre Vote Bars */}
                  <div className="space-y-3 pt-2">
                    {theatreVotes.map((tv) => {
                      const percent = Math.round(
                        (tv.votes / totalTheatreVotes) * 100,
                      );
                      const userHasVoted = rawVotes.some(
                        (rv) =>
                          rv.userId === user?.id &&
                          rv.voteType === "theatre" &&
                          rv.votedId === tv.id,
                      );

                      return (
                        <div key={tv.id} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white flex items-center gap-1.5">
                              {tv.name}
                              {userHasVoted && (
                                <span className="text-[9px] bg-success bg-opacity-15 border border-success border-opacity-35 rounded px-1.5 py-0.5 text-success">
                                  My Vote
                                </span>
                              )}
                            </span>
                            <span className="text-neutral-500 font-inter">
                              {tv.votes} Votes ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                            <div
                              className="h-full bg-accent rounded-full transition-all duration-500 shadow-xl"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* C. SHOWTIME VOTING BOARD */}
                <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 space-y-4">
                  <div className="flex justify-between items-center">
                    <h3 className="font-bold text-sm text-white">
                      3. Select Preferred Showtime
                    </h3>
                    <span className="text-[10px] text-neutral-500 font-semibold font-inter">
                      Auto-computed from top movie choice
                    </span>
                  </div>
                  <div className="flex gap-2.5 mb-4 font-inter text-xs">
                    <select
                      value={selectedShowtimeVote}
                      onChange={(e) =>
                        setSelectedShowtimeVote(
                          e.target.value === "" ? "" : parseInt(e.target.value),
                        )
                      }
                      className="flex-grow p-3 bg-neutral-900 border border-neutral-800 rounded-xl text-white focus:border-primary focus:outline-none"
                    >
                      <option value="">-- Choose Available Showtimes --</option>
                      {showsList.map((s) => (
                        <option key={s.id} value={s.id}>
                          {s.startTime} ({s.date} - Screen {s.screen.number})
                        </option>
                      ))}
                    </select>
                    <button
                      onClick={() =>
                        selectedShowtimeVote !== "" &&
                        handleCastVote("showtime", selectedShowtimeVote)
                      }
                      disabled={selectedShowtimeVote === ""}
                      className="px-5 py-3 bg-primary hover:bg-secondary text-white font-bold rounded-xl shadow-xl disabled:opacity-35 transition-all text-xs"
                    >
                      Cast Showtime Vote
                    </button>
                  </div>

                  {/* Showtime Vote Bars */}
                  <div className="space-y-3 pt-2">
                    {showtimeVotes.map((sv) => {
                      const percent = Math.round(
                        (sv.votes / totalShowtimeVotes) * 100,
                      );
                      const userHasVoted = rawVotes.some(
                        (rv) =>
                          rv.userId === user?.id &&
                          rv.voteType === "showtime" &&
                          rv.votedId === sv.id,
                      );

                      return (
                        <div key={sv.id} className="space-y-1 text-xs">
                          <div className="flex justify-between font-semibold">
                            <span className="text-white flex items-center gap-1.5">
                              {sv.startTime} ({sv.date})
                              {userHasVoted && (
                                <span className="text-[9px] bg-success bg-opacity-15 border border-success border-opacity-35 rounded px-1.5 py-0.5 text-success">
                                  My Vote
                                </span>
                              )}
                            </span>
                            <span className="text-neutral-500 font-inter">
                              {sv.votes} Votes ({percent}%)
                            </span>
                          </div>
                          <div className="w-full h-2 bg-neutral-900 rounded-full overflow-hidden border border-neutral-850">
                            <div
                              className="h-full bg-indigo-600 rounded-full transition-all duration-500 shadow-xl"
                              style={{ width: `${percent}%` }}
                            ></div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              </>
            ) : (
              // FINALIZED SELECTION SUMMARY CARD
              <div className="p-8 rounded-2xl bg-card border border-gray-700 border border-success border-opacity-35 space-y-6 relative overflow-hidden flex flex-col items-center justify-center text-center">
                <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-success opacity-5 blur-[80px]"></div>

                <div
                  className="w-16 h-16 bg-success bg-opacity-10 border border-success rounded-full flex items-center justify-center text-success shadow-xl animate-bounce"
                  style={{ animationDuration: "4s" }}
                >
                  <Trophy className="w-8 h-8" />
                </div>

                <div>
                  <h3 className="text-2xl font-black text-white font-poppins">
                    Room Choices Finalized!
                  </h3>
                  <p className="text-xs text-neutral-400 font-inter max-w-sm mt-1 mx-auto">
                    Decisions are locked. All members should proceed to the
                    interactive seat coordinations to complete booking.
                  </p>
                </div>

                <button
                  onClick={() =>
                    navigate(`/shows/${room.selectedShowId}/booking`)
                  }
                  className="px-8 py-3.5 bg-success hover:bg-green-600 text-white font-bold font-poppins rounded-xl flex items-center gap-2 shadow-xl hover:scale-105 active:scale-95 transition-all text-sm mt-4 animate-pulse"
                >
                  <CheckCircle className="w-4 h-4" /> Go to Seat Selection
                </button>
              </div>
            )}
          </div>

          {/* GROUP MEMBERS LIST SIDEBAR (Right column) */}
          <div className="space-y-6">
            {/* MEMBERS COUNT */}
            <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 shadow-premium">
              <h4 className="font-bold text-sm text-white mb-4 flex items-center gap-2">
                <Users className="w-4 h-4 text-primary" /> Members Joined (
                {members.length})
              </h4>
              <div className="space-y-3.5 font-inter text-xs max-h-60 overflow-y-auto pr-1">
                {members.map((m) => (
                  <div
                    key={m.id}
                    className="flex items-center justify-between p-2.5 rounded-lg bg-neutral-950 bg-opacity-30 border border-neutral-900"
                  >
                    <div className="flex items-center gap-2.5">
                      {m.user.profilePic ? (
                        <img
                          src={m.user.profilePic}
                          alt="pic"
                          className="w-7 h-7 rounded-full"
                        />
                      ) : (
                        <div className="w-7 h-7 rounded-full bg-neutral-800 border border-neutral-700 flex items-center justify-center text-[10px] font-bold uppercase text-neutral-400">
                          {m.user.fullName.substring(0, 2)}
                        </div>
                      )}
                      <div>
                        <span className="font-bold text-white block">
                          {m.user.fullName}
                        </span>
                        <span className="text-[10px] text-neutral-500 truncate max-w-36 block">
                          {m.user.email}
                        </span>
                      </div>
                    </div>
                    {/* Status Badge */}
                    <span className="text-[8px] uppercase tracking-wide font-bold font-poppins text-neutral-500">
                      Joined
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* CREATOR ACTION WIDGET */}
            {room.status === "voting" && (
              <div className="p-6 rounded-2xl bg-card border border-gray-700 border border-neutral-900 shadow-premium">
                <h4 className="font-bold text-sm text-white mb-3 flex items-center gap-2">
                  <Trophy className="w-4 h-4 text-accent" /> Creator Control
                  Center
                </h4>
                <p className="text-xs text-neutral-500 font-inter leading-relaxed mb-5">
                  As the CineCircle Room leader, you can declare voting
                  concluded and finalize the choices based on current leading
                  votes.
                </p>

                {isCreator ? (
                  <button
                    onClick={handleFinalizeRoom}
                    className="w-full py-3 bg-primary hover:bg-secondary text-white font-bold font-poppins rounded-xl flex items-center justify-center gap-1.5 shadow-xl hover:scale-[1.01] active:scale-[0.99] transition-all text-xs"
                  >
                    <CheckCircle className="w-4 h-4" /> Conclude Voting &
                    Finalize
                  </button>
                ) : (
                  <div className="p-3.5 bg-neutral-950 rounded-xl border border-neutral-850 flex items-start gap-2.5 text-xs text-neutral-500 font-inter">
                    <ShieldAlert className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
                    <span>
                      Only the room host (
                      <strong>
                        {members.find((m) => m.user.id === room.creatorId)?.user
                          .fullName || "Creator"}
                      </strong>
                      ) can finalize voting coordinates. Stay synced for
                      updates!
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
