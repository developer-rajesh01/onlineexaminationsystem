import express from "express";
import multer from "multer";
import path from "path";
import { fileURLToPath } from "url";

const router = express.Router();

// resolve uploads directory relative to project root
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.join(__dirname, "..", "..", "uploads");

// ensure uploadDir exists (simple runtime check)
import fs from "fs";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Multer storage config
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // unique filename: fieldname-timestamp-random.ext
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    const ext = path.extname(file.originalname);
    cb(null, `${file.fieldname}-${unique}${ext}`);
  },
});

// Optional: file size limit & fileFilter (example allows most types, you can restrict)
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit
  // fileFilter: (req, file, cb) => {
  //   // Example: allow only pdf and images
  //   if (/pdf|image|text/.test(file.mimetype)) cb(null, true);
  //   else cb(new Error("File type not allowed"), false);
  // }
});

// POST /api/uploads
router.post("/", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: "No file uploaded" });
  }

  const fileMeta = {
    filename: req.file.filename,
    originalName: req.file.originalname,
    size: req.file.size,
    mimeType: req.file.mimetype,
    path: `/uploads/${req.file.filename}`,
  };

  return res.status(201).json({
    message: "File uploaded",
    data: fileMeta,
  });
});

export default router;
