const express = require('express');
const router = express.Router();
const upload = require('../uploads/upload'); 
const { protect } = require('../middleware/authMiddleware');

const { 
    getOnboarding, 
    submitOnboarding 
} = require("../controllers/onboardingController");

router.post('/upload-avatar', protect, upload.single('file'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    res.status(200).json({
        success: true,
        message: "File uploaded successfully!",
        file: req.file 
    });
});


// GET /api/onboarding
router.get("/", protect, getOnboarding);

// POST /api/onboarding/submit
router.post("/submit", protect, submitOnboarding);

module.exports = router;
