// ============================================================
// pages/ResumesPage.jsx — All saved resumes
// ============================================================

import { Link } from 'react-router-dom';
import { useResumes } from '../hooks/useResumes';
import {
  Card, CardBody, Badge, Button, Spinner,
  Alert, SectionHeading
} from '../components/ui';
import { FileText, Wand2, ChevronRight, Trash2 } from 'lucide-react';

export default function ResumesPage() {
  const { resumes, loading, error, remove } = useResumes();

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <Spinner size="lg" className="text-indigo-600" />
    </div>
  );
  if (error) return <Alert variant="error">{error}</Alert>;

  return (
    <div className="max-w-4xl mx-auto">
      <SectionHeading
        title="My resumes"
        subtitle={`${resumes.length} resume${resumes.length !== 1 ? 's' : ''} generated`}
        action={
          <Link to="/generate">
            <Button>
              <Wand2 className="w-4 h-4" /> New resume
            </Button>
          </Link>
        }
      />

      {resumes.length === 0 ? (
        <Card>
          <CardBody className="text-center py-16">
            <FileText className="w-12 h-12 text-gray-200 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">You haven't generated any resumes yet.</p>
            <Link to="/generate">
              <Button>Generate your first resume</Button>
            </Link>
          </CardBody>
        </Card>
      ) : (
        <div className="space-y-3">
          {resumes.map(r => (
            <Card key={r.id} className="hover:shadow-md transition-shadow">
              <CardBody className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-4 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-indigo-50 flex items-center justify-center flex-shrink-0">
                    <FileText className="w-5 h-5 text-indigo-500" />
                  </div>
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.job?.company && `${r.job.company} · `}
                      {new Date(r.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-3 flex-shrink-0">
                  <Badge variant={r.matchScore >= 70 ? 'green' : r.matchScore >= 40 ? 'amber' : 'default'}>
                    {r.matchScore}%
                  </Badge>
                  <Badge variant={r.status === 'final' ? 'indigo' : 'default'}>
                    {r.status}
                  </Badge>
                  <Link to={`/resumes/${r.id}`}>
                    <Button variant="secondary" size="sm">
                      View <ChevronRight className="w-4 h-4" />
                    </Button>
                  </Link>
                  <button
                    onClick={() => { if (confirm('Delete this resume?')) remove(r.id); }}
                    className="text-gray-400 hover:text-red-500 transition-colors p-1"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </CardBody>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}