// ==========================
// 📦 IMPORTS
// ==========================
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
const PORT = 3000;

// ==========================
// 🔧 MIDDLEWARE
// ==========================
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static(__dirname));
app.use("/data", express.static(path.join(__dirname, "data")));

// ==========================
// 🏠 HOME ROUTE
// ==========================
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "index.html"));
});

// ==========================
// 📧 MAIL TRANSPORT (GMAIL SMTP)
// ==========================
if (!process.env.GMAIL_USER || !process.env.GMAIL_PASS) {
  console.error("❌ GMAIL_USER or GMAIL_PASS environment variable missing!");
  process.exit(1);
}

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.GMAIL_USER,
    pass: process.env.GMAIL_PASS, // must be App Password
  },
});

// ==========================
// 💬 CONTACT FORM API
// ==========================
app.post("/api/contact", async (req, res) => {
  const filePath = path.join(__dirname, "contacts.json");
  const newContact = req.body;

  if (!newContact.name || !newContact.email || !newContact.message) {
    return res.status(400).json({ message: "All fields are required" });
  }

  try {
    // Read existing contacts
    let contacts = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      contacts = data ? JSON.parse(data) : [];
    }

    contacts.push(newContact);
    fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
    console.log("✔ New contact saved:", newContact);

    // Send Email
    const mailOptions = {
      from: process.env.GMAIL_USER,
      to: process.env.GMAIL_USER,
      subject: `New Portfolio Message from ${newContact.name}`,
      text: `
Name: ${newContact.name}
Email: ${newContact.email}
Message: ${newContact.message}
      `,
    };

    const info = await transporter.sendMail(mailOptions);
    console.log("📨 Email sent successfully:", info.response);

    res.json({ message: "Contact saved and email sent!" });
  } catch (err) {
    console.error("Error in /api/contact:", err);
    res.status(500).json({ message: "Error saving contact or sending email" });
  }
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
