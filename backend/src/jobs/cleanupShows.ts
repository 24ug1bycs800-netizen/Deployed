import { and, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db";
import { groupRooms, movies, seatLocks, shows } from "../db/schema";

const getToday = () => new Date().toISOString().slice(0, 10);

// Hard-deletes all shows whose date is strictly before today.
// Cleans up seat locks and group room references first.
export const deletePastShows = async () => {
  const today = getToday();
  try {
    const pastShows = await db
      .select({ id: shows.id })
      .from(shows)
      .where(sql`${shows.date} < ${today}`);

    if (pastShows.length === 0) return;

    const ids = pastShows.map((s) => s.id);

    await db.delete(seatLocks).where(inArray(seatLocks.showId, ids));
    await db
      .update(groupRooms)
      .set({ selectedShowId: null })
      .where(inArray(groupRooms.selectedShowId as any, ids));
    await db.delete(shows).where(inArray(shows.id, ids));

    console.log(`[cleanup] Deleted ${ids.length} past show(s) (date < ${today})`);
  } catch (err) {
    console.error("[cleanup] Failed to delete past shows:", err);
  }
};

// Flips isNowShowing = true for any movie whose releaseDate has arrived.
export const promoteReleasedMovies = async () => {
  const today = getToday();
  try {
    const result = await db
      .update(movies)
      .set({ isNowShowing: true })
      .where(
        and(
          eq(movies.isNowShowing, false),
          sql`${movies.releaseDate} <= ${today}`
        )
      )
      .returning({ id: movies.id, title: movies.title });

    if (result.length > 0) {
      console.log(`[release] ${result.length} movie(s) now showing: ${result.map(m => m.title).join(", ")}`);
    }
  } catch (err) {
    console.error("[release] Failed to promote released movies:", err);
  }
};

// Runs both jobs together — called on startup and every midnight.
const runDailyJobs = async () => {
  await deletePastShows();
  await promoteReleasedMovies();
};

// Schedules daily jobs to run at midnight every day.
// Also runs once immediately on server startup to catch anything
// that changed while the server was offline.
export const startCleanupScheduler = () => {
  runDailyJobs();

  const msUntilMidnight = () => {
    const now = new Date();
    const midnight = new Date(now);
    midnight.setHours(24, 0, 0, 0);
    return midnight.getTime() - now.getTime();
  };

  setTimeout(() => {
    runDailyJobs();
    setInterval(runDailyJobs, 24 * 60 * 60 * 1000);
  }, msUntilMidnight());

  console.log(`[scheduler] Started — next run in ${Math.round(msUntilMidnight() / 60000)} min`);
};
