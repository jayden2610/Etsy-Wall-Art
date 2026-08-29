# Etsy Typography / Wall Art

**Read this first — then the Notion page. That page is the brief.**

**[Etsy - Typography/Wall Art](https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb)** (Hermes HQ)

This folder is the local workspace for that page: renders, exports, listing files. Agents: fetch the Notion page before planning or generating. Do not invent a second brief. `AGENTS.md` and `.cursor/rules/notion-brief.mdc` say the same thing.

---

## Two tracks — both open

Notion started as 15 mixed prints, then pivoted to 20 curated motivational. Neither lock is final.

| Track | What it means | When to pick it |
|---|---|---|
| **Volume** | Many prints, one visual system, one or a few bundle listings (the Lumiora 100-print play) | You want catalog breadth, SEO coverage, "set of N" pricing |
| **High quality** | Fewer prints, tighter lockups, higher price (SGD 14.90–18.90 vs SGD 9 for 100 filler) | You want a hero SKU that looks designed, not generated |

Explore both. A new agent should ask which track before building a new set. Do not assume "20 forever" or "always ship 100."

**First thing shipping:** the already-rendered **Anton motivational 20**. Those PNGs are the product. There is no `template.html` — do not rebuild that lockup from HTML.

Office and Singapore concepts stay on the Notion page for a later set (either track).

---

## First ship — rendered Anton 20

White paper `#FFFFFF`, ink `#0A0A0A`, Anton, no hairlines, no beige, no handwritten graffiti.

`prints.json` is the title list. Files live in `output/Etsy-Typography-Bundle-20/<ratio>/`.

| ID | Line 1 | Line 2 |
|---|---|---|
| M01 | 1% BETTER | EVERY DAY |
| M02 | DISCIPLINE | > MOTIVATION |
| M03 | DO THE | WORK |
| M04 | KEEP | GOING |
| M05 | MAKE IT | HAPPEN |
| M06 | STAY | CONSISTENT |
| M07 | TRUST THE | PROCESS |
| M08 | NO | EXCUSES |
| M09 | STAY | FOCUSED |
| M10 | KEEP | PUSHING |
| M11 | MIND OVER | MATTER |
| M12 | DREAM BIG | WORK HARD |
| M13 | NEVER | SETTLE |
| M14 | STAY | HUNGRY |
| M15 | FINISH | STRONG |
| M16 | SHOW UP | DAILY |
| M17 | EARN | IT |
| M18 | DO | MORE |
| M19 | ONE MORE | REP |
| M20 | BUILD YOUR | LEGACY |

Ratios (300 DPI):

- `2x3` — 4500×6750 (4×6 through 24×36)
- `4x5` — 4500×5625
- `5x7` — 4500×6300
- `11x14` — 4500×5727
- `ISO` — 4500×6363 (A4 / A3 / A2)

Buyer gets one PDF with a Drive link. **No room mockups in the files.** Etsy listing images are lifestyle renders after the prints are approved.

---

## Status (29 Aug 2026)

| Deliverable | Here |
|---|---|
| Anton 20 × 5 ratios | `output/Etsy-Typography-Bundle-20/` (100 PNGs + listing grid) |
| Drive upload | Not done. `info.html` still has `PASTE_YOUR_GOOGLE_DRIVE_LINK_HERE` |
| Room mockups | Scene plates in `output/listing-photos/` — fit real PNGs into frames. Grid + size chart ready |
| Buyer PDF | `info.html` + `generate-pdf.mjs` — needs the real Drive URL, then re-export |
| Etsy listing | Not created. Title / tags / hook are on the Notion page |
| Next set (volume or quality) | Not started. New template when that work begins |

---

## What to do next

**Ship the Anton 20**

1. Approve the 2x3 masters in `output/Etsy-Typography-Bundle-20/2x3/`.
2. Paste the Drive link into `info.html`, then `node generate-pdf.mjs`.
3. Upload the five ratio folders + PDF. Anyone with the link = Viewer.
4. Generate listing mockups (oak frame, desk, gallery). Prompt is on the Notion page.
5. Create **one** bundle listing. Instant download = the PDF only.

**Then pick a track for the next set**

- Volume: more lines in the same Anton system, or a second 20/50/100 catalog.
- Quality: a new lockup (different type, more hierarchy, maybe the handwritten graffiti still on Notion).

Do not recreate `template.html` for the shipped Anton set.

---

## Scripts (supporting files, not the first ship)

```bash
# listing grid from the rendered 2x3 set
node generate-bundle-grid.mjs

# buyer PDF from info.html
node generate-pdf.mjs
```

`generate.mjs` stays for a **future** template. It exits if `template.html` is missing — that is intentional.

Font / layout experiments (`template-variants.html`, `template-aesthetic.html`, `template-v1-refined.html`) are research, not shipping.

---

## Repo map

```
AGENTS.md                every agent: read the Notion page first
.cursor/rules/           same instruction, always on
prints.json              titles for the Anton 20
info.html                buyer PDF source (needs Drive URL)
generate-pdf.mjs         info.html → A4 PDF
generate-bundle-grid.mjs listing grid from rendered 2x3
output/Etsy-Typography-Bundle-20/   first ship (100 PNGs + grid)

# future / research
generate.mjs             waits for a new template
template-variants.html / generate-variants.mjs
template-aesthetic.html / generate-aesthetic.mjs
template-v1-refined.html / generate-v1-refined.mjs
generate-remaining.mjs   leftover S04/S05 job — safe to delete
```

---

## Listing copy (from Notion) — Anton 20 bundle

**Title**

> 20 Minimalist Typography Wall Art Set, Motivational Office Prints, Beige Anton Poster Bundle, Digital Download

**13 tags**

`typography wall art`, `motivational poster`, `office wall art`, `minimalist wall art`, `beige wall art`, `handwritten typography`, `digital download wall art`, `inspirational quote print`, `modern office decor`, `printable wall art`, `gym wall art`, `discipline poster`, `mindset print`

**Description hook**

> DIGITAL WALL ART | Instant Download — Minimalist white with bold Anton type. 20 motivational prints. No physical item.

**How to use (keep this short in the listing)**

> 1. Download your files
> 2. Save as PDF
> 3. Print it out

Matte 200gsm, actual size / 100%, no extra border. 5 sizes included.
