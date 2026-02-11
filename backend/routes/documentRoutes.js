const express = require("express");
const router = express.Router();

const { protect, restrictTo } = require("../middleware/authMiddleware");
const upload = require("../uploads/upload");
const documentController = require("../controllers/documentController");

// The specific route should be placed before the dynamic route

// GET /api/documents (my docs)
router.get("/", protect, documentController.getMyDocuments);

// hr fetch all files of one specific employee
router.get(
  "/employee/:employeeId",
  protect,
  restrictTo("HR"),
  documentController.getEmployeeDocuments
);

// preview doc
router.get("/preview/:id", protect, documentController.previewDocument);

// download docs (employee and hr both could do)
router.get("/download/:id", protect, documentController.downloadDocument);

// POST /api/documents (upload new)
router.post("/", protect, upload.single("file"), documentController.uploadDocument);

// PUT /api/documents/:id (reupload for rejected)
router.put("/:id", protect, upload.single("file"), documentController.reuploadDocument);

module.exports = router;
