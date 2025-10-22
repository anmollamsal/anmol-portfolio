// ==========================
// 📦 IMPORTS
// ==========================
const express = require("express");
const path = require("path");
const fs = require("fs");
const cors = require("cors");
const Parser = require("rss-parser");

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

// Serve static files (HTML, CSS, JS, images)
app.use(express.static(__dirname));

// Serve data folder explicitly (for images)
app.use("/data", express.static(path.join(__dirname, "data")));

// ==========================
// 🏠 HOME ROUTE
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

  fs.readFile(filePath, "utf8", (err, data) => {
    let contacts = [];
    if (!err && data) {
      try {
        contacts = JSON.parse(data);
      } catch (e) {
        contacts = [];
      }
    }

    contacts.push(newContact);

    fs.writeFile(filePath, JSON.stringify(contacts, null, 2), (err) => {
      if (err) {
        console.error("Error saving contact:", err);
        return res.status(500).json({ message: "Error saving contact" });
      }
      console.log("✅ New contact saved:", newContact);
      res.json({ message: "Contact saved successfully!" });
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
    console.error("❌ BBC News fetch error:", error);
    res.status(500).json({ message: "Error fetching BBC News" });
  }
});

// ==========================
// 🚀 START SERVER
// ==========================
app.listen(PORT, () => {
  console.log(`✅ Server is running on http://localhost:${PORT}`);
  console.log("📂 Serving files from:", __dirname);
});
