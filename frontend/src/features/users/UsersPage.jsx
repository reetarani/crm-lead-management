
import { useCallback, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

import {
  Plus,
  Search,
  Pencil,
  Trash2,
  UserRound,
  UserCheck,
  UserX,
  RefreshCw,
  LogOut,
} from "lucide-react";

import { useAuth } from "../../context/AuthContext";
import Topbar from "../../components/layout/Topbar";
import Sidebar from "../../components/Sidebar";
import PageHeader from "../../components/layout/PageHeader";
import Button from "../../components/ui/Button";
import { usersService } from "../../services/usersService";

import "./UsersPage.css";

export default function UsersPage() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
  });

  // =========================================
  // LOGOUT
  // =========================================

  const handleLogout = () => {
    logout();
    navigate("/login", { replace: true });
  };

  // =========================================
  // LOAD STAFF USERS
  // =========================================

  const loadUsers = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      const response = await usersService.getAll();

      setUsers(response.users || []);
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to load staff users."
      );

      if (err.response?.status === 401) {
        logout();
        navigate("/login", { replace: true });
      }
    } finally {
      setLoading(false);
    }
  }, [logout, navigate]);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  // =========================================
  // SEARCH STAFF
  // =========================================

  const filteredUsers = users.filter((staff) =>
    `${staff.username} ${staff.email}`
      .toLowerCase()
      .includes(search.trim().toLowerCase())
  );

  // =========================================
  // CREATE STAFF FORM
  // =========================================

  const openCreateForm = () => {
    setEditingUser(null);

    setFormData({
      username: "",
      email: "",
      password: "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =========================================
  // EDIT STAFF FORM
  // =========================================

  const openEditForm = (staff) => {
    setEditingUser(staff);

    setFormData({
      username: staff.username,
      email: staff.email,
      password: "",
    });

    setError("");
    setSuccess("");
    setShowForm(true);
  };

  // =========================================
  // CLOSE FORM
  // =========================================

  const closeForm = () => {
    setShowForm(false);
    setEditingUser(null);

    setFormData({
      username: "",
      email: "",
      password: "",
    });
  };

  // =========================================
  // HANDLE FORM INPUT
  // =========================================

  const handleChange = (event) => {
    setFormData((previous) => ({
      ...previous,
      [event.target.name]: event.target.value,
    }));
  };

  // =========================================
  // CREATE / UPDATE STAFF
  // =========================================

  const handleSubmit = async (event) => {
    event.preventDefault();

    try {
      setSaving(true);
      setError("");
      setSuccess("");

      if (editingUser) {
        const payload = {
          username: formData.username.trim(),
          email: formData.email.trim(),
        };

        // Password is optional when editing.
        if (formData.password.trim()) {
          payload.password = formData.password;
        }

        await usersService.update(editingUser.id, payload);

        setSuccess("Staff user updated successfully.");
      } else {
        await usersService.create({
          username: formData.username.trim(),
          email: formData.email.trim(),
          password: formData.password,
        });

        setSuccess("Staff user created successfully.");
      }

      closeForm();

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to save staff user."
      );
    } finally {
      setSaving(false);
    }
  };

  // =========================================
  // ACTIVATE / DEACTIVATE STAFF
  // =========================================

  const handleStatusChange = async (staff) => {
    const action = staff.isActive ? "deactivate" : "activate";

    const confirmed = window.confirm(
      `Are you sure you want to ${action} ${staff.username}?`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await usersService.updateStatus(
        staff.id,
        !staff.isActive
      );

      setSuccess(
        `Staff user ${action}d successfully.`
      );

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to update user status."
      );
    }
  };

  // =========================================
  // DELETE STAFF
  // =========================================

  const handleDelete = async (staff) => {
    const confirmed = window.confirm(
      `Permanently delete ${staff.username}? This action cannot be undone.`
    );

    if (!confirmed) return;

    try {
      setError("");
      setSuccess("");

      await usersService.remove(staff.id);

      setSuccess("Staff user deleted successfully.");

      await loadUsers();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          "Unable to delete staff user."
      );
    }
  };

  // =========================================
  // PAGE UI
  // =========================================

  return (
    <div className="crm-layout">
      <Sidebar />

      <main className="main-content">

        {/* TOP NAVIGATION */}
        <Topbar
          breadcrumb="Workspace / User Management"
        />

        {/* MAIN PAGE CONTENT */}
        <section className="page-content">

          {/* PAGE HEADER */}
          <PageHeader
            eyebrow="CRM MANAGEMENT"
            title="User Management"
            subtitle="Manage your CRM staff accounts and permissions."
            action={
              <Button
                icon={Plus}
                onClick={openCreateForm}
              >
                Add Staff
              </Button>
            }
          />

          {/* SUCCESS MESSAGE */}
          {success && (
            <div
              className="success-message"
              role="status"
            >
              {success}
            </div>
          )}

          {/* ERROR MESSAGE */}
          {error && (
            <div
              className="error-message"
              role="alert"
            >
              <span>{error}</span>

              <Button
                variant="secondary"
                size="small"
                onClick={loadUsers}
              >
                Retry
              </Button>
            </div>
          )}

          {/* STAFF PANEL */}
          <section className="leads-panel users-panel">

            {/* PANEL HEADER */}
            <div className="panel-heading">

              <div>
                <h2>All Staff Members</h2>

                <p>
                  {users.length} total{" "}
                  {users.length === 1
                    ? "staff member"
                    : "staff members"}
                </p>
              </div>

              <Button
                variant="secondary"
                icon={RefreshCw}
                loading={loading}
                onClick={loadUsers}
              >
                Refresh
              </Button>

            </div>

            {/* SEARCH TOOLBAR */}
            <div className="table-toolbar">

              <div className="ui-search">
                <Search size={19} />

                <input
                  type="search"
                  placeholder="Search staff name or email..."
                  value={search}
                  onChange={(event) =>
                    setSearch(event.target.value)
                  }
                  aria-label="Search staff"
                />
              </div>

            </div>

            {/* STAFF TABLE */}
            <div className="table-wrapper">

              <table>

                <thead>
                  <tr>
                    <th>Staff Member</th>
                    <th>Email</th>
                    <th>Role</th>
                    <th>Status</th>
                    <th>Joined</th>
                    <th>Actions</th>
                  </tr>
                </thead>

                <tbody>

                  {loading ? (
                    <tr>
                      <td colSpan={6}>
                        Loading staff members...
                      </td>
                    </tr>
                  ) : filteredUsers.length === 0 ? (
                    <tr>
                      <td
                        colSpan={6}
                        className="empty-state"
                      >
                        <UserRound size={28} />
                        <p>No staff members found.</p>
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((staff) => (
                      <tr key={staff.id}>

                        {/* STAFF MEMBER */}
                        <td>
                          <div className="lead-person">

                            <div className="lead-avatar">
                              {(staff.username || "?")
                                .charAt(0)
                                .toUpperCase()}
                            </div>

                            <div>
                              <strong>
                                {staff.username}
                              </strong>

                              <span>
                                {staff.email}
                              </span>
                            </div>

                          </div>
                        </td>

                        {/* EMAIL */}
                        <td>{staff.email}</td>

                        {/* ROLE */}
                        <td>
                          <span className="users-role">
                            Staff
                          </span>
                        </td>

                        {/* STATUS */}
                        <td>
                          <span
                            className={`users-status ${
                              staff.isActive
                                ? "active"
                                : "inactive"
                            }`}
                          >
                            {staff.isActive
                              ? "Active"
                              : "Inactive"}
                          </span>
                        </td>

                        {/* JOINED DATE */}
                        <td>
                          {staff.createdAt
                            ? new Date(
                                staff.createdAt
                              ).toLocaleDateString()
                            : "—"}
                        </td>

                        {/* ACTIONS */}
                        <td>
                          <div className="users-actions">

                            <Button
                              variant="secondary"
                              size="small"
                              icon={Pencil}
                              onClick={() =>
                                openEditForm(staff)
                              }
                            >
                              Edit
                            </Button>

                            <Button
                              variant="secondary"
                              size="small"
                              icon={
                                staff.isActive
                                  ? UserX
                                  : UserCheck
                              }
                              onClick={() =>
                                handleStatusChange(staff)
                              }
                            >
                              {staff.isActive
                                ? "Deactivate"
                                : "Activate"}
                            </Button>

                            <Button
                              variant="secondary"
                              size="small"
                              icon={Trash2}
                              onClick={() =>
                                handleDelete(staff)
                              }
                            >
                              Delete
                            </Button>

                          </div>
                        </td>

                      </tr>
                    ))
                  )}

                </tbody>
              </table>

            </div>

            {/* TABLE FOOTER */}
            <div className="table-footer">
              <span>
                Showing {filteredUsers.length} of{" "}
                {users.length} staff members
              </span>
            </div>

          </section>

          {/* ADD / EDIT STAFF MODAL */}
          {showForm && (

            <div
              className="users-modal-overlay"
              onMouseDown={(event) => {
                if (
                  event.target === event.currentTarget &&
                  !saving
                ) {
                  closeForm();
                }
              }}
            >

              <div
                className="users-modal"
                role="dialog"
                aria-modal="true"
                aria-labelledby="users-modal-title"
              >

                {/* MODAL HEADER */}
                <div className="users-modal-header">

                  <div>
                    <h2 id="users-modal-title">
                      {editingUser
                        ? "Edit Staff Member"
                        : "Add Staff Member"}
                    </h2>

                    <p>
                      {editingUser
                        ? "Update staff account information."
                        : "Create a new staff account."}
                    </p>
                  </div>

                  <button
                    type="button"
                    onClick={closeForm}
                    disabled={saving}
                    aria-label="Close"
                  >
                    ×
                  </button>

                </div>

                {/* MODAL FORM */}
                <form onSubmit={handleSubmit}>

                  <label htmlFor="username">
                    Username
                  </label>

                  <input
                    id="username"
                    name="username"
                    value={formData.username}
                    onChange={handleChange}
                    minLength={2}
                    maxLength={50}
                    required
                  />

                  <label htmlFor="email">
                    Email address
                  </label>

                  <input
                    id="email"
                    name="email"
                    type="email"
                    value={formData.email}
                    onChange={handleChange}
                    maxLength={254}
                    required
                  />

                  <label htmlFor="password">
                    {editingUser
                      ? "New Password (optional)"
                      : "Password"}
                  </label>

                  <input
                    id="password"
                    name="password"
                    type="password"
                    value={formData.password}
                    onChange={handleChange}
                    minLength={8}
                    maxLength={72}
                    required={!editingUser}
                    autoComplete="new-password"
                    placeholder={
                      editingUser
                        ? "Leave blank to keep current password"
                        : "Enter at least 8 characters"
                    }
                  />

                  {/* FORM ERROR */}
                  {error && (
                    <div className="users-alert users-alert-error">
                      {error}
                    </div>
                  )}

                  {/* MODAL ACTIONS */}
                  <div className="users-modal-actions">

                    <button
                      type="button"
                      className="users-cancel-btn"
                      onClick={closeForm}
                      disabled={saving}
                    >
                      Cancel
                    </button>

                    <button
                      type="submit"
                      className="users-save-btn"
                      disabled={saving}
                    >
                      {saving
                        ? "Saving..."
                        : editingUser
                        ? "Save Changes"
                        : "Create Staff"}
                    </button>

                  </div>

                </form>

              </div>
            </div>
          )}

        </section>
      </main>
    </div>
  );
}
