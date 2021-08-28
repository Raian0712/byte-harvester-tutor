const nodemailer = require('nodemailer');

const sendEmail = async (email, subject, text) => {
    try {
        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 587,
            secure: false,
            auth: {
                user: 'byteharvesterdev@gmail.com',
                password: 'BH0527!@'
            }
        });

        await transporter.sendMail({
            from: 'byteharvesterdev@gmail.com',
            to: email,
            subject: subject,
            text: text
        });

        console.log('Email sent successfully');
    } catch (err) {
        console.log(err, 'Error sending email');
    }
};

module.exports = sendEmail;