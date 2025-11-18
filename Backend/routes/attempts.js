// routes/attempts.js
import express from "express";
import Test from "../models/Test.js";
import Attempt from "../models/Attempt.js";

const router = express.Router();

// Create attempt for a test
router.post("/tests/:id/attempt", async (req, res) => {
    try {
        const testId = req.params.id;
        const { studentEmail } = req.body;
        if (!studentEmail) return res.status(400).json({ message: "studentEmail required" });

        // check existing attempts for this student & test
        const existing = await Attempt.findOne({ testId, studentEmail }).sort({ createdAt: -1 }).lean();
        if (existing && (existing.status === "submitted" || existing.status === "forfeited" || existing.blocked)) {
            return res.status(403).json({ message: "You have already attempted this test or are blocked from reattempting." });
        }

        // fetch test
        const test = await Test.findById(testId).lean();
        if (!test) return res.status(404).json({ message: "Test not found" });

        // create answers skeleton: qIndex for each question
        const answers = (test.questions || []).map((q, idx) => ({ qIndex: idx }));

        const attempt = new Attempt({
            testId,
            studentEmail,
            answers,
            durationMinutes: test.duration,
            totalMarks: Number(test.totalMarks || 0),
            status: "in-progress",
        });

        const saved = await attempt.save();

        res.status(201).json({ attemptId: saved._id, startedAt: saved.startedAt });
    } catch (err) {
        console.error("Create attempt error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Increment exit count (called when user exits fullscreen or page blur)
router.put("/attempts/:id/inc-exit", async (req, res) => {
    try {
        const attemptId = req.params.id;
        const attempt = await Attempt.findById(attemptId);
        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.status !== "in-progress") return res.status(400).json({ message: "Attempt not in progress" });

        attempt.exitCount = (attempt.exitCount || 0) + 1;
        // if exitCount >= 3 -> forfeited + blocked
        if (attempt.exitCount >= 3) {
            attempt.status = "forfeited";
            attempt.blocked = true;
            attempt.submittedAt = new Date();
        }

        await attempt.save();
        return res.json({ exitCount: attempt.exitCount, status: attempt.status, blocked: attempt.blocked });
    } catch (err) {
        console.error("inc-exit error:", err);
        res.status(500).json({ message: err.message });
    }
});
// PUT /api/attempts/:id/save
router.put("/attempts/:id/save", async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id);
        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.status !== "in-progress") return res.status(400).json({ message: "Not in progress" });

        const { answers } = req.body; // array of {qIndex, selectedIdx}
        if (Array.isArray(answers)) {
            for (const ans of answers) {
                const slot = attempt.answers.find((a) => a.qIndex === ans.qIndex);
                if (slot) {
                    slot.selectedIdx = typeof ans.selectedIdx === "number" ? ans.selectedIdx : slot.selectedIdx;
                    slot.submittedAt = new Date();
                }
            }
            await attempt.save();
        }
        res.json({ ok: true });
    } catch (err) {
        console.error("save attempt error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Submit attempt (body: { answers: [{ qIndex, selectedIdx }], forfeit: boolean optional })
router.put("/attempts/:id/submit", async (req, res) => {
    try {
        const attemptId = req.params.id;
        const { answers: clientAnswers, forfeit } = req.body;

        const attempt = await Attempt.findById(attemptId);
        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        if (attempt.status !== "in-progress") {
            return res.status(400).json({ message: "Attempt not in progress" });
        }

        const test = await Test.findById(attempt.testId).lean();
        if (!test) return res.status(404).json({ message: "Test not found" });

        // if forfeit (due to exitCount limit), mark and save
        if (forfeit) {
            attempt.status = "forfeited";
            attempt.blocked = true;
            attempt.submittedAt = new Date();
            await attempt.save();
            return res.json({ message: "Attempt forfeited", status: attempt.status });
        }

        // Merge client answers into attempt.answers
        if (Array.isArray(clientAnswers)) {
            for (const ans of clientAnswers) {
                const { qIndex, selectedIdx } = ans;
                const slot = attempt.answers.find((a) => a.qIndex === qIndex);
                if (slot) {
                    slot.selectedIdx = typeof selectedIdx === "number" ? selectedIdx : slot.selectedIdx;
                    slot.submittedAt = new Date();
                }
            }
        }

        // Grade: compute score based on correctIdx in test.questions
        let score = 0;
        const questions = test.questions || [];
        for (let i = 0; i < questions.length; i++) {
            const q = questions[i];
            const a = attempt.answers.find((x) => x.qIndex === i);
            if (a && typeof a.selectedIdx === "number" && typeof q.correctIdx === "number") {
                if (Number(a.selectedIdx) === Number(q.correctIdx)) {
                    // assume equal weight: marks per question = totalMarks / totalQuestions
                    // round to 2 decimals
                    const marksPerQ = (Number(test.totalMarks) || 0) / Math.max(1, questions.length);
                    score += marksPerQ;
                }
            }
        }
        // round score to 2 decimal places
        score = Math.round(score * 100) / 100;

        attempt.score = score;
        attempt.status = "submitted";
        attempt.submittedAt = new Date();

        await attempt.save();

        return res.json({ message: "Attempt submitted", score, totalMarks: attempt.totalMarks, status: attempt.status });
    } catch (err) {
        console.error("Submit attempt error:", err);
        res.status(500).json({ message: err.message });
    }
});

// Get attempt
router.get("/attempts/:id", async (req, res) => {
    try {
        const attempt = await Attempt.findById(req.params.id).lean();
        if (!attempt) return res.status(404).json({ message: "Attempt not found" });
        res.json(attempt);
    } catch (err) {
        console.error("Get attempt error:", err);
        res.status(500).json({ message: err.message });
    }
});

export default router;
