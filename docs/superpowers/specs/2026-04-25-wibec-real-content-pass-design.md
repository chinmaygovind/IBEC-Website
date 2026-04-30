# WIBEC site — Real Content Pass

**Date:** 2026-04-25
**Author:** Pedro (with Claude)
**Status:** Approved

## Goal

The April 2026 WIBEC redesign (commits `1430da4`, `2f6a7c8`, `d86bcbc`, `060df4d`) introduced an editorial / financial-journal aesthetic, but populated almost every page with mock placeholder data. This spec swaps that mock data for the real club content that previously lived on the pre-redesign site (commit `276fa34` and earlier), adds a `Learn` dropdown nav with three sub-pages (Investment Committee, IFP, Board), and applies a list of small copy / link / contrast fixes from the user's PDF edit sheet.

**Non-goal:** The visual design stays. We are not reverting to the old `Helios by HTML5 UP` template.

---

## Sources of truth

| Asset | Source |
|---|---|
| Officer roster (8 officers) | `build/index.html:42-51` (already real, verified against commit `2e43f5d`) |
| Committee chairs (6) | Old `build/contact.html` at commit `276fa34`, with Europe corrected to Robert Dennis Solomon (`robdsol@wharton.upenn.edu`) |
| Investment Committee governance content | `git show 276fa34:build/investment-committee.html` |
| Investment Foundations Program content | `git show 276fa34:build/learn.html` |
| Live portfolio data | Existing `build/portfolio.html` (1091-line page using Yahoo Finance API + `trades.csv`); already deployed and functional, currently unlinked |
| Trades | `build/trades.csv` |
| Podcast playlist | `https://www.youtube.com/playlist?list=PLJg1V_W0HDkJW1xRELLbOYy5Aybhy08Yw` (embed video `4V0AyusOVOQ`) |
| Newsroom signup form | `https://forms.gle/VkaBWcErvtSdt5hQ9` |
| WIBEC logo | `build/images/wibec-logo.png` (added Apr 22) |
| IPS PDF | `git show 276fa34:build/assets/IBEC_IPS.pdf` (restore) |
| Club email | `whartonibec@gmail.com` (NOT `wibec@wharton.upenn.edu`) |

---

## Scope by file

### A. Branding & shared assets

**`build/images/wibec-logo.png`** — already present, no change.

**`build/images/wibec.ico`** — new: 32×32 ICO derived from the logo. Use ImageMagick or similar to produce. Add to `build/images/`.

**`build/assets/IBEC_IPS.pdf`** — restore from commit `276fa34`. Filename stays `IBEC_IPS.pdf` to preserve any external links.

**Email rewrite:** every occurrence of `wibec@wharton.upenn.edu` (in `mailto:` links and rendered text) → `whartonibec@gmail.com`. Search across all `build/*.html` and `build/header.js`. Do NOT touch `wibec` in URLs, paths, class names, IDs, or CSS variables.

**Favicon links:** every `<link rel="icon" type="image/x-icon" href="images/ibec.ico">` → `<link rel="icon" type="image/x-icon" href="images/wibec.ico">`. Apply across all 8+ HTML pages.

### B. Navigation — `build/header.js`

Replace the flat `pages` array (lines 89-97) with a structured nav supporting one dropdown:

```
Home | Committees | Events | Live Portfolio | Learn ▾ | Podcast | Contact
                                              ├─ Investment Committee  → index.html#/investment
                                              ├─ Investment Foundations Program → learn.html
                                              └─ Board → board.html
```

- "Live Portfolio" → `portfolio.html` (NOT `index.html#/portfolio`). The React Portfolio route is being removed.
- "Learn" is a hover/click dropdown styled to match the existing pill nav (white pill on docked state, light text otherwise). Open on hover (desktop) and click (mobile / accessibility).
- Active-state logic in `navLinkIsActive` needs to handle the dropdown parent: the "Learn" pill is active when the current page is any of `learn.html`, `board.html`, or `index.html#/investment`.

**Logo in pill nav:** the current `<span class="dot">●</span>WIBEC` mark becomes `<img src="images/wibec-logo.png" class="wpill-logo" alt="WIBEC" />` followed by the WIBEC wordmark. Constrain the logo to ~28px tall in CSS.

