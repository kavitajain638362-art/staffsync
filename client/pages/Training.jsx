import { useState } from "react";
import { Plus, GraduationCap, CalendarDays, Users } from "lucide-react";
import { api, dateLabel } from "../api.js";
import {
  Panel,
  Empty,
  Modal,
  Field,
  FormActions,
  ErrorMessage,
} from "../components/ui.jsx";
export default function Training({ user, training, people, refresh, notify }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const eligible = people.filter(
    (p) => p.user?.active && p.user._id !== user._id,
  );
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = new FormData(e.currentTarget);
    try {
      await api("/training", {
        method: "POST",
        body: {
          title: form.get("title"),
          description: form.get("description"),
          date: form.get("date"),
          assignedTo: form.getAll("assignedTo"),
        },
      });
      await refresh();
      setOpen(false);
      notify("Training created and assigned.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Training</h1>
          <p>Give your team room to grow.</p>
        </div>
        {user.role !== "employee" ? (
          <button
            className="button"
            onClick={() => {
              setOpen(true);
              setError("");
            }}
          >
            <Plus size={18} />
            Create training
          </button>
        ) : null}
      </div>
      <Panel
        title={
          user.role === "employee"
            ? "Your assigned training"
            : "Training programs"
        }
      >
        <div className="training-list">
          {training.map((t) => (
            <article className="training-item" key={t._id}>
              <span className="training-icon">
                <GraduationCap size={27} />
              </span>
              <div>
                <h2>{t.title}</h2>
                <p>{t.description}</p>
                <div className="training-meta">
                  <span>
                    <CalendarDays size={16} />
                    {dateLabel(t.date)}
                  </span>
                  <span>
                    <Users size={16} />
                    {t.assignedTo.length} assigned
                  </span>
                </div>
                <p className="muted">
                  {t.assignedTo.map((u) => u.name).join(", ") ||
                    "No participants assigned"}
                </p>
              </div>
            </article>
          ))}
          {!training.length ? <Empty>No training assigned yet.</Empty> : null}
        </div>
      </Panel>
      {open ? (
        <Modal title="Create training" onClose={() => setOpen(false)}>
          <form onSubmit={submit}>
            <Field
              label="Program title"
              name="title"
              required
              maxLength={200}
            />
            <Field label="Description">
              <textarea name="description" required rows={3} maxLength={5000} />
            </Field>
            <Field label="Session date" name="date" type="date" required />
            <fieldset className="assignment">
              <legend>Assign people</legend>
              {eligible.length ? (
                eligible.map((p) => (
                  <label key={p._id}>
                    <input
                      name="assignedTo"
                      type="checkbox"
                      value={p.user._id}
                    />
                    <span>
                      {p.user.name}
                      <small>{p.department || "No department"}</small>
                    </span>
                  </label>
                ))
              ) : (
                <p className="muted">No team members available to assign.</p>
              )}
            </fieldset>
            <ErrorMessage>{error}</ErrorMessage>
            <FormActions
              busy={busy}
              onClose={() => setOpen(false)}
              label="Create and assign"
            />
          </form>
        </Modal>
      ) : null}
    </>
  );
}
