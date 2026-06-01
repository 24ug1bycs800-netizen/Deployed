import { Request, Response } from "express";
import { db } from "../db/db";
import { seatLocks } from "../db/schema";
import { and, eq, inArray, lt } from "drizzle-orm";

export const lockSeats = async (
  req: Request,
  res: Response
) => {
  try {
    const user = (req as any).user;

    const { showId, seatIds } = req.body;

    await db
      .delete(seatLocks)
      .where(
        lt(seatLocks.expiresAt, new Date())
      );

    const existingLocks = await db
      .select()
      .from(seatLocks)
      .where(
        and(
          eq(seatLocks.showId, showId),
          inArray(seatLocks.seatId, seatIds)
        )
      );

    if (existingLocks.length > 0) {
      return res.status(409).json({
        error: "Seats already locked"
      });
    }
            
    const expiresAt = new Date(
      Date.now() + 5 * 60 * 1000
    );

    await db.insert(seatLocks).values(
      seatIds.map((seatId: number) => ({
        seatId,
        showId,
        userId: user.id,
        expiresAt
      }))
    );

    return res.json({
      success: true,
      expiresAt
    });
  } catch (err) {
    console.error(err);

    return res.status(500).json({
      error: "Failed to lock seats"
    });
  }
};
export const unlockSeats = async (
  req: Request,
  res: Response
) => {
  const user = (req as any).user;

  const { showId, seatIds } = req.body;

  await db
    .delete(seatLocks)
    .where(
      and(
        eq(seatLocks.showId, showId),
        eq(seatLocks.userId, user.id),
        inArray(seatLocks.seatId, seatIds)
      )
    );

  return res.json({
    success: true
  });
};