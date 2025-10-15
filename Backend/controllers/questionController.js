import Question from "../models/Question.js";

// ✅ Add Question to an Exam
export const addQuestion = async (req, res) => {
  try {
    const { exam, questionText, options, correctAnswer } = req.body;

    const question = await Question.create({
      exam,
      questionText,
      options,
      correctAnswer,
    });

    res.status(201).json(question);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get Questions for a specific Exam
export const getQuestionsByExam = async (req, res) => {
  try {
    const questions = await Question.find({ exam: req.params.examId });
    res.json(questions);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Delete Question
export const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);
    if (!question)
      return res.status(404).json({ message: "Question not found" });

    await question.deleteOne();
    res.json({ message: "Question deleted successfully" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
