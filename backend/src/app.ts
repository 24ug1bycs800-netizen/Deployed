import express from 'express';
import cors from 'cors';
import path from "path";
import * as dotenv from 'dotenv';
import authRoutes from './routes/authRoutes';
import movieRoutes from './routes/movieRoutes';
import bookingRoutes from './routes/bookingRoutes';
import groupRoutes from './routes/groupRoutes';
import adminRoutes from './routes/adminRoutes';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;
app.use("/images", express.static(path.join(process.cwd(), "images")));
// MIDDLEWARES
app.use(cors({
  origin: '*', // For complete development compatibility
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use("/uploads", express.static("uploads"));

// STATIC ASSETS
// Allows backend to serve frontend movie posters if required
app.use('/assets', express.static('../frontend/public/assets'));

// HEALTH CHECK
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'ok', service: 'CineCircle API', time: new Date() });
});

// ROUTE MOUNTING
app.use('/api/auth', authRoutes);
app.use('/api', movieRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/groups', groupRoutes);
app.use('/api/admin', adminRoutes);

// GLOBAL ERROR HANDLER
app.use((err: any, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Unhandled server error:', err);
  res.status(500).json({ error: 'Internal server error occurred on API service' });
});
app.get("/", (req, res) => {
  res.send("🎬 Movie Backend is running");
});
// START EXPRESS
app.listen(PORT, () => {
  console.log(`🎬 CineCircle Backend running on http://localhost:${PORT}`);
});
