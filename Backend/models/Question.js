//---------------------------------------------------
// import mongoose from "mongoose";

// const optionSchema = new mongoose.Schema({
//   text: { type: String, required: true },
// });

// const questionSchema = new mongoose.Schema(
//   {
//     questionText: { type: String, required: true },
//     options: {
//       type: [optionSchema],
//       validate: [(arr) => arr.length >= 2, "At least 2 options required"],
//     },
//     correctAnswerIndex: { type: Number, required: true, min: 0 },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Question", questionSchema);

// -----------------------------------
// import mongoose from "mongoose";

// const optionSchema = new mongoose.Schema({
//   text: { type: String, required: true },
// });

// const questionSchema = new mongoose.Schema(
//   {
//     questionText: { type: String, required: true },
//     options: { type: [optionSchema], default: [] },
//     correctAnswerIndex: { type: Number, default: 0 },
//     batchId: { type: String, index: true },
//     uploadedBy: {
//       type: mongoose.Schema.Types.ObjectId,
//       ref: "User",
//       default: null,
//     },
//     uploadedByEmail: { type: String, default: null },
//     uploadedByName: { type: String, default: null },
//   },
//   { timestamps: true }
// );

// export default mongoose.model("Question", questionSchema);

// -----------------------------------
// ---------------------------------------
import mongoose from "mongoose";


const questionSchema = new mongoose.Schema(
  {
    questionText: { type: String, required: true, trim: true },
    options: [{ type: String, required: true }], // <- array of strings
    correctAnswerIndex: { type: Number, default: 0 },
    batchId: { type: String, index: true },
    uploadedByEmail: { type: String, default: null },
    uploadedByName: { type: String, default: null },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      default: null,
    },
  },
  { timestamps: true }
);

export default mongoose.model("Question", questionSchema);
