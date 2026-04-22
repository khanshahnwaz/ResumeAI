// ============================================================
// pages/PreviewPage.jsx
// — Renders structured resume JSON into a styled paper layout
// — All sections are inline-editable (contentEditable)
// — PDF export uses html2pdf.js (no blank pages, preserves styles)
// — Save edits back to the server
// ============================================================

import { useState, useEffect, useRef, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { resumeAPI } from '../services/api';
import { Badge, Button, Alert, Spinner } from '../components/ui';
import {
  Download, ArrowLeft, Save, Edit3,
  Mail, Phone, MapPin, ExternalLink
} from 'lucide-react';

export default function PreviewPage() {
  const { id } = useParams();
  const paperRef = useRef(null);

  const [resume, setResume]     = useState(null);
  const [content, setContent]   = useState(null); // mutable copy
  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [exporting, setExporting] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [error, setError]       = useState('');
  const [saved, setSaved]       = useState(false);

  useEffect(() => {
    resumeAPI.get(id)
      .then(r => { setResume(r); setContent(JSON.parse(JSON.stringify(r.content))); })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  }, [id]);

  // ── Save edits ──────────────────────────────────────────────
  const handleSave = async () => {
    setSaving(true);
    try {
      await resumeAPI.update(id, { content });
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  // ── PDF export via html2pdf.js (loaded from CDN) ───────────
  const handleExport = useCallback(async () => {
    if (!paperRef.current) return;
    setExporting(true);
    try {
      // Dynamically load html2pdf only when needed
      if (!window.html2pdf) {
        await loadScript('https://cdnjs.cloudflare.com/ajax/libs/html2pdf.js/0.10.1/html2pdf.bundle.min.js');
      }
      const opt = {
        margin:       [10, 10, 10, 10], // mm
        filename:     `${resume?.title ?? 'resume'}.pdf`,
        image:        { type: 'jpeg', quality: 0.98 },
        html2canvas:  { scale: 2, useCORS: true, letterRendering: true },
        jsPDF:        { unit: 'mm', format: 'a4', orientation: 'portrait' },
        pagebreak:    { mode: ['avoid-all', 'css'] },
      };
      await window.html2pdf().set(opt).from(paperRef.current).save();
    } finally {
      setExporting(false);
    }
  }, [resume]);

  // ── Content helpers ─────────────────────────────────────────
  const updateField = (path, value) => {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      const keys = path.split('.');
      let obj = next;
      for (let i = 0; i < keys.length - 1; i++) obj = obj[keys[i]];
      obj[keys[keys.length - 1]] = value;
      return next;
    });
  };

  const updateExpBullet = (expIdx, bulletIdx, value) => {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.experience[expIdx].bullets[bulletIdx] = value;
      return next;
    });
  };

  const addBullet = (expIdx) => {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.experience[expIdx].bullets.push('New achievement here');
      return next;
    });
  };

  const removeBullet = (expIdx, bulletIdx) => {
    setContent(prev => {
      const next = JSON.parse(JSON.stringify(prev));
      next.experience[expIdx].bullets.splice(bulletIdx, 1);
      return next;
    });
  };

  if (loading) return (
    <div className="flex items-center justify-center h-64"><Spinner size="lg" className="text-indigo-600" /></div>
  );
  if (error)   return <Alert variant="error">{error}</Alert>;

  const c       = content;
  const contact = c.contact ?? {};
  const meta    = c.meta    ?? {};

  return (
    <div className="max-w-5xl mx-auto">
      {/* ── Toolbar ── */}
      <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <Link to="/resumes">
            <Button variant="ghost" size="sm"><ArrowLeft className="w-4 h-4" /> Back</Button>
          </Link>
          <div>
            <h1 className="font-semibold text-gray-900">{resume.title}</h1>
            <p className="text-xs text-gray-400">
              Match: <span className={`font-semibold ${resume.matchScore >= 70 ? 'text-green-600' : 'text-amber-600'}`}>{resume.matchScore}%</span>
              {meta.useAI && <span className="ml-2 text-purple-500">✦ AI-enhanced</span>}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant={editMode ? 'primary' : 'secondary'} size="sm"
            onClick={() => setEditMode(e => !e)}
          >
            <Edit3 className="w-4 h-4" /> {editMode ? 'Preview mode' : 'Edit content'}
          </Button>
          {editMode && (
            <Button variant="secondary" size="sm" loading={saving} onClick={handleSave}>
              <Save className="w-4 h-4" /> {saved ? 'Saved!' : 'Save edits'}
            </Button>
          )}
          <Button size="sm" loading={exporting} onClick={handleExport}>
            <Download className="w-4 h-4" /> {exporting ? 'Exporting…' : 'Export PDF'}
          </Button>
        </div>
      </div>

      {editMode && (
        <Alert variant="info" className="mb-4">
          ✏️ Edit mode — click any text to edit it directly. Add/remove bullets with the buttons. Click Save when done.
        </Alert>
      )}

      {/* ── Resume paper ── */}
      <div
        ref={paperRef}
        id="resume-paper"
        style={{
          fontFamily: "'Georgia', 'Times New Roman', serif",
          background: '#fff',
          maxWidth: '210mm',
          margin: '0 auto',
          boxShadow: '0 4px 24px rgba(0,0,0,0.10)',
          border: '1px solid #e5e7eb',
        }}
      >
        {/* ── Header ── */}
        <div style={{ background: '#1e1b4b', color: '#fff', padding: '32px 40px' }}>
          <E tag="h1" edit={editMode}
            style={{ fontSize: 28, fontWeight: 700, letterSpacing: '-0.5px', margin: 0, color: '#fff' }}
            value={contact.fullName || 'Your Name'}
            onChange={v => updateField('contact.fullName', v)}
          />
          <E tag="p" edit={editMode}
            style={{ color: '#a5b4fc', fontSize: 16, margin: '4px 0 16px', fontFamily: 'sans-serif' }}
            value={meta.jobTitle || ''}
            onChange={v => updateField('meta.jobTitle', v)}
          />

          {/* Contact row */}
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '16px', fontFamily: 'sans-serif', fontSize: 13, color: '#d1d5db' }}>
            {contact.email      && <span style={{ display:'flex', alignItems:'center', gap:4 }}>✉ {contact.email}</span>}
            {contact.phone      && <span style={{ display:'flex', alignItems:'center', gap:4 }}>📞 {contact.phone}</span>}
            {contact.location   && <span style={{ display:'flex', alignItems:'center', gap:4 }}>📍 {contact.location}</span>}
            {contact.linkedinUrl && <a href={contact.linkedinUrl} style={{ color:'#a5b4fc' }}>LinkedIn</a>}
            {contact.githubUrl  && <a href={contact.githubUrl}   style={{ color:'#a5b4fc' }}>GitHub</a>}
            {contact.portfolioUrl && <a href={contact.portfolioUrl} style={{ color:'#a5b4fc' }}>Portfolio</a>}
          </div>
        </div>

        {/* ── Body ── */}
        <div style={{ padding: '32px 40px' }}>

          {/* Summary */}
          {c.summary && (
            <Section title="Professional Summary">
              <E tag="p" edit={editMode}
                style={{ color: '#374151', lineHeight: 1.7, margin: 0 }}
                value={c.summary}
                onChange={v => updateField('summary', v)}
              />
            </Section>
          )}

          {/* Skills */}
          {c.skills && Object.keys(c.skills).length > 0 && (
            <Section title="Skills">
              <table style={{ width: '100%', borderCollapse: 'collapse' }}>
                <tbody>
                  {Object.entries(c.skills).map(([cat, skills]) => (
                    <tr key={cat}>
                      <td style={{ paddingBottom: 6, paddingRight: 16, fontSize: 13, fontWeight: 600, color: '#6b7280', textTransform: 'capitalize', whiteSpace: 'nowrap', verticalAlign: 'top', fontFamily: 'sans-serif' }}>
                        {cat}
                      </td>
                      <td style={{ paddingBottom: 6, fontSize: 14, color: '#111827', fontFamily: 'sans-serif', lineHeight: 1.5 }}>
                        {skills.join(' · ')}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </Section>
          )}

          {/* Experience */}
          {c.experience?.length > 0 && (
            <Section title="Experience">
              {c.experience.map((exp, ei) => (
                <div key={ei} style={{ marginBottom: 20 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                    <div>
                      <E tag="p" edit={editMode}
                        style={{ fontWeight: 700, fontSize: 15, margin: 0, color: '#111827' }}
                        value={exp.role}
                        onChange={v => updateField(`experience.${ei}.role`, v)}
                      />
                      <E tag="p" edit={editMode}
                        style={{ color: '#4f46e5', fontSize: 14, margin: '2px 0', fontFamily: 'sans-serif', fontWeight: 600 }}
                        value={exp.company}
                        onChange={v => updateField(`experience.${ei}.company`, v)}
                      />
                    </div>
                    <p style={{ fontSize: 13, color: '#6b7280', fontFamily: 'sans-serif', whiteSpace: 'nowrap', marginLeft: 16 }}>
                      {fmtDate(exp.startDate)} – {exp.isCurrent ? 'Present' : fmtDate(exp.endDate)}
                    </p>
                  </div>

                  {/* Editable bullets */}
                  <ul style={{ margin: '8px 0 0 0', paddingLeft: 20 }}>
                    {(exp.bullets || []).map((b, bi) => (
                      <li key={bi} style={{ fontSize: 13, color: '#374151', lineHeight: 1.6, marginBottom: 3, fontFamily: 'sans-serif' }}>
                        {editMode ? (
                          <span style={{ display: 'flex', alignItems: 'flex-start', gap: 6 }}>
                            <span
                              contentEditable suppressContentEditableWarning
                              onBlur={e => updateExpBullet(ei, bi, e.target.innerText)}
                              style={{ flex: 1, outline: 'none', borderBottom: '1px dashed #a5b4fc', minWidth: 20 }}
                            >{b}</span>
                            <button
                              onClick={() => removeBullet(ei, bi)}
                              style={{ color: '#ef4444', fontSize: 16, lineHeight: 1, background: 'none', border: 'none', cursor: 'pointer', padding: '0 2px' }}
                            >×</button>
                          </span>
                        ) : b}
                      </li>
                    ))}
                  </ul>

                  {editMode && (
                    <button
                      onClick={() => addBullet(ei)}
                      style={{ marginTop: 4, fontSize: 12, color: '#4f46e5', background: 'none', border: 'none', cursor: 'pointer', fontFamily: 'sans-serif' }}
                    >+ Add bullet</button>
                  )}

                  {exp.techTags?.length > 0 && (
                    <div style={{ marginTop: 6, display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {exp.techTags.map(t => (
                        <span key={t} style={{ fontSize: 11, background: '#f3f4f6', color: '#374151', padding: '2px 8px', borderRadius: 4, fontFamily: 'sans-serif' }}>{t}</span>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </Section>
          )}

          {/* Projects */}
          {c.projects?.length > 0 && (
            <Section title="Projects">
              {c.projects.map((p, pi) => (
                <div key={pi} style={{ marginBottom: 16 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                    <E tag="p" edit={editMode}
                      style={{ fontWeight: 700, fontSize: 14, margin: 0, color: '#111827' }}
                      value={p.title}
                      onChange={v => updateField(`projects.${pi}.title`, v)}
                    />
                    {p.url && !editMode && (
                      <a href={p.url} target="_blank" rel="noopener noreferrer" style={{ color: '#4f46e5', fontSize: 13 }}>↗</a>
                    )}
                  </div>
                  <E tag="p" edit={editMode}
                    style={{ fontSize: 13, color: '#374151', margin: '4px 0', lineHeight: 1.6, fontFamily: 'sans-serif' }}
                    value={p.description}
                    onChange={v => updateField(`projects.${pi}.description`, v)}
                  />
                  {p.techTags?.length > 0 && (
                    <p style={{ fontSize: 12, color: '#6b7280', fontFamily: 'sans-serif', margin: 0 }}>{p.techTags.join(' · ')}</p>
                  )}
                </div>
              ))}
            </Section>
          )}

        </div>
      </div>
    </div>
  );
}

// ─── Inline-editable element ─────────────────────────────────
// In preview mode renders plain HTML. In edit mode renders contentEditable.
function E({ tag: Tag = 'p', edit, value, onChange, style }) {
  if (!edit) return <Tag style={style}>{value}</Tag>;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      onBlur={e => onChange(e.target.innerText)}
      style={{ ...style, outline: 'none', borderBottom: '1px dashed #a5b4fc', cursor: 'text' }}
    >
      {value}
    </Tag>
  );
}

// ─── Section wrapper ─────────────────────────────────────────
function Section({ title, children }) {
  return (
    <div style={{ marginBottom: 24 }}>
      <h2 style={{
        fontSize: 11,
        fontWeight: 700,
        letterSpacing: '0.1em',
        textTransform: 'uppercase',
        color: '#4f46e5',
        fontFamily: 'sans-serif',
        borderBottom: '1.5px solid #e5e7eb',
        paddingBottom: 6,
        marginBottom: 12,
        marginTop: 0,
      }}>{title}</h2>
      {children}
    </div>
  );
}

// ─── Helpers ─────────────────────────────────────────────────
function fmtDate(d) {
  if (!d) return '';
  return new Date(d).toLocaleDateString('en-US', { month: 'short', year: 'numeric' });
}

function loadScript(src) {
  return new Promise((resolve, reject) => {
    const s = document.createElement('script');
    s.src = src; s.onload = resolve; s.onerror = reject;
    document.head.appendChild(s);
  });
}