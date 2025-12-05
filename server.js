// ==========================
// 📦 IMPORTS
// ==========================
require("dotenv").config();
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const Parser = require("rss-parser");
const sgMail = require("@sendgrid/mail");

// ==========================
// ⚙️ SETUP
// ==========================
const app = express();
const parser = new Parser();
const PORT = process.env.PORT || 3000;

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// ==========================
// 🔧 MIDDLEWARE
// ==========================
app.use(cors());
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
// 💬 CONTACT FORM API
// ==========================
app.post("/api/contact", (req, res) => {
  const filePath = path.join(__dirname, "contacts.json");
  const newContact = req.body;

  // Save contact in file
  fs.readFile(filePath, "utf8", (err, data) => {
    let contacts = [];
    if (!err && data) {
      try {
        contacts = JSON.parse(data);
      } catch {
        contacts = [];
      }
    }

    contacts.push(newContact);

    fs.writeFile(filePath, JSON.stringify(contacts, null, 2), async (err) => {
      if (err) {
        console.error("❌ Error saving contact:", err);
        return res.status(500).json({ message: "Error saving contact" });
      }

      console.log("✔ Contact saved:", newContact);

      // Prepare email
      const msg = {
        to: process.env.CONTACT_EMAIL,
        from: process.env.CONTACT_EMAIL,
        subject: `📨 New Portfolio Message from ${newContact.name}`,
        text: `Name: ${newContact.name}
Email: ${newContact.email}
Message: ${newContact.message}`
      };

      // Send email using SendGrid API
      try {
        await sgMail.send(msg);
        console.log("📨 Email sent successfully!");
      } catch (error) {
        console.error("❌ Mail Send Error:", error);
      }

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
    console.error("❌ BBC News Fetch Error:", error);
    res.status(500).json({ message: "Error fetching BBC news" });
  }
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`✔ Server running at http://localhost:${PORT}`);
  console.log("📂 Serving files from:", __dirname);
});
