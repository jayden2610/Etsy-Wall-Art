# Cover-card cleanup — local agent handoff

Read this after `AGENTS.md` and the Notion brief. Do **not** invent a second brief. Do **not** rewrite buyer prints, zips, PDFs, titles, or prices. Do **not** `ship`. Do **not** publish. Do **not** unpublish Travel.

Branch: `cursor/shop-cover-cleanup-aa32`  
PR: https://github.com/jayden2610/etsy-typography/pull/3  
Workspace: `C:\Users\angdo\ActiveProjects\etsy-typography`

The cloud agent wrote the **rule + scripts**. It also cropped a throwaway copy of the live Etsy JPEGs in a VM (`output/` is gitignored, so those pixels are not in git). **Your local `output/*/listing-photos/` is the source of truth.** Re-run the crop on those files, look at the 8-up, then `push --photos-only`.

---

## Job

Shop Manager showed five covers on the same wide monstera living room. Fix: make `01-` a **cover card** (tight oak, 4:5, framed sheet ≥40% of a 1:1 Etsy tile). Wide rooms stay `02-`–`05-`. Paper still picks the house (Kopitiam stays HDB).

Bar: Combined pine close-up. Full buyer sheet in the oak. No lockup crop. No fake mat. No new rooms.

---

## Files this branch created or changed

### New

| File | What it is |
|---|---|
| [COVER-CARDS.md](COVER-CARDS.md) | This handoff. Local agent starts here. |
| [.cursor/skills/etsy-deliverable/rooms.md](.cursor/skills/etsy-deliverable/rooms.md) | Cover-card rule + paper → house. |
| [scripts/frame-jobs.json](scripts/frame-jobs.json) | Per-alias photo dir + `proof.out` so the next `proof` does not default to the wide living room. |
| [scripts/cover-crops.json](scripts/cover-crops.json) | Crop fractions + `from` → `01-` names. |
| [scripts/crop-listing-hero.py](scripts/crop-listing-hero.py) | Crops existing framed JPEGs to 4:5, writes `01-`, builds the 8-up sheet. Does not re-sit prints. |

### Changed

| File | What changed |
|---|---|
| [.cursor/skills/etsy-deliverable/SKILL.md](.cursor/skills/etsy-deliverable/SKILL.md) | `01-` is a cover card. Aliases for all eight listings. Pointer to rooms.md + `--photos-only`. |
| [.cursor/skills/etsy-deliverable/reference.md](.cursor/skills/etsy-deliverable/reference.md) | `--photos-only`, `pull-photos`, cover-card photo order. |
| [scripts/etsy-api.mjs](scripts/etsy-api.mjs) | SETS for `combined` `singlish` `kopitiam` `home-bundle` `travel` `travel-ready`. `push --photos-only` (no zip/PDF/copy/`type` patch). `pull-photos`. Dry-run works without `.env`. Photo rank: `01-` → `02-`–`05-` → `10-`–`13-` → `00-` → `06-`. Skip `_` and `07`/`08`/`09`. Cap 10. |
| [.gitignore](.gitignore) | `.firecrawl/` |

### Not in git (local / gitignored)

| Path | Notes |
|---|---|
| `output/*/listing-photos/` | Your framed JPEGs. Crop in place. Never commit. |
| `output/_hero-previews/shop-grid-after.jpg` | Square 8-up. Build after crop. Show the user before any Etsy call. |
| `.env` | Required for the real push. Never commit. |

---

## Hero matrix

Use **your** current filenames. Copy the source aside first when `from` and `out` are the same file, or the crop overwrites the wide shot.

| Alias | Listing id | Photo dir | Local source (keep a copy) | Write `01-` | Demote old wide `01-` |
|---|---|---|---|---|---|
| `kopitiam` | 4566504162 | `output/kopitiam/listing-photos` | `02-closeup-teh.jpg` | `01-hero-closeup-teh.jpg` | `01-hero-living.jpg` → `05-living-wide.jpg` |
| `singlish` | 4566462994 | `output/singlish/listing-photos` | copy `01-hero-desk.jpg` → `_source-desk.jpg` | `01-hero-desk.jpg` | keep desk as theme; crop is the new `01-` |
| `combined` | 4565408194 | `output/combined/listing-photos` | `05-pine-closeup.jpg` | `01-hero-pine-closeup.jpg` | `01-hero-living-room.jpg` → `05-living-room.jpg` (then you can delete leftover `05-pine-closeup.jpg` after the copy) |
| `home-bundle` | 4565314043 | `output/angle-2/bundle/listing-photos` | `03-closeup-l03.jpg` | `01-hero-closeup-l03.jpg` | remove `01-hero-l01.jpg` (or it stays rank 1) |
| `travel-ready` | 4565295242 **live** | `output/travel-journal/ready-made/listing-photos` | `04-hallway.jpg` | `01-hero-hallway.jpg` | `01-hero-living-room.jpg` → `05-living-room.jpg` |
| `travel` | 4565293952 **live** | `output/travel-journal/listing-photos` | copy `01-hero-framed.jpg` → `_source-framed.jpg` | `01-hero-framed.jpg` | do not unpublish |
| `cocoa` | 4564758499 | `output/cocoa/listing-photos` | `03-closeup.jpg` | `01-hero-closeup.jpg` | `01-hero-living-room.jpg` → `04-living-room.jpg` |
| `pocket` | 4564965599 | `output/pocket/listing-photos` | `03-close-pear.jpg` | `01-hero-close-pear.jpg` | remove `01-hero-living.jpg` (or it stays rank 1) |

