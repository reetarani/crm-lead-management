
import { useCallback, useEffect, useState } from "react";
import { Plus } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import Topbar from "../../components/layout/Topbar";
import PageHeader from "../../components/layout/PageHeader";

import useLeads from "../leads/hooks/useLeads";
import useFollowUps from "./hooks/useFollowUps";

import followUpsService from "./services/followUpsService";

import FollowUpStats from "./components/FollowUpStats";
import FollowUpModal from "./components/FollowUpModal";
import FollowUpTable from "./components/FollowUpTable";

import "./FollowUpsPage.css";

export default function FollowUpsPage() {
  // Fetch existing leads
  const {
    leads,
    loading: leadsLoading,
    error: leadsError,
    fetchLeads,
  } = useLeads();

  // Fetch follow-ups
  const {
    followUps,
    dashboard,
    loading,
    error,
    fetchFollowUps,
  } = useFollowUps();

  // Modal and form states
  const [modalOpen, setModalOpen] = useState(false);
  const [editingFollowUp, setEditingFollowUp] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [activeFilter, setActiveFilter] = useState("all");

  // Load leads and follow-ups when page opens
  useEffect(() => {
    fetchLeads().catch(() => {
      // Error is handled inside useLeads.
    });
  }, [fetchLeads]);

  const refresh = useCallback(async () => {
    await fetchFollowUps();
  }, [fetchFollowUps]);

  // Create or update follow-up
  const handleSave = async (data) => {
    try {
      setSubmitting(true);

      if (editingFollowUp) {
        await followUpsService.update(editingFollowUp._id, data);
      } else {
        await followUpsService.create(data);
      }

      setModalOpen(false);
      setEditingFollowUp(null);

      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to save follow-up. Please try again."
      );
    } finally {
      setSubmitting(false);
    }
  };

  // Complete follow-up
  const handleComplete = async (id) => {
    if (!window.confirm("Mark this follow-up as completed?")) return;

    try {
      await followUpsService.complete(id);
      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to complete follow-up."
      );
    }
  };

  // Cancel follow-up
  const handleCancel = async (id) => {
    if (!window.confirm("Cancel this follow-up?")) return;

    try {
      await followUpsService.cancel(id);
      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to cancel follow-up."
      );
    }
  };

  // Delete follow-up
  const handleDelete = async (id) => {
    if (!window.confirm("Delete this follow-up permanently?")) return;

    try {
      await followUpsService.remove(id);
      await refresh();
    } catch (err) {
      alert(
        err.response?.data?.message ||
          "Unable to delete follow-up."
      );
    }
  };

  // Open edit modal
  const openEdit = (item) => {
    setEditingFollowUp(item);
    setModalOpen(true);
  };

  // Open create modal
  const openCreate = () => {
    setEditingFollowUp(null);
    setModalOpen(true);
  };

  // Filter follow-ups
  const filteredFollowUps =
    activeFilter === "all"
      ? followUps
      : followUps.filter(
          (item) => item.status === activeFilter
        );

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar breadcrumb="Workspace / Follow-ups" />

        <section className="page-content">
          <PageHeader
            eyebrow="RELATIONSHIP MANAGEMENT"
            title="Follow-ups"
            subtitle="Manage your scheduled client follow-ups and reminders."
          />

          {/* Schedule Follow-up Button */}
          <div className="followup-page-actions">
            <button
              type="button"
              className="followup-add-btn"
              onClick={openCreate}
              disabled={leadsLoading}
            >
              <Plus size={18} />
              {leadsLoading
                ? "Loading Leads..."
                : "Schedule Follow-up"}
            </button>
          </div>

          {/* Lead loading error */}
          {leadsError && (
            <p className="error-message" role="alert">
              {leadsError}
            </p>
          )}

          {/* Follow-up statistics */}
          <FollowUpStats
            counts={dashboard?.counts || {}}
          />

          {/* Follow-up error */}
          {error && (
            <p className="error-message" role="alert">
              {error}
            </p>
          )}

          {/* Follow-up list */}
          <section className="followup-panel">
            <div className="followup-panel-header">
              <div>
                <h2>All Follow-ups</h2>
                <p>
                  View and manage your follow-up activities.
                </p>
              </div>

              <select
                value={activeFilter}
                onChange={(e) =>
                  setActiveFilter(e.target.value)
                }
              >
                <option value="all">All Follow-ups</option>
                <option value="pending">Pending</option>
                <option value="completed">Completed</option>
                <option value="cancelled">Cancelled</option>
              </select>
            </div>

            <FollowUpTable
              followUps={filteredFollowUps}
              loading={loading}
              onEdit={openEdit}
              onComplete={handleComplete}
              onCancel={handleCancel}
              onDelete={handleDelete}
            />
          </section>
        </section>
      </main>

      {/* Create / Edit Follow-up Modal */}
      <FollowUpModal
        isOpen={modalOpen}
        onClose={() => {
          setModalOpen(false);
          setEditingFollowUp(null);
        }}
        onSubmit={handleSave}
        leads={leads}
        editingFollowUp={editingFollowUp}
        submitting={submitting}
      />
    </div>
  );
}
