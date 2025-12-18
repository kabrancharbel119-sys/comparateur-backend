
const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// --- Utils ---
function parseCadPriceToNumber(priceStr) {
  if (!priceStr) return null;

  // Examples: "$279.99", "CA$279.99", "C$279.99", "$279", "279.99"
  const cleaned = String(priceStr)
    .replace(/CA\$|C\$|CAD|\s/gi, "")
    .replace(/,/g, "")
    .match(/(\d+(\.\d+)?)/);

  if (!cleaned) return null;
  const num = Number(cleaned[1]);
  return Number.isFinite(num) ? num : null;
}

function formatCad(priceNumber) {
  if (priceNumber == null || !Number.isFinite(priceNumber)) return null;
  // Keep it simple & consistent for frontend
  return `CA$${priceNumber.toFixed(2)}`;
}

function normalizeStore(source) {
  const s = String(source || "").toLowerCase();

  if (s.includes("amazon")) return "Amazon";
  if (s.includes("walmart")) return "Walmart";
  if (s.includes("best buy") || s.includes("bestbuy")) return "BestBuy";

  return null;
}

/**
 * SerpAPI google_shopping results can include:
 * - link: often Google Shopping product page (redirect)
 * - product_link: often merchant page (what we want)
 * - offers_link / offer_link: sometimes merchant/offer page
 * We'll prefer merchant-direct links if available.
 */
function pickBestMerchantLink(item) {
  // Prefer direct merchant links
  if (item.product_link) return item.product_link;
  if (item.offer_link) return item.offer_link;
  if (item.offers_link) return item.offers_link;

  // Some results have "link" to Google Shopping; keep it as last resort
  if (item.link) return item.link;

  return null;
}

function pickImage(item) {
  return item.thumbnail || item.image || item.thumbnail_url || null;
}

function safeString(x) {
  return (x === undefined || x === null) ? "" : String(x);
}

// --- Routes ---
app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

/**
 * Expected by your frontend:
 * GET /api/search?q=airpods
 * Response:
 * {
 *   query: "airpods",
 *   results: { Amazon: [...], Walmart: [...], BestBuy: [...] }
 * }
 */
app.get("/api/search", async (req, res) => {
  const q = safeString(req.query.q).trim();
  if (!q) {
    return res.json({
      query: "",
      results: { Amazon: [], Walmart: [], BestBuy: [] }
    });
  }

  if (!SERPAPI_KEY) {
    return res.status(500).json({
      error: "SERPAPI_KEY manquante sur Render",
      hint: "Render → Environment → SERPAPI_KEY = ta clé, puis redeploy"
    });
  }

  try {
    // Use Google Shopping engine, Canada context
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

    const shoppingResults = response.data?.shopping_results || [];

    // Prepare buckets
    const buckets = {
      Amazon: [],
      Walmart: [],
      BestBuy: []
    };

    for (const item of shoppingResults) {
      const store = normalizeStore(item.source || item.seller || item.merchant);
      if (!store) continue; // ignore other merchants

      const priceNumber = parseCadPriceToNumber(item.price);
      if (priceNumber == null) continue; // skip if no price

      const link = pickBestMerchantLink(item);
      if (!link) continue;

      const product = {
        store,
        title: safeString(item.title),
        // Frontend uses string; keep it CAD
        price: formatCad(priceNumber),
        // Optional numeric for debugging/sorting if needed
        price_value: priceNumber,
        image: pickImage(item),
        link
      };

      // Only keep useful entries
      if (!product.title || !product.image) {
        // If image missing, we still keep it (some results don’t have thumbnails)
        // but title is required
        if (!product.title) continue;
      }

      buckets[store].push(product);
    }

    // Sort each store by price ascending and keep top 3
    for (const store of Object.keys(buckets)) {
      buckets[store].sort((a, b) => (a.price_value || 1e18) - (b.price_value || 1e18));
      buckets[store] = buckets[store].slice(0, 3);
    }

    // Final response shape expected by your frontend
    return res.json({
      query: q,
      results: {
        Amazon: buckets.Amazon,
        Walmart: buckets.Walmart,
        BestBuy: buckets.BestBuy
      }
    });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || null;

    return res.status(status).json({
      error: "Erreur SerpAPI",
      status,
      details,
      message: err.message
    });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
