<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ValueFinder — Comparateur Canada</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg:#0b0f17;
      --panel:rgba(255,255,255,.06);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.6);
      --stroke:rgba(255,255,255,.1);
      --radius:18px;
      --shadow:0 16px 40px rgba(0,0,0,.45);
      --max:1180px;
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Inter,system-ui,sans-serif;
      color:var(--text);
      background:
        radial-gradient(900px 600px at 10% 10%, rgba(123,97,255,.35), transparent 60%),
        radial-gradient(900px 600px at 90% 20%, rgba(52,152,219,.25), transparent 55%),
        var(--bg);
      min-height:100vh;
    }
    a{color:inherit;text-decoration:none}
    .wrap{max-width:var(--max);margin:auto;padding:24px}

    /* HEADER */
    header{
      position:sticky;top:0;z-index:50;
      backdrop-filter:blur(16px);
      background:linear-gradient(to bottom, rgba(11,15,23,.9), rgba(11,15,23,.5));
      border-bottom:1px solid var(--stroke);
    }
    .row{display:flex;gap:14px;align-items:center;flex-wrap:wrap}

    .brand{display:flex;gap:12px;align-items:center;font-weight:800}
    .logoBox{
      width:42px;height:42px;border-radius:14px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.12);
      display:grid;place-items:center;
      box-shadow:0 10px 24px rgba(0,0,0,.3);
    }
    .logoSvg{width:28px;height:28px}
    .wordmark .name{
      font-size:16px;font-weight:900;
    }
    .wordmark .a{color:#fff}
    .wordmark .b{
      background:linear-gradient(135deg,#7B61FF,#3498DB);
      -webkit-background-clip:text;
      background-clip:text;
      color:transparent;
    }
    .wordmark small{color:var(--muted);font-weight:700;font-size:12px}

    .search{
      flex:1;display:flex;gap:10px;
      background:rgba(255,255,255,.06);
      border:1px solid rgba(255,255,255,.12);
      padding:10px;border-radius:16px;
    }
    .search input{
      flex:1;background:transparent;border:0;
      color:white;font-size:16px;outline:0;
    }
    .btn{
      padding:10px 14px;border:0;cursor:pointer;
      border-radius:14px;font-weight:800;
      background:linear-gradient(135deg,#7B61FF,#3498DB);
      color:white;
    }

    /* HERO */
    .hero h1{margin:24px 0 8px;font-size:28px}
    .hero p{color:var(--muted);max-width:760px}

    /* RESULTS */
    .section{
      margin-top:22px;
      background:rgba(255,255,255,.04);
      border:1px solid rgba(255,255,255,.1);
      border-radius:var(--radius);
      box-shadow:var(--shadow);
      overflow:hidden;
    }
    .sectionHead{
      padding:14px 16px;
      display:flex;justify-content:space-between;
      border-bottom:1px solid rgba(255,255,255,.08);
    }
    .grid{
      padding:16px;
      display:grid;
      grid-template-columns:repeat(3,1fr);
      gap:16px;
    }
    @media(max-width:900px){.grid{grid-template-columns:repeat(2,1fr)}}
    @media(max-width:600px){.grid{grid-template-columns:1fr}}

    .card{
      background:rgba(255,255,255,.05);
      border:1px solid rgba(255,255,255,.1);
      border-radius:16px;
      overflow:hidden;
      display:flex;
      flex-direction:column;
      transition:.15s;
    }
    .card:hover{transform:translateY(-3px);background:rgba(255,255,255,.07)}
    .thumb{
      height:170px;
      display:flex;align-items:center;justify-content:center;
      background:rgba(0,0,0,.25);
    }
    .thumb img{max-width:90%;max-height:90%;object-fit:contain}
    .cardBody{padding:14px;display:flex;flex-direction:column;gap:8px}
    .cardTitle{font-weight:800;font-size:14px;line-height:1.3}
    .price{font-weight:900;font-size:16px}
    .store{color:var(--muted);font-size:12px;font-weight:800}
    .linkBtn{
      margin-top:10px;padding:10px;
      border-radius:12px;
      text-align:center;
      border:1px solid rgba(255,255,255,.14);
      background:rgba(255,255,255,.06);
      font-weight:900;
    }

    /* FOOTER */
    footer{
      margin-top:40px;
      border-top:1px solid var(--stroke);
      padding:20px;
      text-align:center;
      color:var(--muted);
      font-size:12px;
    }
  </style>
</head>

<body>

<header>
  <div class="wrap row">
    <div class="brand">
      <div class="logoBox">
        <!-- LOGO VALUEFINDER -->
        <svg class="logoSvg" viewBox="0 0 64 64" fill="none">
          <defs>
            <linearGradient id="g" x1="0" y1="0" x2="1" y2="1">
              <stop stop-color="#7B61FF"/>
              <stop offset="1" stop-color="#3498DB"/>
            </linearGradient>
          </defs>
          <path d="M20 22h26l-2 18H24l-2-18Z" stroke="url(#g)" stroke-width="3.6"/>
          <circle cx="26" cy="46" r="3" fill="url(#g)"/>
          <circle cx="42" cy="46" r="3" fill="url(#g)"/>
          <circle cx="45" cy="28" r="9" stroke="white" stroke-width="3.6"/>
          <path d="M52 35l7 7" stroke="white" stroke-width="3.6"/>
        </svg>
      </div>
      <div class="wordmark">
        <div class="name"><span class="a">Value</span><span class="b">Finder</span></div>
        <small>Comparateur Canada</small>
      </div>
    </div>

    <div class="search">
      <input id="q" placeholder="airpods, playstation, friteuse..." />
      <button class="btn" id="btn">Rechercher</button>
    </div>
  </div>
</header>

<main class="wrap">
  <section class="hero">
    <h1>Trouve le meilleur prix, vite.</h1>
    <p>3 produits par magasin (Amazon, Walmart, BestBuy), triés du moins cher au plus cher.</p>
  </section>

  <div id="results"></div>
</main>

<footer>
  © 2025 <strong>VF Digital Inc.</strong> — ValueFinder™  
  <br/>Comparateur de prix indépendant — Canada
</footer>

<script>
const BACKEND_URL = "https://comparateur-backend-0l68.onrender.com";
const q = document.getElementById("q");
const btn = document.getElementById("btn");
const results = document.getElementById("results");

function card(item){
  return `
  <a class="card" href="${item.link}" target="_blank" rel="noopener">
    <div class="thumb"><img src="${item.image}"></div>
    <div class="cardBody">
      <div class="cardTitle">${item.title}</div>
      <div class="price">${item.price}</div>
      <div class="store">${item.store}</div>
      <div class="linkBtn">Voir l’article</div>
    </div>
  </a>`;
}

function section(name, items){
  return `
  <div class="section">
    <div class="sectionHead"><strong>${name}</strong></div>
    <div class="grid">${items.map(card).join("")}</div>
  </div>`;
}

async function search(){
  const query = q.value.trim();
  if(!query) return;
  results.innerHTML = "Recherche en cours...";
  const res = await fetch(`${BACKEND_URL}/api/search?q=${encodeURIComponent(query)}`);
  const data = await res.json();
  results.innerHTML =
    section("Amazon.ca", data.results.Amazon) +
    section("Walmart.ca", data.results.Walmart) +
    section("BestBuy.ca", data.results.BestBuy);
}

btn.onclick = search;
q.onkeydown = e => e.key==="Enter" && search();
</script>

</body>
</html>
