
import { useState } from "react";
import { Link } from "react-router-dom";
import { Mail, ArrowLeft, Send, CheckCircle } from "lucide-react";

import { passwordResetService } from "../../services/passwordResetService";

import "./ForgotPassword.css";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();

    setMessage("");
    setError("");

    try {
      setLoading(true);

      const response = await passwordResetService.forgotPassword(
        email.trim()
      );

      setMessage(response.message);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to process your request. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="password-auth-page">
      <div className="password-auth-card">
        <div className="password-auth-icon">
          <Mail size={25} />
        </div>

        <h1>Forgot Password?</h1>

        <p className="password-auth-description">
          Enter your registered email address. We'll send you
          a link to reset your password.
        </p>

        <form onSubmit={handleSubmit}>
          <div className="password-auth-field">
            <label htmlFor="forgot-email">Email Address</label>

            <div className="password-input-wrapper">
              <Mail size={18} />

              <input
                id="forgot-email"
                type="email"
                placeholder="Enter your email address"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                maxLength={254}
                autoComplete="email"
                required
              />
            </div>
          </div>

          {error && (
            <div className="password-auth-alert error">
              {error}
            </div>
          )}

          {message && (
            <div className="password-auth-alert success">
              <CheckCircle size={17} />
              <span>{message}</span>
            </div>
          )}

          <button
            type="submit"
            className="password-auth-button"
            disabled={loading}
          >
            <Send size={17} />
            {loading ? "Sending..." : "Send Reset Link"}
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
