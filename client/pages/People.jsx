import { useState } from "react";
import { Plus, Search, Download, Pencil } from "lucide-react";
import { api, exportCSV } from "../api.js";
import {
  Panel,
  Table,
  Person,
  Status,
  Modal,
  Field,
  FormActions,
  ErrorMessage,
} from "../components/ui.jsx";
export function EmployeeForm({
  employee,
  people,
  user,
  onClose,
  onSaved,
  notify,
}) {
  const [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    const form = Object.fromEntries(new FormData(e.currentTarget));
    try {
      if (employee) {
        if (form.manager !== undefined) form.manager = form.manager || null;
        await api(`/employees/${employee.user._id}`, {
          method: "PATCH",
          body: form,
        });
      } else await api("/employees", { method: "POST", body: form });
      await onSaved();
      notify(
        employee
          ? "Employee updated."
          : "Employee account created. You can now assign a department and manager.",
      );
      onClose();
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  const isHR = user.role === "hr";
  return (
    <Modal
      title={employee ? "Edit employee" : "Add employee"}
      onClose={onClose}
    >
      <form onSubmit={submit}>
        <Field
          label="Full name"
          name="name"
          defaultValue={employee?.user?.name || ""}
          required
          maxLength={100}
        />
        {!employee ? (
          <>
            <Field label="Email address" name="email" type="email" required />
            <Field
              label="Initial password"
              name="password"
              type="password"
              required
              minLength={12}
              maxLength={128}
            />
            <p className="muted form-hint">
              Use at least 12 characters. New accounts start with the employee
              role.
            </p>
          </>
        ) : (
          <>
            <Field
              label="Phone number"
              name="phone"
              defaultValue={employee.phone || ""}
              maxLength={25}
            />
            {isHR ? (
              <>
                <div className="form-row">
                  <Field
                    label="Department"
                    name="department"
                    defaultValue={employee.department || ""}
                    maxLength={100}
                  />
                  <Field
                    label="Designation"
                    name="designation"
                    defaultValue={employee.designation || ""}
                    maxLength={100}
                  />
                </div>
                <Field label="Manager">
                  <select
                    name="manager"
                    defaultValue={employee.manager?._id || ""}
                  >
                    <option value="">No manager assigned</option>
                    {people
                      .filter(
                        (p) =>
                          p.user?.active &&
                          p.user.role === "manager" &&
                          p.user._id !== employee.user._id,
                      )
                      .map((p) => (
                        <option key={p._id} value={p.user._id}>
                          {p.user.name}
                        </option>
                      ))}
                  </select>
                </Field>
                {employee.user._id !== user._id ? (
                  <Field label="Role">
                    <select name="role" defaultValue={employee.user.role}>
                      <option value="employee">Employee</option>
                      <option value="manager">Manager</option>
                      <option value="hr">HR</option>
                    </select>
                  </Field>
                ) : null}
              </>
            ) : null}
          </>
        )}
        <ErrorMessage>{error}</ErrorMessage>
        <FormActions
          busy={busy}
          onClose={onClose}
          label={employee ? "Save changes" : "Create employee"}
        />
      </form>
    </Modal>
  );
}
export default function People({
  user,
  people,
  refresh,
  notify,
  adding,
  setAdding,
}) {
  const [search, setSearch] = useState(""),
    [editing, setEditing] = useState(null),
    [deactivating, setDeactivating] = useState(null),
    [busy, setBusy] = useState(false);
  const visible = people.filter((p) =>
    `${p.user?.name} ${p.user?.email} ${p.department}`
      .toLowerCase()
      .includes(search.toLowerCase()),
  );
  async function deactivate() {
    setBusy(true);
    try {
      await api(`/employees/${deactivating.user._id}`, { method: "DELETE" });
      await refresh();
      notify("Account deactivated. Historical records are retained.");
      setDeactivating(null);
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
          <h1>{user.role === "employee" ? "Your profile" : "People"}</h1>
          <p>
            {user.role === "manager"
              ? "The people who make your team."
              : "A connected directory, with the right access for every role."}
          </p>
        </div>
        {user.role === "hr" ? (
          <button className="button" onClick={() => setAdding(true)}>
            <Plus size={18} />
            Add employee
          </button>
        ) : null}
      </div>
      <Panel
        title={
          user.role === "employee" ? "Personal details" : "Employee directory"
        }
      >
        <div className="toolbar">
          <label className="search">
            <Search size={18} />
            <input
              aria-label="Search people"
              placeholder="Search name, email or department"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </label>
          <button
            className="button secondary"
            onClick={() =>
              exportCSV(
                "staffsync-people.csv",
                [
                  "Name",
                  "Email",
                  "Department",
                  "Designation",
                  "Role",
                  "Status",
                ],
                visible.map((p) => [
                  p.user?.name,
                  p.user?.email,
                  p.department,
                  p.designation,
                  p.user?.role,
                  p.user?.active ? "Active" : "Inactive",
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
            "Name",
            "Department",
            "Designation",
            "Manager",
            "Role",
            "Status",
            "Actions",
          ]}
          count={visible.length}
          empty="No people match your search."
        >
          {visible.map((p, i) => (
            <tr key={p._id}>
              <td>
                <Person name={p.user?.name} email={p.user?.email} index={i} />
              </td>
              <td>{p.department || "Not assigned"}</td>
              <td>{p.designation || "Not assigned"}</td>
              <td>{p.manager?.name || "—"}</td>
              <td className="capitalize">{p.user?.role}</td>
              <td>
                <Status value={p.user?.active ? "Active" : "Inactive"} />
              </td>
              <td>
                <div className="row-actions">
                  {user.role === "hr" || p.user?._id === user._id ? (
                    <button
                      className="button secondary small"
                      aria-label={`Edit ${p.user?.name}`}
                      onClick={() => setEditing(p)}
                    >
                      <Pencil size={14} />
                      Edit
                    </button>
                  ) : null}
                  {user.role === "hr" &&
                  p.user?.active &&
                  p.user._id !== user._id ? (
                    <button
                      className="text-button danger-text"
                      onClick={() => setDeactivating(p)}
                    >
                      Deactivate
                    </button>
                  ) : null}
                </div>
              </td>
            </tr>
          ))}
        </Table>
      </Panel>
      {adding || editing ? (
        <EmployeeForm
          employee={editing}
          people={people}
          user={user}
          onClose={() => {
            setAdding(false);
            setEditing(null);
          }}
          onSaved={refresh}
          notify={notify}
        />
      ) : null}
      {deactivating ? (
        <Modal
          title="Deactivate employee"
          onClose={() => setDeactivating(null)}
        >
          <p>
            Deactivate {deactivating.user.name}? They will lose access
            immediately. Attendance and leave history will stay available.
          </p>
          <div className="form-actions">
            <button
              className="button secondary"
              onClick={() => setDeactivating(null)}
            >
              Cancel
            </button>
            <button
              className="button danger"
              disabled={busy}
              onClick={deactivate}
            >
              {busy ? "Deactivating…" : "Deactivate account"}
            </button>
          </div>
        </Modal>
      ) : null}
    </>
  );
}