Leave `l01` / `l02` / Anton parked. They are not in this eight.

`scripts/cover-crops.json` already has the crop boxes and the `from`/`out` names. After you do the copies/moves below, `python scripts/crop-listing-hero.py --force` matches that file.

---

## What you do (one sitting)

### 1. Get the branch

```bash
git fetch origin cursor/shop-cover-cleanup-aa32
git checkout cursor/shop-cover-cleanup-aa32
```

Need Pillow: `pip install pillow`

### 2. Point sources at the names `cover-crops.json` expects

PowerShell, from the repo root. Skip any line whose source is already missing (already cleaned).

```powershell
# Singlish + Travel: do not crop the only copy of the wide shot
copy output\singlish\listing-photos\01-hero-desk.jpg output\singlish\listing-photos\_source-desk.jpg
copy output\travel-journal\listing-photos\01-hero-framed.jpg output\travel-journal\listing-photos\_source-framed.jpg

# Combined: pine becomes 01-, wide living becomes 05-
if (Test-Path output\combined\listing-photos\05-pine-closeup.jpg) {
  if (Test-Path output\combined\listing-photos\01-hero-living-room.jpg) {
    move output\combined\listing-photos\01-hero-living-room.jpg output\combined\listing-photos\05-living-room.jpg
  }
  copy output\combined\listing-photos\05-pine-closeup.jpg output\combined\listing-photos\01-hero-pine-closeup.jpg
}

# Cocoa / Kopitiam / Travel ready: free the 01- slot
if (Test-Path output\cocoa\listing-photos\01-hero-living-room.jpg) {
  move output\cocoa\listing-photos\01-hero-living-room.jpg output\cocoa\listing-photos\04-living-room.jpg
}
if (Test-Path output\kopitiam\listing-photos\01-hero-living.jpg) {
  move output\kopitiam\listing-photos\01-hero-living.jpg output\kopitiam\listing-photos\05-living-wide.jpg
}
if (Test-Path output\travel-journal\ready-made\listing-photos\01-hero-living-room.jpg) {
  move output\travel-journal\ready-made\listing-photos\01-hero-living-room.jpg output\travel-journal\ready-made\listing-photos\05-living-room.jpg
}

# Home bundle + Pocket: old wide 01- must not stay as 01-
if (Test-Path output\angle-2\bundle\listing-photos\01-hero-l01.jpg) {
  remove-item output\angle-2\bundle\listing-photos\01-hero-l01.jpg
}
if (Test-Path output\pocket\listing-photos\01-hero-living.jpg) {
  remove-item output\pocket\listing-photos\01-hero-living.jpg
}
```

`_`-prefixed files are skipped by `push` (not uploaded).

### 3. Crop and look

```bash
python scripts/crop-listing-hero.py --force
```

Opens / writes `output/_hero-previews/shop-grid-after.jpg`. **Show that to the user.** Square tiles must show oak + the print, not a sofa-and-plant wide shot.

One listing only:

```bash
python scripts/crop-listing-hero.py --listing cocoa --force --crop 0.12,0.06,0.88,0.70
python scripts/crop-listing-hero.py --sheet-only
```

`--crop` is `x0,y0,x1,y1` as 0–1 fractions of the source. The script then center-fits **4:5**.

### 4. Dry-run (no token)

```bash
node scripts/etsy-api.mjs push --listing cocoa --photos-only --dry-run
```

Repeat for `pocket` `combined` `singlish` `kopitiam` `home-bundle` `travel-ready` `travel`.

Each plan must start with the new `01-` and have `"patch": []` and `"files": []`. Two files starting `01-` is a fail — the wrong one may sort first.

### 5. Push photos only (needs `.env`)

```bash
node scripts/etsy-api.mjs push --listing cocoa --photos-only
node scripts/etsy-api.mjs push --listing pocket --photos-only
node scripts/etsy-api.mjs push --listing combined --photos-only
node scripts/etsy-api.mjs push --listing singlish --photos-only
node scripts/etsy-api.mjs push --listing kopitiam --photos-only
node scripts/etsy-api.mjs push --listing home-bundle --photos-only
node scripts/etsy-api.mjs push --listing travel-ready --photos-only
node scripts/etsy-api.mjs push --listing travel --photos-only
```

Then `node scripts/etsy-api.mjs get <alias>` and look at Shop Manager. Travel / travel-ready stay `active`. The others stay whatever they were. This CLI never sends `state=active`.

If `.env` is missing: stop. Do not use Browser MCP or BetterWright unless the Open API is down.

Optional refill from Etsy into `listing-photos/_pulled/rank-NN.jpg`:

```bash
node scripts/etsy-api.mjs pull-photos --listing cocoa
```

---

## Hard stops

- Do not `ship` (that packs zips).
- Do not pass `--publish` / `--active`.
- Do not PATCH Travel to `type=download` (`--photos-only` skips that).
- Do not put rooms in the zip or PDF.
- Do not run `line-art/apply-rounded-listing-photos.py` (Japandi-only language).
- Do not rewrite `cocoa/prints.json` or print recipes.
- Do not generate new interiors this pass.
- Do not commit `.env` or `output/`.

---

## If a source file is missing

Your local tree already had these on 2 Sep 2026. If someone wiped `output/`:

1. Prefer `node scripts/etsy-api.mjs pull-photos --listing <alias>` (needs `.env`).
2. Copy rank files onto the names in the matrix, then crop.
3. Do not image-gen letters into a room.
