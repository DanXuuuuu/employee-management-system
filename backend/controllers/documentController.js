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


    const doc = await Document.create({
      owner: userId,
      type,
      fileUrl: `/uploads/${req.file.filename}`,
      fileKey: req.file.filename,
      fileName: req.file.originalname,
      status: "Pending",
      feedback: "",
    });


    await Employee.findOneAndUpdate(
      { user: userId },
      { $addToSet: { documents: doc._id } },
      { upsert: true }
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


    if (doc.status !== "Rejected") {
      return res.status(409).json({
        ok: false,
        message: "Only rejected documents can be re-uploaded."
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

  
    const doc = await Document.findById(id);
    if (!doc) {
      return res.status(404).json({ 
        success: false, 
        message: "Document not found." 
      });
    }


    const isOwner = doc.owner.toString() === userId.toString();
    const isHR = userRole === 'HR';

    if (!isOwner && !isHR) {
      return res.status(403).json({ 
        success: false, 
        message: "You don't have permission to access this document." 
      });
    }


    const filePath = path.join(__dirname, '../uploads', doc.fileKey);


    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found on server." 
      });
    }


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


    const filePath = path.join(__dirname, '../uploads', doc.fileKey);


    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ 
        success: false, 
        message: "File not found on server." 
      });
    }


    const ext = path.extname(doc.fileName).toLowerCase();
    let contentType = 'application/octet-stream';
    
    if (ext === '.pdf') {
      contentType = 'application/pdf';
    } else if (['.jpg', '.jpeg'].includes(ext)) {
      contentType = 'image/jpeg';
    } else if (ext === '.png') {
      contentType = 'image/png';
    }


    res.setHeader('Content-Type', contentType);
    res.setHeader('Content-Disposition', `inline; filename="${doc.fileName}"`);
    
  
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

    const employee = await Employee.findById(employeeId).populate('documents');
    
    if (!employee) {
      return res.status(404).json({ 
        success: false, 
        message: "Employee not found." 
      });
    }

    
    res.json({
      success: true,
      data: employee.documents
    });

  } catch (err) {
    next(err);
  }
};

