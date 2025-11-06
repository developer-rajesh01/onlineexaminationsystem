import dotenv from "dotenv";
dotenv.config();

import http from "http";
import express from "express";
import cors from "cors";
import connectDB from "./config/DB.js";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

const app = express();

// ======= Middleware =======
// request logger (dev)
app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

// body parser
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

// CORS - allow React dev server
app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

// ======= Connect DB =======
connectDB().catch((err) => {
  console.error("DB connect error:", err);
  process.exit(1);
});

// ======= Routes =======
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);

// root/test route
app.get("/", (req, res) => {
  res.send("✅ Online Examination System API is running...");
});

// ======= 404 handler (at the end) =======
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

// ======= Error handler =======
app.use(errorHandler);

// Create HTTP server and print registered routes (dev helper)
const server = http.createServer(app);

// Debug: list registered route paths (dev)
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

// ✅ Start server (use server.listen so socket/http wrapper works if needed)
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
