
import {
  BrowserRouter,
  Navigate,
  Route,
  Routes,
} from "react-router-dom";

import { AuthProvider, useAuth } from "./context/AuthContext";

import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";

import LeadsPage from "./features/leads/LeadsPage";
import LeadFormPage from "./features/leads/LeadFormPage";
import LeadDetailsPage from "./features/leads/LeadDetailsPage";
import TrashPage from "./features/trash/TrashPage";

function PublicRoute({ children }) {
  const { isInitializing, isAuthenticated } = useAuth();

  if (isInitializing) {
    return (
      <div className="auth-loading" role="status">
        Checking your session...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/dashboard" replace />;
  }

  return children;
}

function AppRoutes() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicRoute>
            <Login />
          </PublicRoute>
        }
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/new" element={<LeadFormPage />} />
        <Route path="/leads/:id/edit" element={<LeadFormPage />} />
        <Route path="/leads/:id" element={<LeadDetailsPage />} />

        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/trash" element={<TrashPage />} />
        </Route>

        {/* Future routes */}
        {/* <Route path="/follow-ups" element={<FollowUps />} /> */}
        {/* <Route path="/reports" element={<Reports />} /> */}
        {/* <Route path="/settings" element={<Settings />} /> */}
      </Route>

      <Route
        path="*"
        element={<Navigate to="/dashboard" replace />}
      />
    </Routes>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  );
}
