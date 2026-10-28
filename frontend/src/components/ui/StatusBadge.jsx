
import "./StatusBadge.css";

const STATUS_CONFIG = {
  New: {
    label: "New",
    className: "status-badge--new",
  },
  Contacted: {
    label: "Contacted",
    className: "status-badge--contacted",
  },
  Qualified: {
    label: "Qualified",
    className: "status-badge--qualified",
  },
  Converted: {
    label: "Converted",
    className: "status-badge--converted",
  },
  Lost: {
    label: "Lost",
    className: "status-badge--lost",
  },
};

export default function StatusBadge({ status = "New" }) {
  const config = STATUS_CONFIG[status] || {
    label: status || "Unknown",
    className: "status-badge--default",
  };

  return (
    <span className={`status-badge ${config.className}`}>
      <span className="status-badge__dot" aria-hidden="true" />
      {config.label}
    </span>
  );
}
