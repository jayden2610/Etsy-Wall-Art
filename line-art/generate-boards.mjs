import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

/**
 * Build contact sheets (per-bundle + combined) for the Grok-generated
 * Japandi + Botanical sets, in the same shape as output/cocoa/cocoa-board.png.
 *
 * Per-bundle: dark #161626 background, 5-col grid, 280x420 cell, figcaption = ID.
 * Combined:   all 10 prints in one sheet, 5x2 grid.
 *
 * Source: output/<bundle>/<ratio>/<ID>_<slug>__<ratio>.<ext>
 * Output: output/<bundle>/<bundle>-board.png  (per bundle)
 *         output/sources/japandi-botanical-board.png  (combined)
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'output');

const BUNDLES = {
  japandi:   { ids: ['J01', 'J02', 'J04', 'J05', 'J06'], cols: 5 },
  botanical: { ids: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06'], cols: 3 },
};

const cellW = 280;
const cellH = 420;
const gap = 16;
const pad = 24;

function findFile(bundle, pid) {
  // Use the 5x7 source (most vertical of the available ratios) so the contact
  // sheet cells don't crop the off-center subject out of frame.
  const dir = path.join(ROOT, bundle, '5x7');
  const exts = ['.jpg', '.jpeg', '.webp', '.png'];
  for (const ext of exts) {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(`${pid}_`) && f.endsWith(ext));
    if (files.length) return path.join(dir, files[0]);
  }
  throw new Error(`No file for ${bundle}/${pid}`);
}

function makeHtml(files, cols, title) {
  const cells = files
    .map((file) => {
      const bytes = fs.readFileSync(file);
      const src = `data:image/${path.extname(file).slice(1)};base64,${bytes.toString('base64')}`;
      const id = path.basename(file).split('_')[0];
      return `<figure><img src="${src}"><figcaption>${id}</figcaption></figure>`;
    })
    .join('');
  return `<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#161626;display:grid;grid-template-columns:repeat(${cols}, ${cellW}px);gap:${gap}px;padding:${pad}px;font-family:Georgia,serif}
    img{width:${cellW}px;height:${cellH}px;object-fit:contain;background:#E8DDC9;display:block}
    figcaption{margin-top:8px;color:#c8c2b8;font-size:12px;letter-spacing:0.08em;text-align:center}
    h1{grid-column:1 / -1;color:#c8c2b8;font:400 16px Georgia,serif;letter-spacing:0.32em;text-transform:uppercase;text-align:center;margin-bottom:8px}
  </style></head><body><h1>${title}</h1>${cells}</body></html>`;
}

async function renderSheet(browser, files, cols, outPath, title) {
  const rows = Math.ceil(files.length / cols);
  const width = pad * 2 + cols * cellW + (cols - 1) * gap;
  const height = pad * 2 + 36 + rows * (cellH + 28) + 12;
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const html = makeHtml(files, cols, title);
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, type: 'png' });
  await page.close();
  console.log('✔', outPath);
}

async function main() {
  const browser = await chromium.launch();
  try {
    // Per-bundle boards
    for (const [bundle, cfg] of Object.entries(BUNDLES)) {
      const files = cfg.ids.map((pid) => findFile(bundle, pid));
      const outPath = path.join(ROOT, bundle, `${bundle}-board.png`);
      await renderSheet(
        browser,
        files,
        cfg.cols,
        outPath,
        `${bundle.toUpperCase()} · ${files.length} PRINTS · WARM BEIGE`,
      );
    }

    // Combined board (5x2 = 10 prints)
    const allFiles = [
      ...BUNDLES.japandi.ids.map((pid) => findFile('japandi', pid)),
      ...BUNDLES.botanical.ids.map((pid) => findFile('botanical', pid)),
    ];
    const combinedOut = path.join(ROOT, 'sources', 'japandi-botanical-board.png');
    await renderSheet(
      browser,
      allFiles,
      5,
      combinedOut,
      'JAPANDI + BOTANICAL · 10 PRINTS · GROK GENERATED',
    );
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
