// ============================================================
// app.js — Express Application Entry Point
// ============================================================

import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { authRouter } from './routes/auth.routes.js';
import { userRouter } from './routes/user.routes.js';
import { profileRouter } from './routes/profile.routes.js';
import { jobRouter } from './routes/job.routes.js';
import { resumeRouter } from './routes/resume.routes.js';
import { errorHandler } from './middlewares/error.middleware.js';
import { logger } from './utils/logger.js';

const app = express();

// ─── Security middleware ──────────────────────────────────────
app.use(helmet());

app.use(cors({
  origin: process.env.CLIENT_URL || 'http://localhost:5173',
  credentials: true,
}));

// ─── Rate limiting ────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100,
  message: { error: 'Too many requests, please try again later.' },
});
app.use('/api', limiter);

// ─── Body parsing ─────────────────────────────────────────────
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Request logging ──────────────────────────────────────────
app.use((req, _res, next) => {
  logger.info(`${req.method} ${req.path}`);
  next();
});

// ─── Routes ───────────────────────────────────────────────────
app.use('/api/auth', authRouter);
app.use('/api/user', userRouter);
app.use('/api/profile', profileRouter);
app.use('/api/job', jobRouter);
app.use('/api/resume', resumeRouter);

// ─── Health check ─────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─── 404 handler ──────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ error: 'Route not found' });
});

// ─── Global error handler ─────────────────────────────────────
app.use(errorHandler);

export default app;