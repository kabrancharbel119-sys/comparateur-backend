const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q,
        location: "Canada",
        hl: "en",
        gl: "ca",
        api_key: SERPAPI_KEY
      }
    });

    const results = (response.data.shopping_results || [])
      .slice(0, 9)
      .map(item => ({
        title: item.title,
        price: item.price,
        store: item.source,
        image: item.thumbnail,
        link: item.link
      }));

    res.json(results);
  } catch (err) {
    res.status(500).json({ error: "Erreur SerpAPI" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));

