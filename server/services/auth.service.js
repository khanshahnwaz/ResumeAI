// ============================================================
// services/auth.service.js — Authentication business logic
// ============================================================

import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../utils/prisma.js';
import { AppError } from '../utils/errors.js';

const SALT_ROUNDS = 12;

/**
 * Register a new user account.
 * Creates the user record + an empty profile row in one transaction.
 */
export async function registerUser({ email, password }) {
  // 1. Check for existing account
  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) throw new AppError('Email already in use', 409);

  // 2. Hash password
  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  // 3. Create user + empty profile atomically
  const user = await prisma.$transaction(async (tx) => {
    const newUser = await tx.user.create({
      data: { email, passwordHash },
    });
    await tx.profile.create({ data: { userId: newUser.id } });
    return newUser;
  });

  return { token: signToken(user.id), userId: user.id };
}

/**
 * Authenticate an existing user and return a JWT.
 */
export async function loginUser({ email, password }) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) throw new AppError('Invalid credentials', 401);

  const valid = await bcrypt.compare(password, user.passwordHash);
  if (!valid) throw new AppError('Invalid credentials', 401);

  return { token: signToken(user.id), userId: user.id };
}

/**
 * Sign a JWT with the user's id as the payload subject.
 */
function signToken(userId) {
  return jwt.sign(
    { sub: userId },
    process.env.JWT_SECRET,
    { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
  );
}

/**
 * Verify a JWT and return the decoded payload.
 */
export function verifyToken(token) {
  try {
    return jwt.verify(token, process.env.JWT_SECRET);
  } catch {
    throw new AppError('Invalid or expired token', 401);
  }
}