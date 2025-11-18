// Server.js (ESM)
import "dotenv/config"; // loads .env
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
<<<<<<< HEAD
import uploadRoutes from "./routes/uploadRoutes.js";
import facultyRoutes from "./routes/facultyRoutes.js";
=======
import attemptsRouter from "./routes/attempts.js";
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f

import errorHandler from "./middlewares/errorHandler.js";
import authMiddleware from "./middlewares/authMiddleware.js";

const CLIENT_ORIGIN = process.env.CLIENT_ORIGIN || "http://localhost:3000";
const PORT = process.env.PORT || 5000;

import { Server as IOServer } from "socket.io";
import cron from "node-cron";
import updateTestStatuses from "./helpers/statusUpdater.js";

const app = express();

<<<<<<< HEAD
// simple logger
=======
// simple request logger
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

<<<<<<< HEAD
app.use(
  cors({
    origin: CLIENT_ORIGIN,
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// connect DB
=======
// CORS config - allow credentials and common headers
const corsOptions = {
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
  credentials: true,
};
app.use(cors(corsOptions));
// after you define corsOptions and call app.use(cors(corsOptions))

// remove any existing app.options("/*", ...) or app.options("*", ...)
// and add this instead:
app.use((req, res, next) => {
  if (req.method === "OPTIONS") {
    res.setHeader("Access-Control-Allow-Origin", corsOptions.origin);
    res.setHeader("Access-Control-Allow-Methods", corsOptions.methods.join(","));
    res.setHeader("Access-Control-Allow-Headers", corsOptions.allowedHeaders.join(","));
    if (corsOptions.credentials) res.setHeader("Access-Control-Allow-Credentials", "true");
    return res.sendStatus(200);
  }
  next();
});

// connect db
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f
connectDB().catch((err) => {
  console.error("DB connect error:", err);
  process.exit(1);
});

<<<<<<< HEAD
// Routes
=======
// mount routers
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
<<<<<<< HEAD
app.use("/api/tests", testRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/faculty", facultyRoutes);

// static uploads
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));
=======

// mount attemptsRouter BEFORE testRoutes
app.use("/api", attemptsRouter);

// tests router
app.use("/api/tests", testRoutes);
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f

app.get("/", (req, res) => {
  res.send("Online Examination System API is running...");
});

// 404 for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

// create HTTP server and socket.io AFTER routes are registered
const server = http.createServer(app);

<<<<<<< HEAD
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
=======
const io = new IOServer(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"], credentials: true }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinTest", (testId) => {
    if (!testId) return;
    socket.join(`test:${testId}`);
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f
  });

  socket.on("joinAudience", (aud) => {
    if (!aud) return;
    const tokens = String(aud).split(",").map((t) => t.trim()).filter(Boolean);
    tokens.forEach((t) => socket.join(`audience:${t}`));
  });

  socket.on("disconnect", (reason) => {
    console.log("Socket disconnected:", socket.id, reason);
  });
});

app.set("io", io);

<<<<<<< HEAD
// start server
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
=======
const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);

  cron.schedule("*/1 * * * *", async () => {
    try {
      await updateTestStatuses(io, { emitWindowMinutes: 5 });
    } catch (err) {
      console.error("Cron status updater error:", err);
    }
    console.log("⏰ Status updater cron scheduled to run every minute.");
  });
>>>>>>> aceca0977cc0dcd81601cf7639a24b6d65cf6d9f
});

export default app;
