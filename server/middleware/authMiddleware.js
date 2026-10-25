import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { fail } from "../lib.js";

export async function authenticate(req, _res, next) {
  const header = req.get("authorization");
  if (!header?.startsWith("Bearer ")) fail(401, "Authentication required");
  let payload;
  try {
    payload = jwt.verify(header.slice(7), req.app.locals.jwtSecret, {
      algorithms: ["HS256"],
      issuer: "staffsync",
      audience: "staffsync-app",
    });
  } catch {
    fail(401, "Invalid or expired token");
  }
  const user = await User.findById(payload.sub);
  if (!user?.active) fail(401, "Account unavailable");
  req.user = user;
  next();
}
export const roles =
  (...allowed) =>
  (req, _res, next) => {
    if (!allowed.includes(req.user.role)) fail(403, "Permission denied");
    next();
  };
export async function teamIds(user) {
  if (user.role === "hr") return null;
  if (user.role === "manager")
    return (await Employee.find({ manager: user._id })).map((e) => e.user);
  return [user._id];
}
export async function assertTeam(user, userId) {
  if (user.role === "hr") return;
  if (
    user.role !== "manager" ||
    !(await Employee.exists({ user: userId, manager: user._id }))
  )
    fail(403, "Employee outside your team");
}
