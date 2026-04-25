# WIBEC Real-Content Pass — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Replace mock placeholder data in the new WIBEC editorial design with real club content from the pre-redesign site (commit 276fa34), add a Learn dropdown nav with three sub-pages (Investment Committee, IFP, Board), and apply targeted copy / link / contrast fixes from the user's edit sheet.

**Architecture:** Static site under `build/`. Most pages are plain HTML. `index.html` is a single-file React app loaded via CDN (React 18 UMD + Babel-standalone). Shared header/footer/ticker live in `build/header.js` and inject via `document.write`. Live portfolio data is served by `api/index.py` (Flask + Yahoo Finance + `build/trades.csv`). The site is deployed as a static bundle (per `vercel.json` + `render.yaml` + GitHub Actions to S3 per the README).

**Tech Stack:** Plain HTML/CSS, React 18 via CDN, Babel-standalone, Flask + yfinance backend, Yahoo Finance API, GitHub Actions deploy to AWS S3.

**Reference spec:** `docs/superpowers/specs/2026-04-25-wibec-real-content-pass-design.md`

**No automated tests exist.** Verification in this plan is **manual via local HTTP server** (`python3 -m http.server 8000` from `build/`, open `http://localhost:8000`). Each task ends with a specific browser-side check + a `git grep` confirmation where applicable.

---

## File map

| File | Action | Reason |
|---|---|---|
| `build/assets/IBEC_IPS.pdf` | Restore from commit `276fa34` | IPS download link target |
| `build/images/wibec.ico` | Create (32×32 from `wibec-logo.png`) | Favicon |
| `build/header.js` | Modify | Logo in pill, Learn dropdown, footer fixes, route changes |
| `build/index.html` | Modify | Hero tagline, REGIONS, EVENTS, TRADES (live), HOLDINGS (live), CommitteePage rewrite, delete PortfolioPage |
| `build/committees.html` | Modify | Khoi → Robert, dark CTA contrast fix |
| `build/events.html` | Modify | Delete Fall 2026 section |
| `build/podcast.html` | Modify | Headline change, YouTube iframe embed |
| `build/contact.html` | Modify | Delete Press option |
| `build/learn.html` | Rewrite | Real IFP content (3 pillars) |
| `build/board.html` | Create | 14 members grid |
| All `build/*.html` | Modify | Email rewrite + favicon link swap (sweep) |

---

## Task 1 — Restore IPS PDF

**Files:**
- Restore: `build/assets/IBEC_IPS.pdf` (from commit `276fa34`)

- [ ] **Step 1 — Restore the file from git**

```bash
git checkout 276fa34 -- build/assets/IBEC_IPS.pdf
```

- [ ] **Step 2 — Verify the file exists and is non-empty**

```bash
ls -la build/assets/IBEC_IPS.pdf
file build/assets/IBEC_IPS.pdf
```
Expected: file exists, type reports "PDF document", size > 0.

- [ ] **Step 3 — Commit**

```bash
git add build/assets/IBEC_IPS.pdf
git commit -m "Restore IBEC_IPS.pdf from pre-redesign commit"
```

---

## Task 2 — Generate WIBEC favicon

**Files:**
- Create: `build/images/wibec.ico`

- [ ] **Step 1 — Generate a 32×32 .ico from the existing logo**

Try ImageMagick first; fall back to `sips` (macOS native) + `magick`/`convert`:

```bash
# Preferred — multi-resolution ico:
magick build/images/wibec-logo.png -resize 32x32 -background none -define icon:auto-resize=32,16 build/images/wibec.ico

# Fallback (macOS, no ImageMagick): produce 32x32 png then rename
# sips -Z 32 -s format png build/images/wibec-logo.png --out /tmp/wibec-32.png
# (ico requires conversion; install imagemagick via `brew install imagemagick` if missing)
```

- [ ] **Step 2 — Verify file exists and is small**

```bash
ls -la build/images/wibec.ico
file build/images/wibec.ico
```
Expected: ICO file, ~1-10KB, format identified as "MS Windows icon resource".

- [ ] **Step 3 — Commit**

```bash
git add build/images/wibec.ico
git commit -m "Add WIBEC favicon derived from wibec-logo.png"
```

---

## Task 3 — Email rewrite sweep

**Files:**
- Modify: every `build/*.html` and `build/header.js` containing `wibec@wharton.upenn.edu`

- [ ] **Step 1 — Identify all occurrences**

```bash
git grep -n "wibec@wharton.upenn.edu" -- build/
```
Note the file list. Expected occurrences (as of writing): `build/header.js` (footer), `build/contact.html` (multiple lines), `build/membership.html` (FAQ), and possibly others. Re-run to see actual current state before editing.

- [ ] **Step 2 — Replace across all matched files**

Use a single in-place sed (BSD/macOS uses `-i ''`):

```bash
git grep -lz "wibec@wharton.upenn.edu" -- build/ | xargs -0 sed -i '' 's/wibec@wharton\.upenn\.edu/whartonibec@wharton.upenn.edu/g'
```

- [ ] **Step 3 — Verify zero remaining matches**

```bash
git grep -n "wibec@wharton.upenn.edu" -- build/
```
Expected: no output.

```bash
git grep -n "whartonibec@wharton.upenn.edu" -- build/ | head -20
```
Expected: the same number of lines as the original Step 1 count, all using the new address.

- [ ] **Step 4 — Verify no unintended matches were touched**

```bash
git diff --stat
```
Expected: only `.html` and `.js` files in `build/` listed; no CSS, no config files, no `wibec` substring outside email contexts changed.

- [ ] **Step 5 — Commit**

```bash
git add build/
git commit -m "Replace wibec@wharton.upenn.edu with whartonibec@wharton.upenn.edu site-wide"
```

---

## Task 4 — Favicon link sweep

**Files:**
- Modify: every `build/*.html` referencing `images/ibec.ico`

- [ ] **Step 1 — Identify all occurrences**

```bash
git grep -n 'href="images/ibec\.ico"' -- 'build/*.html'
```

- [ ] **Step 2 — Replace across all matched files**

```bash
git grep -lz 'href="images/ibec\.ico"' -- 'build/*.html' | xargs -0 sed -i '' 's|href="images/ibec\.ico"|href="images/wibec.ico"|g'
```

- [ ] **Step 3 — Verify no remaining old refs**

```bash
git grep -n 'href="images/ibec\.ico"' -- 'build/*.html'
```
Expected: no output.

- [ ] **Step 4 — Verify in browser**

Start local server and open one page:

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html
```

Confirm: browser tab shows the WIBEC globe icon (not the old IBEC favicon). Stop the server (`fg`, then Ctrl-C).

- [ ] **Step 5 — Commit**

```bash
git add build/
git commit -m "Switch favicon to wibec.ico across all pages"
```

---

## Task 5 — Committees page: Khoi → Robert + apprentice contrast fix

**Files:**
- Modify: `build/committees.html` (line ~101 and lines ~176-188)

- [ ] **Step 1 — Replace Europe chair name**

Use Edit tool:
- Old: `<div class="mono" style="font-size:11px; color:var(--ink-500)">Chair: Khoi Dinh</div>`
- New: `<div class="mono" style="font-size:11px; color:var(--ink-500)">Chair: Robert Dennis Solomon</div>`

- [ ] **Step 2 — Fix dark Apprenticeship CTA section contrast**

Find the section (around lines 176-188). Two changes:

1. The italic body paragraph currently uses `color:rgba(255,255,255,0.7)` — change to `color:rgba(255,255,255,0.92)`:
   - Old: `<p class="serif" style="font-size:20px; font-style:italic; color:rgba(255,255,255,0.7); max-width:600px; margin:0 auto 40px">`
   - New: `<p class="serif" style="font-size:20px; font-style:italic; color:rgba(255,255,255,0.92); max-width:600px; margin:0 auto 40px">`

2. The "Foundations Program" ghost button border + color — bump the border opacity:
   - Old: `<a href="learn.html" class="btn btn-ghost" style="margin:0 8px; border-color:rgba(255,255,255,0.3); color:var(--paper-2)">Foundations Program</a>`
   - New: `<a href="learn.html" class="btn btn-ghost" style="margin:0 8px; border-color:rgba(255,255,255,0.6); color:#fff">Foundations Program</a>`

- [ ] **Step 3 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/committees.html
```

Scroll to Europe card → "Chair: Robert Dennis Solomon" visible. Scroll to dark "Start as an apprentice. Become a lead." section → body text and ghost button are clearly readable on the navy background. Stop server.

- [ ] **Step 4 — Verify no Khoi remains anywhere**

