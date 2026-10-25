import { test, before, after } from "node:test";
import assert from "node:assert/strict";
import { tmpdir } from "node:os";
import { join } from "node:path";
import mongoose from "mongoose";
import { MongoMemoryServer } from "mongodb-memory-server";
import request from "supertest";
import { createApp } from "../app.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import Attendance from "../models/Attendance.js";
import { hashPassword, dayInIndia, date } from "../lib.js";

let db, app;
const users = {};
const password = "Capstone-test-482!";
before(
  async () => {
    db = await MongoMemoryServer.create({
      binary: {
        downloadDir:
          process.env.STAFFSYNC_TEST_CACHE ||
          join(tmpdir(), "staffsync-mongodb-binaries"),
      },
    });
    await mongoose.connect(db.getUri());
    await Promise.all([User.init(), Employee.init(), Attendance.init()]);
    app = createApp({
      jwtSecret: "test-only-secret-which-is-at-least-32-characters",
    });
    for (const role of ["hr", "manager", "employee", "outsider"]) {
      const user = await User.create({
        name: role,
        email: `${role}@example.test`,
        passwordHash: await hashPassword(password),
        role: role === "outsider" ? "employee" : role,
      });
      await Employee.create({ user: user._id });
      const response = await request(app)
        .post("/api/auth/login")
        .send({ email: user.email, password })
        .expect(200);
      users[role] = { id: String(user._id), token: response.body.token };
      assert.equal(response.body.user.passwordHash, undefined);
    }
    await Employee.updateOne(
      { user: users.employee.id },
      { manager: users.manager.id },
    );
  },
  { timeout: 900000 },
);
after(async () => {
  await mongoose.disconnect();
  if (db) await db.stop();
});
const api = (role, method, url) =>
  request(app)[method](url).set("Authorization", `Bearer ${users[role].token}`);

