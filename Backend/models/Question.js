// import mongoose from "mongoose";

// const questionSchema = new mongoose.Schema({
//   exam: { 
//     type: mongoose.Schema.Types.ObjectId,
//     ref: "Exam" 
//   },
//   questionText: { 
//     type: String, 
//     required: true 
//     },
//   options: [String],
//   correctAnswer: { type: String, required: true },
// });

// export default mongoose.model("Question", questionSchema);



import mongoose from "mongoose";

const optionSchema = new mongoose.Schema({
  text: { type: String, required: true },
});

const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true },
    options: {
      type: [optionSchema],
      validate: [(arr) => arr.length >= 2, "At least 2 options required"],
    },
    correctAnswerIndex: { type: Number, required: true, min: 0 },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