```bash
git grep -n -i "khoi" -- build/
```
Expected: no output.

- [ ] **Step 5 — Commit**

```bash
git add build/committees.html
git commit -m "committees: replace Khoi Dinh with Robert Dennis Solomon; fix dark CTA contrast"
```

---

## Task 6 — Events page: delete Fall 2026 section

**Files:**
- Modify: `build/events.html` (lines ~94-128)

- [ ] **Step 1 — Delete the entire Fall 2026 section**

Locate the section starting at the second `<div class="section-head">` block (the one beginning with `<div class="n">§ 02 — Fall 2026</div>`). Delete it AND the entire `<div style="border-top:1px solid var(--ink-900)">` block that contains the two Sep events. The result: after the first event list closes, jump straight to the Weekly rhythm section.

In `build/events.html`, delete from the `<div class="section-head" style="margin-top:96px">` opening (~line 94) through the closing `</div>` of the events list block (~line 128) — i.e., the entire `§ 02 — Fall 2026` section.

- [ ] **Step 2 — Verify no Sep events remain**

```bash
git grep -n "Sep 04\|Sep 11\|Fall 2026" build/events.html
```
Expected: no output.

- [ ] **Step 3 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/events.html
```

Scroll: Spring 2026 events visible (Apr 25, Apr 29, May 01, May 08); no Fall 2026 section/header; "Weekly rhythm" section follows directly. Stop server.

- [ ] **Step 4 — Commit**

```bash
git add build/events.html
git commit -m "events: remove Fall 2026 placeholder section"
```

---

## Task 7 — Podcast page: headline + YouTube iframe embed

**Files:**
- Modify: `build/podcast.html` (line ~23 and lines ~43-49)

- [ ] **Step 1 — Replace the headline**

- Old (line 23): `Long-form. <em style="color:var(--coral-ink)">No slop.</em>`
- New: `Insights From Wharton <em style="color:var(--coral-ink)">And Beyond.</em>`

- [ ] **Step 2 — Replace the placeholder play tile with a YouTube iframe**

Find the `<a href="https://www.youtube.com/@PennIBEC" …>` block at lines ~43-49 (the one rendering the `▶` icon and "Watch on YouTube" caption). Replace the entire `<a>` element with:

```html
<iframe
  src="https://www.youtube.com/embed/4V0AyusOVOQ?list=PLJg1V_W0HDkJW1xRELLbOYy5Aybhy08Yw"
  title="WIBEC Podcast — Latest Episode"
  frameborder="0"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen
  style="aspect-ratio:16/9; width:100%; border:1px solid var(--rule)">
</iframe>
```

- [ ] **Step 3 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/podcast.html
```

Headline reads "Insights From Wharton **And Beyond.**" (second half coral italic). The featured episode area shows an embedded YouTube player that plays the playlist. Stop server.

- [ ] **Step 4 — Commit**

```bash
git add build/podcast.html
git commit -m "podcast: change headline to 'Insights From Wharton And Beyond'; embed YouTube playlist"
```

---

## Task 8 — Contact page: delete Press topic

**Files:**
- Modify: `build/contact.html` (line ~115)

- [ ] **Step 1 — Delete the Press / Media option**

Use Edit tool:
- Old: `              <option>Press / Media</option>\n`
- New: ``  (delete the entire line)

If the Edit fails on the literal newline, use this exact replacement:
- Old:
  ```
              <option>Alumni / Partnership</option>
              <option>Press / Media</option>
              <option>Other</option>
  ```
- New:
  ```
              <option>Alumni / Partnership</option>
              <option>Other</option>
  ```

- [ ] **Step 2 — Verify**

```bash
git grep -n "Press / Media\|Press/Media\|Press.media" build/contact.html
```
Expected: no output.

- [ ] **Step 3 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/contact.html
```

Click the Topic dropdown. Options: Recruiting / Membership · Speaking / Events · Alumni / Partnership · Other. No "Press / Media". Stop server.

- [ ] **Step 4 — Commit**

```bash
git add build/contact.html
git commit -m "contact: remove Press / Media topic option"
```

---

## Task 9 — Index home: hero tagline + REGIONS Khoi fix

**Files:**
- Modify: `build/index.html` (line 36 in REGIONS array; line 548 hero paragraph)

- [ ] **Step 1 — Fix Europe lead in REGIONS array**

In `build/index.html` line 36:
- Old: `  { id: "europe",    name: "Europe",               lead: "Khoi Dinh",       ret: "+6.4%",  lat: 50,  lon: 10   },`
- New: `  { id: "europe",    name: "Europe",               lead: "Robert Dennis Solomon", ret: "+6.4%", lat: 50, lon: 10 },`

- [ ] **Step 2 — Replace hero tagline**

In `build/index.html` line 548:
- Old: `              Wharton's student committee for international markets — an apprenticeship in macro, a working capital vehicle, and a newsroom for the world's economies.`
- New: `              The Wharton International Business and Economics Club (WIBEC) at Penn focuses on the intersection of economics, global affairs, and international relations. Through conversation with industry professionals, analysis of current events, and club workshops, this club aims to provide members with a stronger understanding of how to navigate the world of global business.`

- [ ] **Step 3 — Verify Khoi gone**

```bash
git grep -n -i "khoi" build/
```
Expected: no output (this confirms Task 5 + Task 9 together purged Khoi everywhere).

- [ ] **Step 4 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html
```

Scroll into the hero — the italic body text under the headline is the new full paragraph. The roster grid at the bottom of the hero shows "Robert Dennis Solomon" under Europe (not Khoi Dinh). Scroll to the CommitteesMap section ("Six geographic committees…") — Europe row also shows Robert Dennis Solomon. Stop server.

- [ ] **Step 5 — Commit**

```bash
git add build/index.html
git commit -m "index: replace mock hero tagline with real WIBEC mandate; fix Europe lead"
```

---

## Task 10 — Index home: delete Fall events from EVENTS array

**Files:**
- Modify: `build/index.html` (lines 75-82 EVENTS array)

- [ ] **Step 1 — Delete the two Sep events**

In the `EVENTS` array (line 75-82), remove the last two entries (Sep 04 and Sep 11):

- Old:
  ```js
  const EVENTS = [
    { date: "Apr 25", time: "TBD",   title: "Kiwi Social",                                                          loc: "TBD",           kind: "Social"     },
    { date: "Apr 29", time: "TBD",   title: "Speaker Event — Neel Doshi, Former MD at Citi & UBS",                  loc: "TBD",           kind: "Speaker"    },
    { date: "May 01", time: "19:00", title: "Regional Committee Apprentice Final Pitches",                           loc: "Huntsman F65",  kind: "Committee"  },
    { date: "May 08", time: "17:00", title: "Semester Close — Portfolio Review & Social",                            loc: "JMHH Forum",    kind: "Club"       },
    { date: "Sep 04", time: "18:00", title: "Fall Recruiting — Information Session",                  loc: "Huntsman G06",  kind: "Recruiting" },
    { date: "Sep 11", time: "19:00", title: "Case Night — Sovereign Debt in Argentina",               loc: "Huntsman F60",  kind: "Committee"  },
  ];
  ```
- New:
  ```js
  const EVENTS = [
    { date: "Apr 25", time: "TBD",   title: "Kiwi Social",                                                          loc: "TBD",           kind: "Social"     },
    { date: "Apr 29", time: "TBD",   title: "Speaker Event — Neel Doshi, Former MD at Citi & UBS",                  loc: "TBD",           kind: "Speaker"    },
    { date: "May 01", time: "19:00", title: "Regional Committee Apprentice Final Pitches",                           loc: "Huntsman F65",  kind: "Committee"  },
    { date: "May 08", time: "17:00", title: "Semester Close — Portfolio Review & Social",                            loc: "JMHH Forum",    kind: "Club"       },
  ];
  ```

- [ ] **Step 2 — Verify**

```bash
git grep -n "Sep 04\|Sep 11\|Case Night\|Fall Recruiting" build/index.html
```
Expected: no output.

