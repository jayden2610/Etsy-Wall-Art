# TypographySG — Etsy SEO checklist

Shop: **TypographySG** · Currency: **SGD**  
Live listings: **Cocoa** (`4564758499`) · **Pocket** (`4564965599`)  
Skill: `/etsy-marketing` · Audit: `node scripts/etsy-seo-audit.mjs`  
Notion plan: https://app.notion.com/p/3cc67992bfc981cc9c7fe9bf745edd66  
SEO log: https://app.notion.com/p/4593648914db44cd81df517bd769127c

**North star:** strangers who already search wall-art queries on Etsy land on your listings and buy the digital download.

**Baseline (API, 30 Aug 2026):** both live listings = 0 views · 0 favourites · materials empty · taxonomy `2078` · auto-renew on.

---

## Rules (do not skip)

- [ ] Buyer language only — no internal set names in the **front** of titles (`Cocoa`, `Pocket`, `Anton`, `Japandi` as brand lead)
- [ ] Tags ≤ **20 characters** each · prefer **13** distinct tags
- [ ] Do not invent products outside the Notion typography brief
- [ ] Anton gym 20 stays parked — not the shop face
- [ ] Do not chase renewals just for the “new listing” boost
- [ ] Do not expand the catalogue before Cocoa + Pocket finish P0–P1
- [ ] Social is not the SEO plan (Pinterest/outreach only after P0–P1)

---

## P0 — Match language (do first)

Etsy must **match** the buyer query via title, tags, attributes, category, materials.

### Cocoa (`4564758499`)

- [ ] Replace title (stop leading with “Cocoa”):

```
Motivational Wall Art Printable Typography Quote Bundle Digital Download
```

- [ ] Replace tags (13):

```
motivation wall art
typography print
quote poster
inspirational print
digital download
office decor
printable wall art
minimalist poster
home office art
affirmation print
brown cream print
wall art bundle
instant download
```

- [ ] Remove / avoid: `cocoa wall art` as a primary tag
- [ ] Dry-run then push:

```bash
node scripts/etsy-api.mjs push --listing cocoa \
  --title "Motivational Wall Art Printable Typography Quote Bundle Digital Download" \
  --tags "motivation wall art,typography print,quote poster,inspirational print,digital download,office decor,printable wall art,minimalist poster,home office art,affirmation print,brown cream print,wall art bundle,instant download" \
  --dry-run

node scripts/etsy-api.mjs push --listing cocoa \
  --title "Motivational Wall Art Printable Typography Quote Bundle Digital Download" \
  --tags "motivation wall art,typography print,quote poster,inspirational print,digital download,office decor,printable wall art,minimalist poster,home office art,affirmation print,brown cream print,wall art bundle,instant download"
```

- [ ] Confirm with `node scripts/etsy-api.mjs get cocoa`
- [ ] Log change in SEO Log (`seo_title` + `seo_tags`)

### Pocket (`4564965599`)

- [ ] Replace title (front-load still life / wall art):

```
Still Life Wall Art Printable Zine Poster Set Digital Download
```

- [ ] Replace tags (13):

```
still life print
zine poster
kitchen wall art
food poster
digital download
printable wall art
aesthetic poster
fruit wall art
gallery wall set
apartment decor
minimalist print
poster bundle
instant download
```

- [ ] Drop ultra-narrow tags unless hero photo sells that object (e.g. `pear wall art`)
- [ ] Dry-run then push:

```bash
node scripts/etsy-api.mjs push --listing pocket \
  --title "Still Life Wall Art Printable Zine Poster Set Digital Download" \
  --tags "still life print,zine poster,kitchen wall art,food poster,digital download,printable wall art,aesthetic poster,fruit wall art,gallery wall set,apartment decor,minimalist print,poster bundle,instant download" \
  --dry-run

node scripts/etsy-api.mjs push --listing pocket \
  --title "Still Life Wall Art Printable Zine Poster Set Digital Download" \
  --tags "still life print,zine poster,kitchen wall art,food poster,digital download,printable wall art,aesthetic poster,fruit wall art,gallery wall set,apartment decor,minimalist print,poster bundle,instant download"
```

- [ ] Confirm with `node scripts/etsy-api.mjs get pocket`
- [ ] Log change in SEO Log

### Shop Manager (manual — both listings)

API is weak here; do this in Seller Dashboard:

- [ ] Category path correct for printable / digital wall art (Art & Collectibles → Prints or closest match)
- [ ] Fill **every** attribute Etsy shows (color, room, occasion, subject, etc.)
- [ ] Materials: `digital download`, `printable` (currently empty)
- [ ] Who made / when made accurate (`i_did`, recent)
- [ ] Digital download type confirmed · quantity high · auto-renew on
- [ ] Optional custom wall text enabled if you sell +SGD 4.90 personalization (`is_customizable` was false via API)

---

## P1 — Conversion (same two listings)

