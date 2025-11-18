import Result from "../models/Result.js";
import Test from "../models/Test.js";

// ✅ Save Exam Result
export const saveResult = async (req, res) => {
  try {
    const { exam, score } = req.body;
    const result = await Result.create({
      user: req.user._id,
      exam,
      score,
    });

    res.status(201).json(result);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Results of a User
export const getUserResults = async (req, res) => {
  try {
    const results = await Result.find({ user: req.user._id }).populate(
      "exam",
      "title subject"
    );
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ✅ Get All Results (Admin)
export const getAllResults = async (req, res) => {
  try {
    const results = await Result.find()
      .populate("user", "name email")
      .populate("exam", "title");
    res.json(results);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// POST /api/results/submit
export const submitResult = async (req, res, next) => {
  try {
    const { testId, studentId, studentName, studentEmail, score } = req.body;
    // upsert result (example)
    let result = await Result.findOneAndUpdate(
      { testId, studentId },
      { score, studentName, studentEmail, updatedAt: Date.now() },
      { upsert: true, new: true }
    );

    // Compute aggregated leaderboard row for this student (avg/max/attempts etc.)
    // Simplest: return the latest score as student's score
    const leaderboardRow = {
      studentId,
      studentName,
      studentEmail,
      score: result.score,
      attempts: result.attempts || 1,
      testId,
    };

    // emit via socket (app.get('io') earlier)
    const io = req.app.get("io");
    if (io) {
      // emit to room for this test
      io.to(`test:${testId}`).emit("score:update", leaderboardRow);

      // optionally emit a global refresh (admins)
      // io.emit("score:refresh", { rows: await buildFullLeaderboard(testId) });
    }

    return res.status(200).json({ message: "Result saved", result, leaderboardRow });
  } catch (err) {
    next(err);
  }
};