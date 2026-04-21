// ============================================================
// App.jsx — Top-level router
// ============================================================

import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuth } from './context/AuthContext';

// Pages
import LoginPage       from './pages/LoginPage';
import RegisterPage    from './pages/RegisterPage';
import DashboardPage   from './pages/DashboardPage';
import ProfilePage     from './pages/ProfilePage';
import GeneratorPage   from './pages/GeneratorPage';
import PreviewPage     from './pages/PreviewPage';
import ResumesPage     from './pages/ResumesPage';

// Layout
import AppLayout from './components/layout/AppLayout';

/**
 * Wraps routes that require authentication.
 * Redirects to /login if no token present.
 */
function ProtectedRoute({ children }) {
  const { token } = useAuth();
  return token ? children : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      {/* Public routes */}
      <Route path="/login"    element={<LoginPage />} />
      <Route path="/register" element={<RegisterPage />} />

      {/* Protected routes — all wrapped in AppLayout (sidebar + topbar) */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <AppLayout />
          </ProtectedRoute>
        }
      >
        <Route index                   element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard"        element={<DashboardPage />} />
        <Route path="profile"          element={<ProfilePage />} />
        <Route path="generate"         element={<GeneratorPage />} />
        <Route path="resumes"          element={<ResumesPage />} />
        <Route path="resumes/:id"      element={<PreviewPage />} />
      </Route>

      {/* Catch-all */}
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}