test("public registration cannot grant HR or expose password hash", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "New Employee",
      email: "new@example.test",
      password,
      role: "hr",
      active: false,
    })
    .expect(201);
  assert.equal(response.body.role, "employee");
  assert.equal(response.body.active, true);
  assert.equal(response.body.passwordHash, undefined);
  await request(app)
    .post("/api/auth/register")
    .send({ name: "Duplicate", email: "new@example.test", password })
    .expect(409);
});
test("authentication rejects anonymous, invalid token, and wrong password", async () => {
  await request(app).get("/api/employees").expect(401);
  await request(app)
    .get("/api/employees")
    .set("Authorization", "Bearer forged")
    .expect(401);
  await request(app)
    .post("/api/auth/login")
    .send({ email: "employee@example.test", password: "incorrect" })
    .expect(401);
});
test("employees see only their profile and cannot escalate themselves", async () => {
  const response = await api("employee", "get", "/api/employees").expect(200);
  assert.equal(response.body.length, 1);
  await api("employee", "patch", `/api/employees/${users.employee.id}`)
    .send({ role: "hr", phone: "1234567890" })
    .expect(200);
  assert.equal((await User.findById(users.employee.id)).role, "employee");
  await api("employee", "patch", `/api/employees/${users.outsider.id}`)
    .send({ phone: "1234" })
    .expect(403);
  const team = await api("manager", "get", "/api/employees").expect(200);
  assert.deepEqual(
    team.body.map((e) => String(e.user._id)),
    [users.employee.id],
  );
});
test("leave dates, overlapping requests, team boundaries and final decisions", async () => {
  await api("employee", "post", "/api/leaves")
    .send({ startDate: "2026-02-30", endDate: "2026-03-02", reason: "Invalid" })
    .expect(400);
  await api("employee", "post", "/api/leaves")
    .send({ startDate: "2026-11-03", endDate: "2026-11-01", reason: "Invalid" })
    .expect(400);
  const leave = await api("employee", "post", "/api/leaves")
    .send({
      startDate: "2026-11-01",
      endDate: "2026-11-02",
      reason: "Personal",
    })
    .expect(201);
  await api("employee", "post", "/api/leaves")
    .send({ startDate: "2026-11-02", endDate: "2026-11-03", reason: "Overlap" })
    .expect(409);
  await api("employee", "patch", `/api/leaves/${leave.body._id}`)
    .send({ status: "approved" })
    .expect(403);
  await api("manager", "patch", `/api/leaves/${leave.body._id}`)
    .send({ status: "approved" })
    .expect(200);
  await api("hr", "patch", `/api/leaves/${leave.body._id}`)
    .send({ status: "rejected" })
    .expect(409);
  const other = await api("outsider", "post", "/api/leaves")
    .send({
      startDate: "2026-11-01",
      endDate: "2026-11-01",
      reason: "Personal",
    })
    .expect(201);
  await api("manager", "patch", `/api/leaves/${other.body._id}`)
    .send({ status: "approved" })
    .expect(403);
  const self = await api("manager", "post", "/api/leaves")
    .send({
      startDate: "2026-11-01",
      endDate: "2026-11-01",
      reason: "Personal",
    })
    .expect(201);
  await api("manager", "patch", `/api/leaves/${self.body._id}`)
    .send({ status: "approved" })
    .expect(403);
});
test("attendance uses India day, rejects duplicate check-in and checkout", async () => {
  assert.equal(dayInIndia(new Date("2026-10-24T20:00:00Z")), "2026-10-25");
  assert.throws(() => date("2026-02-30", "date"));
  await api("employee", "post", "/api/attendance/check-out").expect(409);
  await api("employee", "post", "/api/attendance/check-in")
    .send({ employee: users.outsider.id, date: "2000-01-01" })
    .expect(201);
  await api("employee", "post", "/api/attendance/check-in").expect(409);
  await api("employee", "post", "/api/attendance/check-out").expect(200);
  await api("employee", "post", "/api/attendance/check-out").expect(409);
  const response = await api("outsider", "get", "/api/attendance").expect(200);
  assert.equal(response.body.length, 0);
});
test("announcement CRUD checks employee role and manager ownership", async () => {
  await api("employee", "post", "/api/announcements")
    .send({ title: "Test", body: "Text" })
    .expect(403);
  const response = await api("manager", "post", "/api/announcements")
    .send({ title: "Team day", body: "Welcome" })
    .expect(201);
  await api("manager", "patch", `/api/announcements/${response.body._id}`)
    .send({ title: "Team day updated", body: "Welcome back" })
    .expect(200);
  await api("hr", "delete", `/api/announcements/${response.body._id}`).expect(
    204,
  );
});
test("training assignments enforce manager team membership and visibility", async () => {
  const payload = {
    title: "Onboarding",
    description: "Introduction",
    date: "2026-11-05",
    assignedTo: [users.employee.id],
  };
  await api("employee", "post", "/api/training").send(payload).expect(403);
  await api("manager", "post", "/api/training")
    .send({ ...payload, assignedTo: [users.outsider.id] })
    .expect(403);
  await api("manager", "post", "/api/training").send(payload).expect(201);
  assert.equal((await api("employee", "get", "/api/training")).body.length, 1);
  assert.equal((await api("outsider", "get", "/api/training")).body.length, 0);
});
test("deactivating an account invalidates already issued tokens", async () => {
  await api("hr", "delete", `/api/employees/${users.outsider.id}`).expect(200);
  await api("outsider", "get", "/api/employees").expect(401);
});
test("optional profile fields can be cleared without losing manager assignment", async () => {
  await api("hr", "patch", `/api/employees/${users.employee.id}`)
    .send({ phone: "", department: "", designation: "" })
    .expect(200);
  const profile = await Employee.findOne({ user: users.employee.id });
  assert.equal(profile.phone, "");
  assert.equal(String(profile.manager), users.manager.id);
});
test("notifications are private and can be marked read", async () => {
  const notifications = await api(
    "employee",
    "get",
    "/api/notifications",
  ).expect(200);
  assert.ok(notifications.body.some((n) => n.title === "Leave approved"));
  const item = notifications.body[0];
  await api("manager", "patch", `/api/notifications/${item._id}`).expect(404);
  const read = await api(
    "employee",
    "patch",
    `/api/notifications/${item._id}`,
  ).expect(200);
  assert.ok(read.body.readAt);
  await api("employee", "patch", "/api/notifications/read-all").expect(200);
  assert.ok(
    (await api("employee", "get", "/api/notifications")).body.every(
      (n) => n.readAt,
    ),
  );
});
test("missing and malformed authentication input returns client errors", async () => {
  await request(app).post("/api/auth/login").expect(400);
  await request(app)
    .post("/api/auth/login")
    .set("Content-Type", "application/json")
    .send("{broken")
    .expect(400);
});
