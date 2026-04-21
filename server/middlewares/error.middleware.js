// ============================================================
// middlewares/error.middleware.js — Global error handler
// ============================================================

import { logger } from '../utils/logger.js';

export function errorHandler(err, _req, res, _next) {
  // Operational errors (expected, user-facing)
  if (err.isOperational) {
    return res.status(err.statusCode).json({
      error: err.message,
    });
  }

  // Prisma unique constraint violation
  if (err.code === 'P2002') {
    return res.status(409).json({ error: 'A record with this value already exists.' });
  }

  // Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({ error: 'Record not found.' });
  }

  // Unexpected errors — log and return generic message
  logger.error('Unhandled error:', err);
  res.status(500).json({ error: 'Internal server error' });
}