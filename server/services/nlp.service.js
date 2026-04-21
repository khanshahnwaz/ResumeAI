// ============================================================
// services/nlp.service.js — Job description keyword extraction
// No external NLP library required — pure JS TF-IDF approach
// ============================================================

// Common English stop words to exclude from keyword extraction
const STOP_WORDS = new Set([
  'a','an','the','and','or','but','in','on','at','to','for','of','with',
  'by','from','up','about','into','through','during','before','after',
  'above','below','between','each','few','more','most','other','some',
  'such','no','nor','not','only','own','same','so','than','too','very',
  's','t','can','will','just','don','should','now','we','you','they',
  'he','she','it','is','are','was','were','be','been','being','have',
  'has','had','do','does','did','would','could','may','might','shall',
  'this','that','these','those','our','your','their','its','us','them',
  'experience','years','year','team','work','strong','role','skills',
  'ability','knowledge','position','responsibilities','requirements',
  'looking','candidate','preferred','required','must','plus','also',
]);

// Technology and skill keywords to actively look for (boost their score)
const TECH_BOOSTERS = new Set([
  'react','node','express','typescript','javascript','python','java','go',
  'rust','c++','aws','gcp','azure','docker','kubernetes','postgresql',
  'mongodb','redis','graphql','rest','api','ci/cd','devops','ml','ai',
  'machine learning','deep learning','tensorflow','pytorch','sql','nosql',
  'microservices','git','linux','agile','scrum','figma','tailwind','next',
]);

/**
 * Extract keywords and skill signals from a raw job description string.
 * Returns:
 *   - keywords: top N weighted terms
 *   - requiredSkills: tech/tool terms specifically
 *   - seniorityLevel: inferred seniority
 */
export function extractKeywords(rawText) {
  const normalized = rawText.toLowerCase().replace(/[^a-z0-9\s+#]/g, ' ');
  const words = normalized.split(/\s+/).filter(w => w.length > 2 && !STOP_WORDS.has(w));

  // Term frequency map
  const freq = {};
  for (const word of words) {
    freq[word] = (freq[word] || 0) + 1;
  }

  // Score each unique term
  const scored = Object.entries(freq).map(([term, count]) => {
    const boost = TECH_BOOSTERS.has(term) ? 3 : 1;
    return { term, score: count * boost };
  });

  // Sort by score descending, take top 30
  scored.sort((a, b) => b.score - a.score);
  const keywords = scored.slice(0, 30).map(s => s.term);

  // Required skills = tech terms present in the text
  const requiredSkills = scored
    .filter(s => TECH_BOOSTERS.has(s.term))
    .map(s => s.term);

  // Infer seniority level
  const seniorityLevel = inferSeniority(normalized);

  return { keywords, requiredSkills, seniorityLevel };
}

/**
 * Score how well a candidate's skills match the job's required skills.
 * Returns a value between 0 and 1.
 */
export function scoreSkillMatch(userSkills, requiredSkills) {
  if (!requiredSkills.length) return 0;

  const userSkillSet = new Set(userSkills.map(s => s.toLowerCase()));
  const matched = requiredSkills.filter(s => userSkillSet.has(s));

  return matched.length / requiredSkills.length;
}

/**
 * Score relevance of a text block (e.g. experience bullet or project description)
 * against a set of job keywords.
 * Returns a value between 0 and 1.
 */
export function scoreTextRelevance(text, keywords) {
  if (!text || !keywords.length) return 0;

  const normalized = text.toLowerCase();
  const hits = keywords.filter(kw => normalized.includes(kw));

  return hits.length / keywords.length;
}

/**
 * Infer seniority level from job description text.
 */
function inferSeniority(text) {
  if (/\b(senior|sr\.|lead|principal|staff)\b/.test(text)) return 'senior';
  if (/\b(junior|jr\.|entry.level|intern|graduate)\b/.test(text)) return 'junior';
  return 'mid';
}