// ==========================
// 📦 IMPORTS
// ==========================
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const Parser = require("rss-parser");
const nodemailer = require("nodemailer");

// ==========================
// ⚙️ SETUP
// ==========================
const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

// ==========================
// 🔧 MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/data", express.static(path.join(__dirname, "data")));

// ==========================
// 🏠 HOME
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================
// 📧 Nodemailer Gmail Transporter
// ==========================
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS
  }
});

// ==========================
// 💬 CONTACT FORM POST
// ==========================
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;
  const filePath = path.join(__dirname, "contacts.json");

  // Save contact to file
  fs.readFile(filePath, "utf8", (err, data) => {
    let contacts = [];
    if (!err && data) {
      try { contacts = JSON.parse(data); } catch { contacts = []; }
    }

    contacts.push({ name, email, message, date: new Date() });

    fs.writeFile(filePath, JSON.stringify(contacts, null, 2), (err) => {
      if (err) return res.status(500).json({ message: "Error saving contact" });

      console.log("✔ Contact saved:", { name, email, message });

      // Send email to your Gmail
      const mailOptions = {
        from: `Portfolio Contact <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `📩 New Portfolio Message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Mail Send Error:", error);
        } else {
          console.log("📨 Email sent successfully! Message ID:", info.messageId);
        }
      });

      res.json({ message: "Contact saved and email sent!" });
    });
  });
});

// ==========================
// 📰 BBC NEWS API
// ==========================
app.get("/api/news", async (req, res) => {
  try {
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
    const articles = feed.items.slice(0, 10).map(item => ({
      title: item.title,
      link: item.link,
      summary: item.contentSnippet || "No summary available",
      date: item.pubDate || ""
    }));
    res.json(articles);
  } catch (error) {
    console.error("BBC News fetch error:", error);
    res.status(500).json({ message: "Error fetching BBC News" });
  }
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`✔ Server running at http://localhost:${PORT}`);
  console.log("📂 Serving files from:", __dirname);
});
