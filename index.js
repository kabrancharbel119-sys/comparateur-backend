<!doctype html>
<html lang="fr">
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width,initial-scale=1" />
  <title>ValueFinder — Comparateur de prix Canada</title>

  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">

  <style>
    :root{
      --bg:#0b0f17;
      --panel:rgba(255,255,255,.06);
      --stroke:rgba(255,255,255,.12);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.6);
      --accent:#3aa0ff;
      --radius:18px;
      --max:1180px;
    }

    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      background:
        radial-gradient(900px 600px at 10% 10%, rgba(58,160,255,.25), transparent 60%),
        radial-gradient(900px 600px at 90% 20%, rgba(46,204,113,.15), transparent 55%),
        var(--bg);
      color:var(--text);
      min-height:100vh;
    }

    a{color:inherit;text-decoration:none}

    /* ===== HEADER ===== */
    header{
      position:sticky;
      top:0;
      z-index:50;
      backdrop-filter:blur(14px);
      background:linear-gradient(to bottom, rgba(11,15,23,.85), rgba(11,15,23,.55));
      border-bottom:1px solid var(--stroke);
    }

    .wrap{
      max-width:var(--max);
      margin:0 auto;
      padding:22px;
    }

    .header-row{
      display:flex;
      align-items:center;
      gap:16px;
      flex-wrap:wrap;
    }

    .brand{
      display:flex;
      align-items:center;
      gap:14px;
    }

    .brand img{
      width:42px;
      height:42px;
      border-radius:12px;
    }

    .brand-text{
      display:flex;
      flex-direction:column;
      line-height:1.1;
    }

    .brand-text strong{
      font-size:18px;
      font-weight:800;
    }

    .brand-text small{
      font-size:12px;
      color:var(--muted);
      font-weight:600;
    }

    .search{
      flex:1;
      display:flex;
      gap:10px;
      align-items:center;
      background:var(--panel);
      border:1px solid var(--stroke);
      padding:10px 12px;
      border-radius:16px;
      min-width:280px;
    }

    .search input{
      flex:1;
      background:transparent;
      border:0;
      outline:0;
      color:var(--text);
      font-size:16px;
    }

    .search button{
      border:0;
      cursor:pointer;
      padding:10px 16px;
      border-radius:14px;
      font-weight:800;
      background:linear-gradient(135deg,#3aa0ff,#1f7bdc);
      color:white;
    }

    /* ===== CONTENT ===== */
    main{
      max-width:var(--max);
      margin:0 auto;
      padding:28px 22px;
    }

    h1{
      margin:0 0 8px;
      font-size:30px;
      letter-spacing:-.4px;
    }

    p.lead{
      margin:0 0 20px;
      color:var(--muted);
      max-width:760px;
    }

    /* ===== FOOTER ===== */
    footer{
      margin-top:40px;
      border-top:1px solid var(--stroke);
      background:rgba(255,255,255,.03);
    }

    .footer-wrap{
      max-width:var(--max);
      margin:0 auto;
      padding:26px 22px;
      display:grid;
      grid-template-columns:1fr auto;
      gap:18px;
      align-items:center;
    }

    .footer-left{
      display:flex;
      flex-direction:column;
      gap:6px;
      font-size:13px;
      color:var(--muted);
    }

    .footer-right{
      font-size:13px;
      color:var(--muted);
      text-align:right;
    }

    @media (max-width:700px){
      .footer-wrap{
        grid-template-columns:1fr;
        text-align:center;
      }
      .footer-right{text-align:center}
    }
  </style>
</head>

<body>

<!-- ===== HEADER ===== -->
<header>
  <div class="wrap">
    <div class="header-row">
      <div class="brand">
        <img src="logo-valuefinder.png" alt="ValueFinder logo">
        <div class="brand-text">
          <strong>ValueFinder</strong>
          <small>Comparateur de prix Canada</small>
        </div>
      </div>

      <div class="search">
        <input type="text" placeholder="Rechercher un produit (ex: airpods, friteuse, TV…)">
        <button>Rechercher</button>
      </div>
    </div>
  </div>
</header>

<!-- ===== MAIN ===== -->
<main>
  <h1>Trouve le meilleur prix, rapidement.</h1>
  <p class="lead">
    ValueFinder compare les prix sur <strong>Amazon, Walmart et BestBuy</strong> pour t’aider à acheter au meilleur prix.
    Interface simple, résultats clairs, expérience fluide.
  </p>

  <!-- 👉 Ici viendront tes résultats (déjà faits précédemment) -->
</main>

<!-- ===== FOOTER ===== -->
<footer>
  <div class="footer-wrap">
    <div class="footer-left">
      <div><strong>ValueFinder</strong> — Opéré par <strong>VF Digital Inc.</strong></div>
      <div>© 2025 VF Digital Inc. Tous droits réservés.</div>
      <div>Les prix peuvent varier selon la disponibilité et les vendeurs.</div>
    </div>

    <div class="footer-right">
      Version BETA · Canada 🇨🇦
    </div>
  </div>
</footer>

</body>
</html>
