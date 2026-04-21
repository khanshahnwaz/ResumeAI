// ============================================================
// routes/job.routes.js — /api/job
// ============================================================

import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate, schemas } from '../middlewares/validate.middleware.js';
import { extractKeywords } from '../services/nlp.service.js';

export const jobRouter = Router();
jobRouter.use(authMiddleware);

/**
 * POST /api/job — Submit and parse a job description
 * Returns parsed keywords + saved JobDescription record
 */
jobRouter.post('/', validate(schemas.jobDescription), async (req, res, next) => {
  try {
    const { title, company, rawText } = req.body;

    // Extract keywords and required skills from raw JD text
    const { keywords, requiredSkills, seniorityLevel } = extractKeywords(rawText);

    const job = await prisma.jobDescription.create({
      data: {
        userId:            req.user.id,
        title,
        company,
        rawText,
        extractedKeywords: keywords,
        requiredSkills,
      },
    });

    res.status(201).json({ ...job, seniorityLevel });
  } catch (err) { next(err); }
});

/** GET /api/job — List all saved job descriptions */
jobRouter.get('/', async (req, res, next) => {
  try {
    const jobs = await prisma.jobDescription.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, company: true,
        extractedKeywords: true, requiredSkills: true, createdAt: true,
      },
    });
    res.json(jobs);
  } catch (err) { next(err); }
});

/** GET /api/job/:id */
jobRouter.get('/:id', async (req, res, next) => {
  try {
    const job = await prisma.jobDescription.findFirstOrThrow({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.json(job);
  } catch (err) { next(err); }
});

/** DELETE /api/job/:id */
jobRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.jobDescription.delete({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.status(204).end();
  } catch (err) { next(err); }
});