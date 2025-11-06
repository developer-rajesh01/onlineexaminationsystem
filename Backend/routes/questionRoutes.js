import express from 'express';
import Question from '../models/Question.js';

const router = express.Router();

router.post('/bulk', async (req, res) => {
  try {
    const questions = req.body.questions;
    if (!Array.isArray(questions))
      return res.status(400).json({ message: 'Questions must be an array' });

    const savedQuestions = await Question.insertMany(questions);
    res.status(201).json(savedQuestions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default router;
