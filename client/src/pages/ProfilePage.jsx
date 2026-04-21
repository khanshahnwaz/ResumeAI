// ============================================================
// pages/ProfilePage.jsx — Tabbed profile editor
// ============================================================

import { useState } from 'react';
import { useProfile } from '../hooks/useProfile';
import { profileAPI } from '../services/api';
import {
  Card, CardBody, Button, Input, Textarea,
  Badge, Alert, Spinner, SectionHeading
} from '../components/ui';
import { Plus, Trash2, Save } from 'lucide-react';

const TABS = ['Personal', 'Experience', 'Education', 'Skills', 'Projects'];

const SKILL_CATEGORIES = ['language', 'framework', 'tool', 'database', 'cloud', 'soft', 'other'];

export default function ProfilePage() {
  const { data, loading, error, refetch } = useProfile();
  const [activeTab, setActiveTab] = useState('Personal');
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState('');

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" className="text-indigo-600" />
    </div>
  );
  if (error) return <Alert variant="error">{error}</Alert>;

  const showSaved = () => {
    setSaveMsg('Saved!');
    setTimeout(() => setSaveMsg(''), 2500);
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeading
        title="Profile"
        subtitle="Your professional information used to generate resumes"
      />

      {/* Tabs */}
      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl w-fit">
        {TABS.map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors ${
              activeTab === tab
                ? 'bg-white text-gray-900 shadow-sm'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {saveMsg && <Alert variant="success" className="mb-4">{saveMsg}</Alert>}

      {activeTab === 'Personal'    && <PersonalTab    profile={data.profile}     refetch={refetch} onSaved={showSaved} />}
      {activeTab === 'Experience'  && <ExperienceTab  items={data.experiences}   refetch={refetch} />}
      {activeTab === 'Education'   && <EducationTab   items={data.educations}    refetch={refetch} />}
      {activeTab === 'Skills'      && <SkillsTab      items={data.skills}        refetch={refetch} />}
      {activeTab === 'Projects'    && <ProjectsTab    items={data.projects}      refetch={refetch} />}
    </div>
  );
}

// ─── Personal ────────────────────────────────────────────────
function PersonalTab({ profile, refetch, onSaved }) {
  const [form, setForm] = useState({
    fullName:     profile?.fullName     || '',
    phone:        profile?.phone        || '',
    location:     profile?.location     || '',
    linkedinUrl:  profile?.linkedinUrl  || '',
    githubUrl:    profile?.githubUrl    || '',
    portfolioUrl: profile?.portfolioUrl || '',
    bio:          profile?.bio          || '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await profileAPI.update(form);
      await refetch();
      onSaved();
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card>
      <CardBody className="space-y-4">
        {error && <Alert variant="error">{error}</Alert>}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Input label="Full name"   name="fullName"     value={form.fullName}     onChange={handleChange} />
          <Input label="Phone"       name="phone"        value={form.phone}        onChange={handleChange} />
          <Input label="Location"    name="location"     value={form.location}     onChange={handleChange} />
          <Input label="LinkedIn"    name="linkedinUrl"  value={form.linkedinUrl}  onChange={handleChange} placeholder="https://linkedin.com/in/..." />
          <Input label="GitHub"      name="githubUrl"    value={form.githubUrl}    onChange={handleChange} placeholder="https://github.com/..." />
          <Input label="Portfolio"   name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange} placeholder="https://..." />
        </div>
        <Textarea label="Bio / Summary" name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Brief professional summary..." />
        <div className="flex justify-end">
          <Button onClick={handleSave} loading={saving}>
            <Save className="w-4 h-4" /> Save changes
          </Button>
        </div>
      </CardBody>
    </Card>
  );
}

// ─── Experience ───────────────────────────────────────────────
function ExperienceTab({ items, refetch }) {
  const [adding, setAdding]   = useState(false);
  const [form, setForm]       = useState(emptyExp());
  const [saving, setSaving]   = useState(false);
  const [error, setError]     = useState('');

  function emptyExp() {
    return { company: '', role: '', startDate: '', endDate: '', isCurrent: false, bulletPoints: [''], techTags: '' };
  }

  const handleChange = e => {
    const { name, value, type, checked } = e.target;
    setForm(p => ({ ...p, [name]: type === 'checkbox' ? checked : value }));
  };

  const updateBullet = (i, val) => {
    const bullets = [...form.bulletPoints];
    bullets[i] = val;
    setForm(p => ({ ...p, bulletPoints: bullets }));
  };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await profileAPI.addExperience({
        ...form,
        startDate:    new Date(form.startDate).toISOString(),
        endDate:      form.isCurrent || !form.endDate ? undefined : new Date(form.endDate).toISOString(),
        bulletPoints: form.bulletPoints.filter(Boolean),
        techTags:     form.techTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      await refetch();
      setAdding(false);
      setForm(emptyExp());
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm('Delete this experience?')) return;
    await profileAPI.deleteExperience(id);
    refetch();
  };

  return (
    <div className="space-y-4">
      {items.map(exp => (
        <Card key={exp.id}>
          <CardBody>
            <div className="flex items-start justify-between">
              <div>
                <p className="font-semibold text-gray-900">{exp.role}</p>
                <p className="text-sm text-gray-500">{exp.company}</p>
                <p className="text-xs text-gray-400 mt-1">
                  {new Date(exp.startDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                  {' → '}
                  {exp.isCurrent ? 'Present' : exp.endDate && new Date(exp.endDate).toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {exp.techTags.map(t => <Badge key={t} variant="indigo">{t}</Badge>)}
                </div>
              </div>
              <button onClick={() => handleDelete(exp.id)} className="text-gray-400 hover:text-red-500">
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </CardBody>
        </Card>
      ))}

      {adding ? (
        <Card>
          <CardBody className="space-y-4">
            {error && <Alert variant="error">{error}</Alert>}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Company"   name="company"   value={form.company}   onChange={handleChange} />
              <Input label="Role"      name="role"      value={form.role}      onChange={handleChange} />
              <Input label="Start date" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
              <Input label="End date"  name="endDate"  type="date" value={form.endDate}   onChange={handleChange} disabled={form.isCurrent} />
            </div>
            <label className="flex items-center gap-2 text-sm text-gray-700">
              <input type="checkbox" name="isCurrent" checked={form.isCurrent} onChange={handleChange} />
              Currently working here
            </label>
            <div>
              <p className="text-sm font-medium text-gray-700 mb-2">Bullet points</p>
              {form.bulletPoints.map((b, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <Input
                    value={b}
                    onChange={e => updateBullet(i, e.target.value)}
                    placeholder="Achievement or responsibility..."
                    className="flex-1"
                  />
                  <button onClick={() => setForm(p => ({ ...p, bulletPoints: p.bulletPoints.filter((_, j) => j !== i) }))}>
                    <Trash2 className="w-4 h-4 text-gray-400" />
                  </button>
                </div>
              ))}
              <button
                onClick={() => setForm(p => ({ ...p, bulletPoints: [...p.bulletPoints, ''] }))}
                className="text-sm text-indigo-600 hover:underline"
              >
                + Add bullet
              </button>
            </div>
            <Input label="Tech tags (comma-separated)" name="techTags" value={form.techTags} onChange={handleChange} placeholder="React, Node.js, PostgreSQL" />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save experience</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" /> Add experience
        </Button>
      )}
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────
function SkillsTab({ items, refetch }) {
  const [form, setForm]     = useState({ name: '', category: 'language', proficiency: 3 });
  const [saving, setSaving] = useState(false);

  const handleAdd = async () => {
    setSaving(true);
    try {
      await profileAPI.addSkill({ ...form, proficiency: Number(form.proficiency) });
      await refetch();
      setForm({ name: '', category: 'language', proficiency: 3 });
    } finally {
      setSaving(false);
    }
  };

  const grouped = items.reduce((acc, s) => {
    if (!acc[s.category]) acc[s.category] = [];
    acc[s.category].push(s);
    return acc;
  }, {});

  return (
    <div className="space-y-6">
      {/* Add form */}
      <Card>
        <CardBody>
          <p className="text-sm font-medium text-gray-700 mb-3">Add a skill</p>
          <div className="flex flex-wrap gap-3 items-end">
            <Input
              label="Skill name"
              value={form.name}
              onChange={e => setForm(p => ({ ...p, name: e.target.value }))}
              placeholder="e.g. TypeScript"
              className="w-48"
            />
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Category</label>
              <select
                value={form.category}
                onChange={e => setForm(p => ({ ...p, category: e.target.value }))}
                className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none"
              >
                {SKILL_CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div className="space-y-1">
              <label className="block text-sm font-medium text-gray-700">Level (1–5)</label>
              <input
                type="range" min={1} max={5}
                value={form.proficiency}
                onChange={e => setForm(p => ({ ...p, proficiency: Number(e.target.value) }))}
                className="w-24"
              />
            </div>
            <Button onClick={handleAdd} loading={saving} disabled={!form.name}>
              <Plus className="w-4 h-4" /> Add
            </Button>
          </div>
        </CardBody>
      </Card>

      {/* Grouped display */}
      {Object.entries(grouped).map(([cat, skills]) => (
        <div key={cat}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {skills.map(s => (
              <div key={s.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-indigo-800">{s.name}</span>
                <span className="text-xs text-indigo-400">{'★'.repeat(s.proficiency)}</span>
                <button onClick={async () => { await profileAPI.deleteSkill(s.id); refetch(); }}
                  className="text-indigo-300 hover:text-red-500 ml-1">
                  ×
                </button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Education ───────────────────────────────────────────────
function EducationTab({ items, refetch }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ institution: '', degree: '', field: '', startDate: '', endDate: '', gpa: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.addEducation({
        ...form,
        startDate: new Date(form.startDate).toISOString(),
        endDate:   form.endDate ? new Date(form.endDate).toISOString() : undefined,
        gpa:       form.gpa ? parseFloat(form.gpa) : undefined,
      });
      await refetch();
      setAdding(false);
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {items.map(edu => (
        <Card key={edu.id}>
          <CardBody className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">{edu.degree} in {edu.field}</p>
              <p className="text-sm text-gray-500">{edu.institution}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(edu.startDate).getFullYear()} – {edu.endDate ? new Date(edu.endDate).getFullYear() : 'Present'}
                {edu.gpa && ` · GPA ${edu.gpa}`}
              </p>
            </div>
            <button onClick={async () => { await profileAPI.deleteEducation(edu.id); refetch(); }}>
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </CardBody>
        </Card>
      ))}

      {adding ? (
        <Card>
          <CardBody className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Input label="Institution" name="institution" value={form.institution} onChange={handleChange} />
              <Input label="Degree"      name="degree"      value={form.degree}      onChange={handleChange} placeholder="B.S., M.S., PhD..." />
              <Input label="Field"       name="field"       value={form.field}       onChange={handleChange} placeholder="Computer Science..." />
              <Input label="GPA"         name="gpa"         type="number" step="0.01" value={form.gpa} onChange={handleChange} />
              <Input label="Start date"  name="startDate"   type="date" value={form.startDate} onChange={handleChange} />
              <Input label="End date"    name="endDate"     type="date" value={form.endDate}   onChange={handleChange} />
            </div>
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" /> Add education
        </Button>
      )}
    </div>
  );
}

// ─── Projects ────────────────────────────────────────────────
function ProjectsTab({ items, refetch }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({ title: '', description: '', techTags: '', url: '' });
  const [saving, setSaving] = useState(false);

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.addProject({
        ...form,
        techTags: form.techTags.split(',').map(t => t.trim()).filter(Boolean),
      });
      await refetch();
      setAdding(false);
      setForm({ title: '', description: '', techTags: '', url: '' });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-4">
      {items.map(p => (
        <Card key={p.id}>
          <CardBody className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">{p.title}</p>
              <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
              <div className="flex flex-wrap gap-1 mt-2">
                {p.techTags.map(t => <Badge key={t} variant="indigo">{t}</Badge>)}
              </div>
            </div>
            <button onClick={async () => { await profileAPI.deleteProject(p.id); refetch(); }}>
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </CardBody>
        </Card>
      ))}

      {adding ? (
        <Card>
          <CardBody className="space-y-4">
            <Input label="Title" name="title" value={form.title} onChange={handleChange} />
            <Textarea label="Description" name="description" value={form.description} onChange={handleChange} rows={3} />
            <Input label="Tech tags (comma-separated)" name="techTags" value={form.techTags} onChange={handleChange} />
            <Input label="URL (optional)" name="url" value={form.url} onChange={handleChange} />
            <div className="flex gap-3 justify-end">
              <Button variant="secondary" onClick={() => setAdding(false)}>Cancel</Button>
              <Button onClick={handleSave} loading={saving}>Save project</Button>
            </div>
          </CardBody>
        </Card>
      ) : (
        <Button variant="secondary" onClick={() => setAdding(true)}>
          <Plus className="w-4 h-4" /> Add project
        </Button>
      )}
    </div>
  );
}