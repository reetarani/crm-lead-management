
import { useEffect, useState } from "react";
import { Save, X } from "lucide-react";
import Button from "../../../components/ui/Button";
import "./LeadForm.css";

const INITIAL_VALUES = {
  name: "",
  email: "",
  phone: "",
  company: "",
  source: "Website",
  status: "New",
};

const SOURCES = [
  "Website",
  "Referral",
  "Social Media",
  "Cold Call",
  "Other",
];

const STATUSES = [
  "New",
  "Contacted",
  "Qualified",
  "Converted",
  "Lost",
];

export default function LeadForm({
  initialValues = INITIAL_VALUES,
  onSubmit,
  onCancel,
  submitting = false,
  submitLabel = "Save lead",
}) {
  const [formData, setFormData] = useState({
    ...INITIAL_VALUES,
    ...initialValues,
  });

  const [errors, setErrors] = useState({});

  useEffect(() => {
    setFormData({
      ...INITIAL_VALUES,
      ...initialValues,
    });
    setErrors({});
  }, [initialValues]);

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrors((previous) => ({
      ...previous,
      [name]: "",
    }));
  };

  const handleSubmit = async (event) => {
    event.preventDefault();

    const nextErrors = {};

    if (!formData.name.trim()) {
      nextErrors.name = "Name is required.";
    }

    if (!formData.email.trim()) {
      nextErrors.email = "Email is required.";
    } else if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)
    ) {
      nextErrors.email = "Enter a valid email address.";
    }

    if (!formData.phone.trim()) {
      nextErrors.phone = "Phone is required.";
    }

    if (Object.keys(nextErrors).length > 0) {
      setErrors(nextErrors);
      return;
    }

    await onSubmit({
      name: formData.name.trim(),
      email: formData.email.trim(),
      phone: formData.phone.trim(),
      company: formData.company.trim(),
      source: formData.source,
      status: formData.status,
    });
  };

  return (
    <form className="lead-form" onSubmit={handleSubmit}>
      <div className="lead-form__grid">
        <div className="lead-form__field">
          <label htmlFor="name">Full name *</label>
          <input
            id="name"
            name="name"
            value={formData.name}
            onChange={handleChange}
            maxLength={100}
            required
            autoComplete="name"
            aria-invalid={Boolean(errors.name)}
          />
          {errors.name && (
            <span className="lead-form__error">
              {errors.name}
            </span>
          )}
        </div>

        <div className="lead-form__field">
          <label htmlFor="email">Email address *</label>
          <input
            id="email"
            name="email"
            type="email"
            value={formData.email}
            onChange={handleChange}
            maxLength={254}
            required
            autoComplete="email"
            aria-invalid={Boolean(errors.email)}
          />
          {errors.email && (
            <span className="lead-form__error">
              {errors.email}
            </span>
          )}
        </div>

        <div className="lead-form__field">
          <label htmlFor="phone">Phone number *</label>
          <input
            id="phone"
            name="phone"
            type="tel"
            value={formData.phone}
            onChange={handleChange}
            maxLength={30}
            required
            autoComplete="tel"
            aria-invalid={Boolean(errors.phone)}
          />
          {errors.phone && (
            <span className="lead-form__error">
              {errors.phone}
            </span>
          )}
        </div>

        <div className="lead-form__field">
          <label htmlFor="company">Company</label>
          <input
            id="company"
            name="company"
            value={formData.company}
            onChange={handleChange}
            maxLength={150}
            autoComplete="organization"
          />
        </div>

        <div className="lead-form__field">
          <label htmlFor="source">Lead source</label>
          <select
            id="source"
            name="source"
            value={formData.source}
            onChange={handleChange}
          >
            {SOURCES.map((source) => (
              <option key={source} value={source}>
                {source}
              </option>
            ))}
          </select>
        </div>

        <div className="lead-form__field">
          <label htmlFor="status">Status</label>
          <select
            id="status"
            name="status"
            value={formData.status}
            onChange={handleChange}
          >
            {STATUSES.map((status) => (
              <option key={status} value={status}>
                {status}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="lead-form__actions">
        <Button
          variant="secondary"
          icon={X}
          onClick={onCancel}
          disabled={submitting}
        >
          Cancel
        </Button>

        <Button
          type="submit"
          icon={Save}
          loading={submitting}
        >
          {submitLabel}
        </Button>
      </div>
    </form>
  );
}
