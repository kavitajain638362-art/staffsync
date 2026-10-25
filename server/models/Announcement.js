import mongoose from "mongoose";
export default mongoose.model(
  "Announcement",
  new mongoose.Schema(
    {
      title: { type: String, required: true, trim: true, maxlength: 200 },
      body: { type: String, required: true, maxlength: 5000 },
      author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
    },
    { timestamps: true },
  ),
);
