// ============================================================
// pages/DashboardPage.jsx
// ============================================================

import { Link } from 'react-router-dom';
import { useResumes } from '../hooks/useResumes';
import { useProfile } from '../hooks/useProfile';
import { Card, CardBody, Badge, Spinner, Button, SectionHeading } from '../components/ui';
import { FileText, Wand2, User, TrendingUp, ChevronRight } from 'lucide-react';

function StatCard({ icon: Icon, label, value, color }) {
  return (
    <Card>
      <CardBody className="flex items-center gap-4">
        <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${color}`}>
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div>
          <p className="text-2xl font-bold text-gray-900">{value}</p>
          <p className="text-sm text-gray-500">{label}</p>
        </div>
      </CardBody>
    </Card>
  );
}

export default function DashboardPage() {
  const { resumes, loading: resumesLoading } = useResumes();
  const { data: profile, loading: profileLoading } = useProfile();

  const profileComplete = profile
    ? [profile.profile?.fullName, profile.profile?.location, profile.experiences?.length > 0, profile.skills?.length > 0]
        .filter(Boolean).length
    : 0;

  if (resumesLoading || profileLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Spinner size="lg" className="text-indigo-600" />
      </div>
    );
  }

  const avgScore = resumes.length
    ? Math.round(resumes.reduce((s, r) => s + r.matchScore, 0) / resumes.length)
    : 0;

  return (
    <div className="max-w-5xl mx-auto">
      <SectionHeading
        title="Dashboard"
        subtitle="Your resume generation overview"
        action={
          <Link to="/generate">
            <Button>
              <Wand2 className="w-4 h-4" />
              New resume
            </Button>
          </Link>
        }
      />

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <StatCard icon={FileText}    label="Resumes generated" value={resumes.length}         color="bg-indigo-500" />
        <StatCard icon={TrendingUp}  label="Avg. match score"  value={`${avgScore}%`}          color="bg-green-500"  />
        <StatCard icon={User}        label="Profile sections"  value={`${profileComplete}/4`}  color="bg-purple-500" />
      </div>

      {/* Profile completeness prompt */}
      {profileComplete < 4 && (
        <Card className="mb-6 border-amber-200 bg-amber-50">
          <CardBody className="flex items-center justify-between">
            <div>
              <p className="font-medium text-amber-900">Complete your profile</p>
              <p className="text-sm text-amber-700 mt-0.5">
                Add your experience, skills and projects for better resume matches.
              </p>
            </div>
            <Link to="/profile">
              <Button variant="secondary" size="sm">
                Edit profile <ChevronRight className="w-4 h-4" />
              </Button>
            </Link>
          </CardBody>
        </Card>
      )}

      {/* Recent resumes */}
      <Card>
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <h2 className="font-semibold text-gray-900">Recent resumes</h2>
          <Link to="/resumes" className="text-sm text-indigo-600 hover:underline">View all</Link>
        </div>

        {resumes.length === 0 ? (
          <CardBody className="text-center py-12">
            <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500 text-sm">No resumes yet.</p>
            <Link to="/generate" className="mt-3 inline-block">
              <Button size="sm">Generate your first resume</Button>
            </Link>
          </CardBody>
        ) : (
          <ul className="divide-y divide-gray-100">
            {resumes.slice(0, 5).map(r => (
              <li key={r.id}>
                <Link
                  to={`/resumes/${r.id}`}
                  className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-gray-900 truncate">{r.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">
                      {r.job?.company && `${r.job.company} · `}
                      {new Date(r.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                  <div className="flex items-center gap-3 ml-4">
                    <Badge variant={r.matchScore >= 70 ? 'green' : r.matchScore >= 40 ? 'amber' : 'default'}>
                      {r.matchScore}% match
                    </Badge>
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        )}
      </Card>
    </div>
  );
}