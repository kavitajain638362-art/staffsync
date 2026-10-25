import { useState } from "react";
import { Plus, Megaphone, Pencil, Trash2 } from "lucide-react";
import { api, dateLabel } from "../api.js";
import {
  Panel,
  Empty,
  Modal,
  Field,
  FormActions,
  ErrorMessage,
} from "../components/ui.jsx";
export default function Announcements({
  user,
  announcements,
  refresh,
  notify,
}) {
  const [editing, setEditing] = useState(null),
    [open, setOpen] = useState(false),
    [removing, setRemoving] = useState(null),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      await api(`/announcements${editing ? `/${editing._id}` : ""}`, {
        method: editing ? "PATCH" : "POST",
        body: Object.fromEntries(new FormData(e.currentTarget)),
      });
      await refresh();
      setOpen(false);
      setEditing(null);
      notify("Announcement saved.");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  async function remove() {
    setBusy(true);
    try {
      await api(`/announcements/${removing._id}`, { method: "DELETE" });
      await refresh();
      setRemoving(null);
      notify("Announcement removed.");
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
          <h1>Announcements</h1>
          <p>The updates that bring your workplace together.</p>
        </div>
        {user.role !== "employee" ? (
          <button
            className="button"
            onClick={() => {
              setEditing(null);
              setOpen(true);
              setError("");
            }}
          >
            <Plus size={18} />
            New announcement
          </button>
        ) : null}
      </div>
      <Panel title="Company updates">
        <div className="announcement-list">
          {announcements.map((a) => (
            <article className="announcement" key={a._id}>
              <span className="update-icon">
                <Megaphone size={23} />
              </span>
              <div className="announcement-content">
                <h2>{a.title}</h2>
                <p className="announcement-meta">
                  {a.author?.name || "Company"} · {dateLabel(a.createdAt)}
                </p>
                <p>{a.body}</p>
              </div>
              {user.role === "hr" ||
              (user.role === "manager" && a.author?._id === user._id) ? (
                <div className="row-actions">
                  <button
                    className="icon-button"
                    aria-label={`Edit ${a.title}`}
                    onClick={() => {
                      setEditing(a);
                      setOpen(true);
                      setError("");
                    }}
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className="icon-button danger-text"
                    aria-label={`Delete ${a.title}`}
                    onClick={() => setRemoving(a)}
                  >
                    <Trash2 size={17} />
                  </button>
                </div>
              ) : null}
            </article>
          ))}
          {!announcements.length ? <Empty>No announcements yet.</Empty> : null}
        </div>
      </Panel>
      {open ? (
        <Modal
          title={editing ? "Edit announcement" : "New announcement"}
          onClose={() => setOpen(false)}
        >
          <form onSubmit={submit}>
            <Field
              label="Title"
              name="title"
              required
              maxLength={200}
              defaultValue={editing?.title || ""}
            />
            <Field label="Message">
              <textarea
                name="body"
                required
                rows={5}
                maxLength={5000}
                defaultValue={editing?.body || ""}
              />
            </Field>
            <ErrorMessage>{error}</ErrorMessage>
            <FormActions
              busy={busy}
              onClose={() => setOpen(false)}
              label="Publish announcement"
            />
          </form>
        </Modal>
      ) : null}
      {removing ? (
        <Modal title="Delete announcement" onClose={() => setRemoving(null)}>
          <p>Remove “{removing.title}” from the company feed?</p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setRemoving(null)}
            >
              Cancel
            </button>
            <button className="button danger" disabled={busy} onClick={remove}>
              Delete announcement
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
