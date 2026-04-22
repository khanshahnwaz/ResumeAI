// ============================================================
// routes/profile.routes.js — /api/profile
// All routes are protected by authMiddleware
// ============================================================

import { Router } from 'express';
import { prisma } from '../utils/prisma.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { validate, schemas } from '../middlewares/validate.middleware.js';
import { AppError } from '../utils/errors.js';

export const profileRouter = Router();
profileRouter.use(authMiddleware);

// ─── Personal info ──────────────────────────────────────────

/** GET /api/profile — full profile + all sections */
profileRouter.get('/', async (req, res, next) => {
  try {
    const [profile, experiences, educations, skills, projects] = await Promise.all([
      prisma.profile.findUnique({ where: { userId: req.user.id } }),
      prisma.experience.findMany({ where: { userId: req.user.id }, orderBy: { startDate: 'desc' } }),
      prisma.education.findMany({ where: { userId: req.user.id }, orderBy: { startDate: 'desc' } }),
      prisma.userSkill.findMany({ where: { userId: req.user.id }, orderBy: { name: 'asc' } }),
      prisma.project.findMany({ where: { userId: req.user.id }, orderBy: { createdAt: 'desc' } }),
    ]);

    res.json({ profile, experiences, educations, skills, projects });
  } catch (err) { next(err); }
});

/** PATCH /api/profile — update personal info */
profileRouter.patch('/', validate(schemas.profile), async (req, res, next) => {
  try {
    const profile = await prisma.profile.update({
      where: { userId: req.user.id },
      data:  req.body,
    });
    res.json(profile);
  } catch (err) { next(err); }
});

// ─── Experience ──────────────────────────────────────────────

profileRouter.get('/experience', async (req, res, next) => {
  try {
    const list = await prisma.experience.findMany({
      where: { userId: req.user.id },
      orderBy: { startDate: 'desc' },
    });
    res.json(list);
  } catch (err) { next(err); }
});

profileRouter.post('/experience', validate(schemas.experience), async (req, res, next) => {
  try {
    const exp = await prisma.experience.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(exp);
  } catch (err) { next(err); }
});

profileRouter.put('/experience/:id', validate(schemas.experience), async (req, res, next) => {
  try {
    const exp = await prisma.experience.update({
      where: { id: req.params.id, userId: req.user.id },
      data:  req.body,
    });
    res.json(exp);
  } catch (err) { next(err); }
});

profileRouter.delete('/experience/:id', async (req, res, next) => {
  try {
    await prisma.experience.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Education ───────────────────────────────────────────────

profileRouter.post('/education', async (req, res, next) => {
  try {
    const edu = await prisma.education.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(edu);
  } catch (err) { next(err); }
});

profileRouter.put('/education/:id', async (req, res, next) => {
  try {
    const edu = await prisma.education.update({
      where: { id: req.params.id, userId: req.user.id },
      data:  req.body,
    });
    res.json(edu);
  } catch (err) { next(err); }
});

profileRouter.delete('/education/:id', async (req, res, next) => {
  try {
    await prisma.education.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Skills ──────────────────────────────────────────────────

profileRouter.post('/skills', validate(schemas.skill), async (req, res, next) => {
  try {
    const skill = await prisma.userSkill.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(skill);
  } catch (err) { next(err); }
});

profileRouter.delete('/skills/:id', async (req, res, next) => {
  try {
    await prisma.userSkill.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Projects ────────────────────────────────────────────────

profileRouter.post('/projects', validate(schemas.project), async (req, res, next) => {
  try {
    const project = await prisma.project.create({
      data: { ...req.body, userId: req.user.id },
    });
    res.status(201).json(project);
  } catch (err) { next(err); }
});

profileRouter.put('/projects/:id', validate(schemas.project), async (req, res, next) => {
  try {
    const project = await prisma.project.update({
      where: { id: req.params.id, userId: req.user.id },
      data:  req.body,
    });
    res.json(project);
  } catch (err) { next(err); }
});

profileRouter.delete('/projects/:id', async (req, res, next) => {
  try {
    await prisma.project.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Coding Profiles ─────────────────────────────────────────

profileRouter.get('/coding', async (req, res, next) => {
  try {
    const list = await prisma.codingProfile.findMany({ where: { userId: req.user.id } });
    console.log(list);
    res.json(list);
  } catch (err) { next(err); }
});

profileRouter.post('/coding', async (req, res, next) => {
  try {
    const { platform, username, url } = req.body;
    if (!platform || !username || !url) return res.status(422).json({ error: 'platform, username and url required' });
    const entry = await prisma.codingProfile.upsert({
      where:  { userId_platform: { userId: req.user.id, platform } },
      update: { username, url },
      create: { userId: req.user.id, platform, username, url },
    });
    res.status(201).json(entry);
  } catch (err) { next(err); }
});

profileRouter.delete('/coding/:id', async (req, res, next) => {
  try {
    await prisma.codingProfile.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});

// ─── Certifications ──────────────────────────────────────────

profileRouter.get('/certifications', async (req, res, next) => {
  try {
    const list = await prisma.certification.findMany({
      where:   { userId: req.user.id },
      orderBy: { issueDate: 'desc' },
    });
    res.json(list);
  } catch (err) { next(err); }
});

profileRouter.post('/certifications', async (req, res, next) => {
  try {
    const { title, issuer, issueDate, expiryDate, credentialId, url } = req.body;
    if (!title || !issuer) return res.status(422).json({ error: 'title and issuer required' });
    const cert = await prisma.certification.create({
      data: {
        userId: req.user.id, title, issuer,
        issueDate:  issueDate  ? new Date(issueDate)  : null,
        expiryDate: expiryDate ? new Date(expiryDate) : null,
        credentialId, url,
      },
    });
    res.status(201).json(cert);
  } catch (err) { next(err); }
});

profileRouter.delete('/certifications/:id', async (req, res, next) => {
  try {
    await prisma.certification.delete({ where: { id: req.params.id, userId: req.user.id } });
    res.status(204).end();
  } catch (err) { next(err); }
});