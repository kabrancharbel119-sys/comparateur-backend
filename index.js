const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Convertit "$1,299.00" -> 1299.00
function parsePriceToNumber(priceText) {
  if (!priceText) return null;
  const cleaned = String(priceText)
    .replace(/[^0-9.,]/g, "") // garde chiffres , .
    .replace(/,/g, ""); // enlève séparateurs milliers
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function normalizeStoreName(s) {
  const t = (s || "").toLowerCase();
  if (t.includes("amazon")) return "Amazon";
  if (t.includes("walmart")) return "Walmart";
  if (t.includes("best buy") || t.includes("bestbuy")) return "BestBuy";
  return s || "Autre";
}

app.get("/api/search", async (req, res) => {
  const q = req.query.q;
  if (!q) return res.json([]);

  if (!SERPAPI_KEY) {
    return res.status(500).json({ error: "SERPAPI_KEY manquante dans Render" });
  }

  try {
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q,
        location: "Canada",
        hl: "fr",
        gl: "ca",
        api_key: SERPAPI_KEY,
      },
      timeout: 20000,
    });

    const raw = response.data.shopping_results || [];

    const results = raw.map((item) => {
      // SerpAPI peut donner différents champs selon le résultat
      const link =
        item.link ||
        item.product_link ||
        item.offer_link ||
        item.redirect_link ||
        null;

      const priceText = item.price || item.extracted_price || null;
      const price = parsePriceToNumber(priceText);

      return {
        title: item.title || "Produit",
        store: normalizeStoreName(item.source || item.seller || item.merchant || "Autre"),
        price,         // nombre (pour trier)
        priceText,     // texte (pour afficher si besoin)
        image: item.thumbnail || item.image || null,
        link,
      };
    });

    // On enlève ceux qui n’ont pas de lien (sinon clic impossible)
    const filtered = results.filter((p) => p.link);

    res.json(filtered);
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || null;

    res.status(status).json({
      error: "Erreur SerpAPI",
      status,
      details,
      message: err.message,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
