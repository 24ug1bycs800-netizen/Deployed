import { Request, Response } from "express";
import { db } from "../db/db";
import { movies, cities, theatres, shows, screens, reviews } from "../db/schema";
import { eq } from "drizzle-orm";
 
// GET CITIES
export const getCities = async (req: Request, res: Response) => {
  try {
    const citiesList = await db.select().from(cities);
    return res.status(200).json({ cities: citiesList });
  } catch (err) {
    console.error("getCities error:", err);
    return res.status(500).json({ error: "Failed to fetch cities" });
  }
};
 
// GET MOVIES
export const getMovies = async (req: Request, res: Response) => {
  try {
    const { isNowShowing } = req.query;
 
    const moviesList = isNowShowing !== undefined
      ? await db.select().from(movies).where(eq(movies.isNowShowing, isNowShowing === "true"))
      : await db.select().from(movies);
 
    return res.status(200).json({ movies: moviesList });
  } catch (err) {
    console.error("getMovies error:", err);
    return res.status(500).json({ error: "Failed to fetch movies", details: err instanceof Error ? err.message : err });
  }
};
 
// GET MOVIE BY ID
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) return res.status(400).json({ error: "Invalid movie ID" });
 
    const movie = await db.select().from(movies).where(eq(movies.id, id)).limit(1);
    if (!movie[0]) return res.status(404).json({ error: "Movie not found" });
 
    const reviewsList = await db.select().from(reviews).where(eq(reviews.movieId, id));
 
    return res.status(200).json({ movie: movie[0], reviews: reviewsList });
  } catch (err) {
    console.error("getMovieById error:", err);
    return res.status(500).json({ error: "Failed to fetch movie details" });
  }
};
 
// GET THEATRES (supports cityId or citySlug)
export const getTheatres = async (req: Request, res: Response) => {
  try {
    const { cityId, citySlug } = req.query;
 
    if (citySlug) {
      const cityResult = await db.select().from(cities).where(eq(cities.slug, String(citySlug))).limit(1);
      if (!cityResult[0]) return res.status(200).json({ theatres: [] });
 
      const theatresList = await db.select().from(theatres).where(eq(theatres.cityId, cityResult[0].id));
      return res.status(200).json({ theatres: theatresList });
    }
 
    if (cityId) {
      const theatresList = await db.select().from(theatres).where(eq(theatres.cityId, parseInt(String(cityId))));
      return res.status(200).json({ theatres: theatresList });
    }
 
    const theatresList = await db.select().from(theatres);
    return res.status(200).json({ theatres: theatresList });
  } catch (err) {
    console.error("getTheatres error:", err);
    return res.status(500).json({ error: "Failed to fetch theatres" });
  }
};
 
// GET SHOWS (supports movieId + citySlug filter)
export const getShows = async (req: Request, res: Response) => {
  try {
    const { movieId, citySlug } = req.query;
    if (!movieId) return res.status(400).json({ error: "movieId required" });
 
    const movieInt = parseInt(String(movieId));
    const allShows = await db.select().from(shows).where(eq(shows.movieId, movieInt));
 
    const enriched = await Promise.all(
      allShows.map(async (show) => {
        const screen = await db.select().from(screens).where(eq(screens.id, show.screenId)).limit(1);
        const theatre = screen[0]
          ? await db.select().from(theatres).where(eq(theatres.id, screen[0].theatreId)).limit(1)
          : [];
        return { ...show, screen: screen[0] || null, theatre: (theatre as any[])[0] || null };
      })
    );
 
    if (!citySlug) return res.status(200).json({ shows: enriched });
 
    // Filter by city slug
    const filtered = await Promise.all(
      enriched.map(async (show) => {
        if (!show.theatre) return null;
        const city = await db.select().from(cities).where(eq(cities.id, (show.theatre as any).cityId)).limit(1);
        return city[0]?.slug === citySlug ? show : null;
      })
    );
 
    return res.status(200).json({ shows: filtered.filter(Boolean) });
  } catch (err) {
    console.error("getShows error:", err);
    return res.status(500).json({ shows: [] });
  }
};