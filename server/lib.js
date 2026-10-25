import {
  randomBytes,
  scrypt as scryptCallback,
  timingSafeEqual,
} from "node:crypto";
import { promisify } from "node:util";
const scrypt = promisify(scryptCallback);
export function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
export function text(value, field, max = 1000) {
  if (typeof value !== "string" || !value.trim() || value.trim().length > max)
    fail(400, `Invalid ${field}`);
  return value.trim();
}
export function date(value, field) {
  if (
    typeof value !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(value) ||
    !Number.isFinite(Date.parse(value)) ||
    new Date(value).toISOString().slice(0, 10) !== value
  )
    fail(400, `Invalid ${field}`);
  return value;
}
export function dayInIndia(now = new Date()) {
  return new Date(now.getTime() + 330 * 60000).toISOString().slice(0, 10);
}
export async function hashPassword(password) {
  if (
    typeof password !== "string" ||
    password.length < 12 ||
    password.length > 128
  )
    fail(400, "Password must contain 12–128 characters");
  const salt = randomBytes(16).toString("hex");
  const hash = await scrypt(password, salt, 64);
  return `${salt}:${hash.toString("hex")}`;
}
export async function verifyPassword(password, stored) {
  if (typeof password !== "string" || password.length > 128) return false;
  const [salt, encoded] = stored.split(":");
  const actual = await scrypt(password, salt, 64);
  const expected = Buffer.from(encoded, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
