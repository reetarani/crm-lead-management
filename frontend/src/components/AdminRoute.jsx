import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AdminRoute() {
  const { user, isInitializing } = useAuth();

  console.log("AdminRoute user:", user);
  console.log("AdminRoute role:", user?.role);

  if (isInitializing) {
    return <div>Checking your permissions...</div>;
  }

  if (user?.role !== "admin") {
    return <Navigate to="/dashboard" replace />;
  }

  return <Outlet />;
}