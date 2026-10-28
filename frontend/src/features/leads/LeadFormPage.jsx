
import { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { LogOut } from "lucide-react";

import { leadsService } from "../../services/leadsService";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import LeadForm from "./components/LeadForm";

import "./LeadsPage.css";

export default function LeadFormPage() {
  const navigate = useNavigate();
  const { id } = useParams();
  const { user, logout } = useAuth();

  const isEdit = Boolean(id);

  const [initialValues, setInitialValues] = useState(null);
  const [loadingLead, setLoadingLead] = useState(isEdit);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  const loadLead = useCallback(async () => {
    if (!id) return;

    setLoadingLead(true);
    setError("");

    try {
      const response = await leadsService.getById(id);
      const lead = response.data.data;

      if (!lead || !lead._id) {
        setError("Lead not found.");
        return;
      }

      setInitialValues({
        name: lead.name || "",
        email: lead.email || "",
        phone: lead.phone || "",
        company: lead.company || "",
        source: lead.source || "Website",
        status: lead.status || "New",
      });
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message ||
          "Unable to load this lead. Please try again."
      );
    } finally {
      setLoadingLead(false);
    }
  }, [id, logout, navigate]);

  useEffect(() => {
    if (isEdit) {
      loadLead();
    }
  }, [isEdit, loadLead]);

const handleSubmit = async (leadData) => {
  setSubmitting(true);
  setError("");

  try {
    if (isEdit) {
      await leadsService.update(id, leadData);

      navigate("/leads", {
        replace: true,
        state: {
          successMessage: "Lead updated successfully!",
        },
      });
    } else {
      await leadsService.create(leadData);

      navigate("/leads", {
        replace: true,
        state: {
          successMessage: "Lead created successfully!",
        },
      });
    }
  } catch (err) {
    if (err.response?.status === 401) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    if (err.response?.status === 403) {
      setError("You don't have permission to edit this lead.");
      return;
    }

    setError(
      err.response?.data?.message ||
        `Unable to ${isEdit ? "update" : "create"} the lead. Please try again.`
    );
  } finally {
    setSubmitting(false);
  }
};

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace / Leads / {isEdit ? "Edit lead" : "Add lead"}
          </div>

          <div className="topbar-user">
            <div className="user-avatar">
              {(user?.username || "U").charAt(0).toUpperCase()}
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

        <section className="page-content lead-form-page">
          <PageHeader
            eyebrow="CRM MANAGEMENT"
            title={isEdit ? "Edit lead" : "Add lead"}
            subtitle={
              isEdit
                ? "Update the customer details below."
                : "Enter the customer details below."
            }
          />

          {error && (
            <div className="error-message" role="alert">
              <span>{error}</span>
              {isEdit && !initialValues && (
                <Button
                  variant="secondary"
                  size="small"
                  onClick={loadLead}
                  loading={loadingLead}
                >
                  Retry
                </Button>
              )}
            </div>
          )}

          {loadingLead ? (
            <p role="status">Loading lead details...</p>
          ) : initialValues || !isEdit ? (
            <div className="lead-form-page__container">
              <LeadForm
                key={id || "new-lead"}
                initialValues={initialValues || undefined}
                onSubmit={handleSubmit}
                onCancel={() => navigate("/leads")}
                submitting={submitting}
                submitLabel={isEdit ? "Update lead" : "Create lead"}
              />
            </div>
          ) : null}
        </section>
      </main>
    </div>
  );
}