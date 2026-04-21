// ============================================================
// routes/resume.routes.js — /api/resume
// ============================================================

import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate, schemas } from '../middlewares/validate.middleware.js';
import { matchProfileToJob } from '../services/matching.service.js';
import { generateResumeContent } from '../services/resume.service.js';
import { AppError } from '../utils/errors.js';

export const resumeRouter = Router();
resumeRouter.use(authMiddleware);

/**
 * POST /api/resume/generate
 * The main generation endpoint: match → generate → save → return
 */
resumeRouter.post('/generate', validate(schemas.generateResume), async (req, res, next) => {
  try {
    const { jobId, useAI, title } = req.body;
    const userId = req.user.id;

    // 1. Load job description
    const job = await prisma.jobDescription.findFirst({ where: { id: jobId, userId } });
    if (!job) throw new AppError('Job description not found', 404);

    // 2. Load full user profile data
    const [profile, experiences, skills, projects] = await Promise.all([
      prisma.profile.findUnique({ where: { userId }, include: { user: { select: { email: true } } } }),
      prisma.experience.findMany({ where: { userId }, orderBy: { startDate: 'desc' } }),
      prisma.userSkill.findMany({ where: { userId } }),
      prisma.project.findMany({ where: { userId } }),
    ]);

    const jobData = {
      title:          job.title,
      keywords:       job.extractedKeywords,
      requiredSkills: job.requiredSkills,
    };

    // 3. Run matching engine
    const matchResult = matchProfileToJob(
      { profile, experiences, skills, projects },
      jobData
    );

    // 4. Generate structured resume JSON
    const content = await generateResumeContent(profile, matchResult, jobData, useAI);

    // 5. Save resume to database
    const resume = await prisma.resume.create({
      data: {
        userId,
        jobId,
        title:      title ?? `Resume for ${job.title}`,
        content,
        matchScore: matchResult.matchScore,
      },
    });

    res.status(201).json(resume);
  } catch (err) { next(err); }
});

/** GET /api/resume — List all resumes for user */
resumeRouter.get('/', async (req, res, next) => {
  try {
    const resumes = await prisma.resume.findMany({
      where:   { userId: req.user.id },
      orderBy: { createdAt: 'desc' },
      select: {
        id: true, title: true, matchScore: true,
        status: true, createdAt: true,
        job: { select: { title: true, company: true } },
      },
    });
    res.json(resumes);
  } catch (err) { next(err); }
});

/** GET /api/resume/:id — Get full resume with content */
resumeRouter.get('/:id', async (req, res, next) => {
  try {
    const resume = await prisma.resume.findFirstOrThrow({
      where:   { id: req.params.id, userId: req.user.id },
      include: { job: true },
    });
    res.json(resume);
  } catch (err) { next(err); }
});

/** PATCH /api/resume/:id — Update title or status */
resumeRouter.patch('/:id', async (req, res, next) => {
  try {
    const { title, status, content } = req.body;
    const resume = await prisma.resume.update({
      where: { id: req.params.id, userId: req.user.id },
      data:  { title, status, content },
    });
    res.json(resume);
  } catch (err) { next(err); }
});

/** DELETE /api/resume/:id */
resumeRouter.delete('/:id', async (req, res, next) => {
  try {
    await prisma.resume.delete({
      where: { id: req.params.id, userId: req.user.id },
    });
    res.status(204).end();
  } catch (err) { next(err); }
});