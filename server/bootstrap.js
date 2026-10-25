import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import User from "./models/User.js";
import Employee from "./models/Employee.js";
import { hashPassword, text } from "./lib.js";
try {
  const email = text(
    process.env.BOOTSTRAP_EMAIL,
    "BOOTSTRAP_EMAIL",
    254,
  ).toLowerCase();
  const passwordHash = await hashPassword(process.env.BOOTSTRAP_PASSWORD);
  await connectDB(process.env.MONGODB_URI);
  if (await User.exists({ role: "hr" }))
    throw new Error("An HR account already exists; bootstrap refused");
  const user = await User.create({
    name: "HR Administrator",
    email,
    passwordHash,
    role: "hr",
  });
  await Employee.create({
    user: user._id,
    department: "Human Resources",
    designation: "Administrator",
  });
  console.log("HR administrator created");
} finally {
  await mongoose.disconnect();
}
