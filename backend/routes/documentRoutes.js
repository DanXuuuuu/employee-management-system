const express = require("express");
const router = express.Router();

const { protect } = require("../middleware/authMiddleware");

// 修复 1：确保路径指向正确的 middleware 文件夹
const upload = require("../uploads/upload"); 

const {
  getMyDocuments,
  uploadDocument,
  reuploadDocument,
} = require("../controllers/documentController");

// GET /api/documents
router.get("/", protect, getMyDocuments);

// 修复 2：必须重新加上 upload.single("file") 中间件，否则后端拿不到文件
// POST /api/documents (上传新文档)
router.post("/", protect, upload.single("file"), uploadDocument);

// 修复 3：PUT 接口同样需要 Multer 中间件处理重新上传的文件流
// PUT /api/documents/:id (重新上传被拒绝的文档)
router.put("/:id", protect, upload.single("file"), reuploadDocument);

module.exports = router;