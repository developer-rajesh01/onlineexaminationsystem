// models/Attempt.js
import mongoose from "mongoose";

const answerSchema = new mongoose.Schema({
    qIndex: { type: Number, required: true }, // index in test.questions
    selectedIdx: { type: Number }, // optional: null if not answered
    submittedAt: { type: Date }, // optional
});

const AttemptSchema = new mongoose.Schema(
    {
        testId: { type: mongoose.Schema.Types.ObjectId, ref: "Test", required: true },
        studentEmail: { type: String, required: true, index: true },
        startedAt: { type: Date, default: Date.now },
        submittedAt: { type: Date },
        durationMinutes: { type: Number }, // snapshot of test.duration
        answers: [answerSchema],
        score: { type: Number },
        totalMarks: { type: Number },
        exitCount: { type: Number, default: 0 }, // number of fullscreen/blur exits
        status: {
            type: String,
            enum: ["in-progress", "submitted", "forfeited", "blocked"],
            default: "in-progress",
            index: true,
        },
        blocked: { type: Boolean, default: false }, // true if user blocked from reattempt
    },
    { timestamps: true }
);

export default mongoose.model("Attempt", AttemptSchema);
