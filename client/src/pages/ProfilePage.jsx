// ============================================================
// pages/ProfilePage.jsx — Updated with:
//   • Resume upload + auto-fill
//   • Coding profiles tab
//   • Certifications tab
// ============================================================

import { useState, useRef } from 'react';
import { useProfile } from '../hooks/useProfile';
import { profileAPI, uploadAPI } from '../services/api';
import {
  Card, CardBody, Button, Input, Textarea,
  Badge, Alert, Spinner, SectionHeading
} from '../components/ui';
import {
  Plus, Trash2, Save, Upload, Link as LinkIcon,
  Award, Code2, CheckCircle
} from 'lucide-react';

const TABS = ['Personal', 'Experience', 'Education', 'Skills', 'Projects', 'Coding', 'Certifications'];
const SKILL_CATEGORIES = ['language', 'framework', 'tool', 'database', 'cloud', 'soft', 'other'];
const CODING_PLATFORMS = [
  { name: 'LeetCode',   base: 'https://leetcode.com/u/' },
  { name: 'Codeforces', base: 'https://codeforces.com/profile/' },
  { name: 'HackerRank', base: 'https://www.hackerrank.com/profile/' },
  { name: 'CodeChef',   base: 'https://www.codechef.com/users/' },
  { name: 'GitHub',     base: 'https://github.com/' },
  { name: 'GitLab',     base: 'https://gitlab.com/' },
  { name: 'Kaggle',     base: 'https://www.kaggle.com/' },
  { name: 'Other',      base: '' },
];

export default function ProfilePage() {
  const { data, loading, error, refetch } = useProfile();
  const [activeTab, setActiveTab]           = useState('Personal');
  const [saveMsg, setSaveMsg]               = useState('');
  const [codingProfiles, setCodingProfiles] = useState(null);
  const [certifications, setCertifications] = useState(null);

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" className="text-indigo-600" />
    </div>
  );
  if (error) return <Alert variant="error">{error}</Alert>;

  const showSaved = () => { setSaveMsg('Saved!'); setTimeout(() => setSaveMsg(''), 2500); };

  const handleTabChange = async (tab) => {
    setActiveTab(tab);
    if (tab === 'Coding'         && !codingProfiles) setCodingProfiles(await profileAPI.getCodingProfiles());
    if (tab === 'Certifications' && !certifications) setCertifications(await profileAPI.getCertifications());
  };

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeading title="Profile" subtitle="Your professional information used to generate resumes" />

      <div className="flex gap-1 mb-6 bg-gray-100 p-1 rounded-xl overflow-x-auto">
        {TABS.map(tab => (
          <button key={tab} onClick={() => handleTabChange(tab)}
            className={`px-4 py-2 text-sm font-medium rounded-lg whitespace-nowrap transition-colors flex-shrink-0 ${
              activeTab === tab ? 'bg-white text-gray-900 shadow-sm' : 'text-gray-500 hover:text-gray-700'
            }`}>
            {tab}
          </button>
        ))}
      </div>

      {saveMsg && <Alert variant="success" className="mb-4">{saveMsg}</Alert>}

      {activeTab === 'Personal'       && <PersonalTab       profile={data.profile}   refetch={refetch} onSaved={showSaved} />}
      {activeTab === 'Experience'     && <ExperienceTab     items={data.experiences} refetch={refetch} />}
      {activeTab === 'Education'      && <EducationTab      items={data.educations}  refetch={refetch} />}
      {activeTab === 'Skills'         && <SkillsTab         items={data.skills}      refetch={refetch} />}
      {activeTab === 'Projects'       && <ProjectsTab       items={data.projects}    refetch={refetch} />}
      {activeTab === 'Coding'         && (
        codingProfiles === null
          ? <div className="flex justify-center py-12"><Spinner className="text-indigo-600" /></div>
          : <CodingTab items={codingProfiles} setItems={setCodingProfiles} />
      )}
      {activeTab === 'Certifications' && (
        certifications === null
          ? <div className="flex justify-center py-12"><Spinner className="text-indigo-600" /></div>
          : <CertificationsTab items={certifications} setItems={setCertifications} />
      )}
    </div>
  );
}

