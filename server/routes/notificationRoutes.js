import { Router } from "express";
import Notification from "../models/Notification.js";
import { fail } from "../lib.js";
const router = Router();
router.get("/", async (req, res) =>
  res.json(
    await Notification.find({ recipient: req.user._id })
      .sort({ createdAt: -1 })
      .limit(100),
  ),
);
router.patch("/read-all", async (req, res) => {
  await Notification.updateMany(
    { recipient: req.user._id, readAt: null },
    { readAt: new Date() },
  );
  res.json({ message: "All notifications marked read" });
});
router.patch("/:id", async (req, res) => {
  const item = await Notification.findOneAndUpdate(
    { _id: req.params.id, recipient: req.user._id },
    { readAt: new Date() },
    { new: true },
  );
  if (!item) fail(404, "Notification not found");
  res.json(item);
});
export default router;
