const User = require('../models/User');
const Registration = require('../models/Registration'); 
const jwt = require('jsonwebtoken');
const Employee = require('../models/Employee');

const generateToken = (userId, role) => {
    return jwt.sign(
        { id: userId, role: role }, 
        process.env.JWT_TOKEN_SECRET, 
        { expiresIn: process.env.JWT_EXPIRES_IN }
    );
};

// --- Register for employee ---

exports.signup = async (req, res, next) => {
  try {
    const { email, username, password, confirmPassword, registrationToken, token } = req.body;
    const regToken = registrationToken || token; 


    if (!email || !username || !password || !confirmPassword || !regToken) {
      const err = new Error('Please fill in all fields, including the registration token');
      err.statusCode = 400;
      return next(err);
    }
 
    if (password !== confirmPassword) {
      const err = new Error('Passwords do not match');
      err.statusCode = 400;
      return next(err);
    }

    // ✅ 验证注册链接 token 是否存在且未使用
    const validToken = await Registration.findOne({
      token: regToken,
      email: email,
      status: 'sent',
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
      password,
    });

    await newUser.save();


    validToken.status = 'used';
    await validToken.save();


    const authToken = generateToken(newUser._id, newUser.role);

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      token: authToken,
      user: {
        id: newUser._id,
        username: newUser.username,
        role: newUser.role,
      },
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

        let applicationStatus = 'Not Started'; 
        if (user.role === 'Employee') {
            const employeeProfile = await Employee.findOne({ user: user._id });
            if (employeeProfile) {
                applicationStatus = employeeProfile.applicationStatus;
            }
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
                role: user.role,
                applicationStatus: applicationStatus
            }
        });

    } catch (error) {
        next(error);
    }
};