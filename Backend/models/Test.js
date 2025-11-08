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
        institute: { type: String, required: true },
        questions: [questionSchema],
        facultyEmail: { type: String, required: true },
        status: { type: String, enum: ['Active', 'Completed'], default: 'Active' } // Add status field here
    },
    {
        timestamps: true,
    }
);


const Test = mongoose.model("Test", testSchema);

export default Test;
