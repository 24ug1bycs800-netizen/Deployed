import { Router } from "express";
import {
  getCities,
  getMovies,
  getMovieById,
  getTheatres,
  getShows,
} from "../controllers/movieController";

const router = Router();

router.get("/cities", getCities);
router.get("/movies", getMovies);
router.get("/movies/:id", getMovieById);
router.get("/theatres", getTheatres);
router.get("/shows", getShows);

export default router;