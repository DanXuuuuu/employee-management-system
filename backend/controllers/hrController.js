const { application } = require('express');
const Registration = require('../models/Registration');
const Employee = require('../models/Employee');

// get Token History - newest latest 


exports.getTokenHistory = async (req, res, next) =>{
    try{
        // check all registration records, check the time order, reverse order(from newest and latest on the front)
        const tokens = await Registration.find()
        // latest post 
        .sort({ createdAt: -1})
        // select what we need, avoid the info leak 
        .select('email name token status createdAt');
        // return token list and count
        res.status(200).json({
            sucess: true,
            count: tokens.length,
            data: tokens
        })

    }catch(error){
        next(error);
    };
};
//get all the Onboarding Applications
// GET /api/hr/onboarding-applications
exports.getOnboardingApplications = async (req, res, next) => {

    try{
        // find all employees who already submitted applica
        const employees = await Employee.find({
            applicationStatus:{ $in: ['Pending', 'Approved', 'Rejected']}
        })
        .populate('user', 'username email')
        .sort( { createdAt: -1 });

        const pending = employees.filter(e => e.applicationStatus === 'Pending');
        const approved = employees.filter(e => e.applicationStatus === 'Approved');
        const rejected = employees.filter(e => e.applicationStatus === 'Rejected');
        res.status(200).json({
            success: true,
            data: { pending, approved, rejected }
        });

    }catch(error){
        next(error);
    }
}

// Approve Onboarding applications
// PATCH /api/hr/onboarding/:id/approve
exports.approveOnboarding = async (req, res, next)=>{
    try{
        const employee = await Employee.findByIdAndUpdate(
            // be approved person 
            req.params.id,
            { applicationStatus: 'Approved', hrFeedback: ''},
            { new: true }
        );
        // must have employee 
        if(!employee){
            const err = new Error('Employee not found');
            err.stautsCode = 404;
            return next(err);
        }
        res.status(200).json({
            success: true,
            message: 'Application approved',
             // return the employee who just be approved
            data: employee
        });

    }catch(error){
        next(error);
    };
}

// reject onboarding application
//  PATCH /api/hr/onboarding/:id/reject

exports.rejectOnboarding = async (req, res, next)=>{
    try{
        const { feedback } = req.body;
        // must have feedback 
        if(!feedback){
            const err = new Error('Feedback is required when rejecting.');
            err.statusCode = 400;
            return next(err);
        }

        const employee = await Employee.findByIdAndUpdate(
            // be rejected person
            req.params.id,
            // modified and store status and feedback
            { applicationStatus:'Rejected', hrFeedback: feedback },
            //return updated data 
            { new: true }

        );
        if(!employee){
            const err = new Error('Employee not found');
            err.statusCode = 404;
            return next(err);
        }
        res.status(200).json({
            success: true,
            message: 'Application rejected',
            // return the employee who just be rejected to frontend
            data: employee
        });

    }catch(error){
        next(error);
    }
};

// get all employees 
//  GET /api/hr/employees

exports.getAllEmployees = async(req, res, next)=>{
    try{
        const employees = await Employee.find()
        .populate('user', 'username')
        // sort by lastname 
        .sort({ lastName: 1});

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        })   
    }catch(error){
        next(error);
    }
};
// get one employee info specific detail
//  GET /api/hr/employees/:id
exports.getEmployeeDetail = async(req, res, next)=>{
    try{
        const employee = await Employee.findById(req.params.id)
        // filled
        .populate('user', 'username email');

        if(!employee){
            const err = new Error('Employee not found');
            err.statusCode = 404;
            return next(err);
        }
        res.status(200).json({
            success: true,
            data: employee
        })
    }catch(error){
        next(error)
;    }   
}


