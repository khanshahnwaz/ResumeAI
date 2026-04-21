// ============================================================
// middlewares/validate.middleware.js — Zod input validation
// ============================================================

import { z } from 'zod';

/**
 * Factory: returns Express middleware that validates req.body
 * against the provided Zod schema.
 */
export function validate(schema) {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    console.log(result);
    console.log(req.body);
    if (!result.success) {
      const errors = result.error.errors.map(e => ({
        field:   e.path.join('.'),
        message: e.message,
      }));
      return res.status(422).json({ error: 'Validation failed', details: errors });
    }
    req.body = result.data; // use parsed + coerced data
    next();
  };
}

// ─── Shared validation schemas ──────────────────────────────

export const schemas = {
  register: z.object({
    email:    z.string().email(),
    password: z.string().min(8, 'Password must be at least 8 characters'),
  }),

  login: z.object({
    email:    z.string().email(),
    password: z.string().min(1),
  }),

  profile: z.object({
    fullName:     z.string().min(1).max(100).optional(),
    phone:        z.string().max(20).optional(),
    location:     z.string().max(100).optional(),
    linkedinUrl:  z.string().url().optional().or(z.literal('')),
    githubUrl:    z.string().url().optional().or(z.literal('')),
    portfolioUrl: z.string().url().optional().or(z.literal('')),
    bio:          z.string().max(1000).optional(),
  }),

  experience: z.object({
    company:      z.string().min(1).max(100),
    role:         z.string().min(1).max(100),
    startDate:    z.string().datetime(),
    endDate:      z.string().datetime().optional(),
    isCurrent:    z.boolean().default(false),
    bulletPoints: z.array(z.string().max(300)).max(10).default([]),
    techTags:     z.array(z.string().max(50)).max(20).default([]),
  }),

  skill: z.object({
    name:        z.string().min(1).max(80),
    category:    z.enum(['language', 'framework', 'tool', 'database', 'cloud', 'soft', 'other']),
    proficiency: z.number().int().min(1).max(5).default(3),
  }),

  project: z.object({
    title:       z.string().min(1).max(100),
    description: z.string().min(1).max(1000),
    techTags:    z.array(z.string().max(50)).max(20).default([]),
    url:         z.string().url().optional().or(z.literal('')),
  }),

  jobDescription: z.object({
    title:   z.string().min(1).max(200),
    company: z.string().max(100).optional(),
    rawText: z.string().min(50).max(10000),
  }),

  generateResume: z.object({
    jobId: z.string().uuid(),
    useAI: z.boolean().default(false),
    title: z.string().max(200).optional(),
  }),
};