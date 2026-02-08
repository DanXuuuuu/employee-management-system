const Document = require("../models/Document");

const ALLOWED_TYPES = [
  "OPT Receipt",
  "OPT EAD",
  "I-983",
  "I-20",
  "Driver License",
  "Work Authorization",
];

/**
 * GET /api/documents
 */
exports.getMyDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;

    const docs = await Document.find({ owner: userId }).sort({ createdAt: -1 });

    res.json({
      ok: true,
      data: docs.map((d) => d.toObject()),
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/documents
 * multipart/form-data:
 * - type: string
 * - file: file
 *
 * Notes:
 * - 首次上传某个 type（如果你加了 owner+type unique index，这里可以改成 upsert）
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type } = req.body;

    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({
        ok: false,
        message: "Invalid document type.",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "File is required.",
      });
    }

    // 如果你已经加了 owner+type unique index：
    // - 建议这里禁止重复创建（让用户用 PUT 走 reupload）
    const existing = await Document.findOne({ owner: userId, type });
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "This document type already exists. Use reupload endpoint if rejected.",
      });
    }

    const fileUrl = `/uploads/${req.file.filename}`;

    const doc = await Document.create({
      owner: userId,
      type,
      fileUrl,
      fileKey: req.file.filename, // 本地就用文件名当 key
      fileName: req.file.originalname, // 你需要在 Document schema 里加 fileName
      status: "Pending",
      feedback: "",
    });

    return res.status(201).json({
      ok: true,
      data: doc.toObject(),
      message: "Uploaded. Status is Pending.",
    });
  } catch (err) {
    next(err);
  }
};

/**
 * PUT /api/documents/:id
 * - 只允许：自己的文档 + 状态是 Rejected
 * - 行为：替换 fileUrl/fileKey/fileName，status -> Pending，feedback 清空
 */
exports.reuploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({
        ok: false,
        message: "File is required.",
      });
    }

    const doc = await Document.findOne({ _id: id, owner: userId });
    if (!doc) {
      return res.status(404).json({ ok: false, message: "Document not found." });
    }

    if (doc.status !== "Rejected") {
      return res.status(409).json({
        ok: false,
        message: "Only rejected documents can be re-uploaded.",
      });
    }

    doc.fileUrl = `/uploads/${req.file.filename}`;
    doc.fileKey = req.file.filename;
    doc.fileName = req.file.originalname;
    doc.status = "Pending";
    doc.feedback = "";

    await doc.save();

    return res.json({
      ok: true,
      data: doc.toObject(),
      message: "Re-uploaded. Status reset to Pending.",
    });
  } catch (err) {
    next(err);
  }
};