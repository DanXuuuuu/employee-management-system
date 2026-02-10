const express = require('express');
const router = express.Router();

const { protect} = require('../middleware/authMiddleware');

const { getPersonalInfo, updatePersonalInfoSection } = require("../controllers/personalInfoController");

router.get("/personal-info", protect, getPersonalInfo);
router.put("/personal-info/:section", protect, updatePersonalInfoSection);

module.exports = router;
