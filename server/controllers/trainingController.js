import Training from "../models/Training.js";
import User from "../models/User.js";
import { date, fail, text } from "../lib.js";
import { assertTeam } from "../middleware/authMiddleware.js";
import { notifyUsers } from "../notifications.js";
export async function list(req, res) {
  const filter =
    req.user.role === "hr"
      ? {}
      : req.user.role === "manager"
        ? { $or: [{ createdBy: req.user._id }, { assignedTo: req.user._id }] }
        : { assignedTo: req.user._id };
  res.json(
    await Training.find(filter)
      .populate("assignedTo", "name email")
      .sort({ date: 1 })
      .limit(100),
  );
}
export async function create(req, res) {
  const assignedTo = req.body.assignedTo;
  if (
    !Array.isArray(assignedTo) ||
    assignedTo.length > 100 ||
    assignedTo.some(
      (id) => typeof id !== "string" || !/^[a-f\d]{24}$/i.test(id),
    )
  )
    fail(400, "Invalid assignedTo");
  const uniqueIds = [...new Set(assignedTo)];
  for (const id of uniqueIds) {
    if (!(await User.exists({ _id: id, active: true })))
      fail(400, "Assigned employee not found");
    await assertTeam(req.user, id);
  }
  const training = await Training.create({
    title: text(req.body.title, "title", 200),
    description: text(req.body.description, "description", 5000),
    date: date(req.body.date, "date"),
    assignedTo: uniqueIds,
    createdBy: req.user._id,
  });
  await notifyUsers(
    uniqueIds,
    "Training assigned",
    `${training.title} is scheduled for ${training.date}.`,
    "training",
  );
  res.status(201).json(training);
}
