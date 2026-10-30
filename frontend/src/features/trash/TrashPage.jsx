
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { RotateCcw, Trash2, RefreshCw, LogOut } from "lucide-react";

import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { leadsService } from "../../services/leadsService";

import "./TrashPage.css";

export default function TrashPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [leads, setLeads] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [busyId, setBusyId] = useState(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  const fetchTrash = useCallback(async () => {
    setLoading(true);
    setError("");

    try {
      const response = await leadsService.getTrash();
      setLeads(response.data.data || []);
    } catch (err) {
      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
        return;
      }

      setError(
        err.response?.data?.message || "Unable to load deleted leads."
      );
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    if (user?.role === "admin") {
      fetchTrash();
    }
  }, [user?.role, fetchTrash]);

  const filteredLeads = useMemo(() => {
    const query = search.trim().toLowerCase();

    return leads.filter((lead) =>
      [lead.name, lead.email, lead.phone, lead.company]
        .some((value) => String(value || "").toLowerCase().includes(query))
    );
  }, [leads, search]);

  const handleRestore = async (lead) => {
    setBusyId(lead._id);
    setError("");
    setMessage("");

    try {
      await leadsService.restore(lead._id);
      setMessage(`Lead "${lead.name}" restored successfully.`);
      await fetchTrash();
    } catch (err) {
      setError(
        err.response?.data?.message || "Unable to restore this lead."
      );
    } finally {
      setBusyId(null);
    }
  };

  const handlePermanentDelete = async (lead) => {
    const confirmed = window.confirm(
      `Permanently delete "${lead.name}"? This cannot be undone.`
    );

    if (!confirmed) return;

    setBusyId(lead._id);
    setError("");
    setMessage("");

    try {
      await leadsService.permanentlyDelete(lead._id);
      setMessage(`Lead "${lead.name}" permanently deleted.`);
      await fetchTrash();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to permanently delete this lead."
      );
    } finally {
      setBusyId(null);
    }
  };

  if (user?.role !== "admin") {
    return <p className="trash-access-denied">Access denied. Admin only.</p>;
  }

  return (
    <div className="app-layout">
      <Sidebar />

      <main className="main-content">
        <PageHeader
          title="Trash"
          subtitle="Restore or permanently delete leads."
          action={
            <button
              type="button"
              className="trash-refresh"
              onClick={fetchTrash}
              disabled={loading}
            >
              <RefreshCw size={17} />
              Refresh
            </button>
          }
        />

        <div className="trash-page">
          {message && (
            <div className="success-message" role="status">
              {message}
            </div>
          )}

          {error && (
            <div className="error-message" role="alert">
              {error}
            </div>
          )}

          <div className="trash-toolbar">
            <input
              type="search"
              value={search}
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Search deleted leads..."
              aria-label="Search deleted leads"
            />
            <span>{leads.length} deleted leads</span>
          </div>

          <div className="trash-table-wrapper">
            <table className="trash-table">
              <thead>
                <tr>
                  <th>Lead</th>
                  <th>Phone</th>
                  <th>Company</th>
                  <th>Status</th>
                  <th>Deleted On</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={6}>Loading Trash...</td>
                  </tr>
                ) : filteredLeads.length === 0 ? (
                  <tr>
                    <td colSpan={6}>No deleted leads found.</td>
                  </tr>
                ) : (
                  filteredLeads.map((lead) => (
                    <tr key={lead._id}>
                      <td>
                        <strong>{lead.name}</strong>
                        <small>{lead.email}</small>
                      </td>
                      <td>{lead.phone}</td>
                      <td>{lead.company || "—"}</td>
                      <td>{lead.status}</td>
                      <td>
                        {lead.deletedAt
                          ? new Date(lead.deletedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td>
                        <div className="trash-actions">
                          <button
                            type="button"
                            className="trash-restore"
                            disabled={busyId !== null}
                            onClick={() => handleRestore(lead)}
                          >
                            <RotateCcw size={15} />
                            Restore
                          </button>
                          <button
                            type="button"
                            className="trash-permanent"
                            disabled={busyId !== null}
                            onClick={() => handlePermanentDelete(lead)}
                          >
                            <Trash2 size={15} />
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
