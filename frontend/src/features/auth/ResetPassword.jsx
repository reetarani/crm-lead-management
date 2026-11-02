
import { useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import {
  LockKeyhole,
  Eye,
  EyeOff,
  ArrowLeft,
  CheckCircle,
} from "lucide-react";

import { passwordResetService } from "../../services/passwordResetService";

import "./ResetPassword.css";

export default function ResetPassword() {
  const { token } = useParams();
  const navigate = useNavigate();

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setError("");
    setSuccess("");

    if (password.length < 8) {
      setError("Password must contain at least 8 characters.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    try {
      setLoading(true);

      const response = await passwordResetService.resetPassword(
        token,
        password
      );

      setSuccess(response.message || "Password reset successfully.");

      // Redirect to login after successful password reset.
      setTimeout(() => {
        navigate("/login", { replace: true });
      }, 2000);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Invalid or expired reset link. Please request a new one."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-auth-page">
      <div className="password-auth-card">
        <div className="password-auth-icon">
          <LockKeyhole size={25} />
        </div>

        <h1>Reset Password</h1>

        <p className="password-auth-description">
          Create a new password for your CRM account.
          Your password must contain at least 8 characters.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="password-auth-field">
            <label htmlFor="new-password">New Password</label>

            <div className="password-input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="new-password"
                type={showPassword ? "text" : "password"}
                placeholder="Enter new password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                minLength={8}
                maxLength={72}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowPassword((prev) => !prev)}
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
          </div>

          <div className="password-auth-field">
            <label htmlFor="confirm-password">Confirm New Password</label>

            <div className="password-input-wrapper">
              <LockKeyhole size={18} />

              <input
                id="confirm-password"
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />

              <button
                type="button"
                className="password-toggle-btn"
                onClick={() => setShowConfirmPassword((prev) => !prev)}
                aria-label={
                  showConfirmPassword ? "Hide password" : "Show password"
                }
              >
                {showConfirmPassword ? (
                  <EyeOff size={18} />
                ) : (
                  <Eye size={18} />
                )}
              </button>
            </div>
          </div>

          {error && (
            <div className="password-auth-alert error">
              {error}
            </div>
          )}

          {success && (
            <div className="password-auth-alert success">
              <CheckCircle size={17} />
              <span>{success}</span>
            </div>
          )}

          <button
            type="submit"
            className="password-auth-button"
            disabled={loading || Boolean(success)}
          >
            <LockKeyhole size={17} />
            {loading ? "Updating..." : "Reset Password"}
          </button>
        </form>

        <Link to="/login" className="password-back-link">
          <ArrowLeft size={16} />
          Back to Login
        </Link>
      </div>
    </div>
  );
}
