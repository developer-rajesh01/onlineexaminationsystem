import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import connectDB from "./config/DB.js";

import authRoutes from "./routes/authRoutes.js";
import examRoutes from "./routes/examRoutes.js";
import questionRoutes from './routes/questionRoutes.js';
import resultRoutes from "./routes/resultRoutes.js";
import errorHandler from "./middlewares/errorHandler.js";
import testRoutes from './routes/testRoutes.js';

// Load environment variables
dotenv.config();

// Initialize express app
const app = express();

// Middleware to parse JSON
app.use(express.json());

// Enable CORS - update origin according to your frontend URL
app.use(
  cors({
    origin: "http://localhost:3000",
    credentials: true,
  })
);

// Connect to MongoDB
connectDB();

// Use API routes with correct '/api/tests' prefix for tests
app.use("/api/auth", authRoutes);
app.use("/api/exams", examRoutes);
app.use('/api/questions/bulk', questionRoutes);
app.use("/api/results", resultRoutes);
app.use("/api/tests", testRoutes);  // <-- Corrected here (plural "tests")

// Root route (optional)
app.get("/", (req, res) => {
  res.send("✅ Online Examination System API is running...");
});

// Error handling middleware
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
});
