const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// --- Helpers ---
function normalizeStoreName(raw) {
  const s = String(raw || "").toLowerCase();
  if (s.includes("amazon")) return "Amazon";
  if (s.includes("walmart")) return "Walmart";
  if (s.includes("best buy") || s.includes("bestbuy")) return "BestBuy";
  return null;
}

function parsePriceToNumber(priceStr) {
  // Handles strings like "$279.99", "C$279.99", "279.99", "279,99"
  const s = String(priceStr || "").replace(",", ".");
  const m = s.match(/(\d+(\.\d+)?)/);
  return m ? Number(m[1]) : null;
}

function formatCAD(priceNumber) {
  if (typeof priceNumber !== "number" || !isFinite(priceNumber)) return null;
  return new Intl.NumberFormat("en-CA", {
    style: "currency",
    currency: "CAD"
  }).format(priceNumber);
}

async function serpapiGet(urlOrEndpoint, params) {
  const url = urlOrEndpoint.startsWith("http")
    ? urlOrEndpoint
    : `https://serpapi.com/${urlOrEndpoint}`;

  const resp = await axios.get(url, {
    params: { ...params, api_key: SERPAPI_KEY },
    timeout: 25000
  });
  return resp.data;
}

/**
 * Strategy:
 * 1) Search Google Shopping via SerpAPI (fast list)
 * 2) For each item, call serpapi_product_api_link
 * 3) Extract direct vendor links from product API -> online_sellers
 * 4) Keep only Amazon/Walmart/BestBuy offers, sort by price, take top 3 each
 */
app.get("/api/search", async (req, res) => {
  try {
    if (!SERPAPI_KEY) {
      return res.status(500).json({
        error: "Missing SERPAPI_KEY in Render Environment variables."
      });
    }

    const q = String(req.query.q || "").trim();
    if (!q) {
      return res.json({ results: { Amazon: [], Walmart: [], BestBuy: [] } });
    }

    // Step 1: shopping search
    const searchData = await serpapiGet("search.json", {
      engine: "google_shopping",
      q,
      location: "Canada",
      hl: "en",
      gl: "ca",
      currency: "CAD",
      // reduce noise
      no_cache: "true"
    });

    const shopping = Array.isArray(searchData.shopping_results)
      ? searchData.shopping_results
      : [];

    // Keep a reasonable number of candidates; product API calls are heavier
    const candidates = shopping.slice(0, 12);

    // Step 2-3: fetch product details and extract seller offers
    const offersByStore = { Amazon: [], Walmart: [], BestBuy: [] };

    // Fetch in small batches to avoid rate limits
    for (const item of candidates) {
      const productApi = item.serpapi_product_api_link;
      const title = item.title || "";
      const image = item.thumbnail || item.image || "";

      if (!productApi) continue;

      let productData;
      try {
        productData = await serpapiGet(productApi, {
          // sometimes helps to ensure CAD context
          gl: "ca",
          hl: "en",
          currency: "CAD",
          no_cache: "true"
        });
      } catch (e) {
        continue;
      }

      const sellers = Array.isArray(productData.online_sellers)
        ? productData.online_sellers
        : [];

      for (const s of sellers) {
        const store = normalizeStoreName(s.name || s.seller || s.source);
        if (!store) continue;

        const priceNum = parsePriceToNumber(s.price || s.total_price || s.extracted_price);
        if (priceNum == null) continue;

        const link =
          s.link ||
          s.direct_link ||
          s.url ||
          null;

        if (!link) continue;

        offersByStore[store].push({
          title,
          store,
          price_value: priceNum,
          price: formatCAD(priceNum), // formatted CAD
          image,
          link
        });
      }
    }

    // Step 4: sort and take top 3 per store (cheapest first)
    const finalize = (arr) =>
      arr
        .sort((a, b) => a.price_value - b.price_value)
        // de-duplicate by link
        .filter((x, idx, self) => self.findIndex(y => y.link === x.link) === idx)
        .slice(0, 3)
        // keep clean output
        .map(({ price_value, ...rest }) => rest);

    const results = {
      Amazon: finalize(offersByStore.Amazon),
      Walmart: finalize(offersByStore.Walmart),
      BestBuy: finalize(offersByStore.BestBuy)
    };

    return res.json({ results });
  } catch (err) {
    const status = err.response?.status || 500;
    const details = err.response?.data || null;

    return res.status(status).json({
      error: "Backend error",
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
