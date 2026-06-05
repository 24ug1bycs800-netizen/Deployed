import { Request, Response } from "express";
import { db } from "../db/db";
import {
  bookings, users, groupRooms, movies, theatres,
  cities, shows, screens, seats,
} from "../db/schema";
import { eq } from "drizzle-orm";
 
// GET ADMIN DASHBOARD STATS
export const getDashboardStats = async (req: Request, res: Response) => {
  try {
    const confirmed = await db.select().from(bookings).where(eq(bookings.status, "confirmed"));
    const totalRevenue = confirmed.reduce((sum, b) => sum + b.totalAmount, 0);
    const totalUsers = (await db.select().from(users)).length;
    const activeGroupRooms = (await db.select().from(groupRooms)).length;
 
    const kpi = {
      totalRevenue,
      totalBookings: confirmed.length,
      totalUsers,
      activeGroupRooms,
    };
 
    // Daily bookings chart (last 7 days)
    const datesMap: Record<string, { bookings: number; revenue: number }> = {};
    confirmed.forEach((b) => {
      const dateStr = b.createdAt ? new Date(b.createdAt).toISOString().substring(0, 10) : new Date().toISOString().substring(0, 10);
      if (!datesMap[dateStr]) datesMap[dateStr] = { bookings: 0, revenue: 0 };
      datesMap[dateStr].bookings += 1;
      datesMap[dateStr].revenue += b.totalAmount;
    });
    const dailyBookings = Object.entries(datesMap)
      .map(([date, val]) => ({ date, bookings: val.bookings, revenue: val.revenue }))
      .sort((a, b) => a.date.localeCompare(b.date));
 
    // Popular movies from real booking data
    const movieMap: Record<number, { bookings: number; revenue: number }> = {};
    for (const b of confirmed) {
      const showItem = await db.select().from(shows).where(eq(shows.id, b.showId)).limit(1);
      if (showItem[0]) {
        const mId = showItem[0].movieId;
        if (!movieMap[mId]) movieMap[mId] = { bookings: 0, revenue: 0 };
        movieMap[mId].bookings += 1;
        movieMap[mId].revenue += b.totalAmount;
      }
    }
    const popularMovies = await Promise.all(
      Object.entries(movieMap).map(async ([mId, val]) => {
        const movie = await db.select().from(movies).where(eq(movies.id, parseInt(mId))).limit(1);
        return { title: movie[0]?.title || `Movie #${mId}`, bookings: val.bookings, revenue: val.revenue };
      })
    );
    popularMovies.sort((a, b) => b.revenue - a.revenue);
 
    // Popular cities from real booking data
    const cityMap: Record<string, number> = {};
    for (const b of confirmed) {
      const showItem = await db.select().from(shows).where(eq(shows.id, b.showId)).limit(1);
      if (showItem[0]) {
        const screen = await db.select().from(screens).where(eq(screens.id, showItem[0].screenId)).limit(1);
        if (screen[0]) {
          const theatre = await db.select().from(theatres).where(eq(theatres.id, screen[0].theatreId)).limit(1);
          if (theatre[0]) {
            const city = await db.select().from(cities).where(eq(cities.id, theatre[0].cityId)).limit(1);
            if (city[0]) cityMap[city[0].name] = (cityMap[city[0].name] || 0) + 1;
          }
        }
      }
    }
    const popularCities = Object.entries(cityMap)
      .map(([name, count]) => ({ name, bookings: count }))
      .sort((a, b) => b.bookings - a.bookings);
 
    // Group booking usage
    const groupCount = (await db.select().from(groupRooms).where(eq(groupRooms.status, "booked"))).length;
    const groupBookingUsage = [
      { name: "Individual Bookings", value: Math.max(0, confirmed.length - groupCount * 3) },
      { name: "Group Bookings", value: groupCount * 3 || 0 },
    ];
 
    return res.status(200).json({
      kpi,
      charts: { dailyBookings, popularMovies, popularCities, groupBookingUsage },
    });
  } catch (err) {
    console.error("Fetch dashboard stats error:", err);
    return res.status(500).json({ error: "Internal server error fetching admin stats" });
  }
};
 
// ADD MOVIE
export const addMovie = async (req: Request, res: Response) => {
  try {
    const {
      title, description, genre, language, durationMins,
      rating, ratingValue, releaseDate, trailerUrl, posterUrl, isNowShowing,
    } = req.body;
 
    if (!title || !description || !genre || !language || !durationMins || !rating || !releaseDate || !posterUrl) {
      return res.status(400).json({ error: "Missing required movie fields" });
    }
 
    const inserted = await db.insert(movies).values({
      title,
      description,
      genre,
      language,
      durationMins: parseInt(durationMins),
      rating,
      ratingValue: ratingValue || "4.5",
      releaseDate,
      trailerUrl,
      posterUrl,
      isNowShowing: isNowShowing === undefined ? true : isNowShowing === "true" || isNowShowing === true,
    }).returning();
 
    return res.status(201).json({ message: "Movie added successfully", movie: inserted[0] });
  } catch (err) {
    console.error("Admin add movie error:", err);
    return res.status(500).json({ error: "Internal server error adding movie" });
  }
};
 
// ADD SHOW
export const addShow = async (req: Request, res: Response) => {
  try {
    const { movieId, screenId, startTime, date, priceRegular, pricePremium, priceRecliner } = req.body;
 
    if (!movieId || !screenId || !startTime || !date) {
      return res.status(400).json({ error: "movieId, screenId, startTime, and date are required" });
    }
 
    const inserted = await db.insert(shows).values({
      movieId: parseInt(movieId),
      screenId: parseInt(screenId),
      startTime,
      date,
      priceRegular: parseInt(priceRegular) || 150,
      pricePremium: parseInt(pricePremium) || 250,
      priceRecliner: parseInt(priceRecliner) || 450,
    }).returning();
 
    return res.status(201).json({ message: "Showtime added successfully", show: inserted[0] });
  } catch (err) {
    console.error("Admin add show error FULL:", err);
    return res.status(500).json({
    error: "Internal server error adding showtime",
    details: String(err),
  });
}
};
 
// DELETE MOVIE
export const deleteMovie = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid movie ID" });
 
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
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid show ID" });
 
    await db.delete(shows).where(eq(shows.id, id));
    return res.status(200).json({ message: "Show deleted successfully" });
  } catch (err) {
    console.error("Delete show error:", err);
    return res.status(500).json({ error: "Internal server error deleting show" });
  }
};
export const getAllMovies = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(movies);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Get movies error:", err);
    return res.status(500).json({
      error: "Failed to fetch movies",
    });
  }
};

export const getAllShows = async (req: Request, res: Response) => {
  try {
    const data = await db.select().from(shows);
    return res.status(200).json(data);
  } catch (err) {
    console.error("Get shows error:", err);
    return res.status(500).json({
      error: "Failed to fetch shows",
    });
  }
};
