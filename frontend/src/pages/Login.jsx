
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Layers, Mail, Lock, Eye, EyeOff, ArrowRight } from "lucide-react";
import api from "../services/api";
import { useAuth } from "../context/AuthContext";
import "./Login.css";

export default function Login() {
  const navigate = useNavigate();
  const { login } = useAuth();

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    if (error) setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setError("");

    const email = formData.email.trim().toLowerCase();

    if (!email || !formData.password) {
      setError("Please enter your email and password.");
      return;
    }

    setLoading(true);

    try {
      const response = await api.post("/auth/login", {
        email,
        password: formData.password,
      });

      const { token, user } = response.data;

      if (!token || !user) {
        throw new Error("Invalid login response from server.");
      }

      // Save authentication using your AuthContext.
      login(user, token);

      // Open the protected dashboard.
      navigate("/dashboard", { replace: true });
    } catch (err) {
      const status = err.response?.status;

      if (status === 401) {
        setError("Invalid email or password.");
      } else if (status === 403) {
        setError("Your account is inactive or access is denied.");
      } else if (!err.response) {
        setError(
          "Unable to connect to the server. Please check that the backend is running."
        );
      } else {
        setError(
          err.response?.data?.message ||
            "Login failed. Please try again."
        );
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="login-page">
      <div className="login-container">
        {/* Brand */}
        <div className="login-brand">
          <span className="login-brand-icon">
            <Layers size={25} strokeWidth={2.2} />
          </span>

          <span>CRM</span>
        </div>

        {/* Login card */}
        <section className="login-card">
          <div className="login-heading">
            <p className="login-eyebrow">WELCOME BACK</p>

            <h1>Sign in to your account</h1>

            <p className="login-description">
              Manage your leads, track follow-ups, and grow
              your business from one place.
            </p>
          </div>

          <form className="login-form" onSubmit={handleSubmit}>
            {/* Email */}
            <div className="login-field">
              <label htmlFor="email">Email address</label>

              <div className="login-input-wrapper">
                <Mail
                  className="login-input-icon"
                  size={18}
                  aria-hidden="true"
                />

                <input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="you@company.com"
                  value={formData.email}
                  onChange={handleChange}
                  autoComplete="username"
                  required
                  disabled={loading}
                />
              </div>
            </div>

            {/* Password */}
            <div className="login-field">
              <div className="login-label-row">
                <label htmlFor="password">Password</label>
              </div>

              <div className="login-input-wrapper">
                <Lock
                  className="login-input-icon"
                  size={18}
                  aria-hidden="true"
                />

                <input
                  id="password"
                  name="password"
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter your password"
                  value={formData.password}
                  onChange={handleChange}
                  autoComplete="current-password"
                  required
                  disabled={loading}
                />

                <button
                  type="button"
                  className="login-password-toggle"
                  onClick={() =>
                    setShowPassword((previous) => !previous)
                  }
                  aria-label={
                    showPassword ? "Hide password" : "Show password"
                  }
                  aria-pressed={showPassword}
                  disabled={loading}
                >
                  {showPassword ? (
                    <EyeOff size={18} />
                  ) : (
                    <Eye size={18} />
                  )}
                </button>
              </div>
            </div>

            {/* Error message */}
            {error && (
              <div className="login-error" role="alert">
                {error}
              </div>
            )}

            {/* Submit */}
            <button
              type="submit"
              className="login-button"
              disabled={loading}
            >
              <span>
                {loading ? "Signing in..." : "Sign in"}
              </span>

              {!loading && <ArrowRight size={18} />}
            </button>
          </form>

          <div className="login-security-note">
            <Lock size={14} />
            <span>Your account is protected with secure authentication.</span>
          </div>
        </section>

        {/* Footer */}
        <footer className="login-footer">
          © 2026 CRM. All rights reserved.
        </footer>
      </div>
    </main>
  );
}
