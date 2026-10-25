import { useState } from "react";
import { Users, ArrowRight, ShieldCheck } from "lucide-react";
import { api } from "../api.js";
import { Field, ErrorMessage } from "../components/ui.jsx";
export default function Login({ demo, onLogin }) {
  const [register, setRegister] = useState(false),
    [busy, setBusy] = useState(false),
    [error, setError] = useState("");
  const [email, setEmail] = useState(demo ? "hr@example.test" : ""),
    [password, setPassword] = useState(demo ? "StaffSyncDemo2026!" : "");
  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setError("");
    try {
      if (register)
        await api("/auth/register", {
          method: "POST",
          body: {
            name: new FormData(e.currentTarget).get("name"),
            email,
            password,
          },
        });
      const result = await api("/auth/login", {
        method: "POST",
        body: { email, password },
      });
      sessionStorage.setItem("staffsync.token", result.token);
      onLogin(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }
  return (
    <div className="login-page">
      <section className="login-intro">
        <div className="brand">
          <Users size={33} />
          <span>StaffSync</span>
        </div>
        <div>
          <h1>
            Your people,
            <br />
            connected.
          </h1>
          <p>
            A clearer working day, from the first check-in to the next
            opportunity to grow.
          </p>
          <div className="login-values">
            <span>
              <ShieldCheck size={22} />
              Every role. The right access.
            </span>
            <span>
              <Users size={22} />
              One place for your whole team.
            </span>
          </div>
        </div>
        <small>People · Time · Growth</small>
      </section>
      <main className="login-main">
        <div className="login-form">
          <h2>{register ? "Join your workspace" : "Welcome back"}</h2>
          <p>
            {register
              ? "Create an employee account to get started."
              : "Sign in to your StaffSync workspace."}
          </p>
          {demo ? (
            <div className="demo-note">
              <strong>Explore the local demo</strong>
              <p>
                Fictional accounts share the password{" "}
                <code>StaffSyncDemo2026!</code>
              </p>
              <div className="demo-roles">
                {["hr", "manager", "employee"].map((role) => (
                  <button
                    key={role}
                    type="button"
                    className={email === `${role}@example.test` ? "active" : ""}
                    onClick={() => {
                      setEmail(`${role}@example.test`);
                      setPassword("StaffSyncDemo2026!");
                      setRegister(false);
                    }}
                  >
                    {role === "hr"
                      ? "HR"
                      : role === "manager"
                        ? "Manager"
                        : "Employee"}
                  </button>
                ))}
              </div>
            </div>
          ) : null}
          <form onSubmit={submit}>
            {register ? (
              <Field
                label="Full name"
                name="name"
                required
                maxLength={100}
                autoComplete="name"
              />
            ) : null}
            <Field
              label="Email address"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              autoComplete="username"
            />
            <Field
              label="Password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={register ? 12 : 1}
              maxLength={128}
              autoComplete={register ? "new-password" : "current-password"}
            />
            <ErrorMessage>{error}</ErrorMessage>
            <button className="button full" disabled={busy}>
              {busy ? "Signing in…" : register ? "Create account" : "Sign in"}
              <ArrowRight size={18} />
            </button>
          </form>
          <p className="login-switch">
            {register ? "Already have an account?" : "New to your workspace?"}{" "}
            <button
              className="text-button"
              onClick={() => {
                setRegister(!register);
                setError("");
              }}
            >
              {register ? "Sign in" : "Create employee account"}
            </button>
          </p>
        </div>
      </main>
    </div>
  );
}
