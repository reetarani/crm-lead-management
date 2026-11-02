
import { useNavigate } from "react-router-dom";
import { LogOut } from "lucide-react";

import { useAuth } from "../../context/AuthContext";

export default function Topbar({ breadcrumb = "Workspace" }) {
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const handleLogout = async () => {
    await logout();
    navigate("/login", { replace: true });
  };

  return (
    <header className="topbar">
      <div className="breadcrumb">
        {breadcrumb}
      </div>

      <div className="topbar-user">
        <div className="user-avatar">
          {(user?.username || "U")
            .charAt(0)
            .toUpperCase()}
        </div>

        <div className="user-info">
          <strong>{user?.username || "User"}</strong>
          <span>{user?.role || "Staff"}</span>
        </div>

        <button
          type="button"
          className="icon-button"
          title="Logout"
          aria-label="Logout"
          onClick={handleLogout}
        >
          <LogOut size={18} />
        </button>
      </div>
    </header>
  );
}