Ranking follows clicks → favourites → sales. Fix the listing so a visitor buys.

### Photos

- [ ] Hero (`01-`) = framed room, wood still visible — not a flat grid
- [ ] Photos 2–3: more lifestyle / vibe
- [ ] Later: grid / size chart only after lifestyle
- [ ] No zip/PDF/workflow slides in the photo gallery
- [ ] If rooms missing or sticker-only → run `/real-life-typography-generation` first

### Description & offer

- [ ] First lines answer: what it is · how many prints · 5 ratios · instant download
- [ ] Include FOLDER / ASPECT RATIO / FITS table
- [ ] Optional custom wall text (+SGD 4.90) explained, not required
- [ ] Price in SGD 9–14 band (live: SGD 14.90) · use 50% off anchor if shop sales are on
- [ ] Buyer files = zip + info PDF only in digital files

### Trust / clarity

- [ ] Size chart present
- [ ] Print guide clear (matte ~200gsm guidance in PDF)
- [ ] Mobile preview: title readable, hero not cropped oddly

---

## P2 — Search analytics ritual (weekly)

Shop Manager → **Stats / Search analytics** (not available via Open API).

- [ ] Screenshot **7-day** search terms
- [ ] Screenshot **30-day** search terms
- [ ] Save to SEO Log (`Result` = key queries)
- [ ] For each top query:

| Pattern | Action |
|---|---|
| Impressions, low clicks | Rewrite title/tags toward that exact phrase |
| Clicks, no sales | Fix photos / price / promise (conversion) |
| Sales on a query | Protect that phrasing; spawn a sibling listing in that lane later |

- [ ] Re-run `node scripts/etsy-seo-audit.mjs` after any title/tag change
- [ ] Target: audit score ≥ 80 on every live listing

---

## P3 — Expand searchable surface (only after P0–P1)

One listing ≈ one search lane. Ship SEO-ready before publish.

- [ ] **Angle 2 living-room singles** L01–L05 (place / home / housewarming queries)
- [ ] **Japandi** listing when assets ready
- [ ] **Botanical** listing when assets ready
- [ ] Angle 1 singles only if Cocoa doesn’t cover motivational depth
- [ ] Kids / summer last
- [ ] Each new listing checklist before publish:
  - [ ] Buyer-language title (front-loaded)
  - [ ] 13 tags ≤20 chars from `marketing/keyword-banks.json`
  - [ ] Materials + attributes filled
  - [ ] Framed hero + 3–5 lifestyle photos
  - [ ] Zip + info PDF
  - [ ] Description with sizes / FITS
  - [ ] `node scripts/etsy-seo-audit.mjs --listing <alias>` PASS

**Do not list:** Anton as shop face · NahaPrints clones · “These are the good old days”

---

## P4 — Light demand assists (after P0–P1)

- [ ] 5 outreach DMs/day max — templates in `marketing/outreach-templates.md`
- [ ] Log each DM in SEO Log (`outreach`)
- [ ] Pinterest drafts when account connected (best off-Etsy for wall art)
- [ ] Do **not** post TypographySG wall art to `@elinejournals` or TikTok `mindsetdailyclips2` unless you explicitly choose that channel
- [ ] Etsy Ads: only after organic title/tags/conversion are clean; start tiny on Cocoa’s best query

---

## Daily runbook

```
1. node scripts/etsy-seo-audit.mjs
2. Fix worst live listing (title / tags) OR finish one Shop Manager attribute gap
3. Optional: 5 outreach DMs
4. Log in Notion SEO Log
```

---

## Weekly runbook

```
1. Search analytics screenshots (7d + 30d)
2. Retune 1 title or tag set from real queries
3. Conversion skim on Cocoa + Pocket
4. One Growth Experiment row if testing A/B title front-load
5. Decide: stay on P0–P1 or unlock next listing in P3
```

---

## Commands cheat sheet

```bash
# Status / connection
node scripts/etsy-api.mjs status

# Live listing snapshot
node scripts/etsy-api.mjs get cocoa
node scripts/etsy-api.mjs get pocket

# SEO scores + proposals
node scripts/etsy-seo-audit.mjs
node scripts/etsy-seo-audit.mjs --listing cocoa
node scripts/etsy-seo-audit.mjs --json

# Title/tags only (active listings OK; still never use --publish)
node scripts/etsy-api.mjs push --listing cocoa --title "..." --tags "a,b,c" --dry-run
node scripts/etsy-api.mjs push --listing cocoa --title "..." --tags "a,b,c"
```

Keyword banks: `marketing/keyword-banks.json`  
Outreach copy: `marketing/outreach-templates.md`

---

## Done definition

- [ ] Cocoa + Pocket titles front-load buyer phrases (not set names)
- [ ] 13 valid tags each · materials filled · attributes complete
- [ ] Heroes convert (framed room)
- [ ] Weekly search-term habit running
- [ ] First views → then first favourite/sale → then expand catalogue in that winning lane
