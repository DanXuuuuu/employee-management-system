const express = require("express");
const router = express.Router();

const { getOnboarding,submitOnboarding } = require("../controllers/onboardingController");
const { protect } = require("../middleware/authMiddleware"); 
// GET /api/onboarding
router.get('/', protect, getOnboarding);
router.post('/',protect,submitOnboarding);

module.exports = router;
