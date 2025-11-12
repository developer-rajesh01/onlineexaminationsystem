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
import testRoutes from "./routes/testRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

import uploadRoutes from "./routes/uploadRoutes.js";
import path from "path";



const app = express();

app.use((req, res, next) => {
  console.log(new Date().toISOString(), req.method, req.originalUrl);
  next();
});

app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true }));

app.use(
  cors({
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "DELETE"],
    credentials: true,
  })
);

connectDB().catch((err) => {
  console.error("DB connect error:", err);
  process.exit(1);
});

//Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/tests", testRoutes); // Mounted tests router
app.use("/api/uploads", uploadRoutes);

//upload file static folder
app.use("/uploads", express.static(path.join(process.cwd(), "uploads")));

app.get("/", (req, res) => {
  res.send("✅ Online Examination System API is running...");
});

// Single 404 handler for unmatched routes
app.use((req, res) => {
  res.status(404).json({ message: `Cannot ${req.method} ${req.originalUrl}` });
});

app.use(errorHandler);

const server = http.createServer(app);

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

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});

export default app;
