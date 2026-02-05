const mongoose = require('mongoose');

const registrationSchema = new mongoose.Schema({
    email: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
    name: { 
        type: String, 
        required: true 
    }, 
    token: { 
        type: String, 
        required: true, 
        unique: true 
    }, 
        
    status: { 
        type: String, 
        enum: ['sent', 'used'], 
        default: 'sent' 
    } 
}, 

    { timestamps: true });


registrationSchema.index({ createdAt: 1 }, { expireAfterSeconds: 10800 });

module.exports = mongoose.model('Registration', registrationSchema);