**Footer changes (in `header.js` lines 244-289):**
- "Newsletter" link → label "Join the Newsroom", href `https://forms.gle/VkaBWcErvtSdt5hQ9`.
- LinkedIn / Instagram links: add the real `href` (currently empty placeholders) — `https://www.linkedin.com/company/105025108` and `https://www.instagram.com/penn_wibec/`.
- Email: `wibec@wharton.upenn.edu` → `whartonibec@gmail.com`.
- "Live Portfolio" footer link → `portfolio.html`.

### C. Home — `build/index.html`

1. **Hero tagline (line 548)** — replace mock copy with the old IBEC paragraph (verbatim, with WIBEC substituted for IBEC where natural):

   > The Wharton International Business and Economics Club (WIBEC) at Penn focuses on the intersection of economics, global affairs, and international relations. Through conversation with industry professionals, analysis of current events, and club workshops, this club aims to provide members with a stronger understanding of how to navigate the world of global business.

2. **Region lead — Khoi Dinh → Robert Dennis Solomon** (line 36 of the REGIONS array).

3. **STATS strip (lines 108-113)** — keep numbers ($112K AUM, 6 committees, 60+ members, 10 positions). User confirmed these are reasonable; only the portfolio AUM number should be sanity-checked against `portfolio.html` after wiring.

4. **TRADES array (lines 66-73)** — replace hardcoded mock with rows derived from `build/trades.csv`. Show the most recent trades first; format date as `MM.DD`, action as BUY/EXIT (negative `shares` = EXIT), `by` field omitted or set to "Committee" if not derivable from CSV.

5. **HOLDINGS array (lines 53-64)** — replace with live data fetched from `api/index.py` on render. The Holdings component should `fetch('/api')` (same endpoint that powers `portfolio.html`), parse the `holdings` array from the response, and render the same shape as today (ticker / name / region / w / d / ret) — derived from the API fields:
   - `w` (weight %) = `market_value / current_value * 100`, rounded
   - `d` (1-day delta %) — not in current API; derive from price history or omit the column
   - `ret` (total return %) = `return_pct` from the API
   - `region` mapping must be maintained client-side (a small `TICKER_TO_REGION` map) since the API doesn't return region.

   While loading, render the existing static HOLDINGS array as the initial state so the layout doesn't flash empty; on fetch success, swap to live data. On fetch failure, keep the static fallback.

6. **React Portfolio page** — delete the entire Portfolio component and its hash route from the React shell. The `go("portfolio")` calls in the home page CTA (line 551) become `<a href="portfolio.html">Open Live Portfolio</a>`.

7. **React Investment Committee page (lines 1003+)** — rewrite to reflect real IPS-based content (see §D).

8. **EVENTS array (lines 75-82)** — delete the two Sep entries (`Sep 04 Fall Recruiting`, `Sep 11 Case Night`) so only the four Spring 2026 events remain.

9. **PODCASTS array (lines 84-89)** — already has real episode metadata; no change.

10. **Footer "Newsletter" link in React Footer (line 239)** — same change as `header.js` footer.

### D. Investment Committee — React component in `build/index.html`

Rewrite the Investment Committee page (currently around lines 1003-1080) to mirror the real content from old `investment-committee.html`, restyled to fit the editorial aesthetic. Sections:

1. **Hero** — "Investment Committee" with badge "Portfolio Governance" and the paragraph from old hero.
2. **Three roles** — Executive Board / Investment Committee / Regional Committees, each as a card with the descriptions from old `investment-committee.html`.
3. **Investment Objective** — one-paragraph intro + 4 cards (Equities / Fixed Income / Alternatives / Cash & Equivalents).
4. **Strategic Asset Allocation** — table with target weight + permitted range:
   - Equities 60% (55-65%)
   - Fixed Income 25% (22-28%)
   - Alternatives 10% (8-12%)
   - Cash 5% (3-7%)
5. **Investment Process** — 4-card grid: Idea Gen / Review & Vote / Execution & Recording / Monitoring & Exit.
6. **IPS Download banner** — link to `assets/IBEC_IPS.pdf`.

### E. Investment Foundations Program — `build/learn.html`

Replace the entire body (the mock 6-week curriculum) with the real IFP content from old `learn.html`, restyled for the editorial aesthetic. Sections:

