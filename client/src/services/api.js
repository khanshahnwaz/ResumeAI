// ============================================================
// services/api.js — Axios instance + all API call functions
// ============================================================

import axios from 'axios';

// ─── Axios instance ──────────────────────────────────────────
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3001/api',
  timeout: 15000,
});

// Attach JWT to every request automatically
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

// Redirect to login on 401
api.interceptors.response.use(
  (res) => res.data,
  (err) => {
    if (err.response?.status === 401) {
      localStorage.removeItem('token');
      localStorage.removeItem('userId');
      window.location.href = '/login';
    }
    // Surface the server error message if present
    const message = err.response?.data?.error ?? err.message ?? 'Something went wrong';
    return Promise.reject(new Error(message));
  }
);

// ─── Resume Upload ───────────────────────────────────────────
export const uploadAPI = {
  parseResume: (file) => {
    const form = new FormData();
    form.append('resume', file);
    return api.post('/upload/resume', form, {
      headers: { 'Content-Type': 'multipart/form-data' },
    });
  },
};

// ─── Auth ────────────────────────────────────────────────────
export const authAPI = {
  register: (body)  => api.post('/auth/register', body),
  login:    (body)  => api.post('/auth/login', body),
};

// ─── Profile ─────────────────────────────────────────────────
export const profileAPI = {
  get:    ()            => api.get('/profile'),
  update: (data)        => api.patch('/profile', data),

  // Experience
  addExperience:    (data) => api.post('/profile/experience', data),
  updateExperience: (id, data) => api.put(`/profile/experience/${id}`, data),
  deleteExperience: (id) => api.delete(`/profile/experience/${id}`),

  // Education
  addEducation:    (data) => api.post('/profile/education', data),
  updateEducation: (id, data) => api.put(`/profile/education/${id}`, data),
  deleteEducation: (id) => api.delete(`/profile/education/${id}`),

  // Skills
  addSkill:    (data) => api.post('/profile/skills', data),
  deleteSkill: (id)   => api.delete(`/profile/skills/${id}`),

  // Projects
  addProject:    (data) => api.post('/profile/projects', data),
  updateProject: (id, data) => api.put(`/profile/projects/${id}`, data),
  deleteProject: (id) => api.delete(`/profile/projects/${id}`),

  // Coding profiles
  getCodingProfiles:    ()       => api.get('/profile/coding'),
  addCodingProfile:     (data)   => api.post('/profile/coding', data),
  deleteCodingProfile:  (id)     => api.delete(`/profile/coding/${id}`),

  // Certifications
  getCertifications:    ()       => api.get('/profile/certifications'),
  addCertification:     (data)   => api.post('/profile/certifications', data),
  deleteCertification:  (id)     => api.delete(`/profile/certifications/${id}`),
};

// ─── Job Descriptions ────────────────────────────────────────
export const jobAPI = {
  submit: (data) => api.post('/job', data),
  list:   ()     => api.get('/job'),
  get:    (id)   => api.get(`/job/${id}`),
  delete: (id)   => api.delete(`/job/${id}`),
};

// ─── Resumes ─────────────────────────────────────────────────
export const resumeAPI = {
  generate: (data)       => api.post('/resume/generate', data),
  list:     ()           => api.get('/resume'),
  get:      (id)         => api.get(`/resume/${id}`),
  update:   (id, data)   => api.patch(`/resume/${id}`, data),
  delete:   (id)         => api.delete(`/resume/${id}`),
};

export default api;