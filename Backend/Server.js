import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/DB.js";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from "./routes/questionRoutes.js";
import resultRoutes from "./routes/resultRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// ✅ Middleware
app.use(express.json());

// ✅ Enable CORS (Allow frontend to connect to backend)
app.use(
  cors({
    origin: "http://localhost:3000", // React frontend URL
    credentials: true,
  })
);

// ✅ Connect MongoDB
connectDB();

// ✅ API Routes
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use("/api/questions", questionRoutes);
app.use("/api/results", resultRoutes);

// ✅ Root route (optional for testing)
app.get("/", (req, res) => {
  res.send("✅ Online Examination System API is running...");
});

// ✅ Error handling middleware
app.use(errorHandler);

// ✅ Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
