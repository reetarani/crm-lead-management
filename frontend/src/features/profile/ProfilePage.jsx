
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { UserRound, LockKeyhole, Save, LogOut } from "lucide-react";
import Topbar from "../../components/layout/Topbar";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/layout/PageHeader";
import { useAuth } from "../../context/AuthContext";
import { profileService } from "../../services/profileService";

import "./ProfilePage.css";

function ProfilePage() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const [profile, setProfile] = useState({
    username: "",
    email: "",
    role: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [passwordSaving, setPasswordSaving] = useState(false);

  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  const [passwords, setPasswords] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const response = await profileService.getMyProfile();

        setProfile({
          username: response.user.username || "",
          email: response.user.email || "",
          role: response.user.role || "",
        });
      } catch (error) {
        setProfileError(
          error.response?.data?.message || "Unable to load profile."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleProfileChange = (e) => {
    setProfile({
      ...profile,
      [e.target.name]: e.target.value,
    });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();

    setProfileError("");
    setProfileMessage("");

    try {
      setSaving(true);

      const response = await profileService.updateMyProfile({
        username: profile.username.trim(),
        email: profile.email.trim(),
      });

      setProfile((prev) => ({
        ...prev,
        username: response.user.username,
        email: response.user.email,
      }));

      setProfileMessage(response.message || "Profile updated successfully.");
    } catch (error) {
      setProfileError(
        error.response?.data?.message || "Unable to update profile."
      );
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = (e) => {
    setPasswords({
      ...passwords,
      [e.target.name]: e.target.value,
    });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    setPasswordError("");

    if (passwords.newPassword.length < 8) {
      setPasswordError("Password must contain at least 8 characters.");
      return;
    }

    if (passwords.newPassword !== passwords.confirmPassword) {
      setPasswordError("New passwords do not match.");
      return;
    }

    try {
      setPasswordSaving(true);

      await profileService.changeMyPassword({
        currentPassword: passwords.currentPassword,
        newPassword: passwords.newPassword,
      });

      // Password change invalidates the existing sessions.
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      setPasswordError(
        error.response?.data?.message || "Unable to change password."
      );
    } finally {
      setPasswordSaving(false);
    }
  };

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">
        <Topbar breadcrumb="Workspace / My Profile" />

        <section className="page-content">
          <PageHeader
            eyebrow="ACCOUNT SETTINGS"
            title="My Profile"
            subtitle="Manage your personal information and account password."
          />

          <div className="profile-grid">
            {/* Personal Information */}
            <section className="profile-card">
              <div className="profile-card-heading">
                <div className="profile-icon">
                  <UserRound size={20} />
                </div>

                <div>
                  <h2>Personal Information</h2>
                  <p>Update your account details.</p>
                </div>
              </div>

              {loading ? (
                <p className="profile-loading">Loading profile...</p>
              ) : (
                <form onSubmit={handleProfileSubmit}>
                  <div className="profile-field">
                    <label htmlFor="username">Username</label>
                    <input
                      id="username"
                      type="text"
                      name="username"
                      value={profile.username}
                      onChange={handleProfileChange}
                      minLength={2}
                      maxLength={50}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="email">Email Address</label>
                    <input
                      id="email"
                      type="email"
                      name="email"
                      value={profile.email}
                      onChange={handleProfileChange}
                      maxLength={254}
                      required
                    />
                  </div>

                  <div className="profile-field">
                    <label htmlFor="role">Account Role</label>
                    <input
                      id="role"
                      type="text"
                      value={profile.role}
                      disabled
                    />
                  </div>

                  {profileError && (
                    <p className="profile-alert error">{profileError}</p>
                  )}

                  {profileMessage && (
                    <p className="profile-alert success">
                      {profileMessage}
                    </p>
                  )}

                  <button
                    type="submit"
                    className="profile-submit-btn"
                    disabled={saving || loading}
                  >
                    <Save size={16} />
                    {saving ? "Saving..." : "Save Changes"}
                  </button>
                </form>
              )}
            </section>

            {/* Change Password */}
            <section className="profile-card">
              <div className="profile-card-heading">
                <div className="profile-icon">
                  <LockKeyhole size={20} />
                </div>

                <div>
                  <h2>Change Password</h2>
                  <p>Verify your current password before changing it.</p>
                </div>
              </div>

              <form onSubmit={handlePasswordSubmit}>
                <div className="profile-field">
                  <label htmlFor="currentPassword">Current Password</label>
                  <input
                    id="currentPassword"
                    type="password"
                    name="currentPassword"
                    value={passwords.currentPassword}
                    onChange={handlePasswordChange}
                    autoComplete="current-password"
                    required
                  />
                </div>

                <div className="profile-field">
                  <label htmlFor="newPassword">New Password</label>
                  <input
                    id="newPassword"
                    type="password"
                    name="newPassword"
                    value={passwords.newPassword}
                    onChange={handlePasswordChange}
                    minLength={8}
                    maxLength={72}
                    autoComplete="new-password"
                    required
                  />
                  <small>Minimum 8 characters.</small>
                </div>

                <div className="profile-field">
                  <label htmlFor="confirmPassword">
                    Confirm New Password
                  </label>
                  <input
                    id="confirmPassword"
                    type="password"
                    name="confirmPassword"
                    value={passwords.confirmPassword}
                    onChange={handlePasswordChange}
                    autoComplete="new-password"
                    required
                  />
                </div>

                {passwordError && (
                  <p className="profile-alert error">{passwordError}</p>
                )}

                <button
                  type="submit"
                  className="profile-submit-btn"
                  disabled={passwordSaving}
                >
                  <LockKeyhole size={16} />
                  {passwordSaving ? "Updating..." : "Update Password"}
                </button>
              </form>
            </section>
          </div>
        </section>
      </main>
    </div>
  );
}

export default ProfilePage;
