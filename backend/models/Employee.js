const mongoose = require('mongoose');

const employeeSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
        unique: true
    },
  
    firstName: { 
        type: String, 
        required: true 
    },
    lastName: { 
        type: String, 
        required: true 
    },
    middleName: String,
    preferredName: String,

    profilePicture: { 
        type: String, 
        default: 'default_avatar.png' //need modify
    },
    

    address: {
        building: String,
        street: { 
            type: String, 
            required: true 
        },
        city: { 
            type: String, 
            required: true 
        },
        state: { 
            type: String, 
            required: true 
        },
        zip: { 
            type: String, 
            required: true 
        }
    },
    phoneNumber: { 
        type: String, 
        required: true 
    },
    workPhoneNumber: String,

    
    email: { 
        type: String, 
        required: true 
    },
    ssn: { 
        type: String, 
        required: true 
    },
    dob: { 
        type: Date, 
        required: true 
    },
    gender: { 
        type: String, 
        enum: ['Male', 'Female', 'I do not wish to answer'], 
        required: true 
    },

  
    residencyStatus: {
        isCitizenOrPermanentResident: { 
            type: Boolean, 
            required: true 
        },
        statusType: { 
            type: String, 
            enum: ['Citizen', 'Green Card', 'No'] 
        }, 
        workAuthorization: {
            type: { 
                type: String, 
                enum: ['H1-B', 'L2', 'F1(CPT/OPT)', 'H4', 'Other'] 
            },
            otherType: String,
            startDate: Date,
            endDate: Date
        }
    },

   
    emergencyContacts: [{
        firstName: { 
            type: String, 
            required: true 
        },
        lastName: { 
            type: String, 
            required: true 
        },
        middleName: String,
        phone: { 
            type: String, 
            required: true 
        },
        email: { 
            type: String, 
            required: true 
        },
        relationship: { 
            type: String, 
            required: true 
        }
    }],

  
    applicationStatus: {
        type: String,
        enum: ['Not Started', 'Pending', 'Approved', 'Rejected'],
        default: 'Not Started'
    },
    hrFeedback: String

}, 
    { timestamps: true });

module.exports = mongoose.model('Employee', employeeSchema);