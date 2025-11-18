// import express from "express";
// import protect from "../middlewares/authMiddleware.js";
// import Test from "../models/Test.js";
// import Result from "../models/Result.js";

// const router = express.Router();

// // GET scoreboard for logged-in faculty
// router.get("/scoreboard", protect, async (req, res) => {
//   try {
//     const facultyEmail = req.user.email;

//     // Get tests created by this faculty
//     const tests = await Test.find({ facultyEmail });

//     const summary = await Promise.all(
//       tests.map(async (test) => {
//         const results = await Result.find({ testId: test._id });

//         const totalAttempts = results.length;

//         const avgScore =
//           totalAttempts > 0
//             ? results.reduce((sum, r) => sum + r.obtainedMarks, 0) /
//               totalAttempts
//             : 0;

//         const highest =
//           totalAttempts > 0
//             ? Math.max(...results.map((r) => r.obtainedMarks))
//             : 0;

//         const lowest =
//           totalAttempts > 0
//             ? Math.min(...results.map((r) => r.obtainedMarks))
//             : 0;

//         return {
//           testTitle: test.title,
//           totalAttempts,
//           avgScore: avgScore.toFixed(2),
//           highest,
//           lowest,
//           status: test.status,
//         };
//       })
//     );

//     res.json({
//       faculty: req.user.name,
//       email: req.user.email,
//       scoreboard: summary,
//     });
//   } catch (err) {
//     console.error("Scoreboard Error:", err);
//     res.status(500).json({ message: "Server error" });
//   }
// });

// export default router;

// -----------------------------------
// routes/facultyRoutes.js
import express from "express";
import protect from "../middlewares/authMiddleware.js";
import {
  getFacultySummary,
  getTopStudents,
  exportScoreboard,
} from "../controllers/facultyController.js";

const router = express.Router();

router.get("/scoreboard/summary", protect, getFacultySummary);
router.get("/scoreboard/top", protect, getTopStudents);
router.get("/scoreboard/export", protect, exportScoreboard);

export default router;
