import mongoose from "mongoose";
const schema = new mongoose.Schema(
  {
    employee: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: { type: String, required: true },
    checkedInAt: { type: Date, required: true },
    checkedOutAt: Date,
  },
  { timestamps: true },
);
schema.index({ employee: 1, date: 1 }, { unique: true });
export default mongoose.model("Attendance", schema);
