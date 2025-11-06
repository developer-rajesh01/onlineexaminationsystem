// import Question from "../models/Question.js";

// // ✅ Add Question to an Exam
// export const addQuestion = async (req, res) => {
//   try {
//     const { exam, questionText, options, correctAnswer } = req.body;

//     const question = await Question.create({
//       exam,
//       questionText,
//       options,
//       correctAnswer,
//     });

//     res.status(201).json(question);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Get Questions for a specific Exam
// export const getQuestionsByExam = async (req, res) => {
//   try {
//     const questions = await Question.find({ exam: req.params.examId });
//     res.json(questions);
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };

// // ✅ Delete Question
// export const deleteQuestion = async (req, res) => {
//   try {
//     const question = await Question.findById(req.params.id);
//     if (!question)
//       return res.status(404).json({ message: "Question not found" });

//     await question.deleteOne();
//     res.json({ message: "Question deleted successfully" });
//   } catch (error) {
//     res.status(500).json({ message: error.message });
//   }
// };


import Question from "../models/Question.js";

export const bulkAddQuestions = async (req, res) => {
  try {
    console.log("bulkAddQuestions - headers:", req.headers);
    console.log("bulkAddQuestions - body:", JSON.stringify(req.body).slice(0, 2000));

    if (!req.body || !Array.isArray(req.body.questions) || req.body.questions.length === 0) {
      return res.status(400).json({ message: "No questions provided in body" });
    }

    const formatted = req.body.questions.map(q => ({
      questionText: q.questionText || "",
      options: (q.options || []).slice(0, 4).map(opt => ({ text: String(opt || "") })),
      correctAnswerIndex: Number.isFinite(q.correctAnswerIndex) ? q.correctAnswerIndex : 0,
    }));

    const saved = await Question.insertMany(formatted);
    return res.status(201).json({ message: `${saved.length} questions saved`, data: saved });
  } catch (err) {
    console.error("bulkAddQuestions error:", err);
    return res.status(500).json({ message: "Server error", error: err.message });
  }
};

export const getAllQuestions = async (req, res) => {
  try {
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};
