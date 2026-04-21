// ============================================================
// hooks/useResumes.js
// ============================================================

import { useState, useEffect, useCallback } from 'react';
import { resumeAPI } from '../services/api';

export function useResumes() {
  const [resumes, setResumes]   = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setResumes(await resumeAPI.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  const remove = async (id) => {
    await resumeAPI.delete(id);
    setResumes(prev => prev.filter(r => r.id !== id));
  };

  return { resumes, loading, error, refetch: fetch, remove };
}

// ============================================================
// hooks/useJobs.js
// ============================================================

import { jobAPI } from '../services/api';

export function useJobs() {
  const [jobs, setJobs]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError]     = useState(null);

  const fetch = useCallback(async () => {
    setLoading(true);
    try {
      setJobs(await jobAPI.list());
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetch(); }, [fetch]);

  return { jobs, loading, error, refetch: fetch };
}