import {
  Children,
  cloneElement,
  useEffect,
  useId,
  useRef,
  useState,
} from "react";
import { X, ArrowRight, Users } from "lucide-react";
import { initials } from "../api.js";
export function Avatar({ name, index = 0 }) {
  return (
    <span className={`avatar tone-${index % 4}`} aria-hidden="true">
      {initials(name)}
    </span>
  );
}
export function Person({ name, email, index }) {
  return (
    <div className="person">
      <Avatar name={name} index={index} />
      <span>
        <strong>{name || "Removed account"}</strong>
        {email ? <small>{email}</small> : null}
      </span>
    </div>
  );
}
export function Status({ value }) {
  return (
    <span
      className={`status ${String(value).toLowerCase().replaceAll(" ", "-")}`}
    >
      <i />
      {value}
    </span>
  );
}
export function Panel({ title, action, children, className = "" }) {
  return (
    <section className={`panel ${className}`}>
      <div className="panel-heading">
        <h2>{title}</h2>
        {action}
      </div>
      {children}
    </section>
  );
}
export function LinkButton({ children, onClick }) {
  return (
    <button className="text-button" onClick={onClick}>
      {children}
      <ArrowRight size={16} />
    </button>
  );
}
export function Table({ columns, children, empty, count }) {
  const [page, setPage] = useState(0);
  const rows = Children.toArray(children),
    pages = Math.ceil(rows.length / 10),
    current = Math.min(page, Math.max(0, pages - 1));
  return (
    <>
      <div className="table-wrap">
        <table>
          <thead>
            <tr>
              {columns.map((c) => (
                <th key={c}>{c}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {count === 0 ? (
              <tr>
                <td colSpan={columns.length}>
                  <Empty>{empty || "No records yet."}</Empty>
                </td>
              </tr>
            ) : (
              rows.slice(current * 10, current * 10 + 10)
            )}
          </tbody>
        </table>
      </div>
      {pages > 1 ? (
        <div className="pagination">
          <span>
            Page {current + 1} of {pages} · {rows.length} records
          </span>
          <button
            className="button secondary small"
            disabled={current === 0}
            onClick={() => setPage(current - 1)}
          >
            Previous
          </button>
          <button
            className="button secondary small"
            disabled={current + 1 >= pages}
            onClick={() => setPage(current + 1)}
          >
            Next
          </button>
        </div>
      ) : null}
    </>
  );
}
export function Empty({ children }) {
  return (
    <div className="empty">
      <Users size={24} />
      <p>{children}</p>
    </div>
  );
}
export function Field({ label, children, ...props }) {
  const id = useId();
  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      {children ? cloneElement(children, { id }) : <input id={id} {...props} />}
    </div>
  );
}
export function Modal({ title, children, onClose }) {
  const ref = useRef();
  useEffect(() => {
    const element = ref.current;
    element.showModal();
    return () => element.close();
  }, []);
  return (
    <dialog
      ref={ref}
      onCancel={onClose}
      onClick={(e) => {
        if (e.target === ref.current) onClose();
      }}
      aria-label={title}
    >
      <div className="modal-heading">
        <h2>{title}</h2>
        <button
          className="icon-button"
          aria-label="Close dialog"
          onClick={onClose}
        >
          <X size={20} />
        </button>
      </div>
      {children}
    </dialog>
  );
}
export function FormActions({ busy, onClose, label = "Save changes" }) {
  return (
    <div className="form-actions">
      <button type="button" className="button secondary" onClick={onClose}>
        Cancel
      </button>
      <button className="button" disabled={busy}>
        {busy ? "Saving…" : label}
      </button>
    </div>
  );
}
export function ErrorMessage({ children }) {
  return children ? (
    <p className="error-message" role="alert">
      {children}
    </p>
  ) : null;
}
