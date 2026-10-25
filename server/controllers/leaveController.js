import Leave from "../models/Leave.js";
import { fail, date, text } from "../lib.js";
import { teamIds, assertTeam } from "../middleware/authMiddleware.js";
import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { notifyUsers } from "../notifications.js";
export async function list(req, res) {
  const ids = await teamIds(req.user);
  res.json(
    await Leave.find(
      ids
        ? {
            employee: {
              $in: req.user.role === "manager" ? [...ids, req.user._id] : ids,
            },
          }
        : {},
    )
      .populate("employee", "name email")
      .sort({ createdAt: -1 })
      .limit(200),
  );
}
export async function apply(req, res) {
  const startDate = date(req.body.startDate, "startDate");
  const endDate = date(req.body.endDate, "endDate");
  if (endDate < startDate) fail(400, "End date must be on or after start date");
  const reason = text(req.body.reason, "reason");
  if (
    await Leave.exists({
      employee: req.user._id,
      status: { $in: ["pending", "approved"] },
      startDate: { $lte: endDate },
      endDate: { $gte: startDate },
    })
  )
    fail(409, "Dates overlap an existing leave request");
  const leave = await Leave.create({
    employee: req.user._id,
    startDate,
    endDate,
    reason,
  });
  const [profile, hr] = await Promise.all([
    Employee.findOne({ user: req.user._id }),
    User.find({ role: "hr", active: true }).select("_id"),
  ]);
  await notifyUsers(
    [
      ...hr.map((u) => u._id),
      ...(profile?.manager ? [profile.manager] : []),
    ].filter((id) => String(id) !== String(req.user._id)),
    "New leave request",
    `${req.user.name} requested leave from ${startDate} to ${endDate}.`,
    "leaves",
  );
  res.status(201).json(leave);
}
export async function review(req, res) {
  if (!["approved", "rejected"].includes(req.body.status))
    fail(400, "Choose approved or rejected");
  const leave = await Leave.findById(req.params.id);
  if (!leave) fail(404, "Leave request not found");
  if (String(leave.employee) === String(req.user._id))
    fail(403, "Cannot review your own request");
  await assertTeam(req.user, leave.employee);
  const updated = await Leave.findOneAndUpdate(
    { _id: leave._id, status: "pending" },
    {
      status: req.body.status,
      reviewedBy: req.user._id,
      reviewedAt: new Date(),
    },
    { new: true },
  );
  if (!updated) fail(409, "Request already reviewed");
  await notifyUsers(
    [leave.employee],
    `Leave ${req.body.status}`,
    `Your leave from ${leave.startDate} to ${leave.endDate} was ${req.body.status}.`,
    "leaves",
  );
  res.json(updated);
}
