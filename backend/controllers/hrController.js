const Registration = require('../models/Registration');
const Employee = require('../models/Employee');
const Document = require('../models/Document');
const sendEmail = require('../utils/email');

// Token History
// GET /api/hr/token-history
exports.getTokenHistory = async (req, res, next) => {
  try {
    const tokens = await Registration.find()
      .sort({ createdAt: -1 })
      .select('email name token status createdAt');

    res.status(200).json({
      success: true,
      count: tokens.length,
      data: tokens,
    });
  } catch (error) {
    next(error);
  }
};

// Onboarding Applications
// GET /api/hr/onboarding-applications
exports.getOnboardingApplications = async (req, res, next) => {
  try {
    const employees = await Employee.find({
      applicationStatus: { $in: ['Pending', 'Approved', 'Rejected'] },
    })
      .populate('user', 'username email')
      .sort({ createdAt: -1 });

    const pending = employees.filter((e) => e.applicationStatus === 'Pending');
    const approved = employees.filter((e) => e.applicationStatus === 'Approved');
    const rejected = employees.filter((e) => e.applicationStatus === 'Rejected');

    res.status(200).json({
      success: true,
      data: { pending, approved, rejected },
    });
  } catch (error) {
    next(error);
  }
};

// handle onboarding application - approve/ reject
// PATCH /api/hr/onboarding/:id/approve
exports.approveOnboarding = async (req, res, next) => {
  try {
    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { applicationStatus: 'Approved', hrFeedback: '' },
      { new: true }
    );

    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({
      success: true,
      message: 'Application approved',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/hr/onboarding/:id/reject
exports.rejectOnboarding = async (req, res, next) => {
  try {
    const { feedback } = req.body;

    if (!feedback) {
      const err = new Error('Feedback is required when rejecting.');
      err.statusCode = 400;
      return next(err);
    }

    const employee = await Employee.findByIdAndUpdate(
      req.params.id,
      { applicationStatus: 'Rejected', hrFeedback: feedback },
      { new: true }
    );

    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({
      success: true,
      message: 'Application rejected',
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// Employees
// GET /api/hr/employees
exports.getAllEmployees = async (req, res, next) => {
  try {
    const employees = await Employee.find()
      .populate('user', 'username')
      .sort({ lastName: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// fetch one employee detail
// GET /api/hr/employees/:id
exports.getEmployeeDetail = async (req, res, next) => {
  try {
    const employee = await Employee.findById(req.params.id).populate(
      'user',
      'username email'
    );

    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      return next(err);
    }

    res.status(200).json({
      success: true,
      data: employee,
    });
  } catch (error) {
    next(error);
  }
};

// GET /api/hr/employees/search?q=keyword
exports.searchEmployees = async (req, res, next) => {
  try {
    const { q } = req.query;

    if (!q) {
      const err = new Error('Search query is required');
      err.statusCode = 400;
      return next(err);
    }

    const escapedQ = q.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(escapedQ, 'i');

    const employees = await Employee.find({
      $or: [{ firstName: regex }, { lastName: regex }, { preferredName: regex }],
    })
      .populate('user', 'username email')
      .sort({ lastName: 1, firstName: 1 });

    res.status(200).json({
      success: true,
      count: employees.length,
      data: employees,
    });
  } catch (error) {
    next(error);
  }
};

// get Visa In Progress employees
// GET /api/hr/visa/in-progress
exports.getVisaInProgress = async (req, res, next) => {
  try {
    const steps = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];

    const employees = await Employee.find({
      'residencyStatus.isCitizenOrPermanentResident': false,
    }).populate('user', 'username email');

    const results = [];

    for (const emp of employees) {
      if (!emp.user) continue;

      const docs = await Document.find({
        owner: emp.user._id,
        type: { $in: steps },
      }).sort({ createdAt: 1 });

      let nextStep = `Waiting for ${steps[0]} upload`;
      let currentDoc = null;

      for (const step of steps) {
        const doc = docs.find((d) => d.type === step);
        if (!doc) {
          nextStep = `Waiting for ${step} upload`;
          currentDoc = null;
          break;
        }
        if (doc.status === 'Pending') {
          nextStep = `Review ${step}`;
          currentDoc = doc;
          break;
        }
        if (doc.status === 'Rejected') {
          nextStep = `Re-upload ${step}`;
          currentDoc = doc;
          break;
        }
        // Approved: continue to next step
        nextStep = 'All documents approved';
        currentDoc = doc;
      }

      // daysRemaining
      let daysRemaining = null;
      const end = emp.residencyStatus?.workAuthorization?.endDate;
      if (end) {
        daysRemaining = Math.ceil(
          (new Date(end).getTime() - Date.now()) / (1000 * 60 * 60 * 24)
        );
      }

      // only show who havent finish yet
      if (nextStep !== 'All documents approved') {
        results.push({
          employee: emp,
          nextStep,
          currentDoc,
          daysRemaining,
        });
      }
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};

// handle visa docs: Approve / Reject Visa Doc
// PATCH /api/hr/visa/:userId/:docType/approve
exports.approveVisaDoc = async (req, res, next) => {
  try {
    const { userId, docType } = req.params;

    const doc = await Document.findOne({
      owner: userId,
      type: docType,
      status: 'Pending',
    });

    if (!doc) {
      const err = new Error('Document not found or not pending');
      err.statusCode = 404;
      return next(err);
    }

    doc.status = 'Approved';
    doc.feedback = '';
    await doc.save();

    res.status(200).json({
      success: true,
      message: `${docType} approved`,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

// PATCH /api/hr/visa/:userId/:docType/reject
exports.rejectVisaDoc = async (req, res, next) => {
  try {
    const { userId, docType } = req.params;
    const { feedback } = req.body;

    if (!feedback) {
      const err = new Error('Feedback is required when rejecting');
      err.statusCode = 400;
      return next(err);
    }

    const doc = await Document.findOne({
      owner: userId,
      type: docType,
      status: 'Pending',
    });

    if (!doc) {
      const err = new Error('Document not found or not pending');
      err.statusCode = 404;
      return next(err);
    }

    doc.status = 'Rejected';
    doc.feedback = feedback;
    await doc.save();

    res.status(200).json({
      success: true,
      message: `${docType} rejected`,
      data: doc,
    });
  } catch (error) {
    next(error);
  }
};

// POST /api/hr/visa/:userId/send-reminder
exports.sendVisaReminder = async (req, res, next) => {
  try {
    const { userId } = req.params;

    const employee = await Employee.findOne({ user: userId }).populate(
      'user',
      'username email'
    );

    if (!employee) {
      const err = new Error('Employee not found');
      err.statusCode = 404;
      return next(err);
    }

    await sendEmail({
      email: employee.user.email,
      subject: 'Reminder: Please Update Your Visa Documents',
      message: `Hello ${employee.firstName},\n\nThis is a reminder to please upload or update your visa documents as soon as possible.\n\nThank you,\nHR Team`,
    });

    res.status(200).json({
      success: true,
      message: `Reminder email sent to ${employee.user.email}`,
    });
  } catch (error) {
    next(error);
  }
};

// get All Visa Employees
// GET /api/hr/visa/all
exports.getAllVisaEmployees = async (req, res, next) => {
  try {
    const steps = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];

    const employees = await Employee.find({
      'residencyStatus.isCitizenOrPermanentResident': false,
    })
      .populate('user', 'username email')
      .sort({ lastName: 1 });

    const results = [];

    for (const emp of employees) {
      if (!emp.user) continue;

      const docs = await Document.find({
        owner: emp.user._id,
        type: { $in: steps },
      }).sort({ createdAt: 1 });

      const docStatus = {};

      for (const step of steps) {
        const doc = docs.find((d) => d.type === step);
        if (doc) {
          docStatus[step] = {
            status: doc.status,
            feedback: doc.feedback,
            fileUrl: doc.fileUrl,
            updatedAt: doc.updatedAt,
          };
        } else {
          docStatus[step] = {
            status: 'Not Uploaded',
            feedback: '',
            fileUrl: null,
            updatedAt: null,
          };
        }
      }

      results.push({
        employee: emp,
        documents: docStatus,
      });
    }

    res.status(200).json({
      success: true,
      count: results.length,
      data: results,
    });
  } catch (error) {
    next(error);
  }
};