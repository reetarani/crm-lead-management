
import { useState } from "react";
import { RefreshCw } from "lucide-react";

import SearchInput from "../../../components/ui/SearchInput";
import StatusBadge from "../../../components/ui/StatusBadge";
import Button from "../../../components/ui/Button";

const STATUSES = [
  "All",
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
];

export default function RecentLeadsTable({
  leads = [],
  loading = false,
  error = "",
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("All");

  const filteredLeads = leads.filter((lead) => {
    const term = search.trim().toLowerCase();

    const matchesSearch = [
      lead.name,
      lead.email,
      lead.company,
    ].some((value) =>
      (value || "").toLowerCase().includes(term)
    );

    const matchesStatus =
      status === "All" || lead.status === status;

    return matchesSearch && matchesStatus;
  });

  return (
    <section className="leads-panel">
      <div className="panel-heading">
        <div>
          <h2>Recent leads</h2>
          <p>Search and review your customer enquiries.</p>
        </div>

        <Button
          variant="secondary"
          icon={RefreshCw}
          onClick={onRefresh}
          loading={loading}
        >
          Refresh
        </Button>
      </div>

      {/* Search and status filter */}
      <div className="table-toolbar">
        <SearchInput
          value={search}
          onChange={setSearch}
          placeholder="Search name, email or company..."
          ariaLabel="Search leads"
        />

        <select
          value={status}
          onChange={(event) => setStatus(event.target.value)}
          aria-label="Filter leads by status"
        >
          {STATUSES.map((item) => (
            <option key={item} value={item}>
              {item}
            </option>
          ))}
        </select>
      </div>

      {/* Error state */}
      {error && (
        <div className="error-message" role="alert">
          <span>{error}</span>

          <Button
            variant="secondary"
            size="small"
            onClick={onRefresh}
            loading={loading}
          >
            Retry
          </Button>
        </div>
      )}

      {/* Leads table */}
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>Lead</th>
              <th>Company</th>
              <th>Source</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>

          <tbody>
            {loading ? (
              <tr>
                <td colSpan={5}>Loading leads...</td>
              </tr>
            ) : filteredLeads.length === 0 ? (
              <tr>
                <td colSpan={5} className="empty-state">
                  No matching leads found.
                </td>
              </tr>
            ) : (
              filteredLeads.map((lead) => (
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
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="table-footer">
        Showing {filteredLeads.length} of {leads.length} leads
      </div>
    </section>
  );
}
