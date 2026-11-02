
import {
  CheckCircle2,
  Pencil,
  XCircle,
  Trash2,
} from "lucide-react";

export default function FollowUpTable({
  followUps = [],
  loading,
  onEdit,
  onComplete,
  onCancel,
  onDelete,
}) {
  const formatDate = (date) =>
    new Date(date).toLocaleString("en-IN", {
      dateStyle: "medium",
      timeStyle: "short",
    });

  if (loading) {
    return <p className="followup-empty">Loading follow-ups...</p>;
  }

  return (
    <div className="followup-table-wrapper">
      <table>
        <thead>
          <tr>
            <th>Lead</th>
            <th>Date & Time</th>
            <th>Notes</th>
            <th>Created By</th>
            <th>Status</th>
            <th>Actions</th>
          </tr>
        </thead>

        <tbody>
          {followUps.length === 0 ? (
            <tr>
              <td colSpan="6" className="followup-empty">
                No follow-ups found.
              </td>
            </tr>
          ) : (
            followUps.map((item) => (
              <tr key={item._id}>
                <td>
                  <strong>{item.lead?.name || "Deleted lead"}</strong>
                  <span className="followup-company">
                    {item.lead?.company || ""}
                  </span>
                </td>

                <td>{formatDate(item.scheduledAt)}</td>

                <td className="followup-note">{item.note}</td>

                <td>{item.createdBy?.username || "Unknown"}</td>

                <td>
                  <span className={`followup-status ${item.status}`}>
                    {item.status}
                  </span>
                </td>

                <td>
                  <div className="followup-actions">
                    {item.status === "pending" && (
                      <>
                        <button
                          type="button"
                          title="Edit"
                          onClick={() => onEdit(item)}
                        >
                          <Pencil size={16} />
                        </button>

                        <button
                          type="button"
                          title="Complete"
                          onClick={() => onComplete(item._id)}
                        >
                          <CheckCircle2 size={16} />
                        </button>

                        <button
                          type="button"
                          title="Cancel"
                          onClick={() => onCancel(item._id)}
                        >
                          <XCircle size={16} />
                        </button>
                      </>
                    )}

                    <button
                      type="button"
                      title="Delete"
                      onClick={() => onDelete(item._id)}
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}
