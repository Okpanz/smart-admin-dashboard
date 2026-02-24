import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { useAuth } from './context/AuthContext';

import { Dashboard } from './pages/Dashboard';
import { LandingPage } from './pages/LandingPage';
import { VerificationPage } from './pages/VerificationPage';
import { Login } from './pages/Login';
import { CreateStaff } from './pages/CreateStaff';
import { Enrollments } from './pages/Enrollments';
import { Services } from './pages/Services';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { StaffList } from './pages/StaffList';
import { StaffDetails } from './pages/StaffDetails';
import { LivenessCheckPage } from './pages/LivenessCheckPage';
import { Sync } from './pages/Sync';
import { LivenessReportPage } from './pages/LivenessReportPage';
import { ManualMatchingPage } from './pages/ManualMatchingPage';
import { Toaster } from 'react-hot-toast';

const AppShell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

const RootRoute = () => {
  const { isAuthenticated } = useAuth();
  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }
  return <LandingPage />;
};

const LivenessReportRoute = () => {
  const { user } = useAuth();
  const allowedLivenessServiceIds = ['234082052', '234078915', '234079021', '234080703'];
  const canAccessLivenessReport =
    user?.role === 'service_admin' &&
    user.service_id &&
    allowedLivenessServiceIds.includes(String(user.service_id));

  if (!canAccessLivenessReport) {
    return <Navigate to="/dashboard" replace />;
  }

  return <LivenessReportPage />;
};

function App() {
  return (
    <>
      <Routes>
        {/* Public */}
        <Route path="/" element={<RootRoute />} />
        <Route path="/verification" element={<VerificationPage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/liveness-check" element={<LivenessCheckPage />} />

        {/* Protected */}
        <Route
          path="/dashboard"
          element={
            <AppShell>
              <Dashboard />
            </AppShell>
          }
        />

        <Route
          path="/enrollments"
          element={
            <AppShell>
              <Enrollments />
            </AppShell>
          }
        />

        <Route
          path="/staff"
          element={
            <AppShell>
              <StaffList />
            </AppShell>
          }
        />
        <Route
          path="/staff/create"
          element={
            <AppShell>
              <CreateStaff />
            </AppShell>
          }
        />
        <Route
          path="/staff/:id"
          element={
            <AppShell>
              <StaffDetails />
            </AppShell>
          }
        />

        <Route
          path="/services"
          element={
            <AppShell>
              <Services />
            </AppShell>
          }
        />
        <Route
          path="/audit"
          element={
            <AppShell>
              <AuditLogs />
            </AppShell>
          }
        />
        <Route
          path="/health"
          element={
            <AppShell>
              <SystemHealth />
            </AppShell>
          }
        />
        <Route
          path="/sync"
          element={
            <AppShell>
              <Sync />
            </AppShell>
          }
        />

        <Route
          path="/liveness-report"
          element={
            <AppShell>
              <LivenessReportRoute />
            </AppShell>
          }
        />
        <Route
          path="/manual-match/:id"
          element={
            <AppShell>
              <ManualMatchingPage />
            </AppShell>
          }
        />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}

export default App;
