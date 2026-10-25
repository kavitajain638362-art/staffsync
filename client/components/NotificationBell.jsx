import { useState } from "react";
import { Bell, X } from "lucide-react";
import { api } from "../api.js";
export default function NotificationBell({ items, navigate, refresh, notify }) {
  const [open, setOpen] = useState(false),
    [busy, setBusy] = useState(false);
  const unread = items.filter((item) => !item.readAt).length;
  async function read(item) {
    try {
      await api(`/notifications/${item._id}`, { method: "PATCH" });
      await refresh();
      navigate(item.section);
      setOpen(false);
    } catch (err) {
      notify(err.message, true);
    }
  }
  async function readAll() {
    setBusy(true);
    try {
      await api("/notifications/read-all", { method: "PATCH" });
      await refresh();
    } catch (err) {
      notify(err.message, true);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="notifications">
      <button
        className="icon-button notification-toggle"
        aria-label={`Notifications${unread ? `, ${unread} unread` : ""}`}
        aria-expanded={open}
        onClick={() => setOpen(!open)}
      >
        <Bell size={20} />
        {unread ? <span className="unread-dot" /> : null}
      </button>
      {open ? (
        <section className="notification-menu" aria-label="Notifications">
          <div className="panel-heading">
            <h2>Notifications</h2>
            <button
              className="icon-button"
              aria-label="Close notifications"
              onClick={() => setOpen(false)}
            >
              <X size={18} />
            </button>
          </div>
          {items.length ? (
            <>
              <button
                className="text-button"
                disabled={busy || !unread}
                onClick={readAll}
              >
                Mark all as read
              </button>
              <div className="notification-items">
                {items.map((item) => (
                  <button
                    key={item._id}
                    className={
                      item.readAt
                        ? "notification-item"
                        : "notification-item unread"
                    }
                    onClick={() => read(item)}
                  >
                    <strong>{item.title}</strong>
                    <span>{item.body}</span>
                  </button>
                ))}
              </div>
            </>
          ) : (
            <p className="muted">
              You’re all caught up. Leave reviews and training assignments will
              appear here.
            </p>
          )}
        </section>
      ) : null}
    </div>
  );
}
