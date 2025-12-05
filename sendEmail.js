require("dotenv").config();
const nodemailer = require("nodemailer");

// ==========================
// 📧 Gmail Transporter
// ==========================
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail
    pass: process.env.GMAIL_PASS, // App password
  },
});

// ==========================
// 📄 Email Options
// ==========================
const mailOptions = {
  from: `Anmol Lamsal <${process.env.GMAIL_USER}>`, // <-- FIXED
  to: process.env.CONTACT_EMAIL,
  subject: "Test Email from Portfolio",
  text: "Hello! This is a test email sent via Gmail using Node.js and Nodemailer.",
};

// ==========================
// ✉ Send Email
// ==========================
transporter.sendMail(mailOptions, (error, info) => {
  if (error) {
    console.error("❌ Error sending email:", error);
  } else {
    console.log("✅ Email sent successfully! Message ID:", info.messageId);
  }
});
