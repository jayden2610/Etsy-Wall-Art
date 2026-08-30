# etsy-typography — agent brief

Before doing anything in this folder, read the Notion page:

**Etsy - Typography/Wall Art**  
https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb

That page is the product brief, style notes, listing copy, and remaining work. This repo is the local renderer / export workspace for that page. Do not invent a second brief.

Then read `README.md`. Live sets are **Cocoa**, **Pocket** (the zine still-lifes), **Japandi**, and **Botanical**. Anton gym 20 is parked — do not treat it as the shop face.

**Cocoa (approved volume set):** read `cocoa/.handoff`, then `node cocoa/generate.mjs` and `node cocoa/generate.mjs --sizes`. Do not rewrite `cocoa/prints.json`.

**Pocket:** same 11 zine posters as `Typography/assets/Typography - ZIne Poster`. Do not split Pocket and Zine into two products.

**Listings:** `/etsy-deliverable` via `node scripts/etsy-api.mjs` (Open API). Leave drafts unpublished. Do not use BetterWright or Browser MCP for listing edits unless the API is down. Never commit `.env`.

**Marketing:** `/etsy-marketing` — Etsy Demand Agent (SEO ~70%, conversion ~20%, gated social/outreach ~10%). Run `node scripts/etsy-seo-audit.mjs`. Banks in `marketing/keyword-banks.json`. Do not invent a second brief; do not auto-publish.
