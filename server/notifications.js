import Notification from "./models/Notification.js";
export async function notifyUsers(recipients, title, body, section) {
  const ids = [...new Set(recipients.map(String))];
  if (!ids.length) return;
  // Notification delivery must not turn an already saved HR action into a failed request.
  try {
    await Notification.insertMany(
      ids.map((recipient) => ({ recipient, title, body, section })),
    );
  } catch (error) {
    console.error("Notification delivery failed:", error.message);
  }
}
