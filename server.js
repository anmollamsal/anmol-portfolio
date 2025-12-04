// ==========================
// 📦 IMPORTS
// ==========================
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const Parser = require("rss-parser");
const sgMail = require('@sendgrid/mail');

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
// 📧 SENDGRID SETUP
// ==========================
if (!process.env.SENDGRID_API_KEY || !process.env.CONTACT_EMAIL) {
  console.error("❌ SENDGRID_API_KEY or CONTACT_EMAIL environment variable missing!");
  process.exit(1);
}

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

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
    // Save contact locally
    let contacts = [];
    if (fs.existsSync(filePath)) {
      const data = fs.readFileSync(filePath, "utf8");
      contacts = data ? JSON.parse(data) : [];
    }

    contacts.push(newContact);
    fs.writeFileSync(filePath, JSON.stringify(contacts, null, 2));
    console.log("✔ New contact saved:", newContact);

    // Send email via SendGrid
    const msg = {
      to: process.env.CONTACT_EMAIL,
      from: process.env.CONTACT_EMAIL, // must be verified in SendGrid
      subject: `New Portfolio Message from ${newContact.name}`,
      text: `
Name: ${newContact.name}
Email: ${newContact.email}
Message: ${newContact.message}
      `,
    };

    await sgMail.send(msg);
    console.log("📨 Email sent successfully via SendGrid!");

    res.json({ message: "Contact saved and email sent!" });
  } catch (err) {
    console.error("Error sending email:", err);
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
