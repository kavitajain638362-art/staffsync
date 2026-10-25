import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: { type: String, required: true, maxlength: 200 },
    body: { type: String, required: true, maxlength: 1000 },
    section: {
      type: String,
      enum: ["leaves", "training", "announcements"],
      required: true,
    },
    readAt: { type: Date, default: null },
  },
  { timestamps: true },
);
schema.index({ recipient: 1, createdAt: -1 });
export default mongoose.model("Notification", schema);
