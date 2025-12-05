// ==========================
// 📦 IMPORTS
// ==========================
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/data", express.static(path.join(__dirname, "data")));

// ==========================
// 🏠 HOME PAGE
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================
// 📧 GMAIL TRANSPORTER
// ==========================
const transporter = nodemailer.createTransport({
  service: "Gmail",
  auth: {
    user: process.env.GMAIL_USER, // Your Gmail
    pass: process.env.GMAIL_PASS, // 16-digit App Password
  },
});

// ==========================
// 💬 CONTACT FORM POST API
// ==========================
app.post("/api/contact", (req, res) => {
  const { name, email, message } = req.body;

  if (!name || !email || !message) {
    return res.status(400).json({ error: "All fields are required" });
  }

  const newContact = { name, email, message, date: new Date().toISOString() };
  const filePath = path.join(__dirname, "contacts.json");

  // Save message to contacts.json
  fs.readFile(filePath, "utf8", (err, data) => {
    let contacts = [];
    if (!err && data) {
      try {
        contacts = JSON.parse(data);
      } catch {}
    }

    contacts.push(newContact);

    fs.writeFile(filePath, JSON.stringify(contacts, null, 2), (err) => {
      if (err) {
        console.error("❌ Error saving contact:", err);
        return res.status(500).json({ message: "Error saving contact" });
      }

      console.log("✔ Contact saved:", newContact);

      // Send email to Gmail
      const mailOptions = {
        from: `Portfolio Contact <${process.env.GMAIL_USER}>`,
        to: process.env.GMAIL_USER,
        subject: `📩 New Portfolio Message from ${name}`,
        text: `Name: ${name}\nEmail: ${email}\nMessage: ${message}`,
      };

      transporter.sendMail(mailOptions, (error, info) => {
        if (error) {
          console.error("❌ Error sending email:", error);
          return res.status(500).json({ error: "Failed to send email" });
        } else {
          console.log("📨 Email sent successfully! Message ID:", info.messageId);
          res.json({ success: true, msg: "Message saved and email sent!" });
        }
      });
    });
  });
});

// ==========================
// 📰 BBC NEWS API
// ==========================
app.get("/api/news", async (req, res) => {
  try {
    const feed = await parser.parseURL("https://feeds.bbci.co.uk/news/rss.xml");
    const articles = feed.items.slice(0, 10).map((item) => ({
      title: item.title,
      link: item.link,
      summary: item.contentSnippet || "No summary available",
      date: item.pubDate || "",
    }));

    res.json(articles);
  } catch (error) {
    console.error("❌ BBC News fetch error:", error);
    res.status(500).json({ message: "Error fetching BBC News" });
  }
});

// ==========================
// 📂 GET CONTACTS API
// ==========================
app.get("/api/contacts", (req, res) => {
  const filePath = path.join(__dirname, "contacts.json");
  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read contacts" });
    try {
      const contacts = JSON.parse(data);
      res.json(contacts);
    } catch {
      res.json([]);
    }
  });
});

// ==========================
// 🔄 UPDATE CONTACT API (PUT)
// ==========================
app.put("/api/contacts/:index", (req, res) => {
  const index = parseInt(req.params.index);
  const { name, email, message } = req.body;
  const filePath = path.join(__dirname, "contacts.json");

  fs.readFile(filePath, "utf8", (err, data) => {
    if (err) return res.status(500).json({ error: "Failed to read contacts" });
    let contacts = [];
    try {
      contacts = JSON.parse(data);
    } catch {}

    if (!contacts[index]) return res.status(404).json({ error: "Contact not found" });

    contacts[index] = { name, email, message, date: new Date().toISOString() };

    fs.writeFile(filePath, JSON.stringify(contacts, null, 2), (err) => {
      if (err) return res.status(500).json({ error: "Failed to update contact" });
      res.json({ success: true, contact: contacts[index] });
    });
  });
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`✔ Server running at http://localhost:${PORT}`);
  console.log("📂 Serving files from:", __dirname);
});
