import User from "../models/User.js";
import Employee from "../models/Employee.js";
import { fail, text } from "../lib.js";
import { teamIds } from "../middleware/authMiddleware.js";

export async function list(req, res) {
  const ids = await teamIds(req.user);
  res.json(
    await Employee.find(ids ? { user: { $in: ids } } : {})
      .populate("user", "name email role active")
      .populate("manager", "name email")
      .limit(200),
  );
}
export async function update(req, res) {
  const employee = await Employee.findOne({ user: req.params.userId });
  if (!employee) fail(404, "Employee not found");
  const isHR = req.user.role === "hr";
  if (!isHR && String(req.user._id) !== req.params.userId)
    fail(403, "Permission denied");
  const userUpdates = {};
  const optionalText = (value, field, max) =>
    value === "" ? "" : text(value, field, max);
  if (req.body.phone !== undefined)
    employee.phone = optionalText(req.body.phone, "phone", 25);
  if (req.body.name !== undefined)
    userUpdates.name = text(req.body.name, "name", 100);
  if (isHR) {
    for (const key of ["department", "designation"])
      if (req.body[key] !== undefined)
        employee[key] = optionalText(req.body[key], key, 100);
    if (req.body.manager !== undefined) {
      if (
        req.body.manager !== null &&
        !(await User.exists({
          _id: req.body.manager,
          role: "manager",
          active: true,
        }))
      )
        fail(400, "Choose an active manager");
      if (String(req.body.manager) === String(employee.user))
        fail(400, "An employee cannot manage themselves");
      employee.manager = req.body.manager;
    }
    if (req.body.role !== undefined) {
      if (!["hr", "manager", "employee"].includes(req.body.role))
        fail(400, "Invalid role");
      if (String(req.user._id) === String(employee.user))
        fail(400, "Cannot change your own role");
      userUpdates.role = req.body.role;
    }
  }
  await employee.validate();
  if (Object.keys(userUpdates).length)
    await User.updateOne({ _id: employee.user }, userUpdates);
  await employee.save();
  res.json(employee);
}
export async function deactivate(req, res) {
  if (req.params.userId === String(req.user._id))
    fail(400, "Cannot deactivate your own account");
  const user = await User.findByIdAndUpdate(
    req.params.userId,
    { active: false },
    { new: true },
  );
  if (!user) fail(404, "Employee not found");
  res.json({ message: "Employee deactivated; historical records retained" });
}
