const User = require('../models/User');
const Registration = require('../models/Registration'); 
const jwt = require('jsonwebtoken');


const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role: role }, 
        process.env.JWT_TOKEN_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// --- Signup for employee ---
exports.signup = async (req, res, next) => {
    try {
        const { email, username, password, confirmPassword, registrationToken } = req.body;


        if (!email || !username || !password || !confirmPassword || !registrationToken) {
            const err = new Error('Please fill in all fields, including the registration token');
            err.statusCode = 400;
            return next(err);
        }

     
        if (password !== confirmPassword) {
            const err = new Error('Passwords do not match');
            err.statusCode = 400;
            return next(err);
        }
        /*
        console.log('--- DEBUG START ---');
        console.log('Request Email:', `"${email}"`);
        console.log('Request Token:', `"${registrationToken}"`);
        console.log('--- DEBUG END ---');
        */
        const validToken = await Registration.findOne({ 
            token: registrationToken, 
            email: email, 
            status: 'sent' 
        });

        if (!validToken) {
            const err = new Error('Invalid or expired registration link. Please contact HR.');
            err.statusCode = 401;
            return next(err);
        }

      
        const existingUser = await User.findOne({ $or: [{ email }, { username }] });
        if (existingUser) {
            const err = new Error('User email or username already exists');
            err.statusCode = 400;
            return next(err);
        }

     
        const newUser = new User({
            email,
            username,
            password
        });

        await newUser.save();

        validToken.status = 'used';
        await validToken.save();

  
        const token = generateToken(newUser._id, newUser.role);
        res.status(201).json({
            success: true,
            message: 'Registration successful',
            token,
            user: {
                id: newUser._id,
                username: newUser.username,
                role: newUser.role
            }
        });

    } catch (error) {
        next(error);
    }
};

// --- Login logic ---
exports.login = async (req, res, next) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            const err = new Error('Please provide email and password');
            err.statusCode = 400;
            return next(err);
        }


        const user = await User.findOne({ email });
        if (!user) {
            const err = new Error('User not found. Please check your email or sign up.');
            err.statusCode = 404;
            return next(err);
        }

       
        const isMatch = await user.comparePassword(password);
        if (!isMatch) {
            const err = new Error('Invalid credentials');
            err.statusCode = 401;
            return next(err);
        }

     
        const token = generateToken(user._id, user.role);

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token,
            user: {
                id: user._id,
                username: user.username,
                email: user.email,
                role: user.role 
            }
        });

    } catch (error) {
        next(error);
    }
};