const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");
const  upload  = require("../uploads/upload");
const {
  getMyDocuments,
  uploadDocument,
  reuploadDocument,
} = require("../controllers/documentController");

// GET /api/documents
router.get("/", protect, getMyDocuments);

// POST /api/documents  (upload new)
router.post("/", protect, upload.single("file"), uploadDocument);

// PUT /api/documents/:id (reupload for rejected)
router.put("/:id", protect, upload.single("file"), reuploadDocument);

module.exports = router;
