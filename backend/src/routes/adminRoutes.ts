import { Router } from 'express';
import { getDashboardStats, addMovie, addShow } from '../controllers/adminController';
import { authenticateJWT, requireAdmin } from '../middleware/authMiddleware';

const router = Router();

router.get('/stats', authenticateJWT, requireAdmin, getDashboardStats);
router.post('/movies', authenticateJWT, requireAdmin, addMovie);
router.post('/shows', authenticateJWT, requireAdmin, addShow);

export default router;
