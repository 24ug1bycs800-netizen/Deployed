import { Request, Response } from "express";
import { and, asc, desc, eq, inArray, sql } from "drizzle-orm";
import { db } from "../db/db";
import {
  bookings,
  cities,
  groupRooms,
  movies,
  screens,
  seatLocks,
  shows,
  theatres,
  users,
} from "../db/schema";

const DEFAULT_PRICES = {
  regular: 150,
  premium: 250,
  recliner: 450,
};

const GENERATION_TIMES = ["10:00 AM", "07:00 PM"];

const parseInteger = (value: unknown) => Number.parseInt(String(value), 10);

const buildUpcomingDates = (days: number) => {
  const dates: string[] = [];
  const today = new Date();
  const start = new Date(today.getFullYear(), today.getMonth(), today.getDate());

  for (let index = 0; index < days; index += 1) {
    const next = new Date(start);
    next.setDate(start.getDate() + index);
    dates.push(next.toISOString().slice(0, 10));
  }

  return dates;
};

// GET ADMIN DASHBOARD STATS
export const getDashboardStats = async (_req: Request, res: Response) => {
  try {
    const [confirmedRows, totalUsersResult, activeRoomsResult, bookedRoomsResult] =
      await Promise.all([
        db
          .select({
            bookingId: bookings.id,
            totalAmount: bookings.totalAmount,
            createdAt: bookings.createdAt,
            movieTitle: movies.title,
            cityName: cities.name,
          })
          .from(bookings)
          .innerJoin(shows, eq(bookings.showId, shows.id))
          .innerJoin(movies, eq(shows.movieId, movies.id))
          .innerJoin(screens, eq(shows.screenId, screens.id))
          .innerJoin(theatres, eq(screens.theatreId, theatres.id))
          .innerJoin(cities, eq(theatres.cityId, cities.id))
          .where(eq(bookings.status, "confirmed")),
        db.select({ count: sql<number>`count(*)::int` }).from(users),
        db.select({ count: sql<number>`count(*)::int` }).from(groupRooms),
        db
          .select({ count: sql<number>`count(*)::int` })
          .from(groupRooms)
          .where(eq(groupRooms.status, "booked")),
      ]);

    const totalRevenue = confirmedRows.reduce(
      (sum, booking) => sum + booking.totalAmount,
      0
    );

    const kpi = {
      totalRevenue,
      totalBookings: confirmedRows.length,
      totalUsers: totalUsersResult[0]?.count ?? 0,
      activeGroupRooms: activeRoomsResult[0]?.count ?? 0,
    };

    const datesMap: Record<string, { bookings: number; revenue: number }> = {};
    const movieMap: Record<string, { bookings: number; revenue: number }> = {};
    const cityMap: Record<string, number> = {};

    confirmedRows.forEach((booking) => {
      const dateStr = booking.createdAt
        ? new Date(booking.createdAt).toISOString().substring(0, 10)
        : new Date().toISOString().substring(0, 10);

      if (!datesMap[dateStr]) {
        datesMap[dateStr] = { bookings: 0, revenue: 0 };
      }
      datesMap[dateStr].bookings += 1;
      datesMap[dateStr].revenue += booking.totalAmount;

      const movieTitle = booking.movieTitle || "Unknown Movie";
      if (!movieMap[movieTitle]) {
        movieMap[movieTitle] = { bookings: 0, revenue: 0 };
      }
      movieMap[movieTitle].bookings += 1;
      movieMap[movieTitle].revenue += booking.totalAmount;

      const cityName = booking.cityName || "Unknown City";
      cityMap[cityName] = (cityMap[cityName] || 0) + 1;
    });

    const dailyBookings = Object.entries(datesMap)
      .map(([date, value]) => ({
        date,
        bookings: value.bookings,
        revenue: value.revenue,
      }))
      .sort((left, right) => left.date.localeCompare(right.date));

    const popularMovies = Object.entries(movieMap)
      .map(([title, value]) => ({
        title,
        bookings: value.bookings,
        revenue: value.revenue,
      }))
      .sort((left, right) => right.revenue - left.revenue);

    const popularCities = Object.entries(cityMap)
      .map(([name, bookingsCount]) => ({ name, bookings: bookingsCount }))
      .sort((left, right) => right.bookings - left.bookings);

    const bookedRoomCount = bookedRoomsResult[0]?.count ?? 0;
    const groupBookingUsage = [
      {
        name: "Individual Bookings",
        value: Math.max(0, confirmedRows.length - bookedRoomCount * 3),
      },
      { name: "Group Bookings", value: bookedRoomCount * 3 || 0 },
    ];

    return res.status(200).json({
      kpi,
      charts: { dailyBookings, popularMovies, popularCities, groupBookingUsage },
    });
  } catch (err) {
    console.error("Fetch dashboard stats error:", err);
    return res
      .status(500)
      .json({ error: "Internal server error fetching admin stats" });
  }
};

