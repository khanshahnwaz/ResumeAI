// ============================================================
// services/matching.service.js — Resume matching engine
//
// Scores and ranks the user's profile sections against a
// parsed job description, then selects the most relevant items.
// ============================================================

import { scoreSkillMatch, scoreTextRelevance } from './nlp.service.js';

/**
 * Main entry point.
 * Returns a ranked, filtered snapshot of the user's profile
 * tailored to the job, plus an overall match score.
 *
 * @param {Object} userProfile - Full profile data from DB
 * @param {Object} jobData     - Parsed job: { keywords, requiredSkills, seniorityLevel }
 * @returns {Object} matchResult
 */
export function matchProfileToJob(userProfile, jobData) {
  const { keywords, requiredSkills } = jobData;

  // ── Skills ─────────────────────────────────────────────────
  const rankedSkills = rankSkills(userProfile.skills, requiredSkills, keywords);

  // ── Experience ─────────────────────────────────────────────
  const rankedExperience = rankExperience(userProfile.experiences, keywords);

  // ── Projects ───────────────────────────────────────────────
  const rankedProjects = rankProjects(userProfile.projects, keywords);

  // ── Overall match score (weighted average) ─────────────────
  const skillScore   = scoreSkillMatch(userProfile.skills.map(s => s.name), requiredSkills);
  const expScore     = rankedExperience[0]?.relevanceScore ?? 0;
  const projectScore = rankedProjects[0]?.relevanceScore ?? 0;

  const matchScore = Math.round(
    (skillScore * 0.5 + expScore * 0.3 + projectScore * 0.2) * 100
  );

  return {
    matchScore,                           // 0–100
    skills:     rankedSkills.slice(0, 15), // top 15 skills
    experience: rankedExperience.slice(0, 4), // top 4 jobs
    projects:   rankedProjects.slice(0, 3),   // top 3 projects
  };
}

// ─── Internal rankers ───────────────────────────────────────

/**
 * Rank skills: matched required skills first (score 1.0),
 * then keyword-adjacent skills, then the rest by proficiency.
 */
function rankSkills(skills, requiredSkills, keywords) {
  const reqSet = new Set(requiredSkills.map(s => s.toLowerCase()));
  const kwSet  = new Set(keywords.map(k => k.toLowerCase()));

  return skills
    .map(skill => {
      const name = skill.name.toLowerCase();
      let score = 0;
      if (reqSet.has(name))  score = 1.0;
      else if (kwSet.has(name)) score = 0.6;
      else score = (skill.proficiency / 5) * 0.3;

      return { ...skill, relevanceScore: score };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Rank experience entries by how well their bullets and tech tags
 * overlap with the job's keywords.
 */
function rankExperience(experiences, keywords) {
  return experiences
    .map(exp => {
      const bulletText  = exp.bulletPoints.join(' ');
      const techText    = exp.techTags.join(' ');
      const combinedText = `${bulletText} ${techText} ${exp.role} ${exp.company}`;

      const relevanceScore = scoreTextRelevance(combinedText, keywords);

      // Filter bullets down to the most relevant ones (up to 4)
      const scoredBullets = exp.bulletPoints
        .map(b => ({ text: b, score: scoreTextRelevance(b, keywords) }))
        .sort((a, b) => b.score - a.score)
        .slice(0, 4)
        .map(b => b.text);

      return { ...exp, relevanceScore, selectedBullets: scoredBullets };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}

/**
 * Rank projects by tech tag and description overlap with keywords.
 */
function rankProjects(projects, keywords) {
  return projects
    .map(project => {
      const text = `${project.title} ${project.description} ${project.techTags.join(' ')}`;
      const relevanceScore = scoreTextRelevance(text, keywords);
      return { ...project, relevanceScore };
    })
    .sort((a, b) => b.relevanceScore - a.relevanceScore);
}