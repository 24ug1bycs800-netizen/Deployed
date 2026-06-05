import { Router } from 'express';
import {
  getDashboardStats,
  addMovie,
  addShow,
  generateShows,
  deleteMovie,
  deleteShow,
  getAllCities,
  getAllMovies,
  getAllTheatres,
  getAllShows,
  getAllScreens
} from "../controllers/adminController";
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
console.log({
  getAllMovies,
  getAllShows,
});
router.get('/stats', authenticateJWT, requireAdmin, getDashboardStats);

router.get("/cities", authenticateJWT, requireAdmin, getAllCities);
router.get("/theatres", authenticateJWT, requireAdmin, getAllTheatres);
router.post('/movies', authenticateJWT, requireAdmin, addMovie);
router.post('/shows', authenticateJWT, requireAdmin, addShow);
router.post("/generate-shows", authenticateJWT, requireAdmin, generateShows);

router.delete(
  '/movies/:id',
  authenticateJWT,
  requireAdmin,
  deleteMovie
);

router.delete(
  '/shows/:id',
  authenticateJWT,
  requireAdmin,
  deleteShow
);
router.get("/movies", authenticateJWT, requireAdmin, getAllMovies);
router.get("/shows", authenticateJWT, requireAdmin, getAllShows);
router.get("/screens", authenticateJWT, requireAdmin, getAllScreens);
export default router;
