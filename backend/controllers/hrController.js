const { application } = require('express');
const Registration = require('../models/Registration');
const Employee = require('../models/Employee');
const Document = require('../models/Document');

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
        next(error);
    };
};

// search employees by firstname lastname preferredname 
// GET /api/hr/employees/search?q=keyword

exports.searchEmployees = async(req, res, next)=>{
    try{
        const { q } = req.query;
        // undefind/null/""
        if(!q){
            const err = new Error('Search query is required');
            // bad request
            err.statusCode = 400; 
            // skip all code after this and to errorHandler 
            return next(err);
        }
        // ignore uppercase and lowercase diff/ case intensitive 
        const regex = new RegExp(q, 'i');
        const employees = await Employee.find({
            // one of them fit is good
            $or: [
                { firstName: regex },
                { lastName: regex },
                { preferredName: regex }
            ]
        })
        .populate('user', 'username email')
        .sort({ lastName:1, firstName: 1});

        res.status(200).json({
            success: true,
            count: employees.length,
            data: employees
        });

    }catch(error){
        next(error);
    }
};


// get Visa in progress 
// GET /api/hr/visa/in-progress

exports.getVisaInProgress = async(req,res, next)=>{
    try{
        // find employee who needs sponsor 
        const employees = await Employee.find({
            'residencyStatus.isCitizenOrPermanentResident': false
        }).populate('user', 'username email');

        const results = [];
        // check this employee all files 
        //const - cuz every round for one different employee (safe and wouldn't change)
        for(const emp of employees){
            const docs = await Document.find({
                owner: emp.user._id,
                type: {$in: ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20']}
                // sort by upload time(morning to night) 
            }).sort({ createdAt: 1});
            // define progress order
            const steps = ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20'];
            let nextStep = steps[0];
            let currentDoc = null;
            // find step for all files
            for(const step of steps){
                const doc = docs.find(d => d.type === step);
                if(!doc){
                    // if no doc
                    nextStep = `Waiting for ${step} upload`;
                    break;
                    // if has docs check status 
                }else if(doc.status === 'Pending'){
                    nextStep = `Review ${step}`;
                    currentDoc = doc;
                    break;
                    // if has rejected doc needs reupload 
                } else if (doc.status === 'Rejected'){
                    nextStep = `Re-upload ${step}`;
                    currentDoc = doc;
                    break;
                }else if (doc.status === 'Approved'){
                    nextStep = 'All documents approved';
                    currentDoc = doc;
                }
            }
            let daysRemaining = null;
            const endDate = emp.residencyStatus?.workAuthorization?.endDate;
            if(endDate){
                const today = new Date();
                const end = new Date(endDate);
                // calculate left days
                daysRemaining = Math.ceil((end - today)/(1000*60*60*24));
            }
            // all passed employee doesnt show here 
            if(nextStep !== 'All documents approved'){
                results.push({
                    employee: emp,
                    nextStep,
                    currentDoc,
                    daysRemaining
                });
            }

        }
        res.status(200).json({
            success: true,
            count: results.length,
            data: results
        })
    }catch(error){
        next(error);
    }
}
