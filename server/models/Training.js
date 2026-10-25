import mongoose from "mongoose";
export default mongoose.model(
  "Training",
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 200 },
      description: { type: String, required: true, maxlength: 5000 },
      date: { type: String, required: true },
      assignedTo: [
        { type: mongoose.Schema.Types.ObjectId, ref: "User", index: true },
      ],
      createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: true },
  ),
);
