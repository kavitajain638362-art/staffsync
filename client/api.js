export async function api(path, options = {}) {
  const token = sessionStorage.getItem("staffsync.token");
  const response = await fetch(`/api${path}`, {
    ...options,
    headers: {
      "Content-Type": "application/json",
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
    ...(options.body ? { body: JSON.stringify(options.body) } : {}),
  });
  const data = response.status === 204 ? null : await response.json();
  if (!response.ok) {
    if (response.status === 401 && token) {
      sessionStorage.removeItem("staffsync.token");
      window.dispatchEvent(new Event("staffsync:unauthorized"));
    }
    throw new Error(data?.message || "Request failed. Please try again.");
  }
  return data;
}
export const today = () =>
  new Intl.DateTimeFormat("en-CA", {
    timeZone: "Asia/Kolkata",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(new Date());
export const dateLabel = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        day: "numeric",
        month: "short",
        year: "numeric",
        timeZone: "Asia/Kolkata",
      }).format(new Date(date))
    : "—";
export const timeLabel = (date) =>
  date
    ? new Intl.DateTimeFormat("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Kolkata",
      }).format(new Date(date))
    : "—";
export const initials = (name = "") =>
  name
    .split(" ")
    .map((n) => n[0])
    .slice(0, 2)
    .join("");
export function exportCSV(filename, columns, rows) {
  const quote = (value) => {
    const str = String(value ?? "");
    return `"${(/^[=+@\-\t\r]/.test(str) ? "'" : "") + str.replaceAll('"', '""')}"`;
  };
  const blob = new Blob(
    [
      "\uFEFF" +
        [columns, ...rows].map((row) => row.map(quote).join(",")).join("\r\n"),
    ],
    { type: "text/csv;charset=utf-8;" },
  );
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
