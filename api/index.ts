import express, { Application, Request, Response } from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import mongoose from 'mongoose';

// ─── Database Connection ──────────────────────────────────────────────────────
const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/cricclash';
let isConnected = false;

const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(MONGO_URI, { maxPoolSize: 10, serverSelectionTimeoutMS: 5000 });
    isConnected = true;
    console.log('✅ MongoDB Connected');
  } catch (err) {
    console.error('❌ MongoDB Connection Error:', err);
  }
};

// ─── Route Imports (Relative to current api directory) ───────────────────────
import matchRoutes from './src/routes/matchRoutes';
import challengeRoutes from './src/routes/challengeRoutes';
import predictionRoutes from './src/routes/predictionRoutes';
import leaderboardRoutes from './src/routes/leaderboardRoutes';
import userRoutes from './src/routes/userRoutes';
import adminRoutes from './src/routes/adminRoutes';
import { errorHandler } from './src/middleware/errorHandler';
import { generalLimiter } from './src/middleware/rateLimiter';

const app: Application = express();

// ─── Middleware ───────────────────────────────────────────────────────────────
app.use(helmet());
app.use(cors({
  origin: process.env.CLIENT_URL || '*',
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-admin-token'],
}));
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));
app.use(morgan('combined'));

// ─── Lazy DB Connection ───────────────────────────────────────────────────────
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

// ─── Health Check ─────────────────────────────────────────────────────────────
app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'OK', message: '🏏 CricClash API is running!', timestamp: new Date().toISOString() });
});

// ─── API Routes ───────────────────────────────────────────────────────────────
app.use('/api/matches', matchRoutes);
app.use('/api/challenges', challengeRoutes);
app.use('/api/predictions', predictionRoutes);
app.use('/api/leaderboard', leaderboardRoutes);
app.use('/api/users', userRoutes);
app.use('/api/admin', adminRoutes);

// ─── Error Handling ───────────────────────────────────────────────────────────
app.use(errorHandler);

export default app;
