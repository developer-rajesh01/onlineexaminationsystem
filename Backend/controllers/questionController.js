// import Question from "../models/Question.js";

// export const bulkAddQuestions = async (req, res) => {
//   try {
//     console.log("bulkAddQuestions - headers:", req.headers);
//     console.log("bulkAddQuestions - body:", JSON.stringify(req.body).slice(0, 2000));

//     if (!req.body || !Array.isArray(req.body.questions) || req.body.questions.length === 0) {
//       return res.status(400).json({ message: "No questions provided in body" });
//     }

//     const formatted = req.body.questions.map(q => ({
//       questionText: q.questionText || "",
//       options: (q.options || []).slice(0, 4).map(opt => ({ text: String(opt || "") })),
//       correctAnswerIndex: Number.isFinite(q.correctAnswerIndex) ? q.correctAnswerIndex : 0,
//     }));

//     const saved = await Question.insertMany(formatted);
//     return res.status(201).json({ message: `${saved.length} questions saved`, data: saved });
//   } catch (err) {
//     console.error("bulkAddQuestions error:", err);
//     return res.status(500).json({ message: "Server error", error: err.message });
//   }
// };

// export const getAllQuestions = async (req, res) => {
//   try {
//     const questions = await Question.find();
//     res.json(questions);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// -----------------------------------


// // controllers/questionController.js
// import Question from "../models/Question.js"; // adjust path
// import mongoose from "mongoose";

// export const bulkAddQuestions = async (req, res, next) => {
//   try {
//     // debug logs (temporary)
//     console.log("bulkAddQuestions body:", req.body);
//     console.log("bulkAddQuestions user:", req.user);

//     const incoming = req.body?.questions;
//     if (!incoming || !Array.isArray(incoming) || incoming.length === 0) {
//       return res.status(400).json({ message: "No questions provided" });
//     }

//     // Prefer authenticated user (req.user) if present
//     const uploaderEmail = req.user?.email || req.body?.uploaderEmail || null;
//     const uploaderName = req.user?.name || req.body?.uploaderName || null;
//     const uploaderId = req.user?._id || null;

//     // Use provided batchId or create one server-side
//     const batchId =
//       req.body?.batchId ||
//       `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

//     // Map incoming questions -> DB shape (add metadata)
//     const docs = incoming.map((q) => {
//       // sanitize/normalize q.options etc as you like
//       return {
//         questionText: q.questionText || "",
//         options: q.options || [],
//         correctAnswerIndex:
//           typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
//         batchId,
//         uploadedByEmail: uploaderEmail,
//         uploadedByName: uploaderName,
//         uploadedBy: uploaderId ? mongoose.Types.ObjectId(uploaderId) : null,
//       };
//     });

//     // Save all at once
//     const created = await Question.insertMany(docs);

//     return res.status(201).json({
//       message: "Questions saved",
//       batchId,
//       count: created.length,
//       createdIds: created.map((d) => d._id),
//     });
//   } catch (err) {
//     console.error("bulkAddQuestions error:", err);
//     next(err);
//   }
// };



// //getAllQuestions remains unchanged
// export const getAllQuestions = async (req, res) => {
//   try {
//     const questions = await Question.find();
//     res.json(questions);
//   } catch (err) {
//     res.status(500).json({ message: err.message });
//   }
// };

// -------------------------------------------
// controllers/questionController.js
import Question from "../models/Question.js";
import mongoose from "mongoose";

function normalizeOptions(options) {
  // Ensure we always return an array of strings
  if (!options && options !== 0) return [];
  if (Array.isArray(options)) {
    return options.map((o) => (o === null || o === undefined ? "" : String(o).trim()));
  }
  // If it's a string like "A, B, C" or "A" -> split by comma if comma present, else single element array
  const s = String(options);
  if (s.includes(",")) {
    return s
      .split(",")
      .map((x) => x.trim())
      .filter(Boolean);
  }
  return [s.trim()].filter(Boolean);
}

export const bulkAddQuestions = async (req, res, next) => {
  try {
    console.log("bulkAddQuestions body:", req.body);
    console.log("bulkAddQuestions user:", req.user);

    const incoming = req.body?.questions;
    if (!incoming || !Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ message: "No questions provided" });
    }

    // Prefer authenticated user (req.user) if present
    const uploaderEmail = req.user?.email || req.body?.uploaderEmail || null;
    const uploaderName = req.user?.name || req.body?.uploaderName || null;
    const uploaderId = req.user?._id || null;

    // server-side batchId if not provided
    const batchId =
      req.body?.batchId ||
      `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Normalize and map
    const docs = incoming.map((q) => {
      const opts = normalizeOptions(q.options);
      return {
        questionText: q.questionText ? String(q.questionText).trim() : "",
        options: opts,
        correctAnswerIndex:
          typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
        batchId,
        uploadedByEmail: uploaderEmail,
        uploadedByName: uploaderName,
        uploadedBy: uploaderId ? mongoose.Types.ObjectId(uploaderId) : null,
      };
    });

    // Optional: basic validation server-side
    const invalid = docs.findIndex((d) => !d.questionText || d.options.length < 2);
    if (invalid !== -1) {
      return res
        .status(400)
        .json({ message: `Invalid question at index ${invalid}: need text and ≥2 options` });
    }

    const created = await Question.insertMany(docs);

    return res.status(201).json({
      message: "Questions saved",
      batchId,
      count: created.length,
      createdIds: created.map((d) => d._id),
    });
  } catch (err) {
    console.error("bulkAddQuestions error:", err);
    next(err);
  }
};
//getAllQuestions remains unchanged
export const getAllQuestions = async (req, res) => {
  try { 
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};