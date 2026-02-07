const express = require("express");
const router = express.Router();

const { getOnboarding } = require("../controllers/onboardingController");
const { protect } = require("../middleware/authMiddleware"); 
// GET /api/onboarding
router.get("/", protect, getOnboarding);

module.exports = router;
