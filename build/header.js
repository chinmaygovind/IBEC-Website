// WIBEC shared nav + ticker + footer injected into static pages.
// Usage: <script src="header.js"></script> inside <body>, before page content.

(function () {
  const current = window.location.pathname.split("/").pop() || "index.html";
  const active = (href) => current === href ? ' class="active"' : '';

  const TICKER_ITEMS = [
    { sym: "WIBEC NAV",  val: "134.12",  ch: "+0.84%",       dir: "up" },
    { sym: "SPX",        val: "5,642",   ch: "+0.12%",       dir: "up" },
    { sym: "NIKKEI",     val: "38,204",  ch: "-0.31%",       dir: "dn" },
    { sym: "EURO STOXX", val: "518.4",   ch: "+0.08%",       dir: "up" },
    { sym: "HANG SENG",  val: "17,902",  ch: "-0.44%",       dir: "dn" },
    { sym: "BOVESPA",    val: "129,140", ch: "+0.61%",       dir: "up" },
    { sym: "BRENT",      val: "$86.20",  ch: "+1.12%",       dir: "up" },
    { sym: "GOLD",       val: "$2,348",  ch: "+0.22%",       dir: "up" },
    { sym: "USD/JPY",    val: "154.62",  ch: "+0.18%",       dir: "up" },
    { sym: "UST 10Y",    val: "4.21%",   ch: "-2 bps",       dir: "dn" },
    { sym: "WIBEC alpha",val: "+3.4",    ch: "vs MSCI ACWI", dir: "up" },
  ];

  const tickerChips = TICKER_ITEMS.map(t =>
    `<span class="ticker-chip"><strong>${t.sym}</strong><span style="opacity:.9">${t.val}</span><span class="${t.dir === 'up' ? 'up' : 'dn'}">${t.dir === 'up' ? '▲' : '▼'}${t.ch}</span></span>`
  ).join('');
  const tickerRow = tickerChips + tickerChips;

  document.write(`
<link rel="stylesheet" href="assets/css/wibec.css">

<!-- Nav -->
<nav class="top">
  <div class="bar">
    <a href="index.html" class="mark"><span class="dot"></span>WIBEC</a>
    <div class="links">
      <a href="index.html"${active('index.html')}>Home</a>
      <a href="committees.html"${active('committees.html')}>Committees</a>
      <a href="events.html"${active('events.html')}>Events</a>
      <a href="index.html#/portfolio">Live Portfolio</a>
      <a href="index.html#/investment">Inv. Committee</a>
      <a href="podcast.html"${active('podcast.html')}>Podcast</a>
      <a href="contact.html"${active('contact.html')}>Contact</a>
    </div>
    <div class="right">
      <span class="pulse"></span>
      <span>Markets open &middot; NYSE</span>
    </div>
  </div>
</nav>

<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TKBH48M3XP"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TKBH48M3XP');
<\/script>
`);

  // Inject footer + reveal observer at end of body
  window.addEventListener("DOMContentLoaded", function () {
    // Ticker (if .ticker-inject exists on page)
    document.querySelectorAll('.ticker-inject').forEach(el => {
      el.innerHTML = `<div class="ticker-wrap"><div class="ticker">${tickerRow}</div></div>`;
    });

    // Footer
    const footer = document.createElement('footer');
    footer.className = 'site';
    footer.innerHTML = `
      <div class="container-wide">
        <div class="wordmark">WIBEC<span style="color:var(--coral)">.</span></div>
        <div class="grid">
          <div>
            <h5>The Club</h5>
            <p style="max-width:360px;opacity:.8;margin:0;font-size:14px;line-height:1.6">
              Wharton International Business &amp; Economics Club. A student-run investment committee, macro roundtable, and apprenticeship for global markets.
            </p>
          </div>
          <div>
            <h5>Explore</h5>
            <ul>
              <li><a href="index.html">Home</a></li>
              <li><a href="index.html#/portfolio">Live Portfolio</a></li>
              <li><a href="index.html#/investment">Investment Committee</a></li>
              <li><a href="committees.html">Regional Committees</a></li>
              <li><a href="podcast.html">Podcast</a></li>
            </ul>
          </div>
          <div>
            <h5>Members</h5>
            <ul>
              <li><a href="membership.html">Apply (Fall '26)</a></li>
              <li><a href="learn.html">Foundations Program</a></li>
              <li><a href="#">Newsletter</a></li>
              <li><a href="#">Alumni Network</a></li>
            </ul>
          </div>
          <div>
            <h5>Contact</h5>
            <ul>
              <li>wibec@wharton.upenn.edu</li>
              <li>Huntsman Hall, 3730 Walnut</li>
              <li>Philadelphia, PA 19104</li>
              <li style="margin-top:16px"><a class="u-link">LinkedIn &rarr;</a></li>
              <li><a class="u-link">Instagram &rarr;</a></li>
            </ul>
          </div>
        </div>
        <div class="bottom">
          <span>&copy; 2026 Wharton International Business &amp; Economics Club</span>
          <span>A student organization of the University of Pennsylvania</span>
        </div>
      </div>`;
    document.body.appendChild(footer);

    // Scroll reveals
    const io = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) e.target.classList.add('in'); });
    }, { threshold: 0.1 });
    document.querySelectorAll('.reveal').forEach(el => io.observe(el));
  });
})();
