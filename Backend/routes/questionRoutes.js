import express from "express";
import {
  addQuestion,
  getQuestionsByExam,
  deleteQuestion,
} from "../controllers/questionController.js";
import protect from "../middlewares/authMiddleware.js";

const router = express.Router();

router.post("/", protect, addQuestion);
router.get("/:examId", protect, getQuestionsByExam);
router.delete("/:id", protect, deleteQuestion);

export default router;
