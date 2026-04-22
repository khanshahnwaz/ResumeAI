// ============================================================
// routes/upload.routes.js — /api/upload/resume
// Parses an uploaded resume file and returns structured data
// the client can review before saving to profile.
// Uses multer for file handling + pdf-parse for PDF text.
// ============================================================

import { Router } from 'express';
import multer from 'multer';
import pdfParse from 'pdf-parse/lib/pdf-parse.js';
import { authMiddleware } from '../middlewares/auth.middleware.js';
import { AppError } from '../utils/errors.js';

export const uploadRouter = Router();
uploadRouter.use(authMiddleware);

// Store files in memory (no disk writes needed — we only parse them)
const storage = multer.memoryStorage();
const upload  = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB
  fileFilter: (_req, file, cb) => {
    const ok = ['application/pdf', 'text/plain'].includes(file.mimetype);
    cb(ok ? null : new AppError('Only PDF and TXT files are supported', 400), ok);
  },
});

/**
 * POST /api/upload/resume
 * Multipart field name: "resume"
 * Returns: { rawText, parsed: { fullName, email, phone, skills, experience, education } }
 */
uploadRouter.post('/resume', upload.single('resume'), async (req, res, next) => {
  try {
    if (!req.file) throw new AppError('No file uploaded', 400);

    let rawText = '';

    if (req.file.mimetype === 'application/pdf') {
      const data = await pdfParse(req.file.buffer);
      rawText = data.text;
    } else {
      // Plain text
      rawText = req.file.buffer.toString('utf-8');
    }

    const parsed = parseResumeText(rawText);
    res.json({ rawText, parsed });
  } catch (err) { next(err); }
});

// ─── Heuristic resume text parser ───────────────────────────
// A lightweight rule-based extractor — no ML needed.
// The client shows the results for user review before saving.

function parseResumeText(text) {
  const lines = text.split('\n').map(l => l.trim()).filter(Boolean);

  return {
    fullName:    extractName(lines),
    email:       extractPattern(text, /[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}/),
    phone:       extractPattern(text, /(\+?\d[\d\s\-().]{7,}\d)/),
    linkedin:    extractPattern(text, /linkedin\.com\/in\/[\w-]+/),
    github:      extractPattern(text, /github\.com\/[\w-]+/),
    skills:      extractSkills(text),
    experience:  extractExperience(lines),
    education:   extractEducation(lines),
  };
}

function extractName(lines) {
  // The name is usually the first non-empty line and contains only letters/spaces
  for (const line of lines.slice(0, 5)) {
    if (/^[A-Za-z]+(?: [A-Za-z]+){1,3}$/.test(line) && line.length < 50) {
      return line;
    }
  }
  return '';
}

function extractPattern(text, regex) {
  const match = text.match(regex);
  return match ? match[0] : '';
}

const KNOWN_SKILLS = [
  'javascript','typescript','python','java','go','rust','c++','c#','ruby','php','swift','kotlin',
  'react','vue','angular','next.js','node.js','express','django','flask','spring','laravel',
  'postgresql','mysql','mongodb','redis','sqlite','oracle',
  'aws','gcp','azure','docker','kubernetes','terraform','linux','git','ci/cd',
  'graphql','rest','grpc','html','css','tailwind','sass',
  'machine learning','deep learning','tensorflow','pytorch','pandas','numpy',
];

function extractSkills(text) {
  const lower = text.toLowerCase();
  return KNOWN_SKILLS.filter(s => lower.includes(s));
}

// Very simplified section splitter — enough to pre-fill forms
function extractExperience(lines) {
  const results = [];
  let inSection = false;
  let current = null;

  const EXP_HEADERS  = /^(experience|work history|employment)/i;
  const NEXT_SECTION = /^(education|skills|projects|certifications|awards)/i;
  const DATE_RANGE   = /(\w{3,9}\.?\s+\d{4})\s*[-–—to]+\s*(\w{3,9}\.?\s+\d{4}|present)/i;

  for (const line of lines) {
    if (EXP_HEADERS.test(line))  { inSection = true; continue; }
    if (NEXT_SECTION.test(line)) { inSection = false; if (current) { results.push(current); current = null; } continue; }
    if (!inSection) continue;

    const dateMatch = line.match(DATE_RANGE);
    if (dateMatch) {
      if (current) results.push(current);
      current = {
        role:      '',
        company:   '',
        startDate: dateMatch[1],
        endDate:   dateMatch[2],
        bullets:   [],
      };
    } else if (current) {
      if (!current.role)    current.role    = line;
      else if (!current.company) current.company = line;
      else if (line.startsWith('•') || line.startsWith('-') || line.startsWith('*')) {
        current.bullets.push(line.replace(/^[•\-*]\s*/, ''));
      }
    }
  }

  if (current) results.push(current);
  return results;
}

function extractEducation(lines) {
  const results = [];
  let inSection = false;

  const EDU_HEADERS  = /^(education|academic)/i;
  const NEXT_SECTION = /^(experience|skills|projects|certifications)/i;
  const DEGREE_RE    = /\b(bachelor|master|phd|b\.?s|m\.?s|b\.?e|m\.?e|b\.?tech|mba)\b/i;

  for (const line of lines) {
    if (EDU_HEADERS.test(line))  { inSection = true; continue; }
    if (NEXT_SECTION.test(line)) { inSection = false; continue; }
    if (!inSection) continue;

    if (DEGREE_RE.test(line)) {
      results.push({ raw: line });
    }
  }
  return results;
}