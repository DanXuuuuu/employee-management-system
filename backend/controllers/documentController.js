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
      ok: true,
      data: docs.map((d) => d.toObject()) //doc 
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
 */
exports.uploadDocument = async (req, res, next) => {
  try {
    const userId = req.user._id;
    const { type } = req.body;

    // 验证文件 type
    if (!type || !ALLOWED_TYPES.includes(type)) {
      return res.status(400).json({ ok: false, message: "Invalid document type." });
    }

    if (!req.file) {
      return res.status(400).json({ ok: false, message: "File is required." });
    }

    // 检查是否已存在同类型文档（防止重复 POST，重复应走 PUT）
    const existing = await Document.findOne({ owner: userId, type });
    if (existing) {
      return res.status(409).json({
        ok: false,
        message: "This document already exists."
      });
    }


    const doc = await Document.create({
      owner: userId,
      type,
      fileUrl: `/uploads/${req.file.filename}`,
      fileKey: req.file.filename,
      fileName: req.file.originalname,
      status: "Pending",
      feedback: "",
    });

    // 同步关联到 Employee 模型，确保 HR 可见
    await Employee.findOneAndUpdate(
      { user: userId },
      { $addToSet: { documents: doc._id } },
      { upsert: true } // 如果 Employee 记录尚未创建则自动创建
    );

    return res.status(201).json({
      ok: true,
      data: doc.toObject(),
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
      return res.status(400).json({ ok: false, message: "New file is required." });
    }

    const doc = await Document.findOne({ _id: id, owner: userId });

    if (!doc) {
      return res.status(404).json({ ok: false, message: "Document not found." });
    }

    // 状态校验：只有 Rejected 的文档允许重新上传
    if (doc.status !== "Rejected") {
      return res.status(409).json({
        ok: false,
        message: "Only rejected documents can be re-uploaded."
      });
    }


    //  更新数据库记录并重置状态
    doc.fileUrl = `/uploads/${req.file.filename}`;
    doc.fileKey = req.file.filename;
    doc.fileName = req.file.originalname;
    doc.status = "Pending"; // 重置为 Pending 等待重新审核
    doc.feedback = ""; // 清空之前的拒绝反馈

    await doc.save();

    return res.json({
      ok: true,
      data: doc.toObject(),
      message: "Document re-uploaded. Status has been reset to Pending."
    });
  } catch (err) {
    next(err);
  }
};
