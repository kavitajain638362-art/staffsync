import mongoose from "mongoose";
export default mongoose.model(
  "Employee",
  new mongoose.Schema(
    {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
        unique: true,
      },
      department: { type: String, trim: true, maxlength: 100, default: "" },
      designation: { type: String, trim: true, maxlength: 100, default: "" },
      phone: { type: String, trim: true, maxlength: 25, default: "" },
      manager: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null,
        index: true,
      },
    },
    { timestamps: true },
  ),
);
