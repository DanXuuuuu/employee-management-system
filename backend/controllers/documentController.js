const Document = require("../models/Document");
const Employee = require('../models/Employee');
const upload = require('../uploads/upload');
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

/**
 * GET /api/documents/download/:id
 */
// employee could download docs, hr also do

exports.downloadDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. 查找文档
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found." 
      });
    }

    // 2. 权限检查
    const isOwner = doc.owner.toString() === userId.toString();
    const isHR = userRole === 'HR';

    if (!isOwner && !isHR) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to access this document." 
      });
    }

    // 3. 构建文件路径
    const filePath = path.join(__dirname, '../uploads', doc.fileKey);

    // 4. 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found on server." 
      });
    }

    // 5. 发送文件
    res.download(filePath, doc.fileName, (err) => {
      if (err) {
        console.error('Download error:', err);
        return res.status(500).json({ 
          success: false, 
          message: "Error downloading file." 
        });
      }
    });

  } catch (err) {
    next(err);
  }
};


// preview doc /**
// GET /api/documents/preview/:id
 
exports.previewDocument = async (req, res, next) => {
  try {
    const { id } = req.params;
    const userId = req.user._id;
    const userRole = req.user.role;

    // 1. 查找文档
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found." 
      });
    }

    // 2. 权限检查
    const isOwner = doc.owner.toString() === userId.toString();
    const isHR = userRole === 'HR';

    if (!isOwner && !isHR) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to access this document." 
      });
    }

    // 3. 构建文件路径
    const filePath = path.join(__dirname, '../uploads', doc.fileKey);

    // 4. 检查文件是否存在
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found on server." 
      });
    }

    // 5. 设置正确的 Content-Type
    const ext = path.extname(doc.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }

    // 6. 设置为 inline 预览
    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    
    // 7. 发送文件流
    const fileStream = fs.createReadStream(filePath);
    fileStream.pipe(res);

  } catch (err) {
    next(err);
  }
};


/**
 * GET /api/documents/employee/:employeeId
 */

// hr fetch the specifci employee of docs
exports.getEmployeeDocuments = async (req, res, next) => {
  try {
    const { employeeId } = req.params;

    // 1. 查找 Employee
    const employee = await Employee.findById(employeeId).populate('documents');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found." 
      });
    }

    // 2. 返回该 Employee 的所有文档
    res.json({
      success: true,
      data: employee.documents
    });

  } catch (err) {
    next(err);
  }
};

