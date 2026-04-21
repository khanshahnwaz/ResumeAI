// ============================================================
// pages/GeneratorPage.jsx — Job description → resume generation
// ============================================================

import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { jobAPI, resumeAPI } from '../services/api';
import {
  Card, CardBody, Button, Input, Textarea,
  Alert, Badge, SectionHeading, Spinner
} from '../components/ui';
import { Wand2, Sparkles, ChevronRight } from 'lucide-react';

const STEPS = ['Paste job description', 'Review & configure', 'Generate'];

export default function GeneratorPage() {
  const navigate = useNavigate();
  const [step, setStep]         = useState(0);
  const [jobForm, setJobForm]   = useState({ title: '', company: '', rawText: '' });
  const [parsedJob, setParsedJob] = useState(null);
  const [useAI, setUseAI]       = useState(false);
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState('');

  const handleJobChange = e =>
    setJobForm(p => ({ ...p, [e.target.name]: e.target.value }));

  // Step 1 → 2: submit JD, get back parsed keywords
  const handleParseJD = async () => {
    if (!jobForm.rawText.trim() || jobForm.rawText.length < 50) {
      return setError('Please paste a full job description (min 50 characters).');
    }
    setError('');
    setLoading(true);
    try {
      const result = await jobAPI.submit(jobForm);
      setParsedJob(result);
      setStep(1);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Step 2 → 3: trigger generation
  const handleGenerate = async () => {
    setError('');
    setLoading(true);
    try {
      const resume = await resumeAPI.generate({
        jobId: parsedJob.id,
        useAI,
        title: `Resume for ${parsedJob.title}${parsedJob.company ? ` at ${parsedJob.company}` : ''}`,
      });
      navigate(`/resumes/${resume.id}`);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <SectionHeading
        title="Generate resume"
        subtitle="Paste a job description and we'll tailor your resume to it"
      />

      {/* Step indicator */}
      <div className="flex items-center gap-2 mb-8">
        {STEPS.map((label, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className={`flex items-center gap-2 ${i <= step ? 'text-indigo-600' : 'text-gray-400'}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-bold border-2 ${
                i < step  ? 'bg-indigo-600 border-indigo-600 text-white' :
                i === step ? 'border-indigo-600 text-indigo-600' :
                             'border-gray-300 text-gray-400'
              }`}>
                {i < step ? '✓' : i + 1}
              </div>
              <span className="text-sm font-medium hidden sm:block">{label}</span>
            </div>
            {i < STEPS.length - 1 && (
              <ChevronRight className="w-4 h-4 text-gray-300 mx-1" />
            )}
          </div>
        ))}
      </div>

      {error && <Alert variant="error" className="mb-4">{error}</Alert>}

      {/* ── Step 0: Paste JD ── */}
      {step === 0 && (
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input
                label="Job title"
                name="title"
                value={jobForm.title}
                onChange={handleJobChange}
                placeholder="Senior Frontend Engineer"
                required
              />
              <Input
                label="Company (optional)"
                name="company"
                value={jobForm.company}
                onChange={handleJobChange}
                placeholder="Acme Corp"
              />
            </div>
            <Textarea
              label="Paste job description"
              name="rawText"
              value={jobForm.rawText}
              onChange={handleJobChange}
              rows={14}
              placeholder="Paste the full job description here. Include responsibilities, requirements, and any other details. The more complete, the better the match."
            />
            <div className="flex justify-end">
              <Button onClick={handleParseJD} loading={loading} disabled={!jobForm.title || !jobForm.rawText}>
                Analyse job description <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </CardBody>
        </Card>
      )}

      {/* ── Step 1: Review parsed JD ── */}
      {step === 1 && parsedJob && (
        <div className="space-y-4">
          <Card>
            <CardBody>
              <h3 className="font-semibold text-gray-900 mb-1">{parsedJob.title}</h3>
              {parsedJob.company && <p className="text-sm text-gray-500 mb-4">{parsedJob.company}</p>}

              <div className="mb-4">
                <p className="text-sm font-medium text-gray-700 mb-2">Required skills detected</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedJob.requiredSkills.length > 0
                    ? parsedJob.requiredSkills.map(s => (
                        <Badge key={s} variant="indigo">{s}</Badge>
                      ))
                    : <span className="text-sm text-gray-400">None detected — broad match will be used</span>
                  }
                </div>
              </div>

              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Top keywords extracted</p>
                <div className="flex flex-wrap gap-1.5">
                  {parsedJob.extractedKeywords.slice(0, 20).map(k => (
                    <span key={k} className="text-xs bg-gray-100 text-gray-600 px-2 py-1 rounded-md">{k}</span>
                  ))}
                </div>
              </div>
            </CardBody>
          </Card>

          {/* AI toggle */}
          <Card>
            <CardBody>
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-lg bg-purple-100 flex items-center justify-center flex-shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-600" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center justify-between">
                    <p className="font-medium text-gray-900">AI-enhanced writing</p>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        type="checkbox"
                        checked={useAI}
                        onChange={e => setUseAI(e.target.checked)}
                        className="sr-only peer"
                      />
                      <div className="w-10 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-indigo-500 rounded-full peer peer-checked:bg-indigo-600 after:content-[''] after:absolute after:top-0.5 after:left-0.5 after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-4" />
                    </label>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    Use OpenAI to rewrite your experience bullets with stronger action verbs and impact language tailored to this role. Requires OPENAI_API_KEY.
                  </p>
                </div>
              </div>
            </CardBody>
          </Card>

          <div className="flex gap-3 justify-between">
            <Button variant="secondary" onClick={() => setStep(0)}>← Back</Button>
            <Button onClick={handleGenerate} loading={loading}>
              <Wand2 className="w-4 h-4" />
              {loading ? 'Generating…' : 'Generate my resume'}
            </Button>
          </div>
        </div>
      )}

      {/* ── Step 2: Generating spinner ── */}
      {loading && step === 1 && (
        <div className="text-center py-16">
          <Spinner size="lg" className="text-indigo-600 mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Matching your profile to the job…</p>
          <p className="text-sm text-gray-400 mt-1">
            {useAI ? 'Rewriting bullets with AI — this takes a few seconds' : 'Ranking your experience and skills'}
          </p>
        </div>
      )}
    </div>
  );
}