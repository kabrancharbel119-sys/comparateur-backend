const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// --- Helpers ---
function normalizeStoreName(source = "") {
  const s = source.toLowerCase();

  // BestBuy (éviter "Best Buy Marketplace" => on le garde quand même dans BestBuy)
  if (s.includes("best buy")) return "BestBuy";

  // Walmart
  if (s.includes("walmart")) return "Walmart";

  // Amazon
  if (s.includes("amazon")) return "Amazon";

  return null;
}

function parsePriceToNumber(priceStr = "") {
  // Ex: "$1,129.00", "C$69.99", "69.99"
  const cleaned = String(priceStr)
    .replace(/C\$/gi, "")
    .replace(/\$/g, "")
    .replace(/CAD/gi, "")
    .replace(/,/g, "")
    .trim();

  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatCAD(n) {
  try {
    return new Intl.NumberFormat("en-CA", {
      style: "currency",
      currency: "CAD",
      maximumFractionDigits: 2,
    }).format(n);
  } catch {
    return `$${n.toFixed(2)} CAD`;
  }
}

// Essaie d'extraire un lien vendeur direct depuis un lien Google (quand possible)
function tryExtractDirectUrl(link) {
  try {
    const u = new URL(link);
    const sp = u.searchParams;

    // parfois c'est ?url=... ou ?adurl=...
    const direct = sp.get("url") || sp.get("adurl") || sp.get("u");
    if (direct) return decodeURIComponent(direct);

    return link;
  } catch {
    return link;
  }
}

/**
 * Best effort: si SerpAPI nous donne déjà un lien direct, on le prend.
 * Sinon, on essaye d'extraire url=... depuis le lien.
 */
function pickBestLink(item) {
  const directCandidates = [
    item.product_link,
    item.redirect_link,
    item.merchant_link,
    item.offer_link,
    item.link,
  ].filter(Boolean);

  if (!directCandidates.length) return null;

  // Premier candidat (souvent link), puis extraction url=
  return tryExtractDirectUrl(directCandidates[0]);
}

// --- API ---
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) {
    return res.json({
      query: "",
      results: { Amazon: [], Walmart: [], BestBuy: [] },
    });
  }

  if (!SERPAPI_KEY) {
    return res.status(500).json({
      error: "SERPAPI_KEY manquante dans Render > Environment",
    });
  }

  try {
    // On force Canada (gl=ca) et location Canada
    const response = await axios.get("https://serpapi.com/search.json", {
      params: {
        engine: "google_shopping",
        q,
        location: "Canada",
        hl: "en",
        gl: "ca",
        api_key: SERPAPI_KEY,
      },
      timeout: 30000,
    });

    const shopping = response.data.shopping_results || [];

    // On prépare la structure attendue par ton frontend
    const grouped = {
      Amazon: [],
      Walmart: [],
      BestBuy: [],
    };

    // On filtre uniquement Amazon/Walmart/BestBuy + normalisation + prix CAD
    for (const item of shopping) {
      const storeKey = normalizeStoreName(item.source || item.store || "");
      if (!storeKey) continue;

      const rawPrice = item.price || item.extracted_price || item.price_raw || "";
      const n = parsePriceToNumber(rawPrice);

      // Si pas de prix, on ignore (sinon ça casse le tri)
      if (n === null) continue;

      grouped[storeKey].push({
        title: item.title || "Produit",
        store: storeKey === "BestBuy" ? "BestBuy.ca" : storeKey === "Walmart" ? "Walmart.ca" : "Amazon.ca",
        // CAD format
        price: formatCAD(n),
        price_number: n, // utile pour tri backend
        image: item.thumbnail || item.image || "",
        // lien vendeur (best effort)
        link: pickBestLink(item) || "",
      });
    }

    // Tri du moins cher au plus cher + top 3 par magasin
    for (const k of Object.keys(grouped)) {
      grouped[k] = grouped[k]
        .sort((a, b) => (a.price_number ?? 9e15) - (b.price_number ?? 9e15))
        .slice(0, 3)
        .map(({ price_number, ...rest }) => rest); // on retire price_number
    }

    return res.json({
      query: q,
      results: grouped,
      meta: {
        source: "SerpAPI (Google Shopping)",
        country: "CA",
      },
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || null;

    return res.status(status).json({
      error: "Erreur SerpAPI",
      status,
      message: err.message,
      details,
    });
  }
});

app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
