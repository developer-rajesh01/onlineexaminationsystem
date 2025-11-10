// Server.js (ESM)
import "dotenv/config"; // loads .env
import http from "http";
import express from "express";
import cors from "cors";
import connectDB from "./config/DB.js";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import testRoutes from "./routes/testRoutes.js";
import attemptsRouter from "./routes/attempts.js";

import errorHandler from "./middlewares/errorHandler.js";

import { Server as IOServer } from "socket.io";
import cron from "node-cron";
import updateTestStatuses from "./helpers/statusUpdater.js";

const app = express();

// simple request logger
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// body parsers
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

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
connectDB().catch((err) => {
  console.error("DB connect error:", err);
  process.exit(1);
});

// mount routers
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);

// mount attemptsRouter BEFORE testRoutes
app.use("/api", attemptsRouter);

// tests router
app.use("/api/tests", testRoutes);

app.get("/", (req, res) => {
  res.send("✅ Online Examination System API is running...");
});

// 404 for unmatched API routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const server = http.createServer(app);

const io = new IOServer(server, {
  cors: { origin: "http://localhost:3000", methods: ["GET", "POST"], credentials: true }
});

io.on("connection", (socket) => {
  console.log("Socket connected:", socket.id);

  socket.on("joinTest", (testId) => {
    if (!testId) return;
    socket.join(`test:${testId}`);
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
});

export default app;
