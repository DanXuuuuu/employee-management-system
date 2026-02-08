const express = require('express');
const router = express.Router();
const upload = require('../middleware/upload'); 
const { protect } = require('../middleware/authMiddleware');


router.post('/upload-avatar', protect, upload.single('profilePic'), (req, res) => {
    if (!req.file) {
        return res.status(400).json({ success: false, message: "No file uploaded" });
    }
    
    res.status(200).json({
        success: true,
        message: "File uploaded successfully!",
        file: req.file 
    });
});

const { getOnboarding } = require("../controllers/onboardingController");

// GET /api/onboarding
router.get("/", protect, getOnboarding);

module.exports = router;
