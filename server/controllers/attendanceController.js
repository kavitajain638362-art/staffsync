import Attendance from "../models/Attendance.js";
import { fail, dayInIndia } from "../lib.js";
import { teamIds } from "../middleware/authMiddleware.js";
export async function list(req, res) {
  const ids = await teamIds(req.user);
  res.json(
    await Attendance.find(
      ids
        ? {
            employee: {
              $in: req.user.role === "manager" ? [...ids, req.user._id] : ids,
            },
          }
        : {},
    )
      .populate("employee", "name email")
      .sort({ date: -1 })
      .limit(500),
  );
}
export async function checkIn(req, res) {
  res
    .status(201)
    .json(
      await Attendance.create({
        employee: req.user._id,
        date: dayInIndia(),
        checkedInAt: new Date(),
      }),
    );
}
export async function checkOut(req, res) {
  const record = await Attendance.findOneAndUpdate(
    {
      employee: req.user._id,
      date: dayInIndia(),
      checkedOutAt: { $exists: false },
    },
    { checkedOutAt: new Date() },
    { new: true },
  );
  if (!record) fail(409, "No open attendance record today");
  res.json(record);
}
