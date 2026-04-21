// ============================================================
// middlewares/auth.middleware.js — JWT verification
// ============================================================

import { verifyToken } from '../services/auth.service.js';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';

/**
 * Protects a route by requiring a valid Bearer JWT in the
 * Authorization header. Attaches req.user on success.
 */
export async function authMiddleware(req, _res, next) {
  try {
    const header = req.headers.authorization;
    if (!header?.startsWith('Bearer ')) {
      throw new AppError('No token provided', 401);
    }

    const token   = header.split(' ')[1];
    const payload = verifyToken(token);

    // Verify the user still exists in the database
    const user = await prisma.user.findUnique({
      where: { id: payload.sub },
      select: { id: true, email: true },
    });

    if (!user) throw new AppError('User not found', 401);

    req.user = user;
    next();
  } catch (err) {
    next(err);
  }
}