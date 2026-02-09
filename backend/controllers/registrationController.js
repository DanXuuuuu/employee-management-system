const Registration = require('../models/Registration');
const crypto = require('crypto');
const nodemailer = require('nodemailer'); 
const sendEmail = require('../utils/email');
/**
 * hr generate and send register link
 * POST /api/registration/generate
 */
exports.generateRegistrationToken = async (req, res, next) => {
    try {
        const { email, name } = req.body;

        if (!email || !name) {
            const err = new Error('Please provide both employee name and email');
            err.statusCode = 400;
            return next(err);
        }

        const existingToken = await Registration.findOne({ email, status: 'sent' });
        if (existingToken) {
            const err = new Error('A valid registration link has already been sent to this email');
            err.statusCode = 400;
            return next(err);
        }

        const token = crypto.randomBytes(20).toString('hex');

        const registration = await Registration.create({
            email,
            name,
            token
        });

        const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
        const registrationUrl = `${frontendUrl}/register?token=${token}&email=${email}`;
        const message = `Hello ${name},\n\nWelcome to the team! 
        Please use the following link to complete your registration:
        \n\n${registrationUrl}\n\nNote: This link is valid for 3 hours only.`;

        try {
            await sendEmail({
                email: registration.email,
                subject: 'Action Required: Your Registration Link',
                message
            });

            res.status(200).json({
                success: true,
                message: 'Registration link generated and email sent successfully'
            });

        } catch (err) {
            
            await Registration.findByIdAndDelete(registration._id);
            const error = new Error('There was an error sending the email. Try again later.');
            error.statusCode = 500;
            return next(error);
        }

    } catch (error) {
        next(error);
    }
};

/**
 * verify invite token before showing register page
 * GET /api/registration/verify?token=xxxx
 */
exports.verifyRegistrationToken = async (req, res, next) => {
    try {
      const { token } = req.query;
  
      if (!token) {
        return res.status(200).json({
          valid: false,
          reason: "missing_token",
        });
      }
  
      const invite = await Registration.findOne({ token });
  
      if (!invite) {
        return res.status(200).json({
          valid: false,
          reason: "expired_or_invalid",
        });
      }
  
      if (invite.status !== "sent") {
        return res.status(200).json({
          valid: false,
          reason: "already_used",
        });
      }
  
      return res.status(200).json({
        valid: true,
        email: invite.email,
        name: invite.name,
      });
    } catch (error) {
      next(error);
    }
  };