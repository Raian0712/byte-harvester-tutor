require('dotenv').config()
const nodemailer = require('nodemailer');
const { google } = require('googleapis');
const OAuth2 = google.auth.OAuth2;

const sendEmail = async (email, subject, text) => {
    try {
        const oauth2Client = new OAuth2(
            process.env.CLIENT_ID,
            process.env.CLIENT_SECRET,
            "https://developers.google.com/oauthplayground"
        );
        
        oauth2Client.setCredentials({
            refresh_token: process.env.REFRESH_TOKEN
        })
    
        const accessToken = await new Promise((resolve, reject) => {
            oauth2Client.getAccessToken((err, token) => {
                if (err) {
                    reject("Failed to create access token.");
                }
                resolve(token);
            });
        });

        const transporter = nodemailer.createTransport({
            host: 'smtp.gmail.com',
            port: 465,
            secure: true,
            auth: {
                type: "OAUTH2",
                user: 'byteharvesterdev@gmail.com',
                pass: 'BH0527!@',
                clientId: process.env.CLIENT_ID,
                clientSecret: process.env.CLIENT_SECRET,
                accessToken: accessToken,
                refreshToken: process.env.REFRESH_TOKEN
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