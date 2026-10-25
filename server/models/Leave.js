import mongoose from "mongoose";
export default mongoose.model(
  "Leave",
  new mongoose.Schema(
    {
      employee: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        index: true,
      },
      startDate: { type: String, required: true },
      endDate: { type: String, required: true },
      reason: { type: String, required: true, maxlength: 1000 },
      status: {
        type: String,
        enum: ["pending", "approved", "rejected"],
        default: "pending",
      },
      reviewedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
      reviewedAt: Date,
    },
    { timestamps: true },
  ),
);
