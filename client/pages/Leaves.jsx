import { useState } from "react";
import { Plus, Check, X } from "lucide-react";
import { api, dateLabel } from "../api.js";
import {
  Panel,
  Table,
  Status,
  Person,
  Modal,
  Field,
  FormActions,
  ErrorMessage,
} from "../components/ui.jsx";
export default function Leaves({ user, leaves, refresh, notify }) {
  const [filter, setFilter] = useState("all"),
    [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const visible = leaves.filter((l) => filter === "all" || l.status === filter);
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api("/leaves", {
        method: "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      await refresh();
      setOpen(false);
      notify("Leave request sent for review.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function review(id, status) {
    setBusy(true);
    try {
      await api(`/leaves/${id}`, { method: "PATCH", body: { status } });
      await refresh();
      notify(`Leave request ${status}.`);
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Leave requests</h1>
          <p>Plan time away. Keep everyone in the loop.</p>
        </div>
        <button
          className="button"
          onClick={() => {
            setOpen(true);
            setError("");
          }}
        >
          <Plus size={18} />
          Request leave
        </button>
      </div>
      <Panel title="Leave history">
        <div className="toolbar">
          <label className="filter-label">
            Status
            <select
              aria-label="Filter leave status"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
            >
              <option value="all">All requests</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </label>
          <span className="muted">{visible.length} requests</span>
        </div>
        <Table
          columns={["Employee", "Dates", "Reason", "Status", "Actions"]}
          count={visible.length}
          empty="No leave requests in this view."
        >
          {visible.map((l) => (
            <tr key={l._id}>
              <td>
                <Person name={l.employee?.name} />
              </td>
              <td className="nowrap">
                {dateLabel(l.startDate)}
                <small className="subline">to {dateLabel(l.endDate)}</small>
              </td>
              <td className="wrap-cell">{l.reason}</td>
              <td>
                <Status value={l.status} />
              </td>
              <td>
                {user.role !== "employee" &&
                l.employee?._id !== user._id &&
                l.status === "pending" ? (
                  <div className="row-actions">
                    <button
                      className="button secondary small"
                      disabled={busy}
                      onClick={() => review(l._id, "approved")}
                    >
                      <Check size={15} />
                      Approve
                    </button>
                    <button
                      className="button secondary small danger-text"
                      disabled={busy}
                      onClick={() => review(l._id, "rejected")}
                    >
                      <X size={15} />
                      Reject
                    </button>
                  </div>
                ) : (
                  <span className="muted">
                    {l.status === "pending" ? "Awaiting review" : "Reviewed"}
                  </span>
                )}
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      {open ? (
        <Modal title="Request leave" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <div className="form-row">
              <Field label="Start date" name="startDate" type="date" required />
              <Field label="End date" name="endDate" type="date" required />
            </div>
            <Field label="Reason">
              <textarea
                name="reason"
                required
                maxLength={1000}
                rows={4}
                placeholder="Share the reason for your time away"
              />
            </Field>
            <ErrorMessage>{error}</ErrorMessage>
            <FormActions
              busy={busy}
              onClose={() => setOpen(false)}
              label="Send request"
            />
          </form>
        </Modal>
      ) : null}
    </>
  );
}
