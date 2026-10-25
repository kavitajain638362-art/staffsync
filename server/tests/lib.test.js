import { test } from "node:test";
import assert from "node:assert/strict";
import {
  date,
  dayInIndia,
  text,
  hashPassword,
  verifyPassword,
} from "../lib.js";

test("calendar validation rejects impossible dates and non-string input", () => {
  for (const value of ["2026-02-30", "2026-13-01", "2026-1-01", "", {}, null])
    assert.throws(() => date(value, "date"));
  assert.equal(date("2028-02-29", "date"), "2028-02-29");
  assert.equal(dayInIndia(new Date("2026-10-24T18:29:59Z")), "2026-10-24");
  assert.equal(dayInIndia(new Date("2026-10-24T18:30:00Z")), "2026-10-25");
});
test("text validation rejects objects and oversized payloads", () => {
  assert.throws(() => text({ $ne: "" }, "email"));
  assert.throws(() => text("a".repeat(101), "name", 100));
  assert.equal(text("  Ada  ", "name"), "Ada");
});
test("password hashing uses unique salts and verifies without plaintext storage", async () => {
  const password = "A-test-password-928!";
  const first = await hashPassword(password);
  const second = await hashPassword(password);
  assert.notEqual(first, second);
  assert.ok(!first.includes(password));
  assert.equal(await verifyPassword(password, first), true);
  assert.equal(await verifyPassword("wrong-password", first), false);
  await assert.rejects(hashPassword("short"));
});
