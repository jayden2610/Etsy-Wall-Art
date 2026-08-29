---
name: etsy-deliverable
description: >-
  Pushes local Etsy typography deliverables (buyer zip, info PDF, listing
  photos, description, tags, optional custom wall text) to a TypographySG
  listing via the Etsy Open API and leaves it as draft. Use when the user
  says /etsy-deliverable, asks to list on Etsy, upload buyer files, add
  personalization / custom print, fill a TypographySG listing, or save an
  Etsy draft. If 3–5 framed real-life listing photos are missing, call
  real-life-typography-generation first — do not upload sticker composites.
disable-model-invocation: true
---

# /etsy-deliverable

Push what is already rendered in `etsy-typography` onto Etsy **through the Open API**. Confirm the pack is complete. **Leave the listing as draft.** Do not publish unless the user said publish in this turn.

Shop: **TypographySG** (`typographysg.etsy.com`) · account **TypeSG** · currency **SGD**.

Brief (fetch before inventing copy or a new set):
https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb

Do not invent a second brief. Do **not** use Browser MCP or BetterWright for listing edits. API CLI: `node scripts/etsy-api.mjs`. Fallback only if the API is down: [reference.md](reference.md).

## Hard stops

- Buyer files = **zip + info PDF only**. Those two files go in **Digital files**, never in the photo gallery.
- Do **not** put zip/PDF/workflow slides in listing photos (`07-info-pdf.png`, `08-zip-contents.png`, `09-workflow.png`).
- Room mockups are **listing photos only**. Never inside the zip or the PDF. If 3–5 framed real-life examples are missing, call `/real-life-typography-generation` first.
- Instant download. `type=download`. Do not set `state=active`.
- Every listing gets an **optional Custom wall text** field (+SGD 4.90). Do not make it required. Do not flip the listing to made-to-order.
- Tags ≤ **20 characters**. Thirteen is enough.
- Never commit `.env` or paste the shared secret in chat.

## Preflight (local, before Etsy)

Workspace: `C:\Users\angdo\ActiveProjects\etsy-typography`

```
etsy-deliverable:
- [ ] 1. Notion brief fetched (this set, not a new track)
- [ ] 2. Buyer zip exists, opens, <20 MB
- [ ] 3. Zip folders match the table below; 300 DPI PNGs; no rooms
- [ ] 4. Info PDF current (no Drive placeholder)
- [ ] 5. Listing photos = 3–5 **framed** room shots (hero first) + optional grid/size chart; no zip/PDF slides. If rooms are missing, are sticker composites (no wood / lockup crop), or are garbled AI type → **stop**, run `/real-life-typography-generation`, then come back.
- [ ] 6. listing-description.txt has FOLDER / ASPECT RATIO / FITS + OPTIONAL CUSTOM PRINT
- [ ] 7. SEO title (no internal set name unless buyers search it), SGD 14.90, 13 tags ≤20 chars
- [ ] 8. `.env` has keystring, secret, refresh token. `node scripts/etsy-api.mjs status`
- [ ] 9. `node scripts/etsy-api.mjs push --listing <id> ...` then `get` to confirm. Still **draft**.
```

### Buyer zip

| Folder | Ratio | Fits |
|---|---|---|
| `2x3/` | 2:3 | 4×6 · 8×12 · 12×18 · 16×24 · 20×30 · 24×36 |
| `4x5/` | 4:5 | 8×10 · 16×20 |
| `5x7/` | 5:7 | 5×7 · 10×14 |
| `11x14/` | 11:14 | 11×14 |
| `ISO/` | ISO / A-series | A4 · A3 · A2 |

All buyer PNGs: 300 DPI, sRGB, 4500px on the short side.

### Listing photos

Hero / shop thumbnail = **one framed room**, wood still visible. Then more rooms (3–5 lifestyle total). Then optional `00-bundle-grid.png` and `06-size-chart.png`. The CLI ranks `01-` first, then `02-`–`05-`, then `00-`, then `06-`. Skips `_qa*` and `07`/`08`/`09`.

## Known listing ids

| Set | Id | Alias |
|---|---|---|
| Anton first-ship | 4564670051 | `anton` |
| Cocoa | 4564758499 | `cocoa` |
| Pocket Studies | 4564965599 | `pocket` |

## Etsy via Open API

One-time auth (already done for TypographySG):

1. Seller App on [Your Apps](https://www.etsy.com/developers/). Callback: `https://localhost:8443/oauth/callback`
2. `.env` from `.env.example` — keystring + shared secret
3. `node scripts/etsy-oauth.mjs` → grant `listings_r listings_w` as TypeSG
4. Script writes `ETSY_REFRESH_TOKEN`

Push a draft (never publishes):

```bash
node scripts/etsy-api.mjs push --listing cocoa \
  --photos output/cocoa-listing-photos \
  --zip output/Cocoa-Typography-Bundle-20.zip \
  --pdf Cocoa-Typography-Bundle-20-INFO.pdf \
  --desc output/cocoa-listing-photos/listing-description.txt \
  --title "20 Cocoa Typography Wall Art Set, Motivational Quote Prints, Brown Poster Bundle, Digital Download"
```

Then `node scripts/etsy-api.mjs get cocoa`. Confirm: state is `draft`, hero is the living-room frame, zip + PDF present. Human opens Shop Manager once to look. Do not send `state=active`.

`--dry-run` prints the plan. `--publish` / `--active` are refused.

## After

Tell the user: draft id, what uploaded, that it is still draft. Do not publish. Do not start a new print set unless they pick volume vs curated.
