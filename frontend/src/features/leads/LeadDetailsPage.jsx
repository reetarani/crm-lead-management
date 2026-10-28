
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { ArrowLeft, LogOut, Pencil } from "lucide-react";

import { leadsService } from "../../services/leadsService";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import StatusBadge from "../../components/ui/StatusBadge";

import "./LeadDetailsPage.css";

export default function LeadDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [lead, setLead] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const loadLead = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await leadsService.getById(id);
      const leadData = response.data.data;

      if (!leadData?._id) {
        setError("Lead not found.");
        return;
      }

      setLead(leadData);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      if (err.response?.status === 404) {
        setError("Lead not found.");
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load lead details. Please try again."
      );
    } finally {
      setLoading(false);
    }
  }, [id, logout, navigate]);

  useEffect(() => {
    loadLead();
  }, [loadLead]);

  const formatDate = (date) => {
    if (!date) return "—";

    const parsedDate = new Date(date);

    return Number.isNaN(parsedDate.getTime())
      ? "—"
      : parsedDate.toLocaleString();
  };

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace / Leads / Details
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
              onClick={handleLogout}
              aria-label="Logout"
              title="Logout"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <section className="page-content">
          <PageHeader
            eyebrow="CRM MANAGEMENT"
            title="Lead details"
            subtitle="View the complete customer enquiry."
            action={
              <Button
                variant="secondary"
                icon={ArrowLeft}
                onClick={() => navigate("/leads")}
              >
                Back to leads
              </Button>
            }
          />

          {loading ? (
            <p role="status">Loading lead details...</p>
          ) : error ? (
            <div className="error-message" role="alert">
              <span>{error}</span>

              <Button
                variant="secondary"
                size="small"
                onClick={loadLead}
              >
                Retry
              </Button>
            </div>
          ) : lead ? (
            <section className="lead-details-card">
              <div className="lead-details-heading">
                <div className="lead-details-avatar">
                  {(lead.name || "?")
                    .charAt(0)
                    .toUpperCase()}
                </div>

                <div className="lead-details-identity">
                  <h2>{lead.name}</h2>
                  <p>{lead.email || "No email provided"}</p>
                </div>

                <div className="lead-details-status">
                  <StatusBadge status={lead.status} />
                </div>
              </div>

              <div className="lead-details-grid">
                <div className="lead-detail-item">
                  <span>Full name</span>
                  <strong>{lead.name || "—"}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Email address</span>
                  <strong>{lead.email || "—"}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Phone number</span>
                  <strong>{lead.phone || "—"}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Company</span>
                  <strong>{lead.company || "—"}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Lead source</span>
                  <strong>{lead.source || "—"}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Status</span>
                  <strong>{lead.status || "—"}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Created on</span>
                  <strong>{formatDate(lead.createdAt)}</strong>
                </div>

                <div className="lead-detail-item">
                  <span>Last updated</span>
                  <strong>{formatDate(lead.updatedAt)}</strong>
                </div>
              </div>

              <div className="lead-details-actions">
                <Button
                  variant="secondary"
                  icon={ArrowLeft}
                  onClick={() => navigate("/leads")}
                >
                  Back to leads
                </Button>

                {user?.role === "admin" && (
                  <Button
                    icon={Pencil}
                    onClick={() =>
                      navigate(`/leads/${lead._id}/edit`)
                    }
                  >
                    Edit lead
                  </Button>
                )}
              </div>
            </section>
          ) : null}
        </section>
      </main>
    </div>
  );
}
