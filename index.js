const express = require("express");
const axios = require("axios");
const cors = require("cors");

const app = express();
app.use(cors());

const BESTBUY_API_KEY = "REMPLACE_MOI";

app.get("/api/search", async (req, res) => {
  const query = req.query.q;
  if (!query) {
    return res.json([]);
  }

  try {
    const url = `https://api.bestbuy.com/v1/products(search=${encodeURIComponent(
      query
    )})?format=json&show=name,salePrice,image,url&sort=salePrice.asc&pageSize=3&apiKey=${BESTBUY_API_KEY}`;

    const response = await axios.get(url);

    const products = response.data.products.map(p => ({
      store: "BestBuy",
      title: p.name,
      price: p.salePrice,
      image: p.image,
      link: p.url
    }));

    res.json(products);
  } catch (err) {
    res.status(500).json({ error: "Erreur BestBuy" });
  }
});

app.get("/", (req, res) => {
  res.send("Backend comparateur actif ✅");
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log("Serveur lancé sur port", PORT));
