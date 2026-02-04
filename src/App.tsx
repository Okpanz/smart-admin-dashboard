import { Routes, Route, Navigate } from 'react-router-dom';
import { DashboardLayout } from './layouts/DashboardLayout';
import { ProtectedRoute } from './components/ProtectedRoute';

import { Dashboard } from './pages/Dashboard';
import { Login } from './pages/Login';
import { CreateStaff } from './pages/CreateStaff';
import { Enrollments } from './pages/Enrollments';
import { Services } from './pages/Services';
import { AuditLogs } from './pages/AuditLogs';
import { SystemHealth } from './pages/SystemHealth';
import { StaffList } from './pages/StaffList';
import { StaffDetails } from './pages/StaffDetails';

const AppShell = ({ children }: { children: React.ReactNode }) => (
  <ProtectedRoute>
    <DashboardLayout>{children}</DashboardLayout>
  </ProtectedRoute>
);

function App() {
  return (
    <Routes>
      {/* Public */}
      <Route path="/login" element={<Login />} />

      {/* Protected */}
      <Route
        path="/"
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

      {/* Fallback */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
