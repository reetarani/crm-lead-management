
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import "./Dashboard.css";
import Topbar from "../components/layout/Topbar";
import useLeads from "../features/leads/hooks/useLeads";
import DashboardStats from "../features/dashboard/components/DashboardStats";
import RecentLeadsTable from "../features/dashboard/components/RecentLeadsTable";
import dashboardService from "../features/dashboard/services/dashboardService";
import DashboardCharts from "../features/dashboard/components/DashboardCharts";

import { useAuth } from "../context/AuthContext";
import Sidebar from "../components/Sidebar";
import PageHeader from "../components/layout/PageHeader";

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [statsData, setStatsData] = useState(null);
  const [statsLoading, setStatsLoading] = useState(true);
  const [statsError, setStatsError] = useState("");

  // Existing lead data and API state
  const {
    leads,
    loading,
    error,
    fetchLeads,
  } = useLeads();

  // Fetch dashboard statistics
  const loadDashboardStats = useCallback(async () => {
    try {
      setStatsLoading(true);
      setStatsError("");

      const response = await dashboardService.getStats();

      setStatsData(response.data);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      setStatsError(
        err.response?.data?.message ||
        "Failed to load dashboard statistics"
      );
    } finally {
      setStatsLoading(false);
    }
  }, [logout, navigate]);

  // Fetch existing leads
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

  // Refresh both dashboard statistics and recent leads
  const loadDashboardData = useCallback(async () => {
    await Promise.all([
      loadLeads(),
      loadDashboardStats(),
    ]);
  }, [loadLeads, loadDashboardStats]);

  // Load dashboard data when component mounts
  useEffect(() => {
    loadDashboardData();
  }, [loadDashboardData]);

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar breadcrumb="Workspace / Dashboard" />

        <section className="page-content">
          <PageHeader
            eyebrow="OVERVIEW"
            title="Dashboard"
            subtitle={`Welcome back, ${
              user?.username || "User"
            }. Here's your CRM overview.`}
          />

          {/* Dashboard statistics from backend API */}
          {statsError && (
            <p className="error-message" role="alert">
              {statsError}
            </p>
          )}

          {statsLoading && !statsData ? (
            <p>Loading dashboard statistics...</p>
          ) : (
            <>
            <DashboardStats statsData={statsData} />
            <DashboardCharts statsData={statsData} />
            </>
            
          )}

          {/* Existing Recent Leads table */}
          <RecentLeadsTable
            leads={leads}
            loading={loading}
            error={error}
            onRefresh={loadDashboardData}
          />
        </section>
      </main>
    </div>
  );
}
