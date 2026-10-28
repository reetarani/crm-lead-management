
import { useCallback, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import "./Dashboard.css";

import useLeads from "../features/leads/hooks/useLeads";
import DashboardStats from "../features/dashboard/components/DashboardStats";
import RecentLeadsTable from "../features/dashboard/components/RecentLeadsTable";

import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/layout/PageHeader";
import Button from "../components/ui/Button";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  // Lead data and API state
  const {
    leads,
    loading,
    error,
    fetchLeads,
  } = useLeads();

  // Fetch leads and handle expired authentication
  const loadLeads = useCallback(async () => {
    try {
      await fetchLeads();
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    }
  }, [fetchLeads, logout, navigate]);

  // Load leads when the dashboard mounts
  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  // Logout
  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        {/* Top navigation */}
        <header className="topbar">
          <div className="breadcrumb">
            Workspace / Dashboard
          </div>

          <div className="topbar-user">
            <div className="user-avatar">
              {(user?.username || "U")
                .charAt(0)
                .toUpperCase()}
            </div>

            <div className="user-info">
              <strong>{user?.username || "User"}</strong>
              <span>{user?.role || "Staff"}</span>
            </div>

            <button
              type="button"
              className="icon-button"
              title="Logout"
              aria-label="Logout"
              onClick={handleLogout}
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="page-content">
          {/* Dashboard heading */}
          <PageHeader
            eyebrow="OVERVIEW"
            title="Dashboard"
            subtitle={`Welcome back, ${
              user?.username || "User"
            }. Here's your CRM overview.`}
          />

          {/* Dashboard statistics */}
          <DashboardStats leads={leads} />

          {/* Recent leads table with search and filters */}
          <RecentLeadsTable
            leads={leads}
            loading={loading}
            error={error}
            onRefresh={loadLeads}
          />
        </section>
      </main>
    </div>
  );
}
