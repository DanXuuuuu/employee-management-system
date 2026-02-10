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
    const regToken = registrationToken || token; // ✅ 兼容两种字段名

    // ✅ 必填校验
    if (!email || !username || !password || !confirmPassword || !regToken) {
      const err = new Error('Please fill in all fields, including the registration token');
      err.statusCode = 400;
      return next(err);
    }

    // ✅ 密码一致校验
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

    // ✅ 检查用户是否已存在
    const existingUser = await User.findOne({ $or: [{ email }, { username }] });
    if (existingUser) {
      const err = new Error('User email or username already exists');
      err.statusCode = 400;
      return next(err);
    }

    // ✅ 创建用户
    const newUser = new User({
      email,
      username,
      password,
    });

    await newUser.save();

    // ✅ 标记 token 已使用
    validToken.status = 'used';
    await validToken.save();

    // ✅ 返回登录 token（注意别和 req.body 的 token 同名冲突）
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