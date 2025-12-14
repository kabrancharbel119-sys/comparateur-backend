const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

function parsePriceToNumber(priceStr) {
  if (!priceStr) return null;
  // Ex: "$1,129.00" -> 1129.00
  const cleaned = String(priceStr)
    .replace(/[^0-9.,]/g, "")
    .replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function categorizeStore({ source, link }) {
  const s = (source || "").toLowerCase();
  const l = (link || "").toLowerCase();

  if (s.includes("amazon") || l.includes("amazon.ca") || l.includes("amzn.to")) return "Amazon";
  if (s.includes("walmart") || l.includes("walmart.ca")) return "Walmart";
  if (s.includes("best buy") || s.includes("bestbuy") || l.includes("bestbuy.ca")) return "BestBuy";

  return null; // on ignore les autres vendeurs
}

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ query: "", results: { Amazon: [], Walmart: [], BestBuy: [] } });

  if (!SERPAPI_KEY) {
    return res.status(500).json({
      error: "SERPAPI_KEY manquante sur Render (Environment Variables)."
    });
  }

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q,
        location: "Canada",
        hl: "en",
        gl: "ca",
        num: 50, // on récupère plus pour avoir 3 par magasin
        api_key: SERPAPI_KEY
      },
      timeout: 20000
    });

    const raw = response.data.shopping_results || [];

    const bucket = { Amazon: [], Walmart: [], BestBuy: [] };

    for (const item of raw) {
      const store = categorizeStore({ source: item.source, link: item.link });
      if (!store) continue;

      const priceNumber = parsePriceToNumber(item.price);
      // certains items ont un prix non parsable, on les ignore
      if (priceNumber === null) continue;

      bucket[store].push({
        store,
        title: item.title,
        price: item.price,           // string ex "$199.99"
        priceNumber,                 // number pour trier
        image: item.thumbnail,
        link: item.link
      });
    }

    // tri + top 3 par magasin
    for (const key of Object.keys(bucket)) {
      bucket[key].sort((a, b) => a.priceNumber - b.priceNumber);
      bucket[key] = bucket[key].slice(0, 3);
    }

    res.json({
      query: q,
      results: bucket,
      generatedAt: new Date().toISOString()
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const data = err.response?.data || null;

    res.status(status).json({
      error: "Erreur SerpAPI",
      status,
      details: data,
      message: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
