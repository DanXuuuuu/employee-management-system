const nodemailer = require('nodemailer');

/**
 * @param {Object} options - including email, subject, message
 */
const sendEmail = async (options) => {
    // 1. create Transporter
    const transporter = nodemailer.createTransport({
        service: process.env.EMAIL_SERVICE,
        auth: {
            user: process.env.EMAIL_USER,
            pass: process.env.EMAIL_PASS,
        },
    });

    // 2. define email content
    const mailOptions = {
        from: `CRM System Team <${process.env.EMAIL_FROM}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html 
    };

    // 3. send email
    await transporter.sendMail(mailOptions);
};

module.exports = sendEmail;