import { Users, CalendarDays, Clock3, Plus, Megaphone } from "lucide-react";
import { Panel, LinkButton, Person, Status, Table } from "../components/ui.jsx";
import { today, timeLabel, dateLabel } from "../api.js";
export default function Dashboard({ user, data, navigate, addEmployee }) {
  const people = data.people.filter((e) => e.user?.active),
    pending = data.leaves.filter((l) => l.status === "pending");
  const records = data.attendance.filter((a) => a.date === today());
  const stats = [
    [
      Users,
      user.role === "employee"
        ? "Your profile"
        : user.role === "manager"
          ? "People on your team"
          : "Active people",
      people.length,
      "teal",
    ],
    [CalendarDays, "Pending leave", pending.length, "amber"],
    [Clock3, "Checked in today", records.length, "blue"],
  ];
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Overview</h1>
          <p>Your people, connected.</p>
        </div>
        {user.role === "hr" ? (
          <button className="button" onClick={addEmployee}>
            <Plus size={19} />
            Add employee
          </button>
        ) : (
          <button className="button" onClick={() => navigate("attendance")}>
            <Clock3 size={18} />
            Your attendance
          </button>
        )}
      </div>
      <div className="stats">
        {stats.map(([Icon, label, value, color]) => (
          <div className="stat" key={label}>
            <span className={`stat-icon ${color}`}>
              <Icon size={26} />
            </span>
            <div>
              <span>{label}</span>
              <strong>{value}</strong>
            </div>
          </div>
        ))}
      </div>
      <div className="dashboard-grid">
        <Panel
          title="People at a glance"
          action={
            <LinkButton onClick={() => navigate("people")}>
              View all people
            </LinkButton>
          }
        >
          <Table
            columns={["Name", "Department", "Role", "Status"]}
            count={people.length}
          >
            {people.slice(0, 3).map((p, i) => (
              <tr key={p._id}>
                <td>
                  <Person name={p.user?.name} index={i} />
                </td>
                <td>{p.department || "Not assigned"}</td>
                <td className="capitalize">{p.user?.role}</td>
                <td>
                  <Status value="Active" />
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel
          title="Today’s attendance"
          action={
            <LinkButton onClick={() => navigate("attendance")}>
              Open attendance
            </LinkButton>
          }
        >
          <Table
            columns={["Name", "Time", "Status"]}
            count={records.length}
            empty="No check-ins yet today."
          >
            {records.slice(0, 4).map((a) => (
              <tr key={a._id}>
                <td>{a.employee?.name}</td>
                <td>{timeLabel(a.checkedInAt)}</td>
                <td>
                  <Status
                    value={a.checkedOutAt ? "Checked out" : "Checked in"}
                  />
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel
          title="Leave requests"
          action={
            <LinkButton onClick={() => navigate("leaves")}>
              View all requests
            </LinkButton>
          }
        >
          <Table
            columns={["Name", "Dates", "Status", "Actions"]}
            count={pending.length}
            empty="You’re all caught up. No pending requests."
          >
            {pending.slice(0, 3).map((l) => (
              <tr key={l._id}>
                <td>{l.employee?.name}</td>
                <td>
                  {dateLabel(l.startDate)}
                  <small className="subline">to {dateLabel(l.endDate)}</small>
                </td>
                <td>
                  <Status value={l.status} />
                </td>
                <td>
                  <button
                    className="button secondary small"
                    onClick={() => navigate("leaves")}
                  >
                    {user.role === "employee" ? "View" : "Review"}
                  </button>
                </td>
              </tr>
            ))}
          </Table>
        </Panel>
        <Panel
          title="Company updates"
          action={
            <LinkButton onClick={() => navigate("announcements")}>
              View all announcements
            </LinkButton>
          }
        >
          <div className="updates">
            {data.announcements.slice(0, 3).map((a) => (
              <article key={a._id}>
                <span className="update-icon">
                  <Megaphone size={20} />
                </span>
                <div>
                  <h3>{a.title}</h3>
                  <p>{a.body}</p>
                </div>
              </article>
            ))}
            {data.announcements.length === 0 ? (
              <p className="muted">No company updates yet.</p>
            ) : null}
          </div>
        </Panel>
      </div>
    </>
  );
}
