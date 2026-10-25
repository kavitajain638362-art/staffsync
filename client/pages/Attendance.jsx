import { useState } from "react";
import { Clock3, Download, LogIn, LogOut } from "lucide-react";
import { api, today, timeLabel, dateLabel, exportCSV } from "../api.js";
import { Panel, Table, Status, Person } from "../components/ui.jsx";
export default function Attendance({ user, records, refresh, notify }) {
  const [date, setDate] = useState(""),
    [busy, setBusy] = useState(false);
  const own = records.find(
    (a) => a.date === today() && a.employee?._id === user._id,
  );
  const visible = records.filter((a) => !date || a.date === date);
  async function mark(action) {
    setBusy(true);
    try {
      await api(`/attendance/${action}`, { method: "POST" });
      await refresh();
      notify(
        action === "check-in"
          ? "You’re checked in. Have a good day!"
          : "You’re checked out. See you soon.",
      );
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  }
  const duration = (a) =>
    a.checkedOutAt
      ? `${Math.max(0, (new Date(a.checkedOutAt) - new Date(a.checkedInAt)) / 3600000).toFixed(1)} h`
      : "In progress";
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Attendance</h1>
          <p>
            A clear record of every working day. All times use India Standard
            Time.
          </p>
        </div>
      </div>
      <section className="attendance-banner">
        <div className="attendance-icon">
          <Clock3 size={30} />
        </div>
        <div>
          <h2>{dateLabel(today())}</h2>
          <p>
            {own?.checkedOutAt
              ? `Checked out at ${timeLabel(own.checkedOutAt)}`
              : own
                ? `Checked in at ${timeLabel(own.checkedInAt)}`
                : "You haven’t checked in today."}
          </p>
        </div>
        <button
          className="button"
          disabled={busy || Boolean(own?.checkedOutAt)}
          onClick={() => mark(own ? "check-out" : "check-in")}
        >
          {own ? <LogOut size={18} /> : <LogIn size={18} />}{" "}
          {busy
            ? "Updating…"
            : own?.checkedOutAt
              ? "Day complete"
              : own
                ? "Check out"
                : "Check in"}
        </button>
      </section>
      <Panel
        title={
          user.role === "employee"
            ? "Your attendance history"
            : "Attendance records"
        }
      >
        <div className="toolbar">
          <label className="filter-label">
            Date
            <input
              aria-label="Filter attendance date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            onClick={() =>
              exportCSV(
                "staffsync-attendance.csv",
                ["Name", "Date", "Check in IST", "Check out IST", "Hours"],
                visible.map((a) => [
                  a.employee?.name,
                  a.date,
                  timeLabel(a.checkedInAt),
                  timeLabel(a.checkedOutAt),
                  duration(a),
                ]),
              )
            }
          >
            <Download size={16} />
            Export CSV
          </button>
        </div>
        <Table
          columns={[
            "Employee",
            "Date",
            "Check in",
            "Check out",
            "Hours",
            "Status",
          ]}
          count={visible.length}
          empty="No attendance records for this date."
        >
          {visible.map((a) => (
            <tr key={a._id}>
              <td>
                <Person name={a.employee?.name} />
              </td>
              <td>{dateLabel(a.date)}</td>
              <td>{timeLabel(a.checkedInAt)}</td>
              <td>{timeLabel(a.checkedOutAt)}</td>
              <td>{duration(a)}</td>
              <td>
                <Status value={a.checkedOutAt ? "Checked out" : "Checked in"} />
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
    </>
  );
}
