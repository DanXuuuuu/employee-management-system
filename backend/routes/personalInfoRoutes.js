const express = require('express');
const router = express.Router();

const { protect} = require('../middleware/authMiddleware');

const { getPersonalInfo, updatePersonalInfoSection } = require("../controllers/personalInfoController");

router.get("/", protect, getPersonalInfo);
router.put("/:section", protect, updatePersonalInfoSection);

module.exports = router;
