// WIBEC shared nav + ticker + footer injected into static pages.
// Usage: <script src="header.js"></script> inside <body>, before page content.
//
// Optional embed (e.g. index.html + React shell): set before this script runs:
//   window.__WIBEC_HEADER_EMBED = { skipFooter: true, skipGa: true, skipCssLink: true };

(function () {
  document.documentElement.setAttribute('data-aesthetic', 'terminal');
  const EMBED = window.__WIBEC_HEADER_EMBED || {};
  const current = window.location.pathname.split("/").pop() || "index.html";
  const routeHash = () => (window.location.hash || "").replace(/^#\/?/, "");

  const TICKER_ITEMS = [
    { sym: "VOO",    val: "490.00", ch: "-0.82%", dir: "dn" },
    { sym: "SCHG",   val: "90.00",  ch: "-1.12%", dir: "dn" },
    { sym: "PLTR",   val: "105.00", ch: "+2.45%", dir: "up" },
    { sym: "INFY",   val: "18.00",  ch: "-0.33%", dir: "dn" },
    { sym: "TCEHY",  val: "52.00",  ch: "+0.77%", dir: "up" },
    { sym: "FMX",    val: "78.00",  ch: "-0.44%", dir: "dn" },
    { sym: "SBLK",   val: "14.00",  ch: "+0.11%", dir: "up" },
    { sym: "XFIV",   val: "25.00",  ch: "+0.02%", dir: "up" },
    { sym: "IBE.MC", val: "15.00",  ch: "-0.55%", dir: "dn" },
    { sym: "YPF",    val: "28.00",  ch: "+1.22%", dir: "up" },
  ];

  // Yahoo Finance symbols — IBEC current portfolio
  const YF_SYMBOLS = [
    { sym: "VOO",    yf: "VOO"    },
    { sym: "SCHG",   yf: "SCHG"   },
    { sym: "PLTR",   yf: "PLTR"   },
    { sym: "INFY",   yf: "INFY"   },
    { sym: "TCEHY",  yf: "TCEHY"  },
    { sym: "FMX",    yf: "FMX"    },
    { sym: "SBLK",   yf: "SBLK"   },
    { sym: "XFIV",   yf: "XFIV"   },
    { sym: "IBE.MC", yf: "IBE.MC" },
    { sym: "YPF",    yf: "YPF"    },
  ];

  let liveItems = TICKER_ITEMS.slice();

  function fmtNum(n) {
    return n >= 1000 ? n.toLocaleString("en-US", { maximumFractionDigits: 0 }) : n.toFixed(2);
  }

  function chipHtml(t) {
    return `<span class="ticker-chip"><strong>${t.sym}</strong><span style="opacity:.9">${t.val}</span><span class="${t.dir === 'up' ? 'up' : 'dn'}">${t.dir === 'up' ? '▲' : '▼'}${t.ch}</span></span>`;
  }

  function renderTicker() {
    const row = liveItems.map(chipHtml).join('');
    document.querySelectorAll('.ticker-inject').forEach(el => {
      el.innerHTML = `<div class="ticker-wrap"><div class="ticker">${row}${row}</div></div>`;
    });
  }

  async function fetchLive() {
    try {
      const results = await Promise.allSettled(
        YF_SYMBOLS.map(({ sym, yf }) =>
          fetch(`https://query1.finance.yahoo.com/v8/finance/chart/${yf}?interval=1d&range=1d`)
            .then(r => r.json())
            .then(data => {
              const q = data?.chart?.result?.[0];
              if (!q) return null;
              const meta  = q.meta;
              const price = meta.regularMarketPrice;
              const prev  = meta.previousClose || meta.chartPreviousClose;
              const chAbs = price - prev;
              const chPct = (chAbs / prev) * 100;
              return {
                sym,
                val: sym === "UST 10Y" ? price.toFixed(2) + "%" : fmtNum(price),
                ch:  (chPct >= 0 ? "+" : "") + chPct.toFixed(2) + "%",
                dir: chPct >= 0 ? "up" : "dn",
              };
            })
        )
      );
      const live = results.filter(r => r.status === "fulfilled" && r.value).map(r => r.value);
      if (live.length > 0) {
        const map = Object.fromEntries(live.map(l => [l.sym, l]));
        liveItems = liveItems.map(p => map[p.sym] || p);
        renderTicker();
      }
    } catch (_) {}
  }

  const pages = [
    { label: "Home",           href: "index.html"             },
    { label: "Committees",     href: "committees.html"        },
    { label: "Events",         href: "events.html"            },
    { label: "Live Portfolio", href: "index.html#/portfolio"  },
    { label: "Inv. Committee", href: "index.html#/investment" },
    { label: "Podcast",        href: "podcast.html"           },
    { label: "Contact",        href: "contact.html"           },
  ];

  function navLinkIsActive(href) {
    const hash = routeHash();
    const homeRoute = hash === "" || hash === "home";
    if (href === "index.html") return current === "index.html" && homeRoute;
    if (href === "index.html#/portfolio") return current === "index.html" && hash === "portfolio";
    if (href === "index.html#/investment") return current === "index.html" && hash === "investment";
    const file = href.split("#")[0];
    return current === file;
  }

  const homeMarkHref = current === "index.html" ? "#/home" : "index.html";

  const navLinks = pages.map(p => {
    const isActive = navLinkIsActive(p.href);
    return `<a href="${p.href}" class="wpill-link${isActive ? ' is-active' : ''}">${p.label}</a>`;
  }).join('');

  const cssLink = EMBED.skipCssLink ? "" : `<link rel="stylesheet" href="assets/css/wibec.css">\n`;
  const gaBlock = EMBED.skipGa ? "" : `
<!-- Google Analytics -->
<script async src="https://www.googletagmanager.com/gtag/js?id=G-TKBH48M3XP"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-TKBH48M3XP');
<\/script>
`;

  document.write(`${cssLink}<style>
  .wpill-nav {
    position: fixed; top: 18px; left: 50%; transform: translateX(-50%);
    z-index: 200000; width: calc(100% - 120px); max-width: 1120px;
    background: transparent;
    -webkit-backdrop-filter: none;
    backdrop-filter: none;
    border: 1px solid transparent;
    border-radius: 9999px;
    box-shadow: none;
    transition: background 0.45s ease, backdrop-filter 0.45s ease, -webkit-backdrop-filter 0.45s ease, border-color 0.45s ease, box-shadow 0.45s ease;
  }
  .wpill-nav.docked {
    background: rgba(6,14,38,0.32);
    -webkit-backdrop-filter: blur(22px) saturate(1.6);
    backdrop-filter: blur(22px) saturate(1.6);
    border-color: rgba(0,212,255,0.14);
    box-shadow: 0 8px 40px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.06);
  }
  .wpill-bar {
    display: grid; grid-template-columns: auto 1fr auto;
    align-items: center; padding: 8px 18px 8px 22px; gap: 24px;
  }
  .wpill-mark {
    font-family: var(--sans); font-weight: 700; font-size: 16px;
    color: #eaf1ff; letter-spacing: -0.01em;
    display: inline-flex; align-items: center; gap: 8px;
    text-decoration: none; white-space: nowrap;
  }
  .wpill-mark .dot {
    width: 7px; height: 7px; background: var(--coral);
    border-radius: 50%; display: inline-block;
    box-shadow: 0 0 10px var(--coral);
  }
  .wpill-links { display: flex; justify-content: center; gap: 4px; }
  .wpill-link {
    display: inline-block; padding: 8px 16px; font-size: 13px; line-height: 18px;
    border-radius: 9999px; transition: all .2s;
    font-weight: 500; text-decoration: none; color: rgba(234,241,255,0.62);
    background: transparent; border: 1px solid transparent; white-space: nowrap;
  }
  .wpill-link:hover { color: #fff; background: rgba(255,255,255,0.08); }
  .wpill-link.is-active { color: #fff; font-weight: 600; }
  .wpill-nav.docked .wpill-link.is-active {
    color: #fff; font-weight: 600;
    background: rgba(0,212,255,0.2);
    border-color: rgba(0,212,255,0.35);
  }
  .ticker-inject { padding-top: 88px; }
  .ticker-inject .ticker-wrap {
    background: #071428; border-color: rgba(0,212,255,0.12);
  }
</style>

<!-- Nav -->
<nav class="wpill-nav" id="wpill-nav">
  <div class="wpill-bar">
    <a href="${homeMarkHref}" class="wpill-mark"><span class="dot"></span>WIBEC</a>
    <div class="wpill-links">${navLinks}</div>
    <span></span>
  </div>
</nav>
${gaBlock}
`);

  window.addEventListener("DOMContentLoaded", function () {
    const nav = document.getElementById('wpill-nav');
    if (nav) {
      // Keep the bar under <body> so position:fixed is always viewport-relative.
      // (Legacy pages inject this script inside #page-wrapper, which can get transform
      // from main.css — that traps "fixed" children and they scroll away with the page.)
      if (nav.parentElement !== document.body) {
        document.body.appendChild(nav);
      }
    }

    if (nav) {
      function scrollY() {
        return window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      }
      // index.html: tall hero — dock only after ~1.55 viewports (matches former React Nav).
      // All other pages: dock after a small scroll so the pill actually "turns on".
      function dockThreshold() {
        if (current === 'index.html') return window.innerHeight * 1.55;
        return 56;
      }
      const onScroll = () => {
        if (scrollY() > dockThreshold()) nav.classList.add('docked');
        else nav.classList.remove('docked');
      };
      onScroll();
      window.addEventListener('scroll', onScroll, { passive: true });
      window.addEventListener('resize', onScroll, { passive: true });
    }

    function syncNavActive() {
      document.querySelectorAll('#wpill-nav .wpill-link').forEach(function (a) {
        var href = a.getAttribute('href');
        a.classList.toggle('is-active', navLinkIsActive(href));
      });
    }
    window.addEventListener('hashchange', syncNavActive);
    syncNavActive();

    // Ticker — only when page includes a mount point
    if (document.querySelector('.ticker-inject')) {
      renderTicker();
      fetchLive();
      setInterval(fetchLive, 60000);
    }

    if (EMBED.skipFooter) return;

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
              <li>whartonibec@wharton.upenn.edu</li>
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
