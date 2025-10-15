import mongoose from "mongoose";

const questionSchema = new mongoose.Schema({
  exam: { 
    type: mongoose.Schema.Types.ObjectId,
    ref: "Exam" 
  },
  questionText: { 
    type: String, 
    required: true 
    },
  options: [String],
  correctAnswer: { type: String, required: true },
});

export default mongoose.model("Question", questionSchema);