- [ ] **Step 3 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/
```

Scroll to "§ 03 — Calendar" — only 4 events listed (Apr 25, Apr 29, May 01, May 08). Stop server.

- [ ] **Step 4 — Commit**

```bash
git add build/index.html
git commit -m "index: remove Fall 2026 entries from home EVENTS strip"
```

---

## Task 11 — Index home: TRADES from trades.csv (live load)

**Files:**
- Modify: `build/index.html` (TRADES array lines 66-73; add fetch logic)

The `EventsStrip`, `Hero`, `WhoWeAre` etc. read from `TRADES` directly. We'll convert the static array into a state populated by a one-time fetch of `trades.csv` at app start, with the existing array as the initial fallback.

- [ ] **Step 1 — Add CSV-fetch helper near the top of the React script (after the TRADES constant)**

Insert this helper function immediately after the `TRADES` array declaration (around line 73), before `const EVENTS = [`:

```js
// Parse trades.csv at runtime → array shaped like the TRADES constant.
// CSV format: company,shares,purchase-date  (date as YYYY/MM/DD)
async function fetchTradesFromCsv() {
  try {
    const res = await fetch("trades.csv", { cache: "no-store" });
    if (!res.ok) return null;
    const text = await res.text();
    const lines = text.trim().split(/\r?\n/).slice(1); // drop header
    const rows = lines.map(line => {
      const [ticker, sharesRaw, dateRaw] = line.split(",");
      const shares = parseInt(sharesRaw, 10);
      const [y, m, d] = dateRaw.split("/");
      return {
        date: `${m}.${d}`,
        action: shares < 0 ? "EXIT" : "BUY",
        ticker: ticker.trim(),
        px: "—",
        size: `${Math.abs(shares)} sh`,
        by: "Committee",
        sortKey: `${y}${m}${d}`,
      };
    });
    // Most recent first
    rows.sort((a, b) => b.sortKey.localeCompare(a.sortKey));
    return rows.map(({ sortKey, ...rest }) => rest);
  } catch (_) {
    return null;
  }
}
```

- [ ] **Step 2 — Modify the PortfolioPage component (around line 838) to use state**

> **Note:** Task 14 will delete the entire PortfolioPage. To avoid wasted work, **skip this step if Task 14 will run before this task is verified.** If running in declared order (T11 before T14), apply the change; the deletion in T14 supersedes it. The cleaner sequencing is to run **Task 14 first, then Task 11** — see the ordering note at the top of Task 14.

Inside `PortfolioPage()`, the trades are rendered from `TRADES` directly. The trades section ALSO appears nowhere else on the home page — Hero and others don't render trades. So the only consumer of `TRADES` is `PortfolioPage`. **If Task 14 runs first and deletes PortfolioPage, the TRADES array becomes dead code.** In that case, simply delete the unused `TRADES` constant in this task instead.

Choose ONE of the two paths and execute:

**Path A (Task 14 already ran — PortfolioPage is gone):**

Delete the `TRADES = […]` constant declaration (lines 66-73) and delete the `fetchTradesFromCsv` helper added in Step 1 (it now has no consumer). Skip Step 3.

**Path B (Task 14 has not yet run):**

Add state + effect at the top of PortfolioPage (right after `function PortfolioPage() {`):

```js
const [trades, setTrades] = React.useState(TRADES);
React.useEffect(() => {
  fetchTradesFromCsv().then(rows => { if (rows) setTrades(rows); });
}, []);
```

Then change `{TRADES.map((t,i) => (` (around line 959) to `{trades.map((t,i) => (`.

- [ ] **Step 3 — Verify in browser (only if Path B)**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html#/portfolio
```

Open DevTools → Network tab. Reload. Confirm a request to `trades.csv` returns 200. The "Recent trades" section shows tickers from the CSV (TMCV.NS exit, TMPV.NS exit, INFY, FMX, XFIV, SCHG, PLTR, VOO, TCEHY, IBE.MC, SBLK, YPF) sorted newest first. Stop server.

- [ ] **Step 4 — Commit**

```bash
git add build/index.html
git commit -m "index: populate trades section from trades.csv (live)"
```

(If Path A: commit message is `"index: remove dead TRADES constant after PortfolioPage removal"`.)

---

## Task 12 — Index home: HOLDINGS from /api endpoint

**Files:**
- Modify: `build/index.html` (HOLDINGS consumer, add fetch logic)

Same caveat as Task 11: HOLDINGS is consumed by `PortfolioPage`. If Task 14 runs first and deletes PortfolioPage, the HOLDINGS array becomes dead code. Run order: **prefer Task 14 before Tasks 11 + 12** to avoid wasted work.

- [ ] **Step 1 — Decide path based on Task 14 status**

If Task 14 ran first → PortfolioPage no longer exists → delete the `HOLDINGS` constant (lines 53-64) and skip the rest of this task. Commit:

```bash
git add build/index.html
git commit -m "index: remove dead HOLDINGS constant after PortfolioPage removal"
```

Otherwise (Task 12 runs before Task 14) → continue to Step 2.

- [ ] **Step 2 — Add fetch helper after HOLDINGS constant**

```js
// Map ticker → region for live data (api/index.py doesn't return region).
const TICKER_TO_REGION = {
  VOO: "North America", SCHG: "North America", PLTR: "North America", XFIV: "North America",
  INFY: "South Asia",   TCEHY: "East Asia",   FMX: "Latin America",   YPF: "Latin America",
  SBLK: "Europe",       "IBE.MC": "Europe",
};

async function fetchHoldingsFromApi() {
  try {
    const res = await fetch("/api", { cache: "no-store" });
    if (!res.ok) return null;
    const data = await res.json();
    const summary = data.summary || {};
    const items = (data.holdings || []).map(h => ({
      ticker: h.ticker,
      name:   h.ticker, // API doesn't return company name; ticker as fallback
      region: TICKER_TO_REGION[h.ticker] || "—",
      w:      summary.current_value > 0 ? +(h.market_value / summary.current_value * 100).toFixed(1) : 0,
      d:      0, // 1-day delta not returned by /api; column shows 0.00%
      ret:    (h.return_pct >= 0 ? "+" : "") + h.return_pct.toFixed(1) + "%",
    }));
    return items;
  } catch (_) {
    return null;
  }
}
```

- [ ] **Step 3 — Add state + effect at top of PortfolioPage (after the `trades` state from Task 11)**

```js
const [holdings, setHoldings] = React.useState(HOLDINGS);
React.useEffect(() => {
  fetchHoldingsFromApi().then(rows => { if (rows && rows.length) setHoldings(rows); });
}, []);
```

Replace `{HOLDINGS.map((h,i) => (` (around line 931) with `{holdings.map((h,i) => (`.

- [ ] **Step 4 — Verify in browser (only if Step 2/3 path was taken)**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html#/portfolio
```

DevTools → Network: a request to `/api` (will likely 404 against the local Python server — that's OK, the static HOLDINGS fallback should display). To exercise the live path, run the Flask backend in a second shell from the project root:

```bash
cd api && python3 -c "from index import app; app.run(port=5000, debug=True)"
```

Then point the fetch at `http://localhost:5000/api` (only for local testing — do not commit this URL change). Confirm the holdings table populates with live weights. Stop both servers.

- [ ] **Step 5 — Commit**

```bash
git add build/index.html
git commit -m "index: populate holdings section from /api with static fallback"
```

---

## Task 13 — Index home: rewrite Investment Committee React page

**Files:**
- Modify: `build/index.html` (CommitteePage component, lines 1003-1104)

- [ ] **Step 1 — Replace the entire CommitteePage component**

In `build/index.html`, replace the `function CommitteePage() { … }` block (lines 1003-1104) with:

```js
// ── Investment Committee page ──────────────────────────────
function CommitteePage() {
  return (
    <div className="page-enter">

      {/* Hero */}
      <section style={{ padding:"64px 0 40px", borderBottom:"1px solid var(--rule)" }}>
        <div className="container-wide">
          <div className="page-header-meta">
            <span>§ Investment Committee</span>
            <span>Portfolio Governance</span>
            <span>WIBEC Penn Fund</span>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"1.2fr 1fr", gap:64, alignItems:"end" }}>
            <h1 className="display" style={{ fontSize:"clamp(56px,7vw,108px)", margin:0 }}>
              The committee <em style={{ color:"var(--coral-ink)" }}>of&nbsp;record.</em>
            </h1>
            <p className="serif" style={{ fontSize:18, fontStyle:"italic", color:"var(--ink-700)", margin:0 }}>
              The Investment Committee is the decision-making body responsible for managing the WIBEC Penn Fund. Composed of members appointed by the Executive Board, the IC reviews research and recommendations from regional committees, votes on portfolio changes, and ensures adherence to the Fund's Investment Policy Statement.
            </p>
          </div>
        </div>
      </section>

      {/* Three roles */}
      <section style={{ padding:"64px 0", borderBottom:"1px solid var(--rule)" }}>
        <div className="container-wide">
          <div className="section-head">
            <div><div className="n">§ 01 — Roles</div><h2>How the IC operates.</h2></div>
            <p>Three interconnected roles drive the Fund's investment process from research to execution.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(3,1fr)", gap:0, borderTop:"1px solid var(--ink-900)" }}>
            {[
              { n:"01", t:"Executive Board.",      b:"Determines the composition of the Investment Committee, appoints and manages IC members, and oversees the strategic direction of the Fund." },
              { n:"02", t:"Investment Committee.", b:"Holds decision rights for all portfolio changes, reviews recommendations, votes on trade approvals, and monitors compliance with the IPS." },
              { n:"03", t:"Regional Committees.",  b:"Develop in-depth research and security recommendations within their respective geographic regions, feeding ideas up to the IC for review." },
            ].map((s, i) => (
              <div key={s.n} style={{ padding:"36px 32px 36px 0", borderRight:i<2?"1px solid var(--rule)":"none", paddingLeft:i>0?32:0 }}>
                <div className="mono" style={{ fontSize:12, color:"var(--coral-ink)", letterSpacing:"0.14em" }}>{s.n} / 03</div>
                <h3 className="h-serif" style={{ fontSize:28, margin:"12px 0 14px" }}>{s.t}</h3>
                <p style={{ margin:0, fontSize:15, color:"var(--ink-500)", lineHeight:1.6 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Investment Objective */}
      <section style={{ padding:"64px 0", background:"var(--paper-2)", borderBottom:"1px solid var(--rule)" }}>
        <div className="container-wide">
          <div className="section-head">
            <div><div className="n">§ 02 — Objective</div><h2>What we invest in.</h2></div>
            <p>The Fund targets high total returns through a diversified public-markets portfolio while giving members practical experience in global macro awareness, security selection, portfolio construction, and risk management.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(2,1fr)", gap:32 }}>
            {[
              { t:"Equities",          b:"Publicly traded common stocks, ADRs, and equity ETFs across all market capitalizations." },
              { t:"Fixed Income",      b:"U.S. Treasuries and agencies, investment-grade corporate bonds, and sovereign bonds of developed and select emerging markets." },
              { t:"Alternatives",      b:"Liquid, exchange-traded exposures such as listed REITs, commodity ETFs, listed infrastructure, and listed private equity vehicles." },
              { t:"Cash & Equivalents",b:"U.S. Treasury bills, government money-market funds, and similar high-liquidity instruments." },
            ].map(it => (
              <div key={it.t} style={{ padding:"24px 28px", background:"#fff", border:"1px solid var(--rule)" }}>
                <h4 className="h-serif" style={{ fontSize:20, margin:"0 0 10px" }}>{it.t}</h4>
                <p style={{ margin:0, fontSize:14, color:"var(--ink-500)", lineHeight:1.6 }}>{it.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Strategic Asset Allocation */}
      <section style={{ padding:"64px 0", borderBottom:"1px solid var(--rule)" }}>
        <div className="container-wide">
          <div className="section-head">
            <div><div className="n">§ 03 — Allocation</div><h2>Targets &amp; bands.</h2></div>
            <p>The Fund maintains target allocations with defined bands. If an allocation breaches its permitted range, the IC rebalances back within bounds.</p>
          </div>
          <table style={{ width:"100%", borderCollapse:"collapse", borderTop:"2px solid var(--ink-900)" }}>
            <thead>
              <tr>
                <th style={{ textAlign:"left",  padding:"16px 0", fontFamily:"var(--mono)", fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-500)", borderBottom:"1px solid var(--rule)" }}>Asset Class</th>
                <th style={{ textAlign:"right", padding:"16px 0", fontFamily:"var(--mono)", fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-500)", borderBottom:"1px solid var(--rule)" }}>Target</th>
                <th style={{ textAlign:"right", padding:"16px 0", fontFamily:"var(--mono)", fontSize:11, letterSpacing:"0.14em", textTransform:"uppercase", color:"var(--ink-500)", borderBottom:"1px solid var(--rule)" }}>Permitted Range</th>
              </tr>
            </thead>
            <tbody>
              {[
                ["Equities",            "60%", "55% – 65%"],
                ["Fixed Income",        "25%", "22% – 28%"],
                ["Alternatives",        "10%",  "8% – 12%"],
                ["Cash & Equivalents",  "5%",   "3% – 7%"],
              ].map(([cls, tgt, range]) => (
                <tr key={cls}>
                  <td className="h-serif" style={{ fontSize:18, padding:"18px 0", borderBottom:"1px solid var(--rule)" }}>{cls}</td>
                  <td className="num"     style={{ textAlign:"right", padding:"18px 0", borderBottom:"1px solid var(--rule)" }}>{tgt}</td>
                  <td className="mono"    style={{ textAlign:"right", padding:"18px 0", borderBottom:"1px solid var(--rule)", fontSize:13, color:"var(--ink-500)" }}>{range}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>

      {/* Investment Process */}
      <section style={{ padding:"64px 0", background:"var(--paper-2)", borderBottom:"1px solid var(--rule)" }}>
        <div className="container-wide">
          <div className="section-head">
            <div><div className="n">§ 04 — Process</div><h2>From idea to position.</h2></div>
            <p>From idea generation to ongoing monitoring, every step of the process is designed to mirror institutional best practices.</p>
          </div>
          <div style={{ display:"grid", gridTemplateColumns:"repeat(4,1fr)", gap:32 }}>
            {[
              { n:"01", t:"Idea generation.",   b:"Investment ideas originate from regional committees or any WIBEC member and are submitted for IC review." },
              { n:"02", t:"Review & vote.",     b:"The IC discusses thesis quality, portfolio fit, and risk impact. Proposals are approved by simple majority of voting members when a quorum is present." },
              { n:"03", t:"Execution & record.",b:"Approved trades are executed, recorded in the WIBEC fund trade log, and reflected in performance and risk reporting." },
              { n:"04", t:"Monitor & exit.",    b:"Positions are reviewed regularly and may be reduced or exited if the thesis breaks, valuation reaches target, or a position causes guideline breaches." },
            ].map(s => (
              <div key={s.n} style={{ paddingTop:24, borderTop:"1px solid var(--ink-900)", display:"flex", flexDirection:"column", gap:14 }}>
                <div className="mono" style={{ fontSize:12, color:"var(--coral-ink)", letterSpacing:"0.14em" }}>{s.n} / 04</div>
                <h3 className="h-serif" style={{ fontSize:26, margin:0 }}>{s.t}</h3>
                <p style={{ margin:0, fontSize:15, color:"var(--ink-500)", lineHeight:1.6 }}>{s.b}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* IPS Download CTA */}
      <section style={{ padding:"96px 0", background:"var(--ink-900)", color:"var(--paper-2)" }}>
        <div className="container-wide" style={{ textAlign:"center" }}>
          <div className="eyebrow" style={{ color:"var(--coral)" }}>◆ Investment Policy Statement</div>
          <h2 className="display" style={{ fontSize:"clamp(48px,6vw,96px)", margin:"16px 0 24px", color:"var(--paper-2)" }}>
            Read the <em style={{ color:"var(--coral)" }}>IPS.</em>
          </h2>
          <p className="serif" style={{ fontSize:18, fontStyle:"italic", color:"rgba(255,255,255,0.85)", maxWidth:600, margin:"0 auto 36px" }}>
            The IPS is the Fund's governing document for portfolio construction, permissible investments, risk limits, decision-making, and monitoring.
          </p>
          <a href="assets/IBEC_IPS.pdf" target="_blank" rel="noopener" className="btn btn-coral">Download IPS (PDF) <span className="arr">→</span></a>
        </div>
      </section>

    </div>
  );
}
```

- [ ] **Step 2 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html#/investment
```

Page renders with sections: Hero ("The committee of record"), § 01 Roles (3 cards), § 02 Objective (4 asset classes), § 03 Allocation (table with 4 rows), § 04 Process (4 steps), CTA section with "Download IPS (PDF)" link. Click the IPS link → opens `assets/IBEC_IPS.pdf` in a new tab. Stop server.

- [ ] **Step 3 — Commit**

```bash
git add build/index.html
git commit -m "index: rewrite React Investment Committee page with real IPS-based content"
```

---

## Task 14 — Index home: delete React PortfolioPage + route + CTA fix

**Order note:** Run **before** Tasks 11 and 12 to avoid wasting work on a soon-to-be-deleted component. If you've already done T11/T12, that's fine — just remove the `trades`/`holdings` state alongside the rest of PortfolioPage.

**Files:**
- Modify: `build/index.html` (delete PortfolioPage component, update route registry, swap home CTA link)

- [ ] **Step 1 — Delete the PortfolioPage component**

Delete the entire `function PortfolioPage() { … }` block, including the `// ── Portfolio page ─────────────────────────────────────────` comment header. This is roughly lines 837-1001 in the current file.

- [ ] **Step 2 — Remove `"portfolio"` from the route registry in App()**

Find `function App() {` (around line 1107). Three changes:

1. Initial route registry — remove `"portfolio"`:
   - Old: `return ["home","portfolio","investment"].includes(hash) ? hash : "home";`
   - New: `return ["home","investment"].includes(hash) ? hash : "home";`

2. Hashchange listener — same removal:
   - Old: `if (["home","portfolio","investment"].includes(h)) {`
   - New: `if (["home","investment"].includes(h)) {`

3. Page selector — remove the `if (route === "portfolio")` branch:
   - Old:
     ```js
     let page;
     if      (route === "portfolio")   page = <PortfolioPage/>;
     else if (route === "investment")  page = <CommitteePage/>;
     else                              page = <Home go={go}/>;
     ```
   - New:
     ```js
     let page;
     if (route === "investment") page = <CommitteePage/>;
     else                        page = <Home go={go}/>;
     ```

- [ ] **Step 3 — Update Footer "Live Portfolio" link to portfolio.html**

In the React `Footer` component (around line 228):
- Old: `<li><a href="#" onClick={e => { e.preventDefault(); go("portfolio"); }}>Live Portfolio</a></li>`
- New: `<li><a href="portfolio.html">Live Portfolio</a></li>`

- [ ] **Step 4 — Update home Hero CTA "Open Live Portfolio" to portfolio.html**

In the Hero component (around line 551):
- Old: `<a className="btn" href="#/portfolio" onClick={e=>{e.preventDefault();window.__wibecGo&&window.__wibecGo("portfolio");}}>Open Live Portfolio <span className="arr">→</span></a>`
- New: `<a className="btn" href="portfolio.html">Open Live Portfolio <span className="arr">→</span></a>`

- [ ] **Step 5 — Verify no orphan references**

```bash
git grep -n "PortfolioPage\|go(\"portfolio\")\|#/portfolio\|window.__wibecGo.*portfolio" build/index.html
```
Expected: no output.

- [ ] **Step 6 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/
```

Click the home hero "Open Live Portfolio" button → navigates to `portfolio.html`. Click "Live Portfolio" in the footer → also navigates to `portfolio.html`. Manually visit `http://localhost:8000/index.html#/portfolio` → app renders the home page (route falls back since "portfolio" is no longer registered). Stop server.

- [ ] **Step 7 — Commit**

```bash
git add build/index.html
git commit -m "index: remove React Portfolio page; route Live Portfolio links to portfolio.html"
```

---

## Task 15 — Rewrite learn.html as real IFP

**Files:**
- Modify: `build/learn.html` (full body rewrite)

- [ ] **Step 1 — Replace the entire body content (everything between `<body class="page-enter">` and `</body>`)**

Open `build/learn.html` and replace the body's contents with the following (preserve `<body class="page-enter">` and `</body>` tags, and the existing `<script src="header.js"></script>`):

```html
<body class="page-enter">
<script src="header.js"></script>

<section style="padding:64px 0 40px; border-bottom:1px solid var(--rule)">
  <div class="container-wide">
    <div class="page-header-meta">
      <span>§ Foundations Program</span>
      <span>8 – 10 Week Certificate Program</span>
      <span>Open to all members</span>
    </div>
    <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:64px; align-items:end">
      <h1 class="display" style="font-size:clamp(56px,7vw,108px); margin:0">
        Investment <em style="color:var(--coral-ink)">Foundations.</em>
      </h1>
      <p class="serif" style="font-size:18px; font-style:italic; color:var(--ink-700); margin:0">
        WIBEC's flagship educational initiative. The IFP combines professional exposure, hands-on skill building, and real-world competition to give you a comprehensive foundation in finance — from your first accounting equation to your first live pitch in front of industry professionals.
      </p>
    </div>
  </div>
</section>

<!-- Three Pillars -->
<section style="padding:64px 0; border-bottom:1px solid var(--rule)">
  <div class="container-wide">
    <div class="section-head">
      <div>
        <div class="n">§ 01 — Pillars</div>
        <h2>Three pillars.</h2>
      </div>
      <p>Each pillar builds on the last, taking you from industry awareness to hands-on execution.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-top:1px solid var(--ink-900)">
      <div style="padding:32px 28px 32px 0; border-right:1px solid var(--rule)">
        <div class="mono" style="font-size:12px; color:var(--coral-ink); letter-spacing:0.14em">01 / 03</div>
        <h3 class="h-serif" style="font-size:30px; margin:14px 0 14px">Professional Insights.</h3>
        <p style="margin:0; font-size:15px; color:var(--ink-500); line-height:1.6">Workshops, podcasts, and speaker events from practitioners in Investment Banking, Consulting, Corporate Finance, Private Equity, and more.</p>
      </div>
      <div style="padding:32px 28px; border-right:1px solid var(--rule)">
        <div class="mono" style="font-size:12px; color:var(--coral-ink); letter-spacing:0.14em">02 / 03</div>
        <h3 class="h-serif" style="font-size:30px; margin:14px 0 14px">Skill Development.</h3>
        <p style="margin:0; font-size:15px; color:var(--ink-500); line-height:1.6">Hands-on training in Accounting, Financial Modeling, M&amp;A Analysis, Consulting Casing, and other foundational concepts that power the world of finance.</p>
      </div>
      <div style="padding:32px 0 32px 28px">
        <div class="mono" style="font-size:12px; color:var(--coral-ink); letter-spacing:0.14em">03 / 03</div>
        <h3 class="h-serif" style="font-size:30px; margin:14px 0 14px">Competition &amp; Execution.</h3>
        <p style="margin:0; font-size:15px; color:var(--ink-500); line-height:1.6">Put your skills to the test with stock pitches or consulting case presentations at our end-of-semester showcase, judged by alumni and industry professionals.</p>
      </div>
    </div>
  </div>
</section>

<!-- Pillar 1 detail -->
<section style="padding:64px 0; background:var(--paper-2); border-bottom:1px solid var(--rule)">
  <div class="container-wide">
    <div class="section-head">
      <div>
        <div class="n">§ 02 — Pillar 01</div>
        <h2>Professional insights.</h2>
      </div>
      <p>Gain firsthand exposure to the industries that drive global markets. Each week features a different format — keeping content fresh and engagement high.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:32px">
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Industry Workshops</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Interactive sessions led by WIBEC committee members and guest speakers breaking down what careers in IB, Consulting, Corporate Finance, and VC/PE actually look like beyond the job description.</p>
      </div>
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Speaker Events</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Hear directly from analysts, associates, and senior professionals about recruiting timelines, day-in-the-life realities, and the skills that set top candidates apart.</p>
      </div>
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">WIBEC Podcast Series</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">On-demand conversations with alumni and professionals covering market trends, career pivots, and lessons learned on the path from campus to Wall Street and beyond.</p>
      </div>
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Networking &amp; Coffee Chats</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Structured opportunities to connect with speakers after events, practice your elevator pitch, and begin building the professional relationships that define a successful career.</p>
      </div>
    </div>
  </div>
</section>

<!-- Pillar 2 detail -->
<section style="padding:64px 0; border-bottom:1px solid var(--rule)">
  <div class="container-wide">
    <div class="section-head">
      <div>
        <div class="n">§ 03 — Pillar 02</div>
        <h2>Skill development.</h2>
      </div>
      <p>Move from theory to practice with structured modules that build the technical toolkit recruiters look for — regardless of which finance path you choose.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:32px">
      <div style="padding:24px 28px; background:var(--paper-2); border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Accounting &amp; Financial Statements</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Master the income statement, balance sheet, and cash flow statement. Understand how the three statements link together and what they reveal about a company's health.</p>
      </div>
      <div style="padding:24px 28px; background:var(--paper-2); border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Financial Modeling</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Build Excel-based models from the ground up — covering revenue builds, operating assumptions, and scenario analysis used in real investment decisions.</p>
      </div>
      <div style="padding:24px 28px; background:var(--paper-2); border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">M&amp;A &amp; Valuation</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Learn DCF, comparable companies, and precedent transactions. Evaluate whether a deal creates or destroys value and structure a persuasive investment thesis.</p>
      </div>
      <div style="padding:24px 28px; background:var(--paper-2); border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Consulting Casing</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Practice market sizing, profitability analysis, and growth strategy frameworks. Develop structured thinking skills applicable to consulting interviews and case competitions.</p>
      </div>
    </div>
  </div>
</section>

<!-- Pillar 3 detail -->
<section style="padding:64px 0; background:var(--paper-2); border-bottom:1px solid var(--rule)">
  <div class="container-wide">
    <div class="section-head">
      <div>
        <div class="n">§ 04 — Pillar 03</div>
        <h2>Competition &amp; execution.</h2>
      </div>
      <p>The program culminates in a live competition where you apply everything you've learned under real-world pressure and feedback.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(2,1fr); gap:32px">
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Stock Pitch Track</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Research a publicly traded company, build a valuation model, and present a buy/sell/hold recommendation backed by rigorous fundamental analysis and a clear catalyst thesis.</p>
      </div>
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Consulting Case Track</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Tackle a real-world business problem, structure your analysis with proven frameworks, and deliver an actionable recommendation with quantitative and qualitative support.</p>
      </div>
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Alumni &amp; Professional Judges</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Present to panelists from top banks, consulting firms, and corporate finance teams. Receive direct, actionable feedback from professionals who evaluate pitches for a living.</p>
      </div>
      <div style="padding:24px 28px; background:#fff; border:1px solid var(--rule)">
        <h4 class="h-serif" style="font-size:20px; margin:0 0 10px">Awards &amp; Recognition</h4>
        <p style="margin:0; font-size:14px; color:var(--ink-500); line-height:1.6">Top-performing teams are recognized at the end-of-semester event. Outstanding presentations may be featured in WIBEC publications and shared with our alumni network.</p>
      </div>
    </div>
  </div>
</section>

<!-- Certificate CTA -->
<section style="padding:96px 0; background:var(--ink-900); color:var(--paper-2)">
  <div class="container-wide" style="text-align:center">
    <div class="eyebrow" style="color:var(--coral)">◆ Certificate of Completion</div>
    <h2 class="display" style="font-size:clamp(48px,6vw,96px); margin:16px 0 24px; color:var(--paper-2)">
      Earn the <em style="color:var(--coral)">IFP Certificate.</em>
    </h2>
    <p class="serif" style="font-size:18px; font-style:italic; color:rgba(255,255,255,0.85); max-width:600px; margin:0 auto 36px">
      Complete the 8 – 10 week program and receive a certificate of completion from WIBEC — a tangible credential that signals your commitment to professional development and financial literacy to future employers and peers.
    </p>
    <a href="membership.html" class="btn btn-coral">Apply for Fall '26 <span class="arr">→</span></a>
  </div>
</section>

</body>
```

- [ ] **Step 2 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/learn.html
```

Page renders: hero ("Investment Foundations."), Three pillars row, three detail sections (4 cards each), certificate CTA at bottom. No mention of mock readings (Damodaran, BIS) or the old 6-week curriculum. Stop server.

- [ ] **Step 3 — Commit**

```bash
git add build/learn.html
git commit -m "learn: rewrite as real Investment Foundations Program (3 pillars, 8-10 week)"
```

---

## Task 16 — Create board.html

**Files:**
- Create: `build/board.html`

- [ ] **Step 1 — Confirm all 14 photos exist**

```bash
ls build/images/team/{wade_parzick.jpg,joaquin_garcia_argibay.jpg,diego_ordonez.jpg,kevin_bal.jpg,sebastian_dallesio.jpg,marianna_zamora.jpg,justin_chen.png,trenton_ryu.jpg,deborah_jacklin.png,rey_ventura.jpg,robert_solomon.jpg,simon_thomas.jpg,tony_kim.jpg,shawn_gutierrez.jpg}
```
Expected: all 14 files listed without `No such file` errors. If any are missing, **stop and ask the user to provide them** before completing this task.

- [ ] **Step 2 — Write the board page**

Create `build/board.html` with:

```html
<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width, initial-scale=1" />
<title>Board — WIBEC</title>
<link rel="icon" type="image/x-icon" href="images/wibec.ico">
</head>
<body class="page-enter">
<script src="header.js"></script>

<section style="padding:64px 0 40px; border-bottom:1px solid var(--rule)">
  <div class="container-wide">
    <div class="page-header-meta">
      <span>§ Board</span>
      <span>Spring 2026</span>
      <span>14 members</span>
    </div>
    <div style="display:grid; grid-template-columns:1.2fr 1fr; gap:64px; align-items:end">
      <h1 class="display" style="font-size:clamp(56px,7vw,108px); margin:0">
        Meet the <em style="color:var(--coral-ink)">board.</em>
      </h1>
      <p class="serif" style="font-size:18px; font-style:italic; color:var(--ink-700); margin:0">
        Eight officers and six regional committee chairs. Together they lead the WIBEC Penn Fund, the apprenticeship track, the podcast, and every event the club runs.
      </p>
    </div>
  </div>
</section>

<section style="padding:64px 0">
  <div class="container-wide">
    <div class="section-head">
      <div><div class="n">§ 01 — Officers</div><h2>Executive Board.</h2></div>
      <p>Elected by the membership each April. Officers oversee the strategic direction of the club and sit ex-officio on the Investment Committee.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(4,1fr); gap:0; border-top:1px solid var(--ink-900)">
      <!-- Officer cards -->
      <!-- 1 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/wade_parzick.jpg" alt="Wade Parzick" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Co-President</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Wade Parzick</h3>
        <a href="mailto:wparzick@sas.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">wparzick@sas.upenn.edu</a>
      </div>
      <!-- 2 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/joaquin_garcia_argibay.jpg" alt="Joaquin Garcia Argibay" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Co-President</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Joaquin Garcia Argibay</h3>
        <a href="mailto:gajoaco@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">gajoaco@wharton.upenn.edu</a>
      </div>
      <!-- 3 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/diego_ordonez.jpg" alt="Diego Ordonez" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Economic Analysis Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Diego Ordonez</h3>
        <a href="mailto:dordonez@sas.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">dordonez@sas.upenn.edu</a>
      </div>
      <!-- 4 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/kevin_bal.jpg" alt="Kevin Balderrama" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Corporate Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Kevin Balderrama</h3>
        <a href="mailto:kevinbal@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">kevinbal@wharton.upenn.edu</a>
      </div>
      <!-- 5 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/sebastian_dallesio.jpg" alt="Sebastian D'Alessio" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Finance Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Sebastian D'Alessio</h3>
        <a href="mailto:sdaless@sas.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">sdaless@sas.upenn.edu</a>
      </div>
      <!-- 6 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/marianna_zamora.jpg" alt="Marianna Zamora" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Outreach &amp; Engagement Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Marianna Zamora</h3>
        <a href="mailto:mariannaz@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">mariannaz@wharton.upenn.edu</a>
      </div>
      <!-- 7 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/justin_chen.png" alt="Justin Chen" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Technology Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Justin Chen</h3>
        <a href="mailto:justic@seas.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">justic@seas.upenn.edu</a>
      </div>
      <!-- 8 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/trenton_ryu.jpg" alt="Trenton Ryu" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Operations Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Trenton Ryu</h3>
        <a href="mailto:tryu@sas.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">tryu@sas.upenn.edu</a>
      </div>
    </div>
  </div>
</section>

<section style="padding:64px 0; background:var(--paper-2); border-top:1px solid var(--rule)">
  <div class="container-wide">
    <div class="section-head">
      <div><div class="n">§ 02 — Regional chairs</div><h2>Committee leadership.</h2></div>
      <p>Each regional chair leads a committee of analysts covering a distinct geography. They sit on the Investment Committee alongside the eight officers.</p>
    </div>
    <div style="display:grid; grid-template-columns:repeat(3,1fr); gap:0; border-top:1px solid var(--ink-900)">
      <!-- 9 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/deborah_jacklin.png" alt="Deborah Jacklin" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">North American Committee Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Deborah Jacklin</h3>
        <a href="mailto:djacklin@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">djacklin@wharton.upenn.edu</a>
      </div>
      <!-- 10 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/rey_ventura.jpg" alt="Rey Ventura" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Latin American Committee Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Rey Ventura</h3>
        <a href="mailto:reyven@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">reyven@wharton.upenn.edu</a>
      </div>
      <!-- 11 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/robert_solomon.jpg" alt="Robert Dennis Solomon" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">European Committee Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Robert Dennis Solomon</h3>
        <a href="mailto:robdsol@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">robdsol@wharton.upenn.edu</a>
      </div>
      <!-- 12 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/simon_thomas.jpg" alt="Simon Thomas" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">Middle Eastern Committee Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Simon Thomas</h3>
        <a href="mailto:thomassi@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">thomassi@wharton.upenn.edu</a>
      </div>
      <!-- 13 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/tony_kim.jpg" alt="Tony Kim" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">East Asian Committee Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Tony Kim</h3>
        <a href="mailto:kimtony@sas.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">kimtony@sas.upenn.edu</a>
      </div>
      <!-- 14 -->
      <div class="board-card">
        <div class="board-photo"><img src="images/team/shawn_gutierrez.jpg" alt="Shawn Gutierrez" /></div>
        <div class="eyebrow" style="color:var(--coral-ink); margin-top:18px">South Asian Committee Chair</div>
        <h3 class="h-serif" style="font-size:22px; margin:8px 0 4px">Shawn Gutierrez</h3>
        <a href="mailto:shawngut@wharton.upenn.edu" class="mono" style="font-size:11px; color:var(--coral-ink); text-decoration:none">shawngut@wharton.upenn.edu</a>
      </div>
    </div>
  </div>
</section>

<style>
  .board-card { padding:28px 24px 32px; border-right:1px solid var(--rule); border-bottom:1px solid var(--rule); }
  .board-photo { aspect-ratio:4/5; overflow:hidden; background:var(--paper-3); }
  .board-photo img { width:100%; height:100%; object-fit:cover; object-position:center top; display:block; }
  /* Last column borders cleanup */
  section:nth-of-type(2) .board-card:nth-child(4n) { border-right:none; }
  section:nth-of-type(2) .board-card:nth-child(n+5) { border-bottom:none; }
  section:nth-of-type(3) .board-card:nth-child(3n) { border-right:none; }
  section:nth-of-type(3) .board-card:nth-child(n+4) { border-bottom:none; }
  @media (max-width: 900px) {
    section:nth-of-type(2) > div > div:last-child,
    section:nth-of-type(3) > div > div:last-child { grid-template-columns: repeat(2, 1fr) !important; }
  }
  @media (max-width: 600px) {
    section:nth-of-type(2) > div > div:last-child,
    section:nth-of-type(3) > div > div:last-child { grid-template-columns: 1fr !important; }
  }
</style>

</body>
</html>
```

- [ ] **Step 3 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/board.html
```

Page renders: hero ("Meet the board"), Officers section (8 cards in 4-col grid, photos load), Regional Chairs section (6 cards in 3-col grid, photos load including Robert Dennis Solomon). All 14 mailto links present. Stop server.

- [ ] **Step 4 — Commit**

```bash
git add build/board.html
git commit -m "Add board.html — 8 officers + 6 regional chairs with photos and emails"
```

---

## Task 17 — header.js: WIBEC logo in pill mark + footer fixes

**Files:**
- Modify: `build/header.js` (pill mark and footer template)

- [ ] **Step 1 — Replace the colored-dot pill mark with the WIBEC logo image**

Find the line (around 184-185):

```js
    <a href="${homeMarkHref}" class="wpill-mark"><span class="dot"></span>WIBEC</a>
```

Replace with:

```js
    <a href="${homeMarkHref}" class="wpill-mark"><img src="images/wibec-logo.png" class="wpill-logo" alt="WIBEC" />WIBEC</a>
```

- [ ] **Step 2 — Add `.wpill-logo` CSS to constrain logo height**

Inside the existing `<style>` block in `header.js` (around line 128-180), add immediately before `.wpill-links`:

```css
.wpill-logo {
  height: 24px; width: auto; object-fit: contain;
  margin-right: 8px;
}
```

Also remove or hide the old `.wpill-mark .dot` rule (around line 157-161). Easiest: leave the rule but remove the dot from markup (already done in Step 1).

- [ ] **Step 3 — Update footer "Newsletter" → "Join the Newsroom" with the real Google Form**

In the footer template (around line 269), change:

- Old: `<li><a href="#">Newsletter</a></li>`
- New: `<li><a href="https://forms.gle/VkaBWcErvtSdt5hQ9" target="_blank" rel="noopener">Join the Newsroom</a></li>`

Also remove the dead `Alumni Network` link directly below it (line 270 — `<li><a href="#">Alumni Network</a></li>`), since the spec doesn't add an alumni page and an empty `#` link is broken UX.

- [ ] **Step 4 — Update footer "Live Portfolio" link**

In the footer template (around line 258):

- Old: `<li><a href="index.html#/portfolio">Live Portfolio</a></li>`
- New: `<li><a href="portfolio.html">Live Portfolio</a></li>`

- [ ] **Step 5 — Update footer "Investment Committee" link**

(Already routes via `index.html#/investment` — leave as-is.)

- [ ] **Step 6 — Wire up footer LinkedIn / Instagram links**

Find the LinkedIn and Instagram `<li>` entries in the footer (around line 279-280):

- Old:
  ```js
              <li style="margin-top:16px"><a class="u-link">LinkedIn &rarr;</a></li>
              <li><a class="u-link">Instagram &rarr;</a></li>
  ```
- New:
  ```js
              <li style="margin-top:16px"><a class="u-link" href="https://www.linkedin.com/company/105025108" target="_blank" rel="noopener">LinkedIn &rarr;</a></li>
              <li><a class="u-link" href="https://www.instagram.com/penn_wibec/" target="_blank" rel="noopener">Instagram &rarr;</a></li>
  ```

- [ ] **Step 7 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html
```

Top pill nav shows the WIBEC globe logo on the left (not a coral dot). Scroll to footer: "Live Portfolio" link goes to `portfolio.html`; "Join the Newsroom" link opens the Google Form in a new tab; LinkedIn / Instagram links work. No "Alumni Network" link visible. Stop server.

- [ ] **Step 8 — Commit**

```bash
git add build/header.js
git commit -m "header: WIBEC logo in pill nav; fix footer (newsroom form, portfolio link, social URLs)"
```

---

## Task 18 — header.js: Learn dropdown nav + portfolio.html route

**Files:**
- Modify: `build/header.js` (`pages` array, `navLinkIsActive`, nav HTML render, dropdown CSS + JS)

This is the largest header.js change. We restructure the flat nav into a parent-with-children data shape, render the Learn dropdown, and add open/close behavior.

- [ ] **Step 1 — Restructure the `pages` array (line 89-97)**

Replace the existing flat array:

```js
  const pages = [
    { label: "Home",           href: "index.html"             },
    { label: "Committees",     href: "committees.html"        },
    { label: "Events",         href: "events.html"            },
    { label: "Live Portfolio", href: "portfolio.html"         },
    {
      label: "Learn",
      children: [
        { label: "Investment Committee",            href: "index.html#/investment" },
        { label: "Investment Foundations Program",  href: "learn.html"             },
        { label: "Board",                           href: "board.html"             },
      ],
    },
    { label: "Podcast",        href: "podcast.html"           },
    { label: "Contact",        href: "contact.html"           },
  ];
```

- [ ] **Step 2 — Update `navLinkIsActive` to handle dropdown parents**

Replace the function (lines 99-107) with:

```js
  function navLinkIsActive(href) {
    const hash = routeHash();
    const homeRoute = hash === "" || hash === "home";
    if (href === "index.html") return current === "index.html" && homeRoute;
    if (href === "index.html#/investment") return current === "index.html" && hash === "investment";
    const file = href.split("#")[0];
    return current === file;
  }

  function navParentIsActive(item) {
    if (!item.children) return false;
    return item.children.some(c => navLinkIsActive(c.href));
  }
```

- [ ] **Step 3 — Replace the `navLinks` render (line 111-114)**

Old:

```js
  const navLinks = pages.map(p => {
    const isActive = navLinkIsActive(p.href);
    return `<a href="${p.href}" class="wpill-link${isActive ? ' is-active' : ''}">${p.label}</a>`;
  }).join('');
```

New:

```js
  const navLinks = pages.map(p => {
    if (p.children) {
      const isActive = navParentIsActive(p);
      const children = p.children.map(c => {
        const cActive = navLinkIsActive(c.href);
        return `<a href="${c.href}" class="wpill-dropdown-item${cActive ? ' is-active' : ''}">${c.label}</a>`;
      }).join('');
      return `
        <div class="wpill-dropdown">
          <button type="button" class="wpill-link wpill-dropdown-trigger${isActive ? ' is-active' : ''}" aria-haspopup="true" aria-expanded="false">${p.label} <span class="wpill-caret">▾</span></button>
          <div class="wpill-dropdown-menu" role="menu">${children}</div>
        </div>`;
    }
    const isActive = navLinkIsActive(p.href);
    return `<a href="${p.href}" class="wpill-link${isActive ? ' is-active' : ''}">${p.label}</a>`;
  }).join('');
```

- [ ] **Step 4 — Add dropdown CSS**

Inside the `<style>` block, add immediately after the `.wpill-link.is-active` rule (around line 175):

```css
.wpill-dropdown { position: relative; display: inline-block; }
.wpill-dropdown-trigger {
  background: transparent; cursor: pointer; font: inherit; color: inherit;
}
.wpill-dropdown-trigger .wpill-caret {
  display: inline-block; margin-left: 4px; font-size: 10px; transition: transform .2s;
}
.wpill-dropdown.open .wpill-dropdown-trigger .wpill-caret { transform: rotate(180deg); }
.wpill-dropdown-menu {
  position: absolute; top: calc(100% + 8px); left: 50%; transform: translateX(-50%) translateY(-4px);
  min-width: 240px; padding: 8px;
  background: rgba(8,18,42,0.96);
  -webkit-backdrop-filter: blur(22px) saturate(1.6);
  backdrop-filter: blur(22px) saturate(1.6);
  border: 1px solid rgba(0,212,255,0.18);
  border-radius: 14px;
  box-shadow: 0 12px 40px rgba(0,0,0,0.45);
  opacity: 0; pointer-events: none; transition: opacity .18s, transform .18s;
  z-index: 200001;
}
.wpill-dropdown.open .wpill-dropdown-menu {
  opacity: 1; pointer-events: auto;
  transform: translateX(-50%) translateY(0);
}
.wpill-dropdown-item {
  display: block; padding: 10px 14px; font-size: 13px;
  color: rgba(234,241,255,0.78); text-decoration: none;
  border-radius: 10px;
}
.wpill-dropdown-item:hover {
  color: #fff; background: rgba(0,212,255,0.14);
}
.wpill-dropdown-item.is-active { color: #fff; background: rgba(0,212,255,0.2); }
```

- [ ] **Step 5 — Add dropdown open/close behavior**

Inside the `window.addEventListener("DOMContentLoaded", function () { … })` block (around line 193), add the following after the `syncNavActive();` call (around line 230):

```js
    // Dropdown open/close
    document.querySelectorAll('#wpill-nav .wpill-dropdown').forEach(function (dd) {
      const trigger = dd.querySelector('.wpill-dropdown-trigger');
      const open = (val) => {
        dd.classList.toggle('open', val);
        trigger.setAttribute('aria-expanded', val ? 'true' : 'false');
      };
      // Hover (desktop)
      let leaveTimer;
      dd.addEventListener('mouseenter', () => { clearTimeout(leaveTimer); open(true); });
      dd.addEventListener('mouseleave', () => { leaveTimer = setTimeout(() => open(false), 120); });
      // Click (mobile / keyboard)
      trigger.addEventListener('click', (e) => {
        e.preventDefault();
        open(!dd.classList.contains('open'));
      });
      trigger.addEventListener('keydown', (e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          open(!dd.classList.contains('open'));
        } else if (e.key === 'Escape') {
          open(false);
          trigger.focus();
        }
      });
    });
    // Close any open dropdown when clicking outside
    document.addEventListener('click', (e) => {
      document.querySelectorAll('#wpill-nav .wpill-dropdown.open').forEach(dd => {
        if (!dd.contains(e.target)) {
          dd.classList.remove('open');
          const t = dd.querySelector('.wpill-dropdown-trigger');
          if (t) t.setAttribute('aria-expanded', 'false');
        }
      });
    });
```

- [ ] **Step 6 — Verify in browser**

```bash
cd build && python3 -m http.server 8000 &
open http://localhost:8000/index.html
```

Top pill nav shows: Home · Committees · Events · Live Portfolio · **Learn ▾** · Podcast · Contact. Hover "Learn" → dropdown opens with Investment Committee / Investment Foundations Program / Board. Click each:
- Investment Committee → `index.html#/investment`, IC page renders with real IPS content (Task 13).
- Investment Foundations Program → `learn.html`, IFP page renders (Task 15).
- Board → `board.html`, board grid renders (Task 16).

Click "Live Portfolio" → goes to `portfolio.html`. Click anywhere outside dropdown → it closes. Press Esc with dropdown open → closes and refocuses trigger. Stop server.

- [ ] **Step 7 — Commit**

```bash
git add build/header.js
git commit -m "header: add Learn dropdown nav (IC/IFP/Board); route Live Portfolio to portfolio.html"
```

---

## Task 19 — Final smoke test

**Files:**
- (No edits — verification only)

- [ ] **Step 1 — Start the local server**

```bash
cd build && python3 -m http.server 8000
```

Open in two browser tabs: a desktop-width window and a mobile-width window (DevTools device toolbar).

- [ ] **Step 2 — Click through every nav item and verify**

Run through this checklist in the browser:

- **Home (`/`)**: hero tagline reads "The Wharton International Business and Economics Club (WIBEC) at Penn focuses on the intersection of economics…"; region roster shows Robert Dennis Solomon for Europe; "§ 03 — Calendar" lists exactly 4 Spring 2026 events.
- **Committees**: Europe card shows "Chair: Robert Dennis Solomon"; dark "Start as an apprentice. Become a lead." section is legible.
- **Events**: only Spring 2026 events; no `§ 02 — Fall 2026` section; weekly rhythm section renders.
- **Live Portfolio** (nav click): opens `portfolio.html`; holdings table renders with live prices via Yahoo Finance.
- **Learn → Investment Committee**: page renders 4 sections (Roles / Objective / Allocation / Process) + IPS download CTA; the IPS link downloads / opens the PDF.
- **Learn → Investment Foundations Program**: hero "Investment Foundations.", three pillars + 3 detail sections, certificate CTA.
- **Learn → Board**: 8 officers + 6 chairs (14 total cards), all photos load, all mailto links work.
- **Podcast**: headline reads "Insights From Wharton **And Beyond.**"; YouTube iframe plays the playlist.
- **Contact**: Topic dropdown options are Recruiting / Speaking / Alumni / Other (no Press); all `mailto:` links use `whartonibec@wharton.upenn.edu`.
- **Footer (every page)**: "Join the Newsroom" link opens `https://forms.gle/VkaBWcErvtSdt5hQ9`; LinkedIn + Instagram links work; email reads `whartonibec@wharton.upenn.edu`.
- **Browser tab**: favicon shows the WIBEC globe on every page.
- **Pill nav**: WIBEC logo image renders at left; ticker bar shows live prices for the 10 portfolio symbols.

- [ ] **Step 3 — Final search-based assertions**

```bash
# Khoi must be gone
git grep -n -i "khoi" build/

# Old email must be gone
git grep -n "wibec@wharton.upenn.edu" build/

# Old favicon refs must be gone
git grep -n 'href="images/ibec\.ico"' build/

# Old "Long-form. No slop." must be gone (only the new headline remains)
git grep -n "No slop" build/

# Mock fall events must be gone
git grep -n "Sep 04\|Sep 11\|Case Night\|Fall Recruiting" build/
```
Expected: all five commands return no output.

- [ ] **Step 4 — Stop the server**

`Ctrl-C` the running `python3 -m http.server`.

- [ ] **Step 5 — Confirm log of commits looks clean**

```bash
git log --oneline -25
```

Expected: ~17–18 commits since the start of this plan, each a focused change with a clear message.

- [ ] **Step 6 — Commit (none — this task is verification only)**

(Skip — no file changes.)

---

## Self-Review

**1. Spec coverage:**

- §A Branding & assets → T1 (IPS), T2 (.ico), T3 (email), T4 (favicon link), T17 (logo in pill). ✅
- §B Navigation → T17 + T18. ✅
- §C Home → T9 (tagline + REGIONS), T10 (events), T11 (TRADES live), T12 (HOLDINGS live), T13 (CommitteePage rewrite), T14 (delete PortfolioPage + CTA + footer link). ✅
- §D Investment Committee React → T13. ✅
- §E IFP → T15. ✅
- §F Board page → T16. ✅
- §G Committees (Khoi + apprentice contrast) → T5. ✅
- §H Events → T6. ✅
- §I Podcast → T7. ✅
- §J Contact → T8 + T3 (email). ✅
- §K Files to delete → T14 (PortfolioPage). ✅

**2. Placeholder scan:** No "TBD" / "TODO" / "implement later" / "add validation" / "similar to Task N" — all code blocks are complete. ✅

**3. Type/identifier consistency:** `TICKER_TO_REGION`, `fetchTradesFromCsv`, `fetchHoldingsFromApi`, `holdings`, `trades`, `board-card`, `wpill-dropdown`, `wpill-dropdown-trigger`, `wpill-dropdown-menu`, `wpill-dropdown-item`, `wpill-caret`, `wpill-logo`, `navParentIsActive`, `navLinkIsActive` — names match across the tasks where they appear. ✅

**4. Ordering caveats noted:** Tasks 11/12 vs 14 — explicit "run T14 first" guidance + explicit Path A / Path B handling so the plan is robust to either order. ✅
