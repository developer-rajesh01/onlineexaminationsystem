// controllers/facultyController.js
import Test from "../models/Test.js";
import Result from "../models/Result.js";
import mongoose from "mongoose";

/**
 * GET /api/faculty/scoreboard/summary
 * Returns per-test summary for the logged-in faculty.
 * Query params (optional): testId, from, to  (from/to ISO dates)
 */
export const getFacultySummary = async (req, res, next) => {
  try {
    const facultyEmail = req.user?.email;
    if (!facultyEmail) return res.status(401).json({ message: "Unauthorized" });

    const { testId, from, to } = req.query;
    const testFilter = { facultyEmail };
    if (testId && mongoose.Types.ObjectId.isValid(testId))
      testFilter._id = mongoose.Types.ObjectId(testId);

    const tests = await Test.find(testFilter).lean();

    // create date filter for results if from/to provided
    const dateFilter = {};
    if (from) dateFilter.$gte = new Date(from);
    if (to) dateFilter.$lte = new Date(to);

    const summary = await Promise.all(
      tests.map(async (t) => {
        const match = { testId: t._id };
        if (from || to) match.submittedAt = dateFilter;

        const agg = await Result.aggregate([
          { $match: match },
          {
            $group: {
              _id: "$testId",
              totalAttempts: { $sum: 1 },
              avgScore: { $avg: "$obtainedMarks" },
              highest: { $max: "$obtainedMarks" },
              lowest: { $min: "$obtainedMarks" },
            },
          },
        ]);

        const stats = agg[0] || {
          totalAttempts: 0,
          avgScore: 0,
          highest: 0,
          lowest: 0,
        };

        // histogram buckets for chart (optional - simple buckets)
        const buckets = await Result.aggregate([
          { $match: match },
          {
            $bucket: {
              groupBy: "$obtainedMarks",
              boundaries: [0, 20, 40, 60, 80, 100],
              default: "100+",
              output: { count: { $sum: 1 } },
            },
          },
        ]);

        return {
          testId: t._id,
          title: t.title,
          totalAttempts: stats.totalAttempts,
          avgScore: Number((stats.avgScore || 0).toFixed(2)),
          highest: stats.highest || 0,
          lowest: stats.lowest || 0,
          status: t.status,
          histogram: buckets,
        };
      })
    );

    res.json({ faculty: req.user.name, email: facultyEmail, summary });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/faculty/scoreboard/top
 * Query params: testId (optional), limit (default 10), from, to
 * Returns top students across faculty's tests or for a single test.
 */
export const getTopStudents = async (req, res, next) => {
  try {
    const facultyEmail = req.user?.email;
    if (!facultyEmail) return res.status(401).json({ message: "Unauthorized" });

    const { testId, limit = 10, from, to } = req.query;
    // find tests by this faculty (or single test)
    const testFilter = { facultyEmail };
    if (testId && mongoose.Types.ObjectId.isValid(testId))
      testFilter._id = mongoose.Types.ObjectId(testId);
    const tests = await Test.find(testFilter).select("_id").lean();
    const testIds = tests.map((t) => t._id);

    const match = { testId: { $in: testIds } };
    if (from || to) match.submittedAt = {};
    if (from) match.submittedAt.$gte = new Date(from);
    if (to) match.submittedAt.$lte = new Date(to);

    const top = await Result.aggregate([
      { $match: match },
      {
        $group: {
          _id: "$studentId",
          studentName: { $first: "$studentName" },
          studentEmail: { $first: "$studentEmail" },
          maxScore: { $max: "$obtainedMarks" },
          avgScore: { $avg: "$obtainedMarks" },
          attempts: { $sum: 1 },
        },
      },
      { $sort: { maxScore: -1, avgScore: -1 } },
      { $limit: parseInt(limit, 10) },
    ]);

    res.json({ top });
  } catch (err) {
    next(err);
  }
};

/**
 * GET /api/faculty/scoreboard/export
 * Returns flat CSV-friendly JSON (frontend will convert to CSV).
 * Query params similar to getFacultySummary
 */
export const exportScoreboard = async (req, res, next) => {
  try {
    const facultyEmail = req.user?.email;
    if (!facultyEmail) return res.status(401).json({ message: "Unauthorized" });

    const { testId, from, to } = req.query;
    const testFilter = { facultyEmail };
    if (testId && mongoose.Types.ObjectId.isValid(testId))
      testFilter._id = mongoose.Types.ObjectId(testId);
    const tests = await Test.find(testFilter).lean();
    const testIds = tests.map((t) => t._id);

    const match = { testId: { $in: testIds } };
    if (from || to) match.submittedAt = {};
    if (from) match.submittedAt.$gte = new Date(from);
    if (to) match.submittedAt.$lte = new Date(to);

    const rows = await Result.find(match)
      .populate("testId", "title")
      .select(
        "testId studentName studentEmail obtainedMarks totalMarks submittedAt"
      )
      .lean();

    // Format rows for CSV
    const formatted = rows.map((r) => ({
      testTitle: r.testId?.title || "",
      studentName: r.studentName,
      studentEmail: r.studentEmail,
      obtainedMarks: r.obtainedMarks,
      totalMarks: r.totalMarks,
      submittedAt: r.submittedAt,
    }));

    res.json({ rows: formatted });
  } catch (err) {
    next(err);
  }
};
