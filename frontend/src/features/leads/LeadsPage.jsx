
import { useCallback, useEffect, useMemo, useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Plus, RefreshCw, LogOut, Pencil, Eye, Trash2, } from "lucide-react";
import useLeads from "./hooks/useLeads";
import { useAuth } from "../../context/AuthContext";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/layout/PageHeader";
import SearchInput from "../../components/ui/SearchInput";
import StatusBadge from "../../components/ui/StatusBadge";
import Button from "../../components/ui/Button";
import { leadsService } from "../../services/leadsService";
import "./LeadsPage.css";

const STATUSES = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
];

export default function LeadsPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 5;
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const { leads, loading, error, fetchLeads } = useLeads();
  const location = useLocation();
  const successMessage = location.state?.successMessage;
  const [deletingId, setDeletingId] = useState(null);
  const [deleteError, setDeleteError] = useState("");
  const [deleteSuccess, setDeleteSuccess] = useState("");
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

  useEffect(() => {
    loadLeads();
  }, [loadLeads]);

  const filteredLeads = leads.filter((lead) => {
    const term = search.trim().toLowerCase();

    const matchesSearch = [
      lead.name,
      lead.email,
      lead.phone,
      lead.company,
    ].some((value) =>
      (value || "").toLowerCase().includes(term)
    );

    const matchesStatus =
      status === "All" || lead.status === status;

    return matchesSearch && matchesStatus;
  });
const totalPages = Math.max(
  1,
  Math.ceil(filteredLeads.length / pageSize)
);

const paginatedLeads = useMemo(() => {
  const startIndex = (currentPage - 1) * pageSize;

  return filteredLeads.slice(
    startIndex,
    startIndex + pageSize
  );
}, [filteredLeads, currentPage]);

const startItem =
  filteredLeads.length === 0
    ? 0
    : (currentPage - 1) * pageSize + 1;

const endItem = Math.min(
  currentPage * pageSize,
  filteredLeads.length
);
useEffect(() => {
  setCurrentPage(1);
}, [search, status]);
//delete lead

const handleDelete = async (lead) => {
  const confirmed = window.confirm(
  `Are you sure you want to move "${lead.name}" to Trash? You can restore it later from the Trash.`
);

  if (!confirmed) return;

  setDeletingId(lead._id);
  setDeleteError("");
  setDeleteSuccess("");

  try {
    await leadsService.remove(lead._id);

    setDeleteSuccess(`Lead "${lead.name}" moved to Trash successfully.`);

    await loadLeads();
  } catch (err) {
    if (err.response?.status === 401) {
      logout();
      navigate("/login", { replace: true });
      return;
    }

    if (err.response?.status === 403) {
      setDeleteError(
        "You don't have permission to delete leads."
      );
      return;
    }

    setDeleteError(
      err.response?.data?.message ||
        "Unable to delete this lead. Please try again."
    );
  } finally {
    setDeletingId(null);
  }
};

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        <header className="topbar">
          <div className="breadcrumb">
            Workspace / Leads
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
            title="Leads"
            subtitle="Manage and track your customer enquiries."
            action={
              <Button
                icon={Plus}
                onClick={() =>
                  navigate("/leads/new")
                }
              >
                Add lead
              </Button>
            }
          />
          {successMessage && (
            <div className="success-message" role="status">
              {successMessage}
            </div>
          )}
          {deleteSuccess && (
            <div className="success-message" role="status">
              {deleteSuccess}
            </div>
          )}

          {deleteError && (
            <div className="error-message" role="alert">
              {deleteError}
            </div>
          )}
          <section className="leads-panel">
            <div className="panel-heading">
              <div>
                <h2>All leads</h2>
                <p>
                  {leads.length} total{" "}
                  {leads.length === 1 ? "lead" : "leads"}
                </p>
              </div>

              <Button
                variant="secondary"
                icon={RefreshCw}
                loading={loading}
                onClick={loadLeads}
              >
                Refresh
              </Button>
            </div>

            <div className="table-toolbar">
              <SearchInput
                value={search}
                onChange={setSearch}
                placeholder="Search name, email, phone or company..."
                ariaLabel="Search leads"
              />

              <select
                value={status}
                onChange={(event) =>
                  setStatus(event.target.value)
                }
                aria-label="Filter leads by status"
              >
                {STATUSES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </div>

            {error && (
              <div className="error-message" role="alert">
                <span>{error}</span>
                <Button
                  variant="secondary"
                  size="small"
                  onClick={loadLeads}
                >
                  Retry
                </Button>
              </div>
            )}

            <div className="table-wrapper">
              <table>
                <thead>
                  <tr>
                    <th>Lead</th>
                    <th>Phone</th>
                    <th>Company</th>
                    <th>Source</th>
                    <th>Status</th>
                    <th>Created</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={7}>
                        Loading leads...
                      </td>
                    </tr>
                  ) : filteredLeads.length === 0 ? (
                    <tr>
                      <td
                        colSpan={7}
                        className="empty-state"
                      >
                        No matching leads found.
                      </td>
                    </tr>
                  ) : (
                    paginatedLeads.map((lead) => (
                      <tr key={lead._id}>
                        <td>
                          <div className="lead-person">
                            <div className="lead-avatar">
                              {(lead.name || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>{lead.name}</strong>
                              <span>{lead.email}</span>
                            </div>
                          </div>
                        </td>

                        <td>{lead.phone || "—"}</td>
                        <td>{lead.company || "—"}</td>
                        <td>{lead.source || "—"}</td>
                        <td>
                          <StatusBadge status={lead.status} />
                        </td>
                        <td>
                          {lead.createdAt
                            ? new Date(
                                lead.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>
                        <td>
                            <Button
                                variant="secondary"
                                size="small"
                                icon={Pencil}
                                onClick={() =>
                                navigate(`/leads/${lead._id}/edit`)
                                }
                            >
                                Edit
                            </Button>
                            <Button
                              variant="secondary"
                              size="small"
                              icon={Eye}
                              onClick={() => navigate(`/leads/${lead._id}`)}
                            >
                              View
                            </Button>
                            {user?.role === "admin" && (
                            <Button
                              variant="secondary"
                              size="small"
                              icon={Trash2}
                              loading={deletingId === lead._id}
                              disabled={deletingId !== null}
                              onClick={() => handleDelete(lead)}
                            >
                              Delete
                            </Button>
                          )}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>

            
            <div className="table-footer">
              <span>
                Showing {startItem}–{endItem} of {filteredLeads.length} leads
              </span>

              <div className="pagination-controls">
                <button
                  type="button"
                  className="pagination-button"
                  disabled={currentPage === 1}
                  onClick={() =>
                    setCurrentPage((page) => Math.max(1, page - 1))
                  }
                >
                  Previous
                </button>

                {Array.from({ length: totalPages }, (_, index) => index + 1)
                  .map((page) => (
                    <button
                      type="button"
                      key={page}
                      className={`pagination-button ${
                        currentPage === page ? "active" : ""
                      }`}
                      aria-current={currentPage === page ? "page" : undefined}
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </button>
                  ))}

                <button
                  type="button"
                  className="pagination-button"
                  disabled={currentPage === totalPages}
                  onClick={() =>
                    setCurrentPage((page) =>
                      Math.min(totalPages, page + 1)
                    )
                  }
                >
                  Next
                </button>
              </div>
            </div>

          </section>
        </section>
      </main>
    </div>
  );
}
