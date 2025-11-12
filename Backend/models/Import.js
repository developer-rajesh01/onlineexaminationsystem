const importSchema = new mongoose.Schema(
  {
    batchId: { type: String, index: true },
    uploaderEmail: String,
    filename: String,
    originalName: String,
    filePath: String,
    size: Number,
  },
  { timestamps: true }
);

export default mongoose.model("Import", importSchema);