// ADD MOVIE
export const addMovie = async (req: Request, res: Response) => {
  try {
    const {
      title,
      description,
      genre,
      language,
      durationMins,
      rating,
      ratingValue,
      releaseDate,
      trailerUrl,
      posterUrl,
      isNowShowing,
    } = req.body;

    if (
      !title ||
      !description ||
      !genre ||
      !language ||
      !durationMins ||
      !rating ||
      !releaseDate ||
      !posterUrl
    ) {
      return res.status(400).json({ error: "Missing required movie fields" });
    }

    const inserted = await db
      .insert(movies)
      .values({
        title,
        description,
        genre,
        language,
        durationMins: parseInteger(durationMins),
        rating,
        ratingValue: ratingValue || "4.5",
        releaseDate,
        trailerUrl,
        posterUrl,
        isNowShowing:
          isNowShowing === undefined
            ? true
            : isNowShowing === "true" || isNowShowing === true,
      })
      .returning();

    return res
      .status(201)
      .json({ message: "Movie added successfully", movie: inserted[0] });
  } catch (err) {
    console.error("Admin add movie error:", err);
    return res.status(500).json({ error: "Internal server error adding movie" });
  }
};

// ADD SHOW
export const addShow = async (req: Request, res: Response) => {
  try {
    const {
      movieId,
      screenId,
      startTime,
      date,
      priceRegular,
      pricePremium,
      priceRecliner,
    } = req.body;

    const parsedMovieId = parseInteger(movieId);
    const parsedScreenId = parseInteger(screenId);
    const parsedPriceRegular = parseInteger(priceRegular);
    const parsedPricePremium = parseInteger(pricePremium);
    const parsedPriceRecliner = parseInteger(priceRecliner);

    console.info("[admin:addShow] request", {
      movieId,
      screenId,
      parsedMovieId,
      parsedScreenId,
      startTime,
      date,
    });

    if (!movieId || !screenId || !startTime || !date) {
      return res.status(400).json({
        error: "movieId, screenId, startTime, and date are required",
      });
    }

    if (Number.isNaN(parsedMovieId) || Number.isNaN(parsedScreenId)) {
      return res
        .status(400)
        .json({ error: "movieId and screenId must be valid numbers" });
    }

    const [movie, screen] = await Promise.all([
      db
        .select({ id: movies.id, title: movies.title })
        .from(movies)
        .where(eq(movies.id, parsedMovieId))
        .limit(1),
      db
        .select({ id: screens.id, number: screens.number, theatreId: screens.theatreId })
        .from(screens)
        .where(eq(screens.id, parsedScreenId))
        .limit(1),
    ]);

    if (!movie[0]) {
      return res
        .status(400)
        .json({ error: `Movie ${parsedMovieId} does not exist` });
    }

    if (!screen[0]) {
      return res
        .status(400)
        .json({ error: `Screen ${parsedScreenId} does not exist` });
    }

    const inserted = await db
      .insert(shows)
      .values({
        movieId: parsedMovieId,
        screenId: parsedScreenId,
        startTime,
        date,
        priceRegular: Number.isNaN(parsedPriceRegular)
          ? DEFAULT_PRICES.regular
          : parsedPriceRegular,
        pricePremium: Number.isNaN(parsedPricePremium)
          ? DEFAULT_PRICES.premium
          : parsedPricePremium,
        priceRecliner: Number.isNaN(parsedPriceRecliner)
          ? DEFAULT_PRICES.recliner
          : parsedPriceRecliner,
      })
      .returning();

    console.info("[admin:addShow] inserted", { showId: inserted[0]?.id });

    return res
      .status(201)
      .json({ message: "Showtime added successfully", show: inserted[0] });
  } catch (err) {
    console.error("[admin:addShow] failed", {
      body: req.body,
      error: err,
      code: (err as any)?.code,
      detail: (err as any)?.detail,
      constraint: (err as any)?.constraint,
      table: (err as any)?.table,
      column: (err as any)?.column,
    });

    return res.status(500).json({
      error: "Internal server error adding showtime",
      details: String(err),
    });
  }
};

