# Etsy Typography / Wall Art

**Read this first — then the Notion page. That page is the brief.**

**[Etsy - Typography/Wall Art](https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb)** (Hermes HQ)

This folder is the local workspace for that page: renders, exports, listing files. Agents: fetch the Notion page before planning or generating. Do not invent a second brief.

---

## Live sets

Four products. Pocket **is** the zine-poster set (same 11 still lifes — not two listings).

| Set | What it is | Source | Renders | Listing |
|---|---|---|---|---|
| **Cocoa** | 20 packed D11 life-quotes, brown/cream | `cocoa/` | `output/cocoa/` | draft `cocoa` |
| **Pocket** | 11 zine still-lifes (apple, pear, teacup…) | `pocket/` — masters in `Typography/assets/Typography - ZIne Poster` | `output/pocket/` | draft `pocket` |
| **Japandi** | 5 single-line nature studies (J03 Fuji dropped) | `line-art/prompts.md` | `output/japandi/` | not listed yet |
| **Botanical** | 6 single-line plant studies | `line-art/prompts.md` | `output/botanical/` | not listed yet |

Buyer files = clean prints only. Room mockups stay in `listing-photos/`, never in the zip or the info PDF.

```bash
# Cocoa
node cocoa/generate.mjs
node cocoa/generate.mjs --sizes
node cocoa/generate-deliverable.mjs

# Pocket (needs the Typography zine masters)
python pocket/generate.py
node pocket/generate-deliverable.mjs

# Japandi + Botanical contact sheets
node line-art/generate-boards.mjs
node line-art/generate-ratio-grids.mjs
```

Push a draft (never publishes):

```bash
node scripts/etsy-api.mjs push --listing cocoa --dry-run
node scripts/etsy-api.mjs push --listing cocoa
node scripts/etsy-api.mjs push --listing pocket
```

Aliases fill photos / zip / PDF / description. Flags override.

---

## Repo map

```
cocoa/                   D11 generator, prints.json, info PDF, handoff
pocket/                  zine still-life upscale + listing deliverable
line-art/                shared Japandi + Botanical prompts and boards
japandi/  botanical/     pointers — files live in line-art/ and output/
scripts/                 Etsy Open API (draft only)

output/cocoa/            prints/  bundle/  listing-photos/  zip
output/pocket/           ratio folders, listing-photos/, zip
output/japandi/          flat ratio folders (no 2x3)
output/botanical/        flat ratio folders (no 2x3)
output/sources/          Grok masters + combined board
output/_parked/          Anton 20 + angle-1 experiments

archive/anton-20/        parked gym-Anton listing source
archive/research/        old HTML templates / generators
archive/pipeline-oneoffs/ already-run Japandi/Botanical reshape scripts
archive/betterwright/    old browser listing clicks — do not use
```

---

## Parked

**Anton gym 20** (`output/_parked/anton-20/`, listing alias `anton`) is rendered and parked. Not the shop face. Office + Singapore + the 5+5+5 curated angles stay on Notion.

Angle-1 lockup experiments (D05 / D06 / D08 / D11 / D12) that led to Cocoa live in `output/_parked/angle-1-*`.

---

## Listing model

One design × five ratios (2:3, 4:5, 5:7, 11:14, ISO) @ 300 DPI sRGB. Instant download = zip + info PDF. Custom wall text +SGD 4.90, optional.

Shop: **TypographySG**. Leave drafts unpublished. Never commit `.env`.

---

## Marketing — Etsy Demand Agent

Traffic agent for digital downloads: **on-Etsy SEO first**, then listing conversion, then gated off-Etsy drafts. Skill: `/etsy-marketing` (`.cursor/skills/etsy-marketing/`).

```bash
node scripts/etsy-seo-audit.mjs
node scripts/etsy-seo-audit.mjs --listing cocoa
node scripts/etsy-seo-audit.mjs --json
```

Keyword banks + outreach templates: `marketing/`. Do not post TypographySG wall art to `@elinejournals` unless you explicitly say so.
