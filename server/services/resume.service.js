// ============================================================
// services/resume.service.js — Resume generation engine
//
// Builds structured resume JSON from matched profile data.
// Optionally rewrites experience bullets using the OpenAI API.
// ============================================================

import OpenAI from 'openai';
import { AppError } from '../utils/errors.js';

// Initialize OpenAI client (only used if API key is present)
const openai = process.env.OPENAI_API_KEY
  ? new OpenAI({ apiKey: process.env.OPENAI_API_KEY })
  : null;

/**
 * Build the structured resume JSON from matched profile data.
 *
 * @param {Object} profile   - User's profile (name, contact, bio)
 * @param {Object} matchResult - Output from matchingService.matchProfileToJob
 * @param {Object} jobData   - Parsed job description
 * @param {boolean} useAI    - Whether to call OpenAI for rewrites
 * @returns {Object} resume content JSON
 */
export async function generateResumeContent(profile, matchResult, jobData, useAI = false) {
  const { skills, experience, projects, matchScore } = matchResult;

  // ── Summary ──────────────────────────────────────────────
  const summary = useAI && openai
    ? await generateSummaryWithAI(profile, jobData, experience)
    : generateSummaryLocal(profile, jobData, experience);

  // ── Experience bullets ────────────────────────────────────
  const experienceSection = useAI && openai
    ? await rewriteExperienceWithAI(experience, jobData)
    : formatExperienceLocal(experience);

  // ── Skills groups ────────────────────────────────────────
  const skillsSection = groupSkillsByCategory(skills);

  // ── Projects ─────────────────────────────────────────────
  const projectsSection = projects.map(p => ({
    title:       p.title,
    description: p.description,
    techTags:    p.techTags,
    url:         p.url,
  }));

  return {
    meta: {
      matchScore,
      generatedAt: new Date().toISOString(),
      jobTitle:    jobData.title,
      useAI,
    },
    contact: {
      fullName:    profile.fullName,
      email:       profile.user?.email,
      phone:       profile.phone,
      location:    profile.location,
      linkedinUrl: profile.linkedinUrl,
      githubUrl:   profile.githubUrl,
      portfolioUrl: profile.portfolioUrl,
    },
    summary,
    skills:     skillsSection,
    experience: experienceSection,
    projects:   projectsSection,
  };
}

// ─── Local generators (no AI) ───────────────────────────────

function generateSummaryLocal(profile, jobData, experience) {
  const years   = calculateTotalYears(experience);
  const topRole = experience[0]?.role ?? 'professional';
  const jd      = jobData.title ?? 'this role';

  return profile.bio
    ?? `${years > 0 ? `${years}+ year` : 'Motivated'} ${topRole} with expertise in ${
        jobData.requiredSkills.slice(0, 3).join(', ')
      }. Passionate about delivering high-impact solutions and well-suited for ${jd}.`;
}

function formatExperienceLocal(experience) {
  return experience.map(exp => ({
    company:    exp.company,
    role:       exp.role,
    startDate:  exp.startDate,
    endDate:    exp.endDate,
    isCurrent:  exp.isCurrent,
    bullets:    exp.selectedBullets,
    techTags:   exp.techTags,
  }));
}

function groupSkillsByCategory(skills) {
  const groups = {};
  for (const skill of skills) {
    const cat = skill.category || 'other';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(skill.name);
  }
  return groups;
}

function calculateTotalYears(experiences) {
  let months = 0;
  for (const exp of experiences) {
    const start = new Date(exp.startDate);
    const end   = exp.isCurrent ? new Date() : new Date(exp.endDate ?? new Date());
    months += Math.max(0, (end - start) / (1000 * 60 * 60 * 24 * 30));
  }
  return Math.floor(months / 12);
}

// ─── AI-powered generators ──────────────────────────────────

async function generateSummaryWithAI(profile, jobData, experience) {
  if (!openai) throw new AppError('OpenAI not configured', 500);

  const prompt = `
Write a concise, impactful 3-sentence professional summary for a resume.
Candidate: ${profile.fullName}
Target role: ${jobData.title}
Key skills: ${jobData.requiredSkills.slice(0, 6).join(', ')}
Most recent role: ${experience[0]?.role} at ${experience[0]?.company}
Bio: ${profile.bio ?? 'N/A'}

Rules:
- Start with a strong adjective + profession descriptor
- Mention 2–3 specific technical skills relevant to the role
- End with a clear value statement
- No first-person pronouns
- Max 60 words
`;

  const response = await openai.chat.completions.create({
    model:    'gpt-4o-mini',
    messages: [{ role: 'user', content: prompt }],
    max_tokens: 120,
    temperature: 0.5,
  });

  return response.choices[0].message.content.trim();
}

async function rewriteExperienceWithAI(experience, jobData) {
  if (!openai) throw new AppError('OpenAI not configured', 500);

  const rewritten = await Promise.all(
    experience.map(async (exp) => {
      const prompt = `
Rewrite these resume bullet points for a "${jobData.title}" role.
Make each bullet start with a strong action verb, quantify impact where possible,
and naturally incorporate relevant keywords: ${jobData.requiredSkills.slice(0,5).join(', ')}.

Original bullets:
${exp.selectedBullets.map((b, i) => `${i + 1}. ${b}`).join('\n')}

Return ONLY the rewritten bullets, one per line, no numbering, no extra text.
`;

      const response = await openai.chat.completions.create({
        model:    'gpt-4o-mini',
        messages: [{ role: 'user', content: prompt }],
        max_tokens: 300,
        temperature: 0.4,
      });

      const bullets = response.choices[0].message.content
        .trim()
        .split('\n')
        .filter(Boolean)
        .map(b => b.replace(/^[-•]\s*/, ''));

      return {
        company:   exp.company,
        role:      exp.role,
        startDate: exp.startDate,
        endDate:   exp.endDate,
        isCurrent: exp.isCurrent,
        bullets,
        techTags:  exp.techTags,
      };
    })
  );

  return rewritten;
}