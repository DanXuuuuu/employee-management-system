const jwt = require('jsonwebtoken');
const User = require('../models/User');


exports.protect = async (req, res, next) => {
    try {
        let token;

        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
            token = req.headers.authorization.split(' ')[1];
        }

        if (!token) {
            const err = new Error('You are not logged in. Please log in to get access.');
            err.statusCode = 401;
            return next(err);
        }

        const decoded = jwt.verify(token, process.env.JWT_TOKEN_SECRET);

   
        req.user = decoded; 
        next();
    } catch (error) {
        const err = new Error('Invalid or expired token. Please log in again.');
        err.statusCode = 401;
        next(err);
    }
};


exports.restrictTo = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            const err = new Error('You do not have permission');
            err.statusCode = 403; // Forbidden
            return next(err);
        }
        next();
    };
};