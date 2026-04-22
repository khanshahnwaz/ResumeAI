
// ============================================================
// routes/user.routes.js — /api/user  (account management)
// ============================================================
 
import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/errors.js';
 
export const userRouter = Router();
userRouter.use(authMiddleware);
 
/** GET /api/user/me */
userRouter.get('/me', async (req, res, next) => {
  try {
    const user = await prisma.user.findUnique({
      where:  { id: req.user.id },
      select: { id: true, email: true, createdAt: true },
    });
    res.json(user);
  } catch (err) { next(err); }
});
 
/** PATCH /api/user/password */
userRouter.patch('/password', async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) throw new AppError('Both passwords required', 400);
    if (newPassword.length < 8) throw new AppError('Password must be at least 8 characters', 400);
 
    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) throw new AppError('Current password is incorrect', 401);
 
    const passwordHash = await bcrypt.hash(newPassword, 12);
    await prisma.user.update({ where: { id: req.user.id }, data: { passwordHash } });
    res.json({ message: 'Password updated' });
  } catch (err) { next(err); }
});
 
/** DELETE /api/user — delete account */
userRouter.delete('/', async (req, res, next) => {
  try {
    await prisma.user.delete({ where: { id: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});
 
