
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Users,
  CalendarClock,
  ChartNoAxesCombined,
  Settings,
  Layers,
} from "lucide-react";
import "./Sidebar.css";
const links = [
  { to: "/dashboard", label: "Dashboard", icon: LayoutDashboard },
  { to: "/leads", label: "Leads", icon: Users },
  { to: "/follow-ups", label: "Follow-ups", icon: CalendarClock },
  { to: "/reports", label: "Reports", icon: ChartNoAxesCombined },
  { to: "/settings", label: "Settings", icon: Settings },
];

export default function Sidebar() {
  return (
    <aside className="sidebar">
      <div className="brand">
        <span className="brand-icon"><Layers size={22} /></span>
        <span> CRM & LMS</span>
      </div>

      <p className="sidebar-label">WORKSPACE</p>

      <nav className="sidebar-nav">
        {links.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            end={to === "/dashboard"}
            className={({ isActive }) =>
              `sidebar-link ${isActive ? "active" : ""}`
            }
          >
            <Icon size={19} />
            <span>{label}</span>
          </NavLink>
        ))}
      </nav>

      <div className="sidebar-bottom">
        <div className="sidebar-avatar">R</div>
        <div>
          <strong>CRM Workspace</strong>
          <p>Lead management</p>
        </div>
      </div>
    </aside>
  );
}
