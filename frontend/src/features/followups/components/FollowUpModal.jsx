
import { useEffect, useRef, useState } from "react";
import { X, CalendarClock } from "lucide-react";

import "./FollowUpModal.css";

const formatDateTimeLocal = (dateValue) => {
  if (!dateValue) return "";

  const date = new Date(dateValue);

  if (Number.isNaN(date.getTime())) return "";

  const offset = date.getTimezoneOffset() * 60000;

  return new Date(date.getTime() - offset)
    .toISOString()
    .slice(0, 16);
};

export default function FollowUpModal({
  isOpen,
  onClose,
  onSubmit,
  leads = [],
  editingFollowUp = null,
  submitting = false,
}) {
  const dateTimeRef = useRef(null);

  const [form, setForm] = useState({
    leadId: "",
    scheduledAt: "",
    note: "",
  });

  const [error, setError] = useState("");

  // Open native calendar picker
  const openDatePicker = () => {
    const input = dateTimeRef.current;

    if (!input) return;

    if (typeof input.showPicker === "function") {
      try {
        input.showPicker();
      } catch {
        input.focus();
        input.click();
      }
    } else {
      input.focus();
      input.click();
    }
  };

  // Load form data when modal opens
  useEffect(() => {
    if (!isOpen) return;

    if (editingFollowUp) {
      setForm({
        leadId: editingFollowUp.lead?._id || "",
        scheduledAt: formatDateTimeLocal(
          editingFollowUp.scheduledAt
        ),
        note: editingFollowUp.note || "",
      });
    } else {
      setForm({
        leadId: "",
        scheduledAt: "",
        note: "",
      });
    }

    setError("");
  }, [isOpen, editingFollowUp]);

  if (!isOpen) return null;

  // Handle input changes
  const handleChange = (e) => {
    const { name, value } = e.target;

    setForm((prev) => ({
      ...prev,
      [name]: value,
    }));

    setError("");
  };

  // Submit follow-up
 
const handleSubmit = async (e) => {
  e.preventDefault();

  if (
    !form.leadId ||
    !form.scheduledAt ||
    !form.note.trim()
  ) {
    setError("Please complete all fields.");
    return;
  }

  const scheduledDate = new Date(form.scheduledAt);

  if (Number.isNaN(scheduledDate.getTime())) {
    setError("Please select a valid date and time.");
    return;
  }

  if (scheduledDate <= new Date()) {
    setError("Please select a future date and time.");
    return;
  }

  try {
    const payload = {
      scheduledAt: scheduledDate.toISOString(),
      note: form.note.trim(),
    };

    // Include leadId only when creating a new follow-up.
    if (!editingFollowUp) {
      payload.leadId = form.leadId;
    }

    await onSubmit(payload);
  } catch (err) {
    setError(
      err.response?.data?.message ||
        "Unable to save follow-up. Please try again."
    );
  }
};


  return (
    <div className="followup-modal-overlay">
      <div
        className="followup-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="followup-modal-title"
      >
        {/* Modal Header */}
        <div className="followup-modal-header">
          <div>
            <h2 id="followup-modal-title">
              {editingFollowUp
                ? "Edit Follow-up"
                : "Schedule Follow-up"}
            </h2>

            <p>Enter the follow-up details below.</p>
          </div>

          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Modal Form */}
        <form onSubmit={handleSubmit}>
          {/* Select Lead */}
          <div className="followup-form-group">
            <label htmlFor="leadId">
              Select Lead
            </label>

            <select
              id="leadId"
              name="leadId"
              value={form.leadId}
              onChange={handleChange}
              disabled={Boolean(editingFollowUp)}
              required
            >
              <option value="">Choose a lead</option>

              {leads.map((lead) => (
                <option
                  key={lead._id}
                  value={lead._id}
                >
                  {lead.name}
                  {lead.company
                    ? ` - ${lead.company}`
                    : ""}
                </option>
              ))}
            </select>

            {leads.length === 0 && !editingFollowUp && (
              <small>No active leads available.</small>
            )}
          </div>

          {/* Date and Time */}
          <div className="followup-form-group">
            <label htmlFor="scheduledAt">
              Follow-up Date & Time
            </label>

            <div className="followup-datetime-wrapper">
              <button
                type="button"
                className="followup-calendar-btn"
                onClick={openDatePicker}
                aria-label="Open date and time picker"
              >
                <CalendarClock size={22} />
              </button>

              <input
                ref={dateTimeRef}
                type="datetime-local"
                id="scheduledAt"
                name="scheduledAt"
                value={form.scheduledAt}
                onChange={handleChange}
                min={formatDateTimeLocal(new Date())}
                required
              />
            </div>
          </div>

          {/* Notes */}
          <div className="followup-form-group">
            <label htmlFor="note">
              Follow-up Notes
            </label>

            <textarea
              id="note"
              name="note"
              rows={4}
              maxLength={1000}
              placeholder="Enter follow-up details..."
              value={form.note}
              onChange={handleChange}
              required
            />
          </div>

          {/* Error */}
          {error && (
            <p
              className="followup-form-error"
              role="alert"
            >
              {error}
            </p>
          )}

          {/* Buttons */}
          <div className="followup-modal-actions">
            <button
              type="button"
              className="followup-cancel-btn"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="followup-submit-btn"
              disabled={submitting}
            >
              {submitting
                ? "Saving..."
                : editingFollowUp
                  ? "Update Follow-up"
                  : "Schedule Follow-up"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