1. **Hero** — "Investment Foundations Program" with badge "8 – 10 Week Certificate Program" and the old hero paragraph.
2. **Three pillars** — Professional Insights / Skill Development / Competition & Execution. Card layout matching the existing editorial style (use the "section-head" pattern from other new pages).
3. **Pillar 1 detail** — 4 items: Industry Workshops / Speaker Events / IBEC Podcast Series / Networking & Coffee Chats.
4. **Pillar 2 detail** — 4 items: Accounting & Financial Statements / Financial Modeling / M&A & Valuation / Consulting Casing.
5. **Pillar 3 detail** — 4 items: Stock Pitch Track / Consulting Case Track / Alumni & Professional Judges / Awards & Recognition.
6. **Certificate banner** — "Earn Your IFP Certificate" with the old description.
7. **CTA** — keep the existing "Apply for Fall '26" button pointing at `membership.html`.

### F. Board — new `build/board.html`

Create a new page at `build/board.html` listing all 14 board members (8 officers + 6 chairs). Layout: photo grid in the editorial style (similar visual rhythm to `committees.html`'s region grid). Each card shows photo, name, role, email link.

**Members:**

| # | Name | Role | Email | Photo |
|---|---|---|---|---|
| 1 | Wade Parzick | Co-President | wparzick@sas.upenn.edu | wade_parzick.jpg |
| 2 | Joaquin Garcia Argibay | Co-President | gajoaco@wharton.upenn.edu | joaquin_garcia_argibay.jpg |
| 3 | Diego Ordonez | Economic Analysis Chair | dordonez@sas.upenn.edu | diego_ordonez.jpg |
| 4 | Kevin Balderrama | Corporate Chair | kevinbal@wharton.upenn.edu | kevin_bal.jpg |
| 5 | Sebastian D'Alessio | Finance Chair | sdaless@sas.upenn.edu | sebastian_dallesio.jpg |
| 6 | Marianna Zamora | Outreach & Engagement Chair | mariannaz@wharton.upenn.edu | marianna_zamora.jpg |
| 7 | Justin Chen | Technology Chair | justic@seas.upenn.edu | justin_chen.png |
| 8 | Trenton Ryu | Operations Chair | tryu@sas.upenn.edu | trenton_ryu.jpg |
| 9 | Deborah Jacklin | North American Committee Chair | djacklin@wharton.upenn.edu | deborah_jacklin.png |
| 10 | Rey Ventura | Latin American Committee Chair | reyven@wharton.upenn.edu | rey_ventura.jpg |
| 11 | Robert Dennis Solomon | European Committee Chair | robdsol@wharton.upenn.edu | robert_solomon.jpg |
| 12 | Simon Thomas | Middle Eastern Committee Chair | thomassi@wharton.upenn.edu | simon_thomas.jpg |
| 13 | Tony Kim | East Asian Committee Chair | kimtony@sas.upenn.edu | tony_kim.jpg |
| 14 | Shawn Gutierrez | South Asian Committee Chair | shawngut@wharton.upenn.edu | shawn_gutierrez.jpg |

All photos already exist under `build/images/team/`.

### G. Committees — `build/committees.html`

1. **Line 101** — `Chair: Khoi Dinh` → `Chair: Robert Dennis Solomon`.
2. **Apprenticeship CTA section (lines 176-188)** — fix the contrast issue called out in the PDF screenshot. The body paragraph (`<p class="serif">`) currently uses `color: rgba(255,255,255,0.7)` which is hard to read on the dark navy. Bump to `rgba(255,255,255,0.92)`. The ghost button uses `color: var(--paper-2)` with `border-color: rgba(255,255,255,0.3)` — bump border to `rgba(255,255,255,0.6)` and ensure text is `#fff`.

### H. Events — `build/events.html`

1. **Delete the two Fall 2026 events**: `Sep 04 Fall Recruiting` (lines ~104-114) and `Sep 11 Case Night` (lines ~116-127).
2. **Delete the entire `§ 02 — Fall 2026 Looking ahead` section** (the section header at lines ~94-101 and its now-empty event list) since it would otherwise be empty.
3. The "Weekly rhythm" section and Spring 2026 events stay.

### I. Podcast — `build/podcast.html`

1. **Headline (line 23)** — `Long-form. <em>No slop.</em>` → `Insights From Wharton <em style="color:var(--coral-ink)">And Beyond.</em>`.
2. **Featured episode media (lines 43-49)** — replace the placeholder dark `▶` tile with a YouTube iframe embed of the playlist:
   ```html
   <iframe
     src="https://www.youtube.com/embed/4V0AyusOVOQ?list=PLJg1V_W0HDkJW1xRELLbOYy5Aybhy08Yw"
     title="WIBEC Podcast" frameborder="0"
     allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
     allowfullscreen
     style="aspect-ratio:16/9; width:100%; border:1px solid var(--rule)"></iframe>
   ```
3. **All episodes archive (lines 74-140)** — already real; no change.

### J. Contact — `build/contact.html`

1. **Topic dropdown** — delete `<option>Press / Media</option>` (line 115).
2. **Email** — every `wibec@wharton.upenn.edu` → `whartonibec@gmail.com` (mailto + rendered, lines 30, 53, 69, 73, 77).
3. The page intentionally has no officer directory — that lives on `board.html` now.

### K. Files to delete

- `build/wharton_survival.html` — currently a redirect-to-learn stub. Either keep as redirect (preserves any external links) or delete. **Decision: keep as-is** (12 lines, harmless).
- The React Portfolio component inside `index.html` (lines roughly handling `case "portfolio":` in the route switch) — delete since `portfolio.html` is now canonical.

---

## Open issues / risks

- **Logo aspect ratio in pill nav**: the WIBEC logo is square (globe + wordmark stacked). At 28px height it may render very small. If it looks bad, we may need to crop or use a horizontal lockup variant. Verify in browser; iterate if needed.
- **Dropdown styling on mobile**: the existing pill nav is desktop-first. The Learn dropdown on mobile needs a tap-to-toggle behavior plus an overlay close-on-outside-click. Will be addressed during implementation.
- **Yahoo Finance rate limits**: the ticker bar in `header.js` already polls Yahoo every 60s. Adding `portfolio.html`'s API also hits Yahoo. Now that the home page Holdings table also calls `api/index.py`, every home-page load triggers a Yahoo bulk download via the API. Acceptable for current traffic; revisit if rate-limit errors appear.
- **`portfolio.html` styling drift**: `portfolio.html` uses the old `assets/css/main.css` (Helios template). Linking to it from the new pill nav means the user clicks "Live Portfolio" and lands on a visually-different page. Acceptable trade-off per user instruction (preserve real data; don't recreate the page in React). A future task could restyle `portfolio.html` to match the editorial aesthetic.
- **`investment-committee.html` (old, standalone)**: keep file in place for now (no harm), but it's no longer linked. Can delete in a follow-up.

## Test plan

1. `python -m http.server` (or similar) inside `build/` and click through every nav item:
   - Home loads; tagline reads "The Wharton International Business and Economics Club…"; region roster shows Robert Dennis Solomon for Europe; events list shows only Spring 2026 dates.
   - Committees: Europe card shows Robert Dennis Solomon; dark CTA section text is legible.
   - Events: only Spring 2026 events present; no `§ 02 — Fall 2026` section.
   - Live Portfolio: opens the old `portfolio.html`, holdings table renders with live prices.
   - Learn dropdown opens and shows three items; each routes correctly.
   - Investment Committee: real content with IPS table + IPS PDF download works.
   - Investment Foundations Program: 8–10 wk content, 3 pillars.
   - Board: 14 cards, all photos load, all `mailto:` links work.
   - Podcast: headline reads "Insights From Wharton And Beyond"; YouTube iframe plays.
   - Contact: Topic dropdown has no "Press / Media"; mailto links use `whartonibec@`.
2. Search the rendered DOM for `wibec@wharton.upenn.edu` and `Khoi Dinh` — both should return zero hits.
3. Favicon shows the WIBEC globe in the browser tab on every page.
4. Pill nav pill-mark shows the WIBEC logo image, not the colored dot.

## Out of scope

- Restyling `portfolio.html` to the editorial aesthetic.
- Live AUM / member-count from `portfolio.html` API into the home stats strip (kept as static numbers).
- A custom recruiting / membership / IFP application form (membership.html keeps its existing CTA).
- Removing the unused `investment-committee.html` standalone file (deferred).
