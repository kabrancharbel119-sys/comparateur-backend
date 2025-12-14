import express from "express";
import cors from "cors";
import axios from "axios";

const app = express();
app.use(cors());
app.use(express.json());

const SERPAPI_KEY = process.env.SERPAPI_KEY;

// Magasins qu’on veut garder (tu peux en ajouter)
const TARGET_STORES = [
  { key: "amazon", label: "Amazon", match: ["amazon"] },
  { key: "walmart", label: "Walmart", match: ["walmart"] },
  { key: "bestbuy", label: "Best Buy", match: ["best buy", "bestbuy"] },
];

// Helpers
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function normalizeStoreName(name = "") {
  const s = name.toLowerCase();
  for (const t of TARGET_STORES) {
    if (t.match.some((m) => s.includes(m))) return t.key;
  }
  return null;
}

function toNumberPrice(extracted_price, priceStr) {
  if (typeof extracted_price === "number") return extracted_price;
  if (!priceStr) return null;
  // "$1,299.99" -> 1299.99
  const cleaned = String(priceStr).replace(/[^\d.,]/g, "").replace(/,/g, "");
  const n = Number(cleaned);
  return Number.isFinite(n) ? n : null;
}

function formatCAD(value) {
  if (typeof value !== "number") return null;
  return new Intl.NumberFormat("en-CA", { style: "currency", currency: "CAD" }).format(value);
}

async function serpapiSearch(params) {
  const url = "https://serpapi.com/search.json";
  const { data } = await axios.get(url, { params, timeout: 30000 });
  return data;
}

/**
 * 1) On fait une recherche "google_shopping"
 * 2) On récupère des "page_token" pour interroger "google_immersive_product"
 * 3) Dans immersive_product: product_results.stores[] contient:
 *    - name (magasin)
 *    - link (LIEN MARCHAND DIRECT)
 *    - price / extracted_price
 *    - logo, etc.
 * Doc: la structure "stores[].link" est un lien vers le produit chez le magasin. :contentReference[oaicite:1]{index=1}
 */
app.get("/api/search", async (req, res) => {
  try {
    if (!SERPAPI_KEY) {
      return res.status(500).json({ error: "SERPAPI_KEY manquante dans Render (Environment Variables)." });
    }

    const q = String(req.query.q || "").trim();
    if (!q) return res.json({ query: q, results: {}, flat: [], updatedAt: new Date().toISOString() });

    // 1) Google Shopping (Canada)
    const shopping = await serpapiSearch({
      engine: "google_shopping",
      q,
      api_key: SERPAPI_KEY,
      gl: "ca",
      hl: "en",
      google_domain: "google.ca",
      location: "Canada",
      // "no_cache" aide à être plus proche du temps réel (peut coûter + de crédits selon ton plan)
      no_cache: "true",
      num: 20,
    });

    const shoppingResults = Array.isArray(shopping.shopping_results) ? shopping.shopping_results : [];

    // On va collecter 3 items par magasin
    const grouped = { amazon: [], walmart: [], bestbuy: [] };

    // Petit cache pour éviter de recharger 2x le même token
    const tokenCache = new Map();

    // On boucle des résultats shopping, et on va chercher les offres marchands via immersive_product
    for (const sr of shoppingResults) {
      // Arrêt dès qu’on a 3 par magasin
      const done = Object.values(grouped).every((arr) => arr.length >= 3);
      if (done) break;

      const pageToken =
        sr?.immersive_product_page_token ||
        sr?.immersive_product_page_token?.page_token ||
        sr?.serpapi_immersive_product_api_link?.page_token ||
        null;

      // SerpAPI renvoie souvent un champ direct:
      // sr.serpapi_immersive_product_api_link (URL) OU immersive_product_page_token
      // Si on a carrément le lien API, on le préfère.
      const apiLink = sr?.serpapi_immersive_product_api_link;

      let immersive;
      try {
        if (apiLink && typeof apiLink === "string") {
          if (tokenCache.has(apiLink)) {
            immersive = tokenCache.get(apiLink);
          } else {
            const { data } = await axios.get(apiLink, { timeout: 30000 });
            immersive = data;
            tokenCache.set(apiLink, immersive);
          }
        } else if (pageToken) {
          const cacheKey = `token:${pageToken}`;
          if (tokenCache.has(cacheKey)) {
            immersive = tokenCache.get(cacheKey);
          } else {
            immersive = await serpapiSearch({
              engine: "google_immersive_product",
              page_token: pageToken,
              api_key: SERPAPI_KEY,
              gl: "ca",
              hl: "en",
              google_domain: "google.ca",
              location: "Canada",
              no_cache: "true",
            });
            tokenCache.set(cacheKey, immersive);
          }
        } else {
          continue;
        }
      } catch {
        continue;
      }

      const stores = immersive?.product_results?.stores;
      if (!Array.isArray(stores) || stores.length === 0) continue;

      // Image / titre côté immersive si dispo
      const baseTitle = immersive?.product_results?.title || sr?.title || "Produit";
      const baseImage =
        immersive?.product_results?.thumbnails?.[0] ||
        immersive?.product_results?.thumbnails ||
        sr?.thumbnail ||
        sr?.image ||
        null;

      // On parcourt les offres “stores”
      for (const offer of stores) {
        const storeKey = normalizeStoreName(offer?.name);
        if (!storeKey) continue;
        if (grouped[storeKey].length >= 3) continue;

        const priceValue = toNumberPrice(offer?.extracted_price, offer?.price);
        if (priceValue == null) continue;

        const link = offer?.link;
        if (!link || typeof link !== "string" || !link.startsWith("http")) continue;

        grouped[storeKey].push({
          store: TARGET_STORES.find((t) => t.key === storeKey)?.label || storeKey,
          storeKey,
          title: offer?.title || baseTitle,
          priceValue,
          price: formatCAD(priceValue),
          currency: "CAD",
          image: baseImage,
          logo: offer?.logo || null,
          link, // ✅ lien direct marchand (BestBuy/Walmart/Amazon etc.) :contentReference[oaicite:2]{index=2}
          rating: offer?.rating ?? null,
          reviews: offer?.reviews ?? null,
        });
      }

      // Petite pause pour éviter d’être trop agressif
      await sleep(150);
    }

    // Tri par prix (moins cher -> plus cher) et on coupe à 3
    for (const k of Object.keys(grouped)) {
      grouped[k] = grouped[k]
        .sort((a, b) => (a.priceValue ?? 999999) - (b.priceValue ?? 999999))
        .slice(0, 3);
    }

    // Flat list si tu veux afficher “tout mélangé”
    const flat = Object.values(grouped)
      .flat()
      .sort((a, b) => (a.priceValue ?? 999999) - (b.priceValue ?? 999999));

    res.json({
      query: q,
      updatedAt: new Date().toISOString(),
      results: grouped,
      flat,
    });
  } catch (e) {
    res.status(500).json({ error: "Erreur SerpAPI", details: String(e?.message || e) });
  }
});

app.get("/", (req, res) => res.send("Backend comparateur actif ✅"));

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
{
  "name": "comparateur-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "index.js",
  "scripts": {
    "start": "node index.js"
  },
  "dependencies": {
    "axios": "^1.7.9",
    "cors": "^2.8.5",
    "express": "^4.19.2"
  }
}
