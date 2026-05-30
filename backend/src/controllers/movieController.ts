import { Request, Response } from 'express';
import { isFallback, db, fallbackDb } from '../db/db';
import { movies, cities, theatres, shows, screens, reviews } from '../db/schema';
import { eq, and } from 'drizzle-orm';

// GET ALL CITIES
export const getCities = async (req: Request, res: Response) => {
  try {
    let citiesList = [];
    if (isFallback) {
      citiesList = fallbackDb.cities;
    } else {
      citiesList = await db.select().from(cities);
    }
    res.status(200).json({ cities: citiesList });
  } catch (err) {
    console.error('Fetch cities error:', err);
    res.status(500).json({ error: 'Internal server error fetching cities' });
  }
};

// GET ALL MOVIES (with filtering)
export const getMovies = async (req: Request, res: Response) => {
  try {
    const { isNowShowing } = req.query;
    let moviesList = [];

    if (isFallback) {
      moviesList = fallbackDb.movies;
      if (isNowShowing !== undefined) {
        const filterVal = isNowShowing === 'true';
        moviesList = moviesList.filter(m => m.isNowShowing === filterVal);
      }
    } else {
      if (isNowShowing !== undefined) {
        const filterVal = isNowShowing === 'true';
        moviesList = await db.select().from(movies).where(eq(movies.isNowShowing, filterVal));
      } else {
        moviesList = await db.select().from(movies);
      }
    }

    res.status(200).json({ movies: moviesList });
  } catch (err) {
    console.error('Fetch movies error:', err);
    res.status(500).json({ error: 'Internal server error fetching movies' });
  }
};

// GET MOVIE DETAILS BY ID
export const getMovieById = async (req: Request, res: Response) => {
  try {
    const id = parseInt(req.params.id);
    if (isNaN(id)) {
      return res.status(400).json({ error: 'Invalid movie ID' });
    }

    let movieItem: any = null;
    let reviewsList: any[] = [];

    if (isFallback) {
      movieItem = fallbackDb.movies.find(m => m.id === id);
      reviewsList = fallbackDb.reviews.filter(r => r.movieId === id).map(r => {
        const user = fallbackDb.users.find(u => u.id === r.userId);
        return {
          ...r,
          user: user ? { id: user.id, fullName: user.fullName, profilePic: user.profilePic } : null
        };
      });
    } else {
      const dbMovies = await db.select().from(movies).where(eq(movies.id, id)).limit(1);
      movieItem = dbMovies[0] || null;

      const dbReviews = await db.select().from(reviews).where(eq(reviews.movieId, id));
      // Map user names for postgres (in a real app we'd join, but simple mapping works perfectly for seed profiles)
      reviewsList = dbReviews;
    }

    if (!movieItem) {
      return res.status(404).json({ error: 'Movie not found' });
    }

    res.status(200).json({ movie: movieItem, reviews: reviewsList });
  } catch (err) {
    console.error('Fetch movie details error:', err);
    res.status(500).json({ error: 'Internal server error fetching movie details' });
  }
};

// GET THEATRES BY CITY
export const getTheatres = async (req: Request, res: Response) => {
  try {
    const { citySlug, cityId } = req.query;
    let theatresList = [];

    if (isFallback) {
      theatresList = fallbackDb.theatres;
      if (citySlug) {
        const city = fallbackDb.cities.find(c => c.slug === String(citySlug).toLowerCase());
        if (city) {
          theatresList = theatresList.filter(t => t.cityId === city.id);
        } else {
          theatresList = [];
        }
      } else if (cityId) {
        theatresList = theatresList.filter(t => t.cityId === parseInt(String(cityId)));
      }
    } else {
      if (citySlug) {
        const dbCities = await db.select().from(cities).where(eq(cities.slug, String(citySlug).toLowerCase())).limit(1);
        if (dbCities[0]) {
          theatresList = await db.select().from(theatres).where(eq(theatres.cityId, dbCities[0].id));
        }
      } else if (cityId) {
        theatresList = await db.select().from(theatres).where(eq(theatres.cityId, parseInt(String(cityId))));
      } else {
        theatresList = await db.select().from(theatres);
      }
    }

    res.status(200).json({ theatres: theatresList });
  } catch (err) {
    console.error('Fetch theatres error:', err);
    res.status(500).json({ error: 'Internal server error fetching theatres' });
  }
};

// GET SHOWTIMES FOR MOVIE BY CITY
export const getShows = async (req: Request, res: Response) => {
  try {
    const { movieId, citySlug } = req.query;
    if (!movieId) {
      return res.status(400).json({ error: 'movieId query parameter is required' });
    }

    const movieInt = parseInt(String(movieId));
    let showsList: any[] = [];

    if (isFallback) {
      // Find city to filter theatres
      let targetTheatres = fallbackDb.theatres;
      if (citySlug) {
        const city = fallbackDb.cities.find(c => c.slug === String(citySlug).toLowerCase());
        if (city) {
          targetTheatres = targetTheatres.filter(t => t.cityId === city.id);
        } else {
          targetTheatres = [];
        }
      }

      const theatreIds = targetTheatres.map(t => t.id);
      const targetScreens = fallbackDb.screens.filter(s => theatreIds.includes(s.theatreId));
      const screenIds = targetScreens.map(s => s.id);

      const targetShows = fallbackDb.shows.filter(s => s.movieId === movieInt && screenIds.includes(s.screenId));

      // Hydrate show with screen and theatre details
      showsList = targetShows.map(show => {
        const screen = fallbackDb.screens.find(s => s.id === show.screenId)!;
        const theatre = fallbackDb.theatres.find(t => t.id === screen.theatreId)!;
        return {
          ...show,
          screen,
          theatre
        };
      });
    } else {
      // Drizzle PostgreSQL queries (simplified hydration matching fallback db outputs)
      const allShows = await db.select().from(shows).where(eq(shows.movieId, movieInt));
      // Perform manual hydration mapping for Drizzle
      const hydrated = [];
      for (const showItem of allShows) {
        const screenItem = await db.select().from(screens).where(eq(screens.id, showItem.screenId)).limit(1);
        if (screenItem[0]) {
          const theatreItem = await db.select().from(theatres).where(eq(theatres.id, screenItem[0].theatreId)).limit(1);
          if (theatreItem[0]) {
            // Filter by city if slug is specified
            let include = true;
            if (citySlug) {
              const cityItem = await db.select().from(cities).where(eq(cities.id, theatreItem[0].cityId)).limit(1);
              if (!cityItem[0] || cityItem[0].slug !== String(citySlug).toLowerCase()) {
                include = false;
              }
            }
            if (include) {
              hydrated.push({
                ...showItem,
                screen: screenItem[0],
                theatre: theatreItem[0]
              });
            }
          }
        }
      }
      showsList = hydrated;
    }

    res.status(200).json({ shows: showsList });
  } catch (err) {
    console.error('Fetch shows error:', err);
    res.status(500).json({ error: 'Internal server error fetching shows' });
  }
};
