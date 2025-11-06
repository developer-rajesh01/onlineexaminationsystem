import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
    questionText: { type: String, required: true },
    options: [{ type: String, required: true }],
    correctIdx: { type: Number, required: true },
});

const testSchema = new mongoose.Schema(
    {
        title: { type: String, required: true },
        duration: { type: Number, required: true },
        startDate: { type: String, required: true },
        startTime: { type: String, required: true },
        targetAudience: { type: String, required: true },
        author: { type: String, required: true },
        passMarks: { type: Number },
        totalMarks: { type: Number, required: true },
        questions: [questionSchema],
    },
    { timestamps: true }
);

const Test = mongoose.model("Test", testSchema);

export default Test;
