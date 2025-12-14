const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// --------- Helpers ---------
function normalizeStoreName(source = "") {
  const s = source.toLowerCase();

  if (s.includes("amazon")) return "Amazon";
  if (s.includes("walmart")) return "Walmart";
  if (s.includes("best buy") || s.includes("bestbuy")) return "BestBuy";

  return source || "Autre";
}

function extractNumberFromPrice(priceStr = "") {
  // Ex: "$1,129.00", "CA$99.99", "US$79.99"
  const cleaned = String(priceStr)
    .replace(/CA\$/gi, "")
    .replace(/US\$/gi, "")
    .replace(/\$/g, "")
    .replace(/,/g, "")
    .trim();

  const num = parseFloat(cleaned);
  return Number.isFinite(num) ? num : null;
}

function formatCAD(value) {
  if (!Number.isFinite(value)) return null;
  return value.toLocaleString("en-CA", { style: "currency", currency: "CAD" });
}

function isSafeUrl(urlStr) {
  try {
    const u = new URL(urlStr);
    if (!["http:", "https:"].includes(u.protocol)) return false;

    // Bloque des hosts évidents (sécurité)
    const h = u.hostname.toLowerCase();
    if (
      h === "localhost" ||
      h === "127.0.0.1" ||
      h.endsWith(".local")
    ) return false;

    return true;
  } catch {
    return false;
  }
}

// --------- Routes ---------
app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

/**
 * Recherche Google Shopping via SerpAPI
 * - no_cache=true : plus “temps réel”
 * - gl=ca + location=Canada : résultats Canada (souvent CAD)
 * Retourne 3 meilleurs (moins chers) par magasin (Amazon/Walmart/BestBuy) + lien de redirection vendeur.
 */
app.get("/api/search", async (req, res) => {
  const q = (req.query.q || "").trim();
  if (!q) return res.json({ query: "", stores: {}, flat: [] });

  if (!SERPAPI_KEY) {
    return res.status(500).json({
      error: "SERPAPI_KEY manquante sur Render (Environment Variables)",
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
        no_cache: true, // + “temps réel”
        api_key: SERPAPI_KEY,
      },
      timeout: 20000,
    });

    const raw = response.data.shopping_results || [];

    // Map résultats
    const mapped = raw.map((item) => {
      const store = normalizeStoreName(item.source || item.store || "");
      const priceStr = item.price || "";
      const priceValue = item.extracted_price ?? extractNumberFromPrice(priceStr);

      // IMPORTANT: selon les cas, SerpAPI fournit product_link / link.
      // On garde les deux, puis on clique via /api/go?u=...
      const originalLink = item.link || item.product_link || item.product_link || "";

      return {
        store,
        title: item.title || "Produit",
        price_raw: priceStr || null,
        price_value: Number.isFinite(priceValue) ? priceValue : null,
        currency: "CAD",
        price_cad: Number.isFinite(priceValue) ? formatCAD(priceValue) : null,
        image: item.thumbnail || item.image || null,
        original_link: originalLink || null,
        // lien de redirection (celui-là sera cliqué par le frontend)
        redirect_link: originalLink ? `/api/go?u=${encodeURIComponent(originalLink)}` : null,
      };
    });

    // Filtrer uniquement Amazon/Walmart/BestBuy
    const wanted = mapped.filter((x) =>
      ["Amazon", "Walmart", "BestBuy"].includes(x.store)
    );

    // Trier du moins cher au plus cher (prix manquant à la fin)
    wanted.sort((a, b) => {
      const av = a.price_value ?? Number.POSITIVE_INFINITY;
      const bv = b.price_value ?? Number.POSITIVE_INFINITY;
      return av - bv;
    });

    // 3 meilleurs par magasin
    const stores = { Amazon: [], Walmart: [], BestBuy: [] };
    for (const item of wanted) {
      if (stores[item.store].length < 3) stores[item.store].push(item);
    }

    // Flat list (utile au frontend)
    const flat = [...stores.Amazon, ...stores.Walmart, ...stores.BestBuy]
      .filter(Boolean)
      .sort((a, b) => (a.price_value ?? 1e18) - (b.price_value ?? 1e18));

    res.json({
      query: q,
      stores,
      flat,
      meta: {
        country: "Canada",
        currency: "CAD",
        realtime: true,
      },
    });
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

/**
 * Redirection vers le vendeur final
 * On suit les redirections côté backend et on fait res.redirect(finalUrl)
 */
app.get("/api/go", async (req, res) => {
  const u = req.query.u;
  if (!u || !isSafeUrl(u)) {
    return res.status(400).send("URL invalide");
  }

  try {
    // On suit les redirections
    const r = await axios.get(u, {
      maxRedirects: 10,
      timeout: 20000,
      // Certains sites aiment un User-Agent "réaliste"
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome Safari",
        "Accept-Language": "en-CA,en;q=0.9,fr-CA;q=0.8,fr;q=0.7",
      },
      validateStatus: () => true,
    });

    // URL finale après redirects
    const finalUrl = r.request?.res?.responseUrl || u;
    if (!isSafeUrl(finalUrl)) return res.status(400).send("URL finale invalide");

    return res.redirect(finalUrl);
  } catch (e) {
    return res.redirect(u); // fallback: au pire on redirige vers le lien initial
  }
});

// --------- Start ---------
const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
