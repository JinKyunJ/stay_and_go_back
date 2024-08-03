const dotenv = require('dotenv');
dotenv.config();
const nodemailer = require('nodemailer');
const transport = nodemailer.createTransport({
    service: 'Gmail',
    auth: {
        user: process.env.GMAIL_ID,
        pass: process.env.GMAIL_PASSWORD,
    },
});

const sendEmail = (email, subject, text) => {
    const message = {
        from: process.env.GMAIL_ID,
        to: email,
        subject: subject,
        text: text
    };

    return new Promise((resolve, reject) => {
        transport.sendMail(message, (err, info) => {
            if(err){
                console.error('err', err);
                reject(-1);
            } else {
                console.log('ok', info);
                resolve(1);
            }
        });
    })  
};

module.exports = sendEmail;
