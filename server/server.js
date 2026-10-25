import mongoose from "mongoose";
import { connectDB } from "./config/db.js";
import { createApp } from "./app.js";
import { fileURLToPath } from "node:url";

const app = createApp({
  jwtSecret: process.env.JWT_SECRET,
  staticDir: fileURLToPath(new URL("../dist", import.meta.url)),
});
await connectDB(process.env.MONGODB_URI);
const server = app.listen(Number(process.env.PORT || 4000), "127.0.0.1", () =>
  console.log(
    "StaffSync API ready at http://127.0.0.1:" + (process.env.PORT || 4000),
  ),
);
for (const signal of ["SIGINT", "SIGTERM"])
  process.on(signal, () =>
    server.close(async () => {
      await mongoose.disconnect();
      process.exit(0);
    }),
  );
