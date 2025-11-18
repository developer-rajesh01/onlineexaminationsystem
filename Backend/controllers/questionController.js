// controllers/questionController.js
// import Question from "../models/Question.js";
// import mongoose from "mongoose";

// function normalizeOptions(options) {
//   // Ensure we always return an array of strings
//   if (!options && options !== 0) return [];
//   if (Array.isArray(options)) {
//     return options.map((o) => (o === null || o === undefined ? "" : String(o).trim()));
//   }
//   // If it's a string like "A, B, C" or "A" -> split by comma if comma present, else single element array
//   const s = String(options);
//   if (s.includes(",")) {
//     return s
//       .split(",")
//       .map((x) => x.trim())
//       .filter(Boolean);
//   }
//   return [s.trim()].filter(Boolean);
// }

// export const bulkAddQuestions = async (req, res, next) => {
//   try {
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

//     // server-side batchId if not provided
//     const batchId =
//       req.body?.batchId ||
//       `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

//     // Normalize and map
//     const docs = incoming.map((q) => {
//       const opts = normalizeOptions(q.options);
//       return {
//         questionText: q.questionText ? String(q.questionText).trim() : "",
//         options: opts,
//         correctAnswerIndex:
//           typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
//         batchId,
//         uploadedByEmail: uploaderEmail,
//         uploadedByName: uploaderName,
//         uploadedBy: uploaderId ? mongoose.Types.ObjectId(uploaderId) : null,
//       };
//     });

//     // Optional: basic validation server-side
//     const invalid = docs.findIndex((d) => !d.questionText || d.options.length < 2);
//     if (invalid !== -1) {
//       return res
//         .status(400)
//         .json({ message: `Invalid question at index ${invalid}: need text and ≥2 options` });
//     }

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
//getAllQuestions remains unchanged


// controllers/questionController.js
import Question from "../models/Question.js";
import mongoose from "mongoose";

export const bulkAddQuestions = async (req, res, next) => {
  try {
    console.log("bulkAddQuestions body:", JSON.stringify(req.body, null, 2));
    console.log("bulkAddQuestions user:", req.user && { id: req.user._id, email: req.user?.email, name: req.user?.name });

    const incoming = req.body?.questions;
    if (!incoming || !Array.isArray(incoming) || incoming.length === 0) {
      return res.status(400).json({ message: "No questions provided" });
    }

    // get uploader info (prefer authenticated user)
    const uploaderEmail = req.user?.email || req.body?.uploaderEmail || null;
    const uploaderName = req.user?.name || req.body?.uploaderName || null;

    // Safely determine uploaderId:
    let uploaderId = null;
    if (req.user?._id) {
      // If req.user is a mongoose doc, this _id is already an ObjectId
      uploaderId = req.user._id;
    } else if (req.body?.uploaderId) {
      // If client passed a string id, validate then construct with `new`
      const maybe = req.body.uploaderId;
      if (mongoose.Types.ObjectId.isValid(maybe)) {
        uploaderId = new mongoose.Types.ObjectId(maybe); // === USE `new` HERE
      } else {
        uploaderId = null;
      }
    }

    // use provided batchId or make a server-side one
    const batchId =
      req.body?.batchId ||
      `batch-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    // Build docs ensuring options is an array (avoid invalid casts)
    const docs = incoming.map((q, idx) => {
      const opts = Array.isArray(q.options)
        ? q.options
        : // if it's a comma-separated string, you might want to split it:
          (typeof q.options === "string" ? q.options.split(",").map(s => s.trim()).filter(Boolean) : []);

      return {
        questionText: q.questionText || "",
        options: opts,
        correctAnswerIndex: typeof q.correctAnswerIndex === "number" ? q.correctAnswerIndex : 0,
        batchId,
        uploadedByEmail: uploaderEmail,
        uploadedByName: uploaderName,
        uploadedBy: uploaderId || null,
      };
    });

    // Insert many
    const created = await Question.insertMany(docs);

    return res.status(201).json({
      message: "Questions saved",
      batchId,
      count: created.length,
      createdIds: created.map((d) => d._id),
    });
  } catch (err) {
    // If the ObjectId error still appears we'll get full stack here
    console.error("bulkAddQuestions error:", err && (err.stack || err.message || err));
    // Surface message to client (for dev). In production don't leak stack.
    return res.status(500).json({ message: err.message || "Server error" });
  }
};



export const getAllQuestions = async (req, res) => {
  try { 
    const questions = await Question.find();
    res.json(questions);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};