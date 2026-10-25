import express from "express";
import helmet from "helmet";
import mongoose from "mongoose";
import path from "node:path";
import { authenticate } from "./middleware/authMiddleware.js";
import authRoutes from "./routes/authRoutes.js";
import employeeRoutes from "./routes/employeeRoutes.js";
import leaveRoutes from "./routes/leaveRoutes.js";
import attendanceRoutes from "./routes/attendanceRoutes.js";
import announcementRoutes from "./routes/announcementRoutes.js";
import trainingRoutes from "./routes/trainingRoutes.js";
import notificationRoutes from "./routes/notificationRoutes.js";

export function createApp({ jwtSecret, staticDir, demo = false }) {
  if (typeof jwtSecret !== "string" || jwtSecret.length < 32)
    throw new Error("JWT_SECRET must contain at least 32 characters");
  const app = express();
  app.locals.jwtSecret = jwtSecret;
  app.disable("x-powered-by");
  app.use(helmet(), express.json({ limit: "32kb" }));
  app.use((req, _res, next) => {
    req.body ??= {};
    next();
  });
  app.get("/api/health", (_req, res) =>
    res
      .status(mongoose.connection.readyState === 1 ? 200 : 503)
      .json({
        database:
          mongoose.connection.readyState === 1 ? "connected" : "disconnected",
      }),
  );
  app.get("/api/config", (_req, res) => res.json({ demo }));
  app.use("/api/auth", authRoutes);
  for (const [path, routes] of Object.entries({
    employees: employeeRoutes,
    leaves: leaveRoutes,
    attendance: attendanceRoutes,
    announcements: announcementRoutes,
    training: trainingRoutes,
    notifications: notificationRoutes,
  }))
    app.use(`/api/${path}`, authenticate, routes);
  if (staticDir) {
    app.use(express.static(staticDir));
    app.use((req, res, next) => {
      if (
        req.method === "GET" &&
        !req.path.startsWith("/api/") &&
        req.accepts("html")
      )
        return res.sendFile(path.join(staticDir, "index.html"));
      next();
    });
  }
  app.use((_req, res) => res.status(404).json({ message: "Route not found" }));
  app.use((err, _req, res, _next) => {
    const status =
      err.code === 11000
        ? 409
        : ["ValidationError", "CastError"].includes(err.name)
          ? 400
          : err.status || 500;
    const message =
      err.code === 11000
        ? "Record already exists"
        : status >= 500
          ? "Internal server error"
          : err.message;
    if (status >= 500) console.error(err);
    res.status(status).json({ message });
  });
  return app;
}
