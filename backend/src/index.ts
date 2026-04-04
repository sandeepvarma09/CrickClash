import dotenv from 'dotenv';
// ⚠️  Load env FIRST — before any other imports use process.env
dotenv.config();

import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

import connectDB from './config/db';
import { errorHandler } from './middleware/errorHandler';
import { generalLimiter } from './middleware/rateLimiter';

// ─── Route Imports ─────────────────────────────────────────────────────────────
import matchRoutes from './routes/matchRoutes';
import challengeRoutes from './routes/challengeRoutes';
import predictionRoutes from './routes/predictionRoutes';
import leaderboardRoutes from './routes/leaderboardRoutes';
import userRoutes from './routes/userRoutes';
import adminRoutes from './routes/adminRoutes';

// ─── Bootstrap ─────────────────────────────────────────────────────────────────
connectDB();

const app: Application = express();

// ─── Security & Parsing Middleware ────────────────────────────────────────────
app.use(helmet());
app.use(
  cors({
    origin: (origin, callback) => {
      // In development, allow any origin (especially for local network testing)
      if (process.env.NODE_ENV !== 'production' || !origin) {
        return callback(null, true);
      }
      
      const allowedOrigins = [
        'https://crick-clash.vercel.app',
        'https://cricclash-v1.vercel.app',
        process.env.CLIENT_URL
      ].filter(Boolean);

      // Check if it's one of the explicitly allowed origins
      if (allowedOrigins.includes(origin)) {
        return callback(null, true);
      }
      
      // Allow any vercel.app subdomain for maximum flexibility
      if (origin.endsWith('.vercel.app')) {
        return callback(null, true);
      }

      callback(new Error('Not allowed by CORS'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
  })
);
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan(process.env.NODE_ENV === 'development' ? 'dev' : 'combined'));

// ─── Global Rate Limiter ──────────────────────────────────────────────────────
app.use('/api', generalLimiter);

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'OK',
    message: '🏏 CricClash API is running!',
    timestamp: new Date().toISOString(),
    version: '1.0.0',
    environment: process.env.NODE_ENV || 'development',
  });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/matches', matchRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// ─── 404 Handler ──────────────────────────────────────────────────────────────
app.use((req: Request, res: Response) => {
  res.status(404).json({
    success: false,
    message: `Route not found: ${req.originalUrl}. Available routes: /api/health | /api/matches | /api/challenges | /api/predictions | /api/leaderboard | /api/users | /api/admin`,
  });
});

// ─── Global Error Handler ─────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
