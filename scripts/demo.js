import { MongoMemoryServer } from "mongodb-memory-server";
import mongoose from "mongoose";
import { randomBytes } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { fileURLToPath } from "node:url";
import { join } from "node:path";
import { tmpdir } from "node:os";
import { connectDB } from "../server/config/db.js";
import { createApp } from "../server/app.js";
import { seedDemo } from "./seed.js";

const root = fileURLToPath(new URL("../", import.meta.url));
const data = join(root, ".data");
await mkdir(join(data, "mongo"), { recursive: true });
let secret;
try {
  secret = await readFile(join(data, "demo-secret"), "utf8");
} catch (error) {
  if (error.code !== "ENOENT") throw error;
  secret = randomBytes(48).toString("hex");
  await writeFile(join(data, "demo-secret"), secret, { flag: "wx" });
}
const mongo = await MongoMemoryServer.create({
  binary: {
    downloadDir:
      process.env.STAFFSYNC_TEST_CACHE ||
      join(tmpdir(), "staffsync-mongodb-binaries"),
  },
  instance: { dbPath: join(data, "mongo"), storageEngine: "wiredTiger" },
});
await connectDB(mongo.getUri("staffsync"));
await seedDemo();
const app = createApp({
  jwtSecret: secret,
  staticDir: join(root, "dist"),
  demo: true,
});
const port = Number(process.env.PORT || 5173);
const server = app.listen(port, "127.0.0.1", () =>
  console.log(
    `StaffSync demo: http://localhost:${port}\nDemo accounts: hr@example.test, manager@example.test, employee@example.test\nDemo password: StaffSyncDemo2026!\nPersistent demo data: .data/mongo`,
  ),
);
let stopping = false;
async function stop() {
  if (stopping) return;
  stopping = true;
  server.close(async () => {
    await mongoose.disconnect();
    await mongo.stop();
    process.exit(0);
  });
}
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
