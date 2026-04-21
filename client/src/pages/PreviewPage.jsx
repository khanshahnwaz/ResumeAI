// ============================================================
// pages/PreviewPage.jsx — Resume render + PDF export
// ============================================================

import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { resumeAPI } from '../services/api';
import { Badge, Button, Alert, Spinner } from '../components/ui';
import {
  Download, ArrowLeft, ExternalLink,
  Mail, Phone, MapPin, Linkedin, Github, Globe
} from 'lucide-react';

export default function PreviewPage() {
  const { id }   = useParams();
  const navigate = useNavigate();
  const printRef = useRef(null);

  const [resume, setResume]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState('');

  useEffect(() => {
    resumeAPI.get(id)
      .then(setResume)
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  const handlePrint = () => window.print();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" className="text-indigo-600" />
    </div>
  );
  if (error) return <Alert variant="error">{error}</Alert>;

  const c = resume.content;
  const contact = c.contact ?? {};
  const meta    = c.meta ?? {};

  return (
    <>
      {/* ── Toolbar (hidden on print) ── */}
      <div className="print:hidden flex items-center justify-between mb-6 max-w-4xl mx-auto">
        <div className="flex items-center gap-3">
          <Link to="/resumes">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="w-4 h-4" /> Resumes
            </Button>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900 text-lg">{resume.title}</h1>
            <p className="text-xs text-gray-400">
              Match score: <span className={`font-semibold ${resume.matchScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{resume.matchScore}%</span>
              {meta.useAI && <span className="ml-2 text-purple-500">✦ AI-enhanced</span>}
            </p>
          </div>
        </div>
        <Button onClick={handlePrint}>
          <Download className="w-4 h-4" /> Export PDF
        </Button>
      </div>

      {/* ── Resume paper ── */}
      <div
        ref={printRef}
        className="
          max-w-4xl mx-auto bg-white shadow-lg
          print:shadow-none print:max-w-none
          border border-gray-200 print:border-none
        "
        id="resume-paper"
        style={{ fontFamily: 'Georgia, serif' }}
      >
        {/* Header */}
        <div className="bg-gray-900 text-white px-10 py-8">
          <h1 className="text-3xl font-bold tracking-tight">{contact.fullName || 'Your Name'}</h1>
          <p className="text-indigo-300 text-lg mt-1 font-sans">{meta.jobTitle}</p>

          <div className="flex flex-wrap gap-4 mt-4 text-sm text-gray-300 font-sans">
            {contact.email      && <ContactItem icon={<Mail className="w-3.5 h-3.5" />}     text={contact.email} />}
            {contact.phone      && <ContactItem icon={<Phone className="w-3.5 h-3.5" />}    text={contact.phone} />}
            {contact.location   && <ContactItem icon={<MapPin className="w-3.5 h-3.5" />}   text={contact.location} />}
            {contact.linkedinUrl && <ContactItem icon={<Linkedin className="w-3.5 h-3.5" />} text="LinkedIn" href={contact.linkedinUrl} />}
            {contact.githubUrl  && <ContactItem icon={<Github className="w-3.5 h-3.5" />}   text="GitHub"   href={contact.githubUrl} />}
            {contact.portfolioUrl && <ContactItem icon={<Globe className="w-3.5 h-3.5" />}  text="Portfolio" href={contact.portfolioUrl} />}
          </div>
        </div>

        <div className="px-10 py-8 space-y-7">
          {/* Summary */}
          {c.summary && (
            <Section title="Professional Summary">
              <p className="text-gray-700 leading-relaxed">{c.summary}</p>
            </Section>
          )}

          {/* Skills */}
          {c.skills && Object.keys(c.skills).length > 0 && (
            <Section title="Skills">
              <div className="space-y-2">
                {Object.entries(c.skills).map(([cat, skills]) => (
                  <div key={cat} className="flex gap-3 items-baseline">
                    <span className="text-sm font-semibold text-gray-500 capitalize w-28 flex-shrink-0">{cat}</span>
                    <span className="text-sm text-gray-800">{skills.join(' · ')}</span>
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Experience */}
          {c.experience?.length > 0 && (
            <Section title="Experience">
              <div className="space-y-5">
                {c.experience.map((exp, i) => (
                  <div key={i}>
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="font-bold text-gray-900">{exp.role}</p>
                        <p className="text-sm text-indigo-700 font-sans font-medium">{exp.company}</p>
                      </div>
                      <p className="text-sm text-gray-500 font-sans flex-shrink-0 ml-4">
                        {formatDate(exp.startDate)} – {exp.isCurrent ? 'Present' : formatDate(exp.endDate)}
                      </p>
                    </div>
                    {exp.bullets?.length > 0 && (
                      <ul className="mt-2 space-y-1.5 ml-4">
                        {exp.bullets.map((b, j) => (
                          <li key={j} className="text-sm text-gray-700 leading-relaxed list-disc">{b}</li>
                        ))}
                      </ul>
                    )}
                    {exp.techTags?.length > 0 && (
                      <div className="flex flex-wrap gap-1 mt-2">
                        {exp.techTags.map(t => (
                          <span key={t} className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded font-sans">{t}</span>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}

          {/* Projects */}
          {c.projects?.length > 0 && (
            <Section title="Projects">
              <div className="space-y-4">
                {c.projects.map((p, i) => (
                  <div key={i}>
                    <div className="flex items-center gap-2">
                      <p className="font-bold text-gray-900">{p.title}</p>
                      {p.url && (
                        <a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-500 print:hidden">
                          <ExternalLink className="w-3.5 h-3.5" />
                        </a>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 mt-1 leading-relaxed">{p.description}</p>
                    {p.techTags?.length > 0 && (
                      <p className="text-xs text-gray-500 mt-1 font-sans">{p.techTags.join(' · ')}</p>
                    )}
                  </div>
                ))}
              </div>
            </Section>
          )}
        </div>
      </div>

      {/* Print styles */}
      <style>{`
        @media print {
          body > *:not(#resume-paper) { display: none !important; }
          @page { margin: 15mm; }
        }
      `}</style>
    </>
  );
}

// ─── Sub-components ──────────────────────────────────────────

function Section({ title, children }) {
  return (
    <div>
      <h2 className="text-xs font-bold uppercase tracking-widest text-indigo-600 font-sans mb-3 pb-1 border-b border-gray-200">
        {title}
      </h2>
      {children}
    </div>
  );
}

function ContactItem({ icon, text, href }) {
  const inner = (
    <span className="flex items-center gap-1.5">{icon}{text}</span>
  );
  return href
    ? <a href={href} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">{inner}</a>
    : inner;
}

function formatDate(date) {
  if (!date) return '';
  return new Date(date).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}