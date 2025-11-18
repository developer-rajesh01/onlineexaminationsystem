import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import path from "path";
import jwt from "jsonwebtoken";

import connectDB from "./config/DB.js";

import { Server as IOServer } from "socket.io";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import uploadRoutes from "./routes/uploadRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";

import errorHandler from "./middlewares/errorHandler.js";
import authMiddleware from "./middlewares/authMiddleware.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const PORT = process.env.PORT || 5000;

const app = express();

// simple logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// connect DB
connectDB().catch((err) => {
  console.error("DB connect error:", err);
  process.exit(1);
});

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/tests", testRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/faculty", facultyRoutes);

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("Online Examination System API is running...");
});

// Single 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

// create HTTP server and socket.io AFTER routes are registered
const server = http.createServer(app);

// create socket.io server and enable CORS to client origin
const io = new IOServer(server, {
  cors: {
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST"],
  },
});

// socket middleware: optional JWT handshake verification
io.use((socket, next) => {
  try {
    // client may send token in socket.handshake.auth.token
    const token = socket.handshake?.auth?.token || null;
    if (!token) {
      // allow anonymous or reject if you want strict auth:
      // return next(new Error("Auth token required"));
      return next();
    }
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // attach minimal user info to socket
    socket.user = { id: payload.id, email: payload.email, name: payload.name };
    return next();
  } catch (err) {
    console.warn("Socket JWT verify failed:", err.message);
    // either allow connection or reject:
    // next(new Error("Authentication error"));
    return next(); // allow but without user info
  }
});

// socket event handlers
io.on("connection", (socket) => {
  console.log(
    "Socket connected:",
    socket.id,
    "user:",
    socket.user?.email || "anon"
  );

  // join test room
  socket.on("joinTestRoom", ({ testId } = {}) => {
    if (testId) {
      const room = `test:${testId}`;
      socket.join(room);
      console.log(`Socket ${socket.id} joined room ${room}`);
    }
  });

  socket.on("leaveTestRoom", ({ testId } = {}) => {
    if (testId) {
      const room = `test:${testId}`;
      socket.leave(room);
      console.log(`Socket ${socket.id} left room ${room}`);
    }
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, "reason:", reason);
  });
});

// attach io to app so controllers can emit: req.app.get("io") or app.get("io")
app.set("io", io);

// optional: print registered routes for debugging
if (app && app._router) {
  const routes = [];
  app._router.stack.forEach((m) => {
    if (m.route && m.route.path) {
      const methods = Object.keys(m.route.methods).join(",");
      routes.push(`${methods.toUpperCase()} ${m.route.path}`);
    } else if (m.name === "router" && m.handle && m.handle.stack) {
      m.handle.stack.forEach((r) => {
        if (r.route && r.route.path) {
          const methods = Object.keys(r.route.methods).join(",");
          routes.push(`${methods.toUpperCase()} (mounted) ${r.route.path}`);
        }
      });
    }
  });
  console.log("Registered routes:", routes);
}

// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});

export default app;