// GENERATE SHOWS
export const generateShows = async (req: Request, res: Response) => {
  try {
    const {
      movieId,
      cityIds = [],
      theatreIds = [],
      screenIds = [],
      startTimes = GENERATION_TIMES,
      priceRegular,
      pricePremium,
      priceRecliner,
    } = req.body;

    const parsedMovieId = parseInteger(movieId);
    const parsedCityIds = Array.isArray(cityIds)
      ? cityIds.map((value: unknown) => parseInteger(value)).filter(Number.isFinite)
      : [];
    const parsedTheatreIds = Array.isArray(theatreIds)
      ? theatreIds.map((value: unknown) => parseInteger(value)).filter(Number.isFinite)
      : [];
    const parsedScreenIds = Array.isArray(screenIds)
      ? screenIds.map((value: unknown) => parseInteger(value)).filter(Number.isFinite)
      : [];
    const safeStartTimes = Array.isArray(startTimes) && startTimes.length > 0
      ? startTimes.map((value: unknown) => String(value))
      : GENERATION_TIMES;

    if (Number.isNaN(parsedMovieId)) {
      return res.status(400).json({ error: "A valid movie selection is required" });
    }

    if (parsedCityIds.length === 0) {
      return res
        .status(400)
        .json({ error: "Select at least one location before generating shows" });
    }

    const [movie] = await db
      .select({ id: movies.id, title: movies.title })
      .from(movies)
      .where(eq(movies.id, parsedMovieId))
      .limit(1);

    if (!movie) {
      return res.status(404).json({ error: "Selected movie was not found" });
    }

    let screenQuery = db
      .select({
        screenId: screens.id,
        screenNumber: screens.number,
        theatreId: theatres.id,
        cityId: cities.id,
      })
      .from(screens)
      .innerJoin(theatres, eq(screens.theatreId, theatres.id))
      .innerJoin(cities, eq(theatres.cityId, cities.id))
      .where(inArray(cities.id, parsedCityIds))
      .$dynamic();

    if (parsedTheatreIds.length > 0) {
      screenQuery = screenQuery.where(inArray(theatres.id, parsedTheatreIds));
    }

    if (parsedScreenIds.length > 0) {
      screenQuery = screenQuery.where(inArray(screens.id, parsedScreenIds));
    }

    const availableScreens = await screenQuery.orderBy(
      asc(cities.name),
      asc(theatres.name),
      asc(screens.number)
    );

    if (availableScreens.length === 0) {
      return res.status(400).json({
        error: "No screens matched the selected locations and theatres",
      });
    }

    const targetScreenIds = availableScreens.map((screen) => screen.screenId);
    const upcomingDates = buildUpcomingDates(30);

    const existingShows = await db
      .select({
        screenId: shows.screenId,
        date: shows.date,
        startTime: shows.startTime,
      })
      .from(shows)
      .where(inArray(shows.screenId, targetScreenIds));

    const existingKeys = new Set(
      existingShows.map(
        (show) => `${show.screenId}::${show.date}::${show.startTime}`
      )
    );

    const valuesToInsert: Array<typeof shows.$inferInsert> = [];
    let skipped = 0;

    for (const screen of availableScreens) {
      for (const date of upcomingDates) {
        for (const startTime of safeStartTimes) {
          const key = `${screen.screenId}::${date}::${startTime}`;
          if (existingKeys.has(key)) {
            skipped += 1;
            continue;
          }

          valuesToInsert.push({
            movieId: parsedMovieId,
            screenId: screen.screenId,
            date,
            startTime,
            priceRegular: Number.isNaN(parseInteger(priceRegular))
              ? DEFAULT_PRICES.regular
              : parseInteger(priceRegular),
            pricePremium: Number.isNaN(parseInteger(pricePremium))
              ? DEFAULT_PRICES.premium
              : parseInteger(pricePremium),
            priceRecliner: Number.isNaN(parseInteger(priceRecliner))
              ? DEFAULT_PRICES.recliner
              : parseInteger(priceRecliner),
          });
          existingKeys.add(key);
        }
      }
    }

    if (valuesToInsert.length > 0) {
      await db.insert(shows).values(valuesToInsert);
    }

    return res.status(200).json({
      message: "Show generation completed",
      created: valuesToInsert.length,
      skipped,
    });
  } catch (err) {
    console.error("[admin:generateShows] failed", {
      body: req.body,
      error: err,
    });
    return res
      .status(500)
      .json({ error: "Internal server error generating shows" });
  }
};

// DELETE MOVIE
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const id = parseInteger(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid movie ID" });
    }

    await db.delete(movies).where(eq(movies.id, id));
    return res.status(200).json({ message: "Movie deleted successfully" });
  } catch (err) {
    console.error("Delete movie error:", err);
    return res.status(500).json({ error: "Internal server error deleting movie" });
  }
};

