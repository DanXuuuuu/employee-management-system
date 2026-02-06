const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');

// token history: register a route when people visit path, the func will be called
router.get('/token-history', hrController.getTokenHistory);

// onboarding applicaitons 
router.get('/onboarding-applications', hrController.getOnboardingApplications);

// update approve/reject applications
router.patch('/onboarding/:id/approve', hrController.approveOnboarding);
router.patch('/onboarding/:id/reject', hrController.rejectOnboarding);



module.exports = router;

