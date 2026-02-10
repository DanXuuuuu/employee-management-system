const Document = require("../models/Document");
const Employee = require('../models/Employee');
const fs = require('fs');
const path = require('path');

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
      success: true,
      data: docs
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

    // 1. 校验参数
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ success: false, message: "Invalid document type." });
    }

    if (!req.file) {
      return res.status(400).json({ success: false, message: "File is required." });
    }

    // 2. 检查是否已存在同类型文档（防止重复 POST，重复应走 PUT）
    const existing = await Document.findOne({ owner: userId, type });
    if (existing) {
      return res.status(409).json({
        success: false,
        message: "This document already exists. Please use the re-upload endpoint if it was rejected."
      });
    }
    const isAutoApprove = type === "Driver License"; 
    const initialStatus = isAutoApprove ? "Approved" : "Pending";

    // 3. 创建数据库记录
    const fileUrl = `/uploads/${req.file.filename}`;
    const doc = await Document.create({
      owner: userId,
      type,
      fileUrl,
      fileKey: req.file.filename,
      fileName: req.file.originalname,
      status: initialStatus, // 初始状态均为 Pending
      feedback: "",
    });

    // 4. 重要：同步关联到 Employee 模型，确保 HR 可见
    await Employee.findOneAndUpdate(
      { user: userId },
      { $addToSet: { documents: doc._id } },
      { upsert: true } // 如果 Employee 记录尚未创建则自动创建
    );

    return res.status(201).json({
      success: true,
      data: doc,
      message: "Document uploaded successfully. Status is now Pending."
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
      return res.status(400).json({ success: false, message: "New file is required." });
    }

    // 1. 查找旧文档记录并验证所有权
    const doc = await Document.findOne({ _id: id, owner: userId });
    if (!doc) {
      return res.status(404).json({ success: false, message: "Document not found." });
    }

    // 2. 状态校验：只有 Rejected 的文档允许重新上传
    if (doc.status !== "Rejected") {
      return res.status(409).json({
        success: false,
        message: "Only rejected documents can be re-uploaded."
      });
    }

    // 3. 物理删除服务器上的旧文件（可选优化）
    if (doc.fileKey) {
      const oldPath = path.join(__dirname, '../uploads', doc.fileKey);
      if (fs.existsSync(oldPath)) {
        fs.unlinkSync(oldPath);
      }
    }

    // 4. 更新数据库记录并重置状态
    doc.fileUrl = `/uploads/${req.file.filename}`;
    doc.fileKey = req.file.filename;
    doc.fileName = req.file.originalname;
    doc.status = "Pending"; // 重置为 Pending 等待重新审核
    doc.feedback = ""; // 清空之前的拒绝反馈

    await doc.save();

    return res.json({
      success: true,
      data: doc,
      message: "Document re-uploaded. Status has been reset to Pending."
    });
  } catch (err) {
    next(err);
  }
};