// ─── Personal + Resume Upload ────────────────────────────────
function PersonalTab({ profile, refetch, onSaved }) {
  const fileRef = useRef(null);
  const [form, setForm] = useState({
    fullName: profile?.fullName || '', phone: profile?.phone || '',
    location: profile?.location || '', linkedinUrl: profile?.linkedinUrl || '',
    githubUrl: profile?.githubUrl || '', portfolioUrl: profile?.portfolioUrl || '',
    bio: profile?.bio || '',
  });
  const [saving, setSaving]         = useState(false);
  const [uploading, setUploading]   = useState(false);
  const [uploadResult, setUploadResult] = useState(null);
  const [error, setError]           = useState('');

  const handleChange = e => setForm(p => ({ ...p, [e.target.name]: e.target.value }));

  const handleSave = async () => {
    setSaving(true); setError('');
    try { await profileAPI.update(form); await refetch(); onSaved(); }
    catch (err) { setError(err.message); }
    finally { setSaving(false); }
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true); setError(''); setUploadResult(null);
    try {
      const result = await uploadAPI.parseResume(file);
      setUploadResult(result.parsed);
      setForm(prev => ({
        ...prev,
        fullName:    prev.fullName    || result.parsed.fullName || '',
        phone:       prev.phone       || result.parsed.phone    || '',
        linkedinUrl: prev.linkedinUrl || (result.parsed.linkedin ? `https://${result.parsed.linkedin}` : ''),
        githubUrl:   prev.githubUrl   || (result.parsed.github  ? `https://${result.parsed.github}`   : ''),
      }));
    } catch (err) { setError(`Upload failed: ${err.message}`); }
    finally { setUploading(false); e.target.value = ''; }
  };

  return (
    <div className="space-y-4">
      <Card className="border-dashed border-2 border-indigo-200 bg-indigo-50/40">
        <CardBody>
          <div className="flex items-center justify-between flex-wrap gap-3">
            <div>
              <p className="font-medium text-gray-900 flex items-center gap-2">
                <Upload className="w-4 h-4 text-indigo-500" /> Import from resume
              </p>
              <p className="text-sm text-gray-500 mt-0.5">Upload a PDF or TXT resume to auto-fill your profile</p>
            </div>
            <div>
              <input ref={fileRef} type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} />
              <Button variant="secondary" size="sm" loading={uploading} onClick={() => fileRef.current?.click()}>
                {uploading ? 'Parsing…' : 'Choose file'}
              </Button>
            </div>
          </div>
          {uploadResult && (
            <div className="mt-4 pt-4 border-t border-indigo-100">
              <p className="text-sm font-medium text-indigo-700 mb-2 flex items-center gap-1.5">
                <CheckCircle className="w-4 h-4" /> Detected from your resume
              </p>
              <div className="flex flex-wrap gap-2">
                {uploadResult.fullName && <Badge variant="indigo">Name: {uploadResult.fullName}</Badge>}
                {uploadResult.email    && <Badge variant="indigo">Email: {uploadResult.email}</Badge>}
                {uploadResult.phone    && <Badge variant="indigo">Phone: {uploadResult.phone}</Badge>}
                {uploadResult.skills?.slice(0, 8).map(s => <Badge key={s}>{s}</Badge>)}
              </div>
              <p className="text-xs text-gray-400 mt-2">Fields pre-filled below — review and save.</p>
            </div>
          )}
        </CardBody>
      </Card>

      <Card>
        <CardBody className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Full name"    name="fullName"     value={form.fullName}     onChange={handleChange} />
            <Input label="Phone"        name="phone"        value={form.phone}        onChange={handleChange} />
            <Input label="Location"     name="location"     value={form.location}     onChange={handleChange} />
            <Input label="LinkedIn URL" name="linkedinUrl"  value={form.linkedinUrl}  onChange={handleChange} placeholder="https://linkedin.com/in/..." />
            <Input label="GitHub URL"   name="githubUrl"    value={form.githubUrl}    onChange={handleChange} placeholder="https://github.com/..." />
            <Input label="Portfolio"    name="portfolioUrl" value={form.portfolioUrl} onChange={handleChange} placeholder="https://..." />
          </div>
          <Textarea label="Bio / Summary" name="bio" value={form.bio} onChange={handleChange} rows={4} placeholder="Brief professional summary..." />
          <div className="flex justify-end">
            <Button onClick={handleSave} loading={saving}><Save className="w-4 h-4" /> Save changes</Button>
          </div>
        </CardBody>
      </Card>
    </div>
  );
}

