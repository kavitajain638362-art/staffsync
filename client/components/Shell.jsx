import {
  Home,
  Users,
  CalendarDays,
  Clock3,
  Megaphone,
  GraduationCap,
  Building2,
  LogOut,
} from "lucide-react";
import { Avatar } from "./ui.jsx";
import NotificationBell from "./NotificationBell.jsx";
export const sections = [
  ["overview", "Overview", Home],
  ["people", "People", Users],
  ["leaves", "Leave requests", CalendarDays],
  ["attendance", "Attendance", Clock3],
  ["announcements", "Announcements", Megaphone],
  ["training", "Training", GraduationCap],
];
export default function Shell({
  user,
  demo,
  page,
  navigate,
  logout,
  notifications,
  refresh,
  notify,
  children,
}) {
  return (
    <div className="app-shell">
      <aside className="sidebar">
        <a
          className="brand"
          href="#overview"
          onClick={() => navigate("overview")}
        >
          <Users size={32} strokeWidth={2.6} />
          <span>StaffSync</span>
        </a>
        <nav aria-label="Main navigation">
          {sections.map(([id, label, Icon]) => (
            <button
              key={id}
              className={page === id ? "nav-item selected" : "nav-item"}
              aria-current={page === id ? "page" : undefined}
              onClick={() => navigate(id)}
            >
              <Icon size={21} strokeWidth={1.8} />
              <span>{label}</span>
            </button>
          ))}
        </nav>
        <div className="workspace">
          <Building2 size={21} />
          <div>
            <strong>{demo ? "Acme Corporation" : "StaffSync workspace"}</strong>
            <small>
              {demo ? "Demo workspace · fictional data" : "People operations"}
            </small>
          </div>
        </div>
      </aside>
      <div className="main-shell">
        <header className="topbar">
          <span className="topbar-context">People & workplace</span>
          <div className="session">
            <NotificationBell
              items={notifications}
              navigate={navigate}
              refresh={refresh}
              notify={notify}
            />
            <Avatar name={user.name} />
            <span>
              <strong>{user.name}</strong>
              <small>
                {user.role === "hr"
                  ? "HR Administrator"
                  : user.role === "manager"
                    ? "Team manager"
                    : "Employee"}
              </small>
            </span>
            <button
              className="icon-button"
              onClick={logout}
              aria-label="Sign out"
              title="Sign out"
            >
              <LogOut size={19} />
            </button>
          </div>
        </header>
        <main id="main-content">{children}</main>
      </div>
    </div>
  );
}
