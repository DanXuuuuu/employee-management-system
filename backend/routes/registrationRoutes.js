const express = require('express');
const router = express.Router();
const { protect, restrictTo } = require('../middleware/authMiddleware');
const { generateRegistrationToken,verifyRegistrationToken } = require('../controllers/registrationController');

//1. must login
//2. must HR 
router.post('/generate', protect, restrictTo('HR'), generateRegistrationToken);
router.get("/verify", verifyRegistrationToken);
module.exports = router;