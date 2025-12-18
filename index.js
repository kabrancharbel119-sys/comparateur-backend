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
      --panel2:rgba(255,255,255,.08);
      --text:rgba(255,255,255,.92);
      --muted:rgba(255,255,255,.62);
      --stroke:rgba(255,255,255,.10);
      --shadow:0 16px 40px rgba(0,0,0,.45);
      --radius:18px;
      --radius2:14px;
      --max:1180px;
      --brand:linear-gradient(135deg,#7b61ff,#3498db);
    }
    *{box-sizing:border-box}
    body{
      margin:0;
      font-family:Inter,system-ui,-apple-system,Segoe UI,Roboto,Arial,sans-serif;
      color:var(--text);
      background:
        radial-gradient(900px 600px at 10% 10%, rgba(123,97,255,.35), transparent 60%),
        radial-gradient(900px 600px at 90% 20%, rgba(46,204,113,.18), transparent 55%),
        radial-gradient(800px 500px at 60% 100%, rgba(52,152,219,.18), transparent 60%),
        var(--bg);
      min-height:100vh;
    }
    a{color:inherit;text-decoration:none}
    .wrap{max-width:var(--max);margin:0 auto;padding:24px}

    /* HEADER */
    header{
      position:sticky;top:0;z-index:50;
      backdrop-filter:blur(16px);
      background:linear-gradient(to bottom,rgba(11,15,23,.85),rgba(11,15,23,.45));
      border-bottom:1px solid var(--stroke);
    }
    .header-inner{
      display:flex;align-items:center;gap:16px;flex-wrap:wrap;
    }
    .brand{
      display:flex;align-items:center;gap:12px;
      font-weight:800;letter-spacing:.3px;
    }
    .logo{
      width:36px;height:36px;border-radius:12px;
      background:var(--brand);
      box-shadow:0 10px 26px rgba(123,97,255,.35);
      display:flex;align-items:center;justify-content:center;
      font-weight:900;
    }
    .brand-title{
      display:flex;flex-direction:column;line-height:1.1
    }
    .brand-title span{font-size:18px}
    .brand-title small{color:var(--muted);font-weight:600}

    .search{
      flex:1;display:flex;gap:10px;align-items:center;
      background:var(--panel);
      border:1px solid var(--stroke);
      padding:10px;border-radius:16px;
      min-width:280px;
    }
    .search input{
      flex:1;background:transparent;border:0;outline:0;
      color:var(--text);font-size:16px;
    }
    .btn{
      border:0;cursor:pointer;
      padding:10px 14px;border-radius:14px;
      font-weight:800;color:white;
      background:var(--brand);
      box-shadow:0 10px 22px rgba(52,152,219,.25);
    }

    /* CONTENT */
    .hero h1{margin:18px 0 6px;font-size:28px}
    .hero p{margin:0;color:var(--muted);max-width:760px}

    .status{
      margin-top:18px;
      background:var(--panel);
      border:1px solid var(--stroke);
      padding:12px 14px;border-radius:var(--radius2);
      color:var(--muted);display:none
    }
    .status.show{display:block}

    /* FOOTER */
    footer{
      margin-top:50px;
      border-top:1px solid var(--stroke);
      background:rgba(0,0,0,.25);
    }
    .footer-inner{
      max-width:var(--max);
      margin:0 auto;
      padding:24px;
      display:flex;
      flex-direction:column;
      gap:10px;
      text-align:center;
      color:var(--muted);
      font-size:13px;
    }
    .footer-inner strong{color:var(--text)}
  </style>
</head>

<body>

<!-- HEADER -->
<header>
  <div class="wrap header-inner">
    <div class="brand">
      <div class="logo">VF</div>
      <div class="brand-title">
        <span>ValueFinder</span>
        <small>Comparateur de prix Canada</small>
      </div>
    </div>

    <div class="search">
      <input id="q" placeholder="Ex : airpods, playstation, friteuse..." />
      <button class="btn" id="btn">Rechercher</button>
    </div>
  </div>
</header>

<!-- CONTENT -->
<main class="wrap">
  <section class="hero">
    <h1>Trouve le meilleur prix, en quelques secondes.</h1>
    <p>ValueFinder compare les meilleurs articles sur Amazon, Walmart et BestBuy.  
    Résultats clairs, rapides et triés.</p>
    <div id="status" class="status"></div>
  </section>

  <section id="results"></section>
</main>

<!-- FOOTER -->
<footer>
  <div class="footer-inner">
    <div><strong>ValueFinder</strong> — un service de <strong>VF Digital Inc.</strong></div>
    <div>⚠️ Les prix et disponibilités peuvent varier selon les vendeurs.</div>
    <div>© 2025 VF Digital Inc. — Tous droits réservés.</div>
  </div>
</footer>

</body>
</html>
