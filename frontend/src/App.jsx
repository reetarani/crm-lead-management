
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
import UsersPage from "./features/users/UsersPage";
import ProfilePage from "./features/profile/ProfilePage";
import ForgotPassword from "./features/auth/ForgotPassword";
import ResetPassword from "./features/auth/ResetPassword";
import FollowUpsPage from "./features/followups/FollowUpsPage";

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
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route
        path="/reset-password/:token"
        element={<ResetPassword />}
      />

      <Route element={<ProtectedRoute />}>
        <Route path="/dashboard" element={<Dashboard />} />
        <Route path="/leads" element={<LeadsPage />} />
        <Route path="/leads/new" element={<LeadFormPage />} />
        <Route path="/leads/:id/edit" element={<LeadFormPage />} />
        <Route path="/leads/:id" element={<LeadDetailsPage />} />
        <Route path="/profile" element={<ProfilePage />} />
        <Route path="/follow-ups" element={<FollowUpsPage />} />

        {/* Admin-only routes */}
        <Route element={<AdminRoute />}>
          <Route path="/trash" element={<TrashPage />} />
          <Route path="/users" element={<UsersPage />} />
        </Route>
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
