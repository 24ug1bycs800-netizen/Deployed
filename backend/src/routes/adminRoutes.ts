import { Router } from 'express';
import {
  getDashboardStats,
  addMovie,
  addShow,
  deleteMovie,
  deleteShow,
  getAllMovies,
  getAllShows
} from "../controllers/adminController";
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();
console.log({
  getAllMovies,
  getAllShows,
});
router.get('/stats', authenticateJWT, requireAdmin, getDashboardStats);

router.post('/movies', authenticateJWT, requireAdmin, addMovie);
router.post('/shows', authenticateJWT, requireAdmin, addShow);

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
export default router;
