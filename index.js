const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// --- Helpers ---
function parsePriceToNumber(priceStr) {
  if (!priceStr || typeof priceStr !== "string") return null;

  // Common formats: "$199.99", "CA$199.99", "C$199.99", "199.99", "$1,299.99"
  const cleaned = priceStr
    .replace(/\s/g, "")
    .replace(/CA\$/gi, "")
    .replace(/C\$/gi, "")
    .replace(/\$/g, "")
    .replace(/,/g, "");

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function detectCurrency(priceStr) {
  if (!priceStr || typeof priceStr !== "string") return "CAD";
  // If it explicitly mentions CA$ or CAD, treat as CAD.
  if (/CA\$/i.test(priceStr) || /CAD/i.test(priceStr)) return "CAD";
  // If it has $ and we're searching in Canada with gl=ca, assume CAD.
  if (/\$/g.test(priceStr)) return "CAD";
  return "CAD";
}

function normalizeStoreName(source) {
  const s = (source || "").toLowerCase();
  if (s.includes("amazon")) return "Amazon";
  if (s.includes("walmart")) return "Walmart";
  if (s.includes("best buy") || s.includes("bestbuy")) return "BestBuy";
  return source || "Autre";
}

function pickTop3Cheapest(items) {
  return items
    .filter(x => typeof x.priceNumber === "number")
    .sort((a, b) => a.priceNumber - b.priceNumber)
    .slice(0, 3);
}

app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ amazon: [], walmart: [], bestbuy: [], other: [] });

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
        api_key: SERPAPI_KEY
      },
      timeout: 20000
    });

    const shopping = response.data.shopping_results || [];

    const normalized = shopping.map((item) => {
      const priceStr = item.price || item.extracted_price?.toString() || null;
      const priceNumber = item.extracted_price ?? parsePriceToNumber(priceStr);

      return {
        title: item.title || "Produit",
        store: normalizeStoreName(item.source),
        priceText: priceStr,
        priceNumber: typeof priceNumber === "number" ? priceNumber : null,
        currency: detectCurrency(priceStr),
        image: item.thumbnail || item.thumbnail_url || null,
        link: item.link || item.product_link || null
      };
    }).filter(x => x.link); // keep only clickable items

    const amazonAll = normalized.filter(x => x.store === "Amazon");
    const walmartAll = normalized.filter(x => x.store === "Walmart");
    const bestbuyAll = normalized.filter(x => x.store === "BestBuy");
    const otherAll = normalized.filter(x => !["Amazon", "Walmart", "BestBuy"].includes(x.store));

    const amazon = pickTop3Cheapest(amazonAll);
    const walmart = pickTop3Cheapest(walmartAll);
    const bestbuy = pickTop3Cheapest(bestbuyAll);
    const other = pickTop3Cheapest(otherAll);

    res.json({
      query: q,
      currency: "CAD",
      amazon,
      walmart,
      bestbuy,
      other
    });

  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || null;

    res.status(status).json({
      error: "Erreur SerpAPI",
      status,
      message: err.message,
      details
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
