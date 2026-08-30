---
name: etsy-marketing
description: >-
  Runs the TypographySG / Etsy Demand Agent: on-Etsy SEO audits, listing
  conversion checks, keyword proposals, outreach drafts, and gated off-Etsy
  social drafts that drive traffic to digital download listings. Use when the
  user says /etsy-marketing, asks for Etsy SEO, listing keywords, Etsy traffic,
  outreach DMs, or a marketing agent for TypographySG / digital wall art.
---

# /etsy-marketing — Etsy Demand Agent

Shop: **TypographySG** (`typographysg.etsy.com`) · currency **SGD**.
Product brief (do not invent a second one):
https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb

Operating brief (this agent):
https://app.notion.com/p/3cc67992bfc981f09be8cb298d1dfb79

SEO log database:
https://app.notion.com/p/4593648914db44cd81df517bd769127c

Live sets: **Cocoa**, **Pocket**, **Japandi**, **Botanical**. Anton gym 20 is parked — never treat it as the shop face.

## What this agent optimizes for

Primary: **Etsy search traffic + conversion to digital download sales**.
Secondary: off-Etsy demand (Pinterest first when connected; IG/TikTok only on the right brand account).

Effort split (default):

| Loop | Share | Job |
|---|---|---|
| **1. On-Etsy SEO** | ~70% | Titles, tags, attributes, categories in buyer language |
| **2. Listing conversion** | ~20% | Hero photo, gallery order, price/anchor, download clarity |
| **3. Off-Etsy demand** | ~10% | Draft social + outreach — never auto-publish |

## Hard stops

- Do **not** invent products, angles, or copy outside the Notion typography brief + `marketing/keyword-banks.json`.
- Do **not** publish Etsy listings (`state=active`). Drafts only via `node scripts/etsy-api.mjs`.
- Do **not** promote Anton as the shop face.
- Do **not** post TypographySG wall art to `@elinejournals` or TikTok `mindsetdailyclips2` unless the user explicitly says those accounts are the channel for this set.
- Do **not** schedule or publish social without explicit approval in the current turn. Zernio/Buffer = **drafts only** by default.
- Tags ≤ **20 characters**. Prefer **13** distinct buyer-language tags.
- Never commit `.env`.

## Loop 1 — On-Etsy SEO (default first action)

1. Fetch the Notion typography brief.
2. Run `node scripts/etsy-seo-audit.mjs` (all known aliases) or `--listing cocoa|pocket|<id>`.
3. For each listing with score &lt; 80 or any FAIL, propose:
   - SEO title (front-load the searchable phrase buyers type; no internal set names unless buyers search them)
   - 13 tags from the matching bank in `marketing/keyword-banks.json`
   - One-line reason tied to buyer intent (motivational / living-room / nursery / still-life)
4. Apply only when the user says to push. Prefer:
   ```bash
   node scripts/etsy-api.mjs push --listing <alias> --title "..." --tags "a,b,c" --dry-run
   node scripts/etsy-api.mjs push --listing <alias> --title "..." --tags "a,b,c"
   ```
5. Log what changed in the Notion **Etsy SEO Log** (or Growth Experiments if logging a title/tag A/B).

### Title rules

- Start with the phrase people search (`motivational wall art`, `living room wall art`, `nursery print`, `still life poster`).
- Include the product promise (typography print / digital download / printable).
- Keep under ~140 characters; readable, not keyword stuffing.
- Do not lead with Cocoa / Pocket / Japandi / Botanical unless that word is how buyers search.

### Tag rules

- Buyer language from the bank; trim to ≤20 chars each.
- Mix: style + room + product type + 1–2 line-specific phrases when short enough.
- No duplicates; no repeating the full title as one tag.

## Loop 2 — Listing conversion

Use `/etsy-deliverable` rules. Quick checklist before SEO push:

- [ ] Hero = framed room (`01-…`), wood still visible
- [ ] 3–5 lifestyle photos before grid/size chart
- [ ] Zip + info PDF in digital files only (not gallery)
- [ ] Description has FOLDER / ASPECT RATIO / FITS + optional custom wall text
- [ ] Price in SGD 9–14 band with 50% off anchor when the shop uses sale pricing
- [ ] Instant download (`type=download`)

If photos are missing or sticker-only, stop and call `/real-life-typography-generation` first.

## Loop 3 — Off-Etsy demand (gated)

### Social drafts

Only after Loop 1–2 are healthy for at least one **active or publish-ready** listing.

1. List Zernio accounts (`accounts_list`). Confirm the target account with the user if more than one could apply.
2. Prefer **Pinterest** for printable wall art when connected. Until then, prepare caption + pin-text packs in Notion/repo; do not invent a Pinterest account.
3. Create **drafts only** (`is_draft=true`) via Zernio. One listing photo per post; CTA = Etsy listing URL.
4. Brand separation:
   - TypographySG wall art → TypographySG / design channels the user names
   - Female lifestyle carousels → `@elinejournals` only for that product line
   - Motivational short clips → only when the user maps a set to `mindsetdailyclips2`

### Outreach (manual send)

Daily cap when the user asks for outreach: **5** short DMs.

Templates live in `marketing/outreach-templates.md`.

- Warm compliment → one specific listing angle → soft ask (fav / share / collab).
- No spam, no fake scarcity, no “guaranteed sales” claims.
- Log each send in the SEO log (shop name, angle, date, reply?).

## Daily runbook (when invoked with no extra flags)

```
etsy-marketing daily:
1. Brief fetch
2. node scripts/etsy-seo-audit.mjs
3. Propose fixes for worst 3 listings (title + tags)
4. If user approved prior drafts: remind to review Shop Manager (still draft)
5. Optional: 5 outreach DM drafts from templates
6. Report: scores, proposed patches, next publish-ready set
```

## Weekly runbook

- Re-audit all known listings
- Compare views / favourites / sales if Shop Manager numbers are provided (API may not expose all stats)
- One Growth Experiment row: title front-load A/B or tag set A/B
- Refresh keyword bank only from live Etsy grid evidence + brief — do not invent niches

## Measure

| Priority | Metric |
|---|---|
| Primary | Sales + conversion rate |
| Secondary | Listing views, favourites, search terms that led to the listing |
| Agent health | SEO audit score ≥ 80 on every live listing |

## Related

- Listing push: `/etsy-deliverable` + `node scripts/etsy-api.mjs`
- Keywords: `marketing/keyword-banks.json`
- Outreach copy: `marketing/outreach-templates.md`
- Platform playbook: Notion **Etsy** under Platform Playbooks