// DELETE SHOW
export const deleteShow = async (req: Request, res: Response) => {
  try {
    const id = parseInteger(req.params.id);
    if (Number.isNaN(id)) {
      return res.status(400).json({ error: "Invalid show ID" });
    }

    console.info("[admin:deleteShow] request", { showId: id });

    await db.delete(seatLocks).where(eq(seatLocks.showId, id));
    await db
      .update(groupRooms)
      .set({ selectedShowId: null })
      .where(eq(groupRooms.selectedShowId, id));
    await db.delete(shows).where(eq(shows.id, id));

    console.info("[admin:deleteShow] deleted", { showId: id });
    return res.status(200).json({ message: "Show deleted successfully" });
  } catch (err) {
    console.error("[admin:deleteShow] failed", {
      showId: req.params.id,
      error: err,
      code: (err as any)?.code,
      detail: (err as any)?.detail,
      constraint: (err as any)?.constraint,
      table: (err as any)?.table,
      column: (err as any)?.column,
    });
    return res.status(500).json({ error: "Internal server error deleting show" });
  }
};

export const getAllMovies = async (_req: Request, res: Response) => {
  try {
    const data = await db.select().from(movies).orderBy(asc(movies.title));
    return res.status(200).json(data);
  } catch (err) {
    console.error("Get movies error:", err);
    return res.status(500).json({ error: "Failed to fetch movies" });
  }
};

export const getAllCities = async (_req: Request, res: Response) => {
  try {
    const data = await db.select().from(cities).orderBy(asc(cities.name));
    return res.status(200).json(data);
  } catch (err) {
    console.error("Get cities error:", err);
    return res.status(500).json({ error: "Failed to fetch cities" });
  }
};

export const getAllTheatres = async (req: Request, res: Response) => {
  try {
    const cityId = req.query.cityId ? parseInteger(req.query.cityId) : NaN;

    const query = db
      .select({
        id: theatres.id,
        name: theatres.name,
        cityId: theatres.cityId,
        address: theatres.address,
      })
      .from(theatres)
      .$dynamic();

    const data = Number.isNaN(cityId)
      ? await query.orderBy(asc(theatres.name))
      : await query
          .where(eq(theatres.cityId, cityId))
          .orderBy(asc(theatres.name));

    return res.status(200).json(data);
  } catch (err) {
    console.error("Get theatres error:", err);
    return res.status(500).json({ error: "Failed to fetch theatres" });
  }
};

export const getAllScreens = async (req: Request, res: Response) => {
  try {
    const theatreId = req.query.theatreId
      ? parseInteger(req.query.theatreId)
      : NaN;

    const query = db
      .select({
        id: screens.id,
        number: screens.number,
        type: screens.type,
        theatreId: screens.theatreId,
      })
      .from(screens)
      .$dynamic();

    const data = Number.isNaN(theatreId)
      ? await query.orderBy(asc(screens.number), asc(screens.id))
      : await query
          .where(eq(screens.theatreId, theatreId))
          .orderBy(asc(screens.number), asc(screens.id));

    return res.status(200).json(data);
  } catch (err) {
    console.error("Get screens error:", err);
    return res.status(500).json({ error: "Failed to fetch screens" });
  }
};

export const getAllShows = async (_req: Request, res: Response) => {
  try {
    const data = await db
      .select({
        id: shows.id,
        movieId: shows.movieId,
        movieTitle: movies.title,
        screenId: shows.screenId,
        screenNumber: screens.number,
        screenType: screens.type,
        theatreId: theatres.id,
        theatreName: theatres.name,
        cityId: cities.id,
        cityName: cities.name,
        startTime: shows.startTime,
        date: shows.date,
        priceRegular: shows.priceRegular,
        pricePremium: shows.pricePremium,
        priceRecliner: shows.priceRecliner,
      })
      .from(shows)
      .innerJoin(movies, eq(shows.movieId, movies.id))
      .innerJoin(screens, eq(shows.screenId, screens.id))
      .innerJoin(theatres, eq(screens.theatreId, theatres.id))
      .innerJoin(cities, eq(theatres.cityId, cities.id))
      .orderBy(
        asc(cities.name),
        asc(theatres.name),
        asc(shows.date),
        asc(shows.startTime),
        desc(shows.id)
      );

    return res.status(200).json(data);
  } catch (err) {
    console.error("Get shows error:", err);
    return res.status(500).json({ error: "Failed to fetch shows" });
  }
};
