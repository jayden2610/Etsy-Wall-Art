import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

/**
 * For each bundle + each ratio, render ONE grid PNG that contains all the
 * prints of that bundle at that ratio. Drop the file into:
 *   output/<bundle>/<bundle>_<ratio>__grid.png
 * and a per-print copy at:
 *   output/<bundle>/<ID>/<ratio>/<bundle>_<ratio>__grid.png
 *
 * This replaces the per-print-per-ratio file fan-out with one composite
 * image per ratio per bundle, matching the "1 image per ratio per set"
 * shape that's easier to inspect and ship.
 */

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..', 'output');

const BUNDLES = {
  japandi:   { ids: ['J01', 'J02', 'J04', 'J05', 'J06'] },
  botanical: { ids: ['B01', 'B02', 'B03', 'B04', 'B05', 'B06'] },
};

const RATIOS = ['4x5', '5x7', '11x14', 'ISO'];

function findFile(bundle, pid, ratio) {
  const dir = path.join(ROOT, bundle, ratio);
  const exts = ['.jpg', '.jpeg', '.webp', '.png'];
  for (const ext of exts) {
    const files = fs.readdirSync(dir).filter((f) => f.startsWith(`${pid}_`) && f.endsWith(ext));
    if (files.length) return path.join(dir, files[0]);
  }
  throw new Error(`No file for ${bundle}/${pid}/${ratio}`);
}

function makeHtml(files, cols, ratio, title) {
  // Each cell shows the print at a consistent visual size, paper-cream
  // background acts as a natural border.
  const cellW = 360;
  const cellH = 480;
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
    body{background:#161626;display:grid;grid-template-columns:repeat(${cols}, ${cellW}px);gap:18px;padding:28px;font-family:Georgia,serif}
    figure{margin:0}
    img{width:${cellW}px;height:${cellH}px;object-fit:contain;background:#E8DDC9;display:block}
    figcaption{margin-top:8px;color:#c8c2b8;font-size:13px;letter-spacing:0.08em;text-align:center}
    h1{grid-column:1 / -1;color:#c8c2b8;font:400 16px Georgia,serif;letter-spacing:0.32em;text-transform:uppercase;text-align:center;margin-bottom:6px}
    p{grid-column:1 / -1;color:#9a948b;font:400 11px Georgia,serif;letter-spacing:0.24em;text-align:center;margin-bottom:14px}
  </style></head><body><h1>${title}</h1><p>${ratio.toUpperCase()} · ALL PRINTS</p>${cells}</body></html>`;
}

async function renderOne(browser, files, cols, ratio, outPath, title) {
  const rows = Math.ceil(files.length / cols);
  const cellW = 360;
  const cellH = 480;
  const gap = 18;
  const pad = 28;
  const width = pad * 2 + cols * cellW + (cols - 1) * gap;
  const height = pad * 2 + 70 + rows * (cellH + 28) + 12;
  const page = await browser.newPage({
    viewport: { width, height },
    deviceScaleFactor: 1,
  });
  const html = makeHtml(files, cols, ratio, title);
  await page.setContent(html, { waitUntil: 'load' });
  await page.screenshot({ path: outPath, type: 'png' });
  await page.close();
  console.log('✔', outPath);
}

async function main() {
  const browser = await chromium.launch();
  try {
    for (const [bundle, cfg] of Object.entries(BUNDLES)) {
      const cols = bundle === 'japandi' ? 5 : 3;
      for (const ratio of RATIOS) {
        const files = cfg.ids.map((pid) => findFile(bundle, pid, ratio));
        // Drop the composite INSIDE the ratio folder, alongside the per-print
        // PNGs. This mirrors the Pocket-Studies "flat ratio folder" shape
        // while giving you one grid for visual review.
        const outPath = path.join(ROOT, bundle, ratio, `${bundle}_${ratio}__grid.png`);
        await renderOne(
          browser,
          files,
          cols,
          ratio,
          outPath,
          `${bundle.toUpperCase()} · ${files.length} PRINTS · ${ratio.toUpperCase()}`,
        );
      }
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone.');
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
