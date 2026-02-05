const mongoose = require('mongoose');

const documentSchema = new mongoose.Schema({
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        required: true,
        enum: ['OPT Receipt', 'OPT EAD', 'I-983', 'I-20', 'Driver License', 'Work Authorization'] // 涵盖所有文件类型
    },
    fileUrl: {
        type: String,
        required: true
    },
    fileKey: {
        type: String, 
        required: true
    },
    status: {
        type: String,
        enum: ['Pending', 'Approved', 'Rejected'],
        default: 'Pending' 
    },
    feedback: {
        type: String, 
        default: ''
    }
}, { timestamps: true });

module.exports = mongoose.model('Document', documentSchema);