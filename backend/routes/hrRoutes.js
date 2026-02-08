const express = require('express');
const router = express.Router();
const hrController = require('../controllers/hrController');

// get token history: register a route when people visit path, the func will be called
router.get('/token-history', hrController.getTokenHistory);


// onboarding applicaitons 
router.get('/onboarding-applications', hrController.getOnboardingApplications);

// update approve/reject applications
router.patch('/onboarding/:id/approve', hrController.approveOnboarding);
router.patch('/onboarding/:id/reject', hrController.rejectOnboarding);


// get all employees
router.get('/employees', hrController.getAllEmployees);


// search employee 
router.get('/employees/search', hrController.searchEmployees);


// get one specific employee 
router.get('/employees/:id', hrController.getEmployeeDetail);

// get visa in progress 
router.get('/visa/in-progress', hrController.getVisaInProgress);

// get all employees who need Visa 
router.get('/visa/all', hrController.getAllVisaEmployees);

// approve/reject visa
router.patch('/visa/:userId/:docType/approve', hrController.approveVisaDoc);
router.patch('/visa/:userId/:docType/reject', hrController.rejectVisaDoc);

// send visa reminder reminder email 
router.post('/visa/:userId/send-reminder', hrController.sendVisaReminder);

module.exports = router;

