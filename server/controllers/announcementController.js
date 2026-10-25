import Announcement from "../models/Announcement.js";
import { fail, text } from "../lib.js";
export async function list(_req, res) {
  res.json(
    await Announcement.find()
      .populate("author", "name")
      .sort({ createdAt: -1 })
      .limit(100),
  );
}
export async function create(req, res) {
  res
    .status(201)
    .json(
      await Announcement.create({
        title: text(req.body.title, "title", 200),
        body: text(req.body.body, "body", 5000),
        author: req.user._id,
      }),
    );
}
export async function update(req, res) {
  const item = await Announcement.findById(req.params.id);
  if (!item) fail(404, "Announcement not found");
  if (req.user.role !== "hr" && String(item.author) !== String(req.user._id))
    fail(403, "Permission denied");
  item.title = text(req.body.title, "title", 200);
  item.body = text(req.body.body, "body", 5000);
  res.json(await item.save());
}
export async function remove(req, res) {
  const item = await Announcement.findById(req.params.id);
  if (!item) fail(404, "Announcement not found");
  if (req.user.role !== "hr" && String(item.author) !== String(req.user._id))
    fail(403, "Permission denied");
  await item.deleteOne();
  res.status(204).end();
}
