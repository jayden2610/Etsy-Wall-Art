# etsy-typography — agent brief

Before doing anything in this folder, read the Notion page:

**Etsy - Typography/Wall Art**  
https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb

That page is the product brief, style notes, listing copy, and remaining work. This repo is the local renderer / export workspace for that page. Do not invent a second brief.

Then read `README.md` for what is already rendered and which path is open (volume catalog vs high-quality curated). Both are valid. The first ship is the already-rendered Anton motivational set in `output/` — there is no `template.html` to regenerate it from.

**Cocoa volume set (approved):** read `.handoff`, then `node generate-cocoa.mjs` and `node generate-cocoa.mjs --sizes`. Do not rewrite `prints-cocoa.json`.
