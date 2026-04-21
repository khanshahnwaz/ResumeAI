// ============================================================
// routes/auth.routes.js — /api/auth
// ============================================================

import { Router } from 'express';
import { registerUser, loginUser } from '../services/auth.service.js';
import { validate, schemas } from '../middlewares/validate.middleware.js';

export const authRouter = Router();

/**
 * POST /api/auth/register
 * Body: { email, password }
 */
authRouter.post('/register', validate(schemas.register), async (req, res, next) => {
  try {
    const result = await registerUser(req.body);
    res.status(201).json(result);
  } catch (err) {
    next(err);
  }
});

/**
 * POST /api/auth/login
 * Body: { email, password }
 */
authRouter.post('/login', validate(schemas.login), async (req, res, next) => {
  try {
    const result = await loginUser(req.body);
    res.json(result);
  } catch (err) {
    next(err);
  }
});