// ─── Experience ───────────────────────────────────────────────
function ExperienceTab({ items, refetch }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState(emptyExp());
  const [saving, setSaving] = useState(false);
  const [error, setError]   = useState('');

  function emptyExp() { return { company:'', role:'', startDate:'', endDate:'', isCurrent:false, bulletPoints:[''], techTags:'' }; }

  const handleChange = e => { const {name,value,type,checked}=e.target; setForm(p=>({...p,[name]:type==='checkbox'?checked:value})); };
  const updateBullet = (i,val) => { const b=[...form.bulletPoints]; b[i]=val; setForm(p=>({...p,bulletPoints:b})); };

  const handleSave = async () => {
    setSaving(true); setError('');
    try {
      await profileAPI.addExperience({
        ...form,
        startDate:    new Date(form.startDate).toISOString(),
        endDate:      form.isCurrent||!form.endDate ? undefined : new Date(form.endDate).toISOString(),
        bulletPoints: form.bulletPoints.filter(Boolean),
        techTags:     form.techTags.split(',').map(t=>t.trim()).filter(Boolean),
      });
      await refetch(); setAdding(false); setForm(emptyExp());
    } catch(err) { setError(err.message); } finally { setSaving(false); }
  };

  return (
    <div className="space-y-4">
      {items.map(exp => (
        <Card key={exp.id}><CardBody>
          <div className="flex items-start justify-between">
            <div>
              <p className="font-semibold text-gray-900">{exp.role}</p>
              <p className="text-sm text-gray-500">{exp.company}</p>
              <p className="text-xs text-gray-400 mt-1">
                {new Date(exp.startDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
                {' → '}{exp.isCurrent?'Present':exp.endDate&&new Date(exp.endDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}
              </p>
              <div className="flex flex-wrap gap-1 mt-2">{exp.techTags.map(t=><Badge key={t} variant="indigo">{t}</Badge>)}</div>
            </div>
            <button onClick={async()=>{if(confirm('Delete?')){await profileAPI.deleteExperience(exp.id);refetch();}}}>
              <Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" />
            </button>
          </div>
        </CardBody></Card>
      ))}
      {adding ? (
        <Card><CardBody className="space-y-4">
          {error && <Alert variant="error">{error}</Alert>}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Company" name="company" value={form.company} onChange={handleChange} />
            <Input label="Role" name="role" value={form.role} onChange={handleChange} />
            <Input label="Start date" name="startDate" type="date" value={form.startDate} onChange={handleChange} />
            <Input label="End date" name="endDate" type="date" value={form.endDate} onChange={handleChange} disabled={form.isCurrent} />
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 cursor-pointer">
            <input type="checkbox" name="isCurrent" checked={form.isCurrent} onChange={handleChange} /> Currently working here
          </label>
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Bullet points</p>
            {form.bulletPoints.map((b,i)=>(
              <div key={i} className="flex gap-2 mb-2">
                <input value={b} onChange={e=>updateBullet(i,e.target.value)} placeholder="Achievement or responsibility…"
                  className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-indigo-500 focus:outline-none" />
                <button onClick={()=>setForm(p=>({...p,bulletPoints:p.bulletPoints.filter((_,j)=>j!==i)}))}><Trash2 className="w-4 h-4 text-gray-400" /></button>
              </div>
            ))}
            <button onClick={()=>setForm(p=>({...p,bulletPoints:[...p.bulletPoints,'']}))} className="text-sm text-indigo-600 hover:underline">+ Add bullet</button>
          </div>
          <Input label="Tech tags (comma-separated)" name="techTags" value={form.techTags} onChange={handleChange} placeholder="React, Node.js, PostgreSQL" />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save experience</Button>
          </div>
        </CardBody></Card>
      ) : <Button variant="secondary" onClick={()=>setAdding(true)}><Plus className="w-4 h-4" /> Add experience</Button>}
    </div>
  );
}

// ─── Education ───────────────────────────────────────────────
function EducationTab({ items, refetch }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({institution:'',degree:'',field:'',startDate:'',endDate:'',gpa:''});
  const [saving, setSaving] = useState(false);
  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));
  const handleSave = async () => {
    setSaving(true);
    try {
      await profileAPI.addEducation({...form,startDate:new Date(form.startDate).toISOString(),endDate:form.endDate?new Date(form.endDate).toISOString():undefined,gpa:form.gpa?parseFloat(form.gpa):undefined});
      await refetch(); setAdding(false);
    } finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      {items.map(edu=>(
        <Card key={edu.id}><CardBody className="flex items-start justify-between">
          <div>
            <p className="font-semibold text-gray-900">{edu.degree} in {edu.field}</p>
            <p className="text-sm text-gray-500">{edu.institution}</p>
            <p className="text-xs text-gray-400 mt-1">{new Date(edu.startDate).getFullYear()} – {edu.endDate?new Date(edu.endDate).getFullYear():'Present'}{edu.gpa&&` · GPA ${edu.gpa}`}</p>
          </div>
          <button onClick={async()=>{await profileAPI.deleteEducation(edu.id);refetch();}}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
        </CardBody></Card>
      ))}
      {adding ? (
        <Card><CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Institution" name="institution" value={form.institution} onChange={handleChange} />
            <Input label="Degree"      name="degree"      value={form.degree}      onChange={handleChange} placeholder="B.S., M.S., PhD…" />
            <Input label="Field"       name="field"       value={form.field}       onChange={handleChange} placeholder="Computer Science" />
            <Input label="GPA"         name="gpa"         type="number" step="0.01" value={form.gpa} onChange={handleChange} />
            <Input label="Start date"  name="startDate"   type="date" value={form.startDate} onChange={handleChange} />
            <Input label="End date"    name="endDate"     type="date" value={form.endDate}   onChange={handleChange} />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save</Button>
          </div>
        </CardBody></Card>
      ) : <Button variant="secondary" onClick={()=>setAdding(true)}><Plus className="w-4 h-4" /> Add education</Button>}
    </div>
  );
}

// ─── Skills ───────────────────────────────────────────────────
function SkillsTab({ items, refetch }) {
  const [form, setForm]     = useState({name:'',category:'language',proficiency:3});
  const [saving, setSaving] = useState(false);
  const handleAdd = async () => {
    if (!form.name) return;
    setSaving(true);
    try { await profileAPI.addSkill({...form,proficiency:Number(form.proficiency)}); await refetch(); setForm(p=>({...p,name:''})); }
    finally { setSaving(false); }
  };
  const grouped = items.reduce((acc,s)=>{(acc[s.category]=acc[s.category]||[]).push(s);return acc;},{});
  return (
    <div className="space-y-6">
      <Card><CardBody>
        <p className="text-sm font-medium text-gray-700 mb-3">Add a skill</p>
        <div className="flex flex-wrap gap-3 items-end">
          <Input label="Skill name" value={form.name} onChange={e=>setForm(p=>({...p,name:e.target.value}))} onKeyDown={e=>e.key==='Enter'&&handleAdd()} placeholder="e.g. TypeScript" className="w-44" />
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Category</label>
            <select value={form.category} onChange={e=>setForm(p=>({...p,category:e.target.value}))} className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              {SKILL_CATEGORIES.map(c=><option key={c} value={c}>{c}</option>)}
            </select>
          </div>
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Level: {form.proficiency}</label>
            <input type="range" min={1} max={5} value={form.proficiency} onChange={e=>setForm(p=>({...p,proficiency:Number(e.target.value)}))} className="w-24" />
          </div>
          <Button onClick={handleAdd} loading={saving} disabled={!form.name}><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </CardBody></Card>
      {Object.entries(grouped).map(([cat,skills])=>(
        <div key={cat}>
          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2 capitalize">{cat}</p>
          <div className="flex flex-wrap gap-2">
            {skills.map(s=>(
              <div key={s.id} className="flex items-center gap-1.5 bg-indigo-50 border border-indigo-100 rounded-lg px-3 py-1.5">
                <span className="text-sm font-medium text-indigo-800">{s.name}</span>
                <span className="text-xs text-indigo-300">{'★'.repeat(s.proficiency)}</span>
                <button onClick={async()=>{await profileAPI.deleteSkill(s.id);refetch();}} className="text-indigo-300 hover:text-red-500 ml-1 text-base leading-none">×</button>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Projects ────────────────────────────────────────────────
function ProjectsTab({ items, refetch }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({title:'',description:'',techTags:'',url:''});
  const [saving, setSaving] = useState(false);
  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));
  const handleSave = async () => {
    setSaving(true);
    try { await profileAPI.addProject({...form,techTags:form.techTags.split(',').map(t=>t.trim()).filter(Boolean)}); await refetch(); setAdding(false); setForm({title:'',description:'',techTags:'',url:''}); }
    finally { setSaving(false); }
  };
  return (
    <div className="space-y-4">
      {items.map(p=>(
        <Card key={p.id}><CardBody className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <p className="font-semibold text-gray-900">{p.title}</p>
              {p.url&&<a href={p.url} target="_blank" rel="noopener noreferrer" className="text-indigo-400 hover:text-indigo-600"><LinkIcon className="w-3.5 h-3.5" /></a>}
            </div>
            <p className="text-sm text-gray-500 mt-1 line-clamp-2">{p.description}</p>
            <div className="flex flex-wrap gap-1 mt-2">{p.techTags.map(t=><Badge key={t} variant="indigo">{t}</Badge>)}</div>
          </div>
          <button onClick={async()=>{await profileAPI.deleteProject(p.id);refetch();}} className="ml-3"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
        </CardBody></Card>
      ))}
      {adding ? (
        <Card><CardBody className="space-y-4">
          <Input label="Title" name="title" value={form.title} onChange={handleChange} />
          <Textarea label="Description" name="description" value={form.description} onChange={handleChange} rows={3} />
          <Input label="Tech tags (comma-separated)" name="techTags" value={form.techTags} onChange={handleChange} />
          <Input label="URL (optional)" name="url" value={form.url} onChange={handleChange} placeholder="https://..." />
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving}>Save project</Button>
          </div>
        </CardBody></Card>
      ) : <Button variant="secondary" onClick={()=>setAdding(true)}><Plus className="w-4 h-4" /> Add project</Button>}
    </div>
  );
}

// ─── Coding Profiles ─────────────────────────────────────────
function CodingTab({ items, setItems }) {
  const [form, setForm]   = useState({platform:'LeetCode',username:'',url:'https://leetcode.com/u/'});
  const [saving,setSaving]= useState(false);
  const [error,setError]  = useState('');

  const handlePlatformChange = (e) => {
    const p = CODING_PLATFORMS.find(x=>x.name===e.target.value);
    setForm(prev=>({...prev,platform:e.target.value,url:p?.base?`${p.base}${prev.username}`:prev.url}));
  };
  const handleUsernameChange = (e) => {
    const username = e.target.value;
    const p = CODING_PLATFORMS.find(x=>x.name===form.platform);
    setForm(prev=>({...prev,username,url:p?.base?`${p.base}${username}`:prev.url}));
  };
  const handleAdd = async () => {
    if (!form.username||!form.url) return setError('Username and URL are required');
    setSaving(true); setError('');
    try {
      const entry = await profileAPI.addCodingProfile(form);
      setItems(prev=>{const idx=prev.findIndex(x=>x.platform===entry.platform);if(idx>=0){const u=[...prev];u[idx]=entry;return u;}return [...prev,entry];});
      const p=CODING_PLATFORMS.find(x=>x.name===form.platform);
      setForm(prev=>({...prev,username:'',url:p?.base||''}));
    } catch(err){setError(err.message);}finally{setSaving(false);}
  };
  const handleDelete = async (id) => { await profileAPI.deleteCodingProfile(id); setItems(prev=>prev.filter(x=>x.id!==id)); };

  return (
    <div className="space-y-6">
      <Card><CardBody>
        <div className="flex items-center gap-2 mb-4"><Code2 className="w-4 h-4 text-indigo-500" /><p className="font-medium text-gray-900">Add coding profile</p></div>
        {error&&<Alert variant="error" className="mb-3">{error}</Alert>}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 items-end">
          <div className="space-y-1">
            <label className="block text-sm font-medium text-gray-700">Platform</label>
            <select value={form.platform} onChange={handlePlatformChange} className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 focus:ring-2 focus:ring-indigo-500 focus:outline-none">
              {CODING_PLATFORMS.map(p=><option key={p.name} value={p.name}>{p.name}</option>)}
            </select>
          </div>
          <Input label="Username" value={form.username} onChange={handleUsernameChange} placeholder="your_username" />
          <Input label="Profile URL" value={form.url} onChange={e=>setForm(p=>({...p,url:e.target.value}))} placeholder="https://..." />
        </div>
        <div className="flex justify-end mt-3">
          <Button onClick={handleAdd} loading={saving} disabled={!form.username}><Plus className="w-4 h-4" /> Add</Button>
        </div>
      </CardBody></Card>

      {items.length===0 ? <p className="text-sm text-gray-400 text-center py-8">No coding profiles added yet.</p> : (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {items.map(item=>(
            <Card key={item.id}><CardBody className="flex items-center justify-between">
              <div>
                <p className="font-medium text-gray-900">{item.platform}</p>
                <a href={item.url} target="_blank" rel="noopener noreferrer" className="text-sm text-indigo-600 hover:underline flex items-center gap-1 mt-0.5">
                  <LinkIcon className="w-3 h-3" />{item.username}
                </a>
              </div>
              <button onClick={()=>handleDelete(item.id)}><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
            </CardBody></Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Certifications ──────────────────────────────────────────
function CertificationsTab({ items, setItems }) {
  const [adding, setAdding] = useState(false);
  const [form, setForm]     = useState({title:'',issuer:'',issueDate:'',expiryDate:'',credentialId:'',url:''});
  const [saving, setSaving] = useState(false);
  const handleChange = e => setForm(p=>({...p,[e.target.name]:e.target.value}));
  const handleSave = async () => {
    setSaving(true);
    try {
      const cert = await profileAPI.addCertification(form);
      setItems(prev=>[cert,...prev]); setAdding(false); setForm({title:'',issuer:'',issueDate:'',expiryDate:'',credentialId:'',url:''});
    } finally { setSaving(false); }
  };
  const handleDelete = async (id) => { await profileAPI.deleteCertification(id); setItems(prev=>prev.filter(x=>x.id!==id)); };
  const isExpired = (date) => date && new Date(date) < new Date();

  return (
    <div className="space-y-4">
      {items.map(cert=>(
        <Card key={cert.id}><CardBody className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <div className={`mt-0.5 w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 ${isExpired(cert.expiryDate)?'bg-red-50':'bg-green-50'}`}>
              <Award className={`w-4 h-4 ${isExpired(cert.expiryDate)?'text-red-400':'text-green-500'}`} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <p className="font-semibold text-gray-900">{cert.title}</p>
                {isExpired(cert.expiryDate)&&<Badge variant="red">Expired</Badge>}
              </div>
              <p className="text-sm text-gray-500">{cert.issuer}</p>
              <p className="text-xs text-gray-400 mt-1">
                {cert.issueDate&&`Issued ${new Date(cert.issueDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}`}
                {cert.expiryDate&&` · Expires ${new Date(cert.expiryDate).toLocaleDateString('en-US',{month:'short',year:'numeric'})}`}
                {cert.credentialId&&` · ID: ${cert.credentialId}`}
              </p>
              {cert.url&&<a href={cert.url} target="_blank" rel="noopener noreferrer" className="text-xs text-indigo-600 hover:underline flex items-center gap-1 mt-1"><LinkIcon className="w-3 h-3" />View credential</a>}
            </div>
          </div>
          <button onClick={()=>handleDelete(cert.id)} className="ml-3"><Trash2 className="w-4 h-4 text-gray-400 hover:text-red-500" /></button>
        </CardBody></Card>
      ))}
      {adding ? (
        <Card><CardBody className="space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Input label="Certificate title" name="title"        value={form.title}        onChange={handleChange} placeholder="AWS Solutions Architect" />
            <Input label="Issuing org"        name="issuer"       value={form.issuer}       onChange={handleChange} placeholder="Amazon Web Services" />
            <Input label="Issue date"         name="issueDate"    type="date" value={form.issueDate}    onChange={handleChange} />
            <Input label="Expiry date"        name="expiryDate"   type="date" value={form.expiryDate}   onChange={handleChange} />
            <Input label="Credential ID"      name="credentialId" value={form.credentialId} onChange={handleChange} placeholder="ABC-123-XYZ" />
            <Input label="Verification URL"   name="url"          value={form.url}          onChange={handleChange} placeholder="https://..." />
          </div>
          <div className="flex gap-3 justify-end">
            <Button variant="secondary" onClick={()=>setAdding(false)}>Cancel</Button>
            <Button onClick={handleSave} loading={saving} disabled={!form.title||!form.issuer}><Award className="w-4 h-4" /> Save</Button>
          </div>
        </CardBody></Card>
      ) : <Button variant="secondary" onClick={()=>setAdding(true)}><Plus className="w-4 h-4" /> Add certification</Button>}
    </div>
  );
}