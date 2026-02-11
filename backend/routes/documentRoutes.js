const express = require("express");
const router = express.Router();

const { protect, restrictTo } = require("../middleware/authMiddleware");
const  upload  = require("../uploads/upload");
const {
  getMyDocuments,
  uploadDocument,
  reuploadDocument,
  downloadDocument,
  getEmployeeDocuments,
  previewDocument
} = require("../controllers/documentController");


// The specific route should be placed before the dynamic route

// GET /api/documents
router.get("/", protect, getMyDocuments);

// hr fetch all files of one specific employee 
router.get("/employee/:employeeId", protect, restrictTo('HR'), getEmployeeDocuments);

// preview doc
router.get("/preview/:id", protect, previewDocument);

// download docs (employeee and hr both could do)
router.get("/download/:id", protect, downloadDocument);

// POST /api/documents  (upload new)
router.post("/", protect, upload.single("file"), uploadDocument);


// PUT /api/documents/:id (reupload doc for rejected doc)
router.put("/:id", protect,  reuploadDocument);


module.exports = router;
