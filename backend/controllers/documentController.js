const Document = require('../models/Document');

/**
 * GET /api/documents
 */
exports.getMyDocuments = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const docs = await Document.find({ owner: userId }).sort({ createdAt: -1 });

    // 修改：使用 ok 对齐前端 Slice
    res.json({
      ok: true,
      data: docs
    });
  } catch (err) {
    next(err);
  }
};

/**
 * POST /api/documents
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type } = req.body;

    // 校验参数：使用 ok
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ ok: false, message: "Invalid document type." });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "File is required." });
    }

    const existing = await Document.findOne({ owner: userId, type });
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "This document already exists."
      });
    }

    const isAutoApprove = type === "Driver License"; 
    const initialStatus = isAutoApprove ? "Approved" : "Pending";

    const fileUrl = `/uploads/${req.file.filename}`;
    const doc = await Document.create({
      owner: userId,
      type,
      fileUrl,
      fileKey: req.file.filename,
      fileName: req.file.originalname,
      status: initialStatus,
      feedback: "",
    });

    await Employee.findOneAndUpdate(
      { user: userId },
      { $addToSet: { documents: doc._id } },
      { upsert: true }
    );

    return res.status(201).json({
      ok: true,
      data: doc,
      message: isAutoApprove ? "Document auto-approved." : "Document uploaded, status is Pending."
    });
  } catch (err) {
    next(err);
  }
};
/**
 * PUT /api/documents/:id
 * 重新上传被 HR 拒绝的文档
 */
exports.reuploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { id } = req.params;

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "New file is required." });
    }

    // 1. 查找旧文档并验证所有权
    const doc = await Document.findOne({ _id: id, owner: userId });
    if (!doc) {
      return res.status(404).json({ ok: false, message: "Document not found." });
    }

    // 2. 状态校验：只有 Rejected 状态允许重传
    if (doc.status !== "Rejected") {
      return res.status(409).json({
        ok: false,
        message: "Only rejected documents can be re-uploaded."
      });
    }

    // 3. 物理删除旧文件 (可选，防止服务器确存堆积)
    if (doc.fileKey) {
      const oldPath = path.join(__dirname, '../uploads', doc.fileKey);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // 4. 更新文档信息并重置状态为 Pending
    doc.fileUrl = `/uploads/${req.file.filename}`;
    doc.fileKey = req.file.filename;
    doc.fileName = req.file.originalname;
    doc.status = "Pending"; 
    doc.feedback = ""; 

    await doc.save();

    // 5. 返回 ok 结构对齐前端 Slice
    return res.json({
      ok: true,
      data: doc,
      message: "Document re-uploaded. Status reset to Pending."
    });
  } catch (err) {
    next(err);
  }
};
