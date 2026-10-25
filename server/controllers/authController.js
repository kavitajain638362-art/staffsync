import jwt from "jsonwebtoken";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { fail, hashPassword, verifyPassword, text } from "../lib.js";

export async function register(req, res) {
  const name = text(req.body.name, "name", 100);
  const email = text(req.body.email, "email", 254).toLowerCase();
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) fail(400, "Invalid email");
  const passwordHash = await hashPassword(req.body.password);
  // Client role, active, manager, and other privileged fields are deliberately ignored.
  const user = await User.create({
    name,
    email,
    passwordHash,
    role: "employee",
  });
  try {
    await Employee.create({ user: user._id });
  } catch (error) {
    await User.deleteOne({ _id: user._id });
    throw error;
  }
  res.status(201).json(user);
}
export async function login(req, res) {
  const email = text(req.body.email, "email", 254).toLowerCase();
  const user = await User.findOne({ email, active: true }).select(
    "+passwordHash",
  );
  if (!user || !(await verifyPassword(req.body.password, user.passwordHash)))
    fail(401, "Invalid email or password");
  const token = jwt.sign({}, req.app.locals.jwtSecret, {
    subject: String(user._id),
    expiresIn: "2h",
    algorithm: "HS256",
    issuer: "staffsync",
    audience: "staffsync-app",
  });
  res.json({ token, user: user.toJSON() });
}
