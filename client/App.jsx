import { lazy, Suspense, useCallback, useEffect, useState } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";
import { api } from "./api.js";
import Shell from "./components/Shell.jsx";
import Login from "./pages/Login.jsx";
import Dashboard from "./pages/Dashboard.jsx";
const People = lazy(() => import("./pages/People.jsx"));
const Leaves = lazy(() => import("./pages/Leaves.jsx"));
const Attendance = lazy(() => import("./pages/Attendance.jsx"));
const Announcements = lazy(() => import("./pages/Announcements.jsx"));
const Training = lazy(() => import("./pages/Training.jsx"));
const emptyData = {
  people: [],
  leaves: [],
  attendance: [],
  announcements: [],
  training: [],
  notifications: [],
};
const validPages = new Set([
  "overview",
  "people",
  "leaves",
  "attendance",
  "announcements",
  "training",
]);
export default function App() {
  const [user, setUser] = useState(null),
    [demo, setDemo] = useState(false),
    [booting, setBooting] = useState(true),
    [data, setData] = useState(emptyData),
    [loading, setLoading] = useState(false),
    [error, setError] = useState(""),
    [page, setPage] = useState(() =>
      validPages.has(location.hash.slice(1))
        ? location.hash.slice(1)
        : "overview",
    ),
    [adding, setAdding] = useState(false),
    [toast, setToast] = useState(null);
  const logout = useCallback(() => {
    sessionStorage.removeItem("staffsync.token");
    setUser(null);
    setData(emptyData);
  }, []);
  const refresh = useCallback(async () => {
    const [
      people,
      leaves,
      attendance,
      announcements,
      training,
      notifications,
      current,
    ] = await Promise.all(
      [
        "/employees",
        "/leaves",
        "/attendance",
        "/announcements",
        "/training",
        "/notifications",
        "/auth/me",
      ].map((path) => api(path)),
    );
    setData({
      people,
      leaves,
      attendance,
      announcements,
      training,
      notifications,
    });
    setUser(current);
    setError("");
  }, []);
  const navigate = useCallback((id) => {
    setPage(id);
    location.hash = id;
  }, []);
  const notify = useCallback(
    (message, isError = false) => setToast({ message, isError }),
    [],
  );
  useEffect(() => {
    let alive = true;
    Promise.all([
      api("/config"),
      sessionStorage.getItem("staffsync.token")
        ? api("/auth/me")
        : Promise.resolve(null),
    ])
      .then(([config, current]) => {
        if (alive) {
          setDemo(config.demo);
          setUser(current);
        }
      })
      .catch((err) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setBooting(false);
      });
    return () => {
      alive = false;
    };
  }, []);
  useEffect(() => {
    window.addEventListener("staffsync:unauthorized", logout);
    const hash = () =>
      setPage(
        validPages.has(location.hash.slice(1))
          ? location.hash.slice(1)
          : "overview",
      );
    window.addEventListener("hashchange", hash);
    return () => {
      window.removeEventListener("staffsync:unauthorized", logout);
      window.removeEventListener("hashchange", hash);
    };
  }, [logout]);
  const userId = user?._id;
  useEffect(() => {
    if (!userId) return;
    let alive = true;
    setLoading(true);
    refresh()
      .catch((err) => {
        if (alive) setError(err.message);
      })
      .finally(() => {
        if (alive) setLoading(false);
      });
    return () => {
      alive = false;
    };
  }, [userId, refresh]);
  useEffect(() => {
    if (!toast) return;
    const timer = setTimeout(() => setToast(null), 6500);
    return () => clearTimeout(timer);
  }, [toast]);
  if (booting) return <div className="boot-screen">Opening StaffSync…</div>;
  if (!user)
    return (
      <Login
        key={demo ? "demo" : "live"}
        demo={demo}
        onLogin={(current) => {
          setUser(current);
          navigate("overview");
        }}
      />
    );
  const common = { user, refresh, notify };
  return (
    <Shell
      user={user}
      demo={demo}
      page={page}
      navigate={navigate}
      logout={logout}
      notifications={data.notifications}
      refresh={refresh}
      notify={notify}
    >
      {error ? (
        <div className="load-error" role="alert">
          {error}
          <button
            className="text-button"
            onClick={() => {
              setLoading(true);
              refresh()
                .catch((err) => setError(err.message))
                .finally(() => setLoading(false));
            }}
          >
            Try again
          </button>
        </div>
      ) : null}
      {loading ? (
        <div className="loading-state" role="status">
          Loading your workspace…
        </div>
      ) : (
        <Suspense
          fallback={
            <div className="loading-state" role="status">
              Opening section…
            </div>
          }
        >
          {page === "overview" ? (
            <Dashboard
              user={user}
              data={data}
              navigate={navigate}
              addEmployee={() => {
                navigate("people");
                setAdding(true);
              }}
            />
          ) : null}
          {page === "people" ? (
            <People
              {...common}
              people={data.people}
              adding={adding}
              setAdding={setAdding}
            />
          ) : null}
          {page === "leaves" ? (
            <Leaves {...common} leaves={data.leaves} />
          ) : null}
          {page === "attendance" ? (
            <Attendance {...common} records={data.attendance} />
          ) : null}
          {page === "announcements" ? (
            <Announcements {...common} announcements={data.announcements} />
          ) : null}
          {page === "training" ? (
            <Training
              {...common}
              training={data.training}
              people={data.people}
            />
          ) : null}
        </Suspense>
      )}
      {toast ? (
        <div
          className={`toast ${toast.isError ? "toast-error" : ""}`}
          role={toast.isError ? "alert" : "status"}
        >
          {toast.isError ? (
            <AlertCircle size={20} />
          ) : (
            <CheckCircle2 size={20} />
          )}
          <span>{toast.message}</span>
          <button aria-label="Dismiss message" onClick={() => setToast(null)}>
            <X size={16} />
          </button>
        </div>
      ) : null}
    </Shell>
  );
}
