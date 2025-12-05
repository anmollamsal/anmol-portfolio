// sendEmail.js
const nodemailer = require("nodemailer");

// Choose which service to use: "gmail" or "sendgrid"
const SERVICE = "gmail"; // change to "sendgrid" if you want

let transporter;

if (SERVICE === "gmail") {
  // Gmail SMTP transporter
  transporter = nodemailer.createTransport({
    host: "smtp.gmail.com",
    port: 465,        // SSL port
    secure: true,     // true for 465, false for 587
    auth: {
      user: process.env.GMAIL_USER, // your Gmail address
      pass: process.env.GMAIL_PASS  // 16-character app password, no spaces
    }
  });
} else if (SERVICE === "sendgrid") {
  // SendGrid SMTP transporter
  transporter = nodemailer.createTransport({
    host: "smtp.sendgrid.net",
    port: 587,       // TLS port
    secure: false,   // false for 587
    auth: {
      user: "apikey",                 // literal string "apikey"
      pass: process.env.SENDGRID_API_KEY
    }
  });
} else {
  console.error("Invalid service selected. Use 'gmail' or 'sendgrid'.");
  process.exit(1);
}

// Email details
const mailOptions = {
  from: "Your Name" <${process.env.GMAIL_USER}>, // sender
  to: process.env.CONTACT_EMAIL,                   // recipient
  subject: Test Email via ${SERVICE},
  text: Hello! This is a test email sent via ${SERVICE}.
};

// Send the email
transporter.sendMail(mailOptions, (err, info) => {
  if (err) {
    console.error(${SERVICE} Error:, err);
  } else {
    console.log(${SERVICE} Message sent:, info.messageId);
  }
});
