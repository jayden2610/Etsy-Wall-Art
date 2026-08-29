import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const prints = JSON.parse(fs.readFileSync(path.join(HERE, 'prints.json'), 'utf-8'));
const template = fs.readFileSync(path.join(HERE, 'template.html'), 'utf-8');
const args = process.argv.slice(2);

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const printId = argValue('--print');
const sizesAll = args.includes('--sizes');
const outRoot = argValue('--out') || path.join(ROOT, 'output', 'cocoa', 'prints');

const targets = printId
  ? prints.filter((print) => print.printId === printId)
  : prints;

const RATIOS = sizesAll
  ? [
      { name: '2x3', w: 1500, h: 2250 },
      { name: '4x5', w: 1500, h: 1875 },
      { name: '5x7', w: 1500, h: 2100 },
      { name: '11x14', w: 1500, h: 1909 },
      { name: 'ISO', w: 1500, h: 2121 },
    ]
  : [{ name: '2x3', w: 1500, h: 2250 }];

function fileSlug(print) {
  return `${print.printId}_${print.slug}`;
}

async function fitDisplay(page) {
  await page.evaluate(() => {
    const el = document.querySelector('.d11 .display');
    if (!el) return;
    let size = parseFloat(getComputedStyle(el).fontSize);
    while ((el.scrollWidth > el.clientWidth || el.scrollHeight > el.clientHeight) && size > 110) {
      size -= 4;
      el.style.fontSize = `${size}px`;
    }
  });
}

async function renderOne(browser, print, ratio) {
  const payload = { ...print, dir: 'd11' };
  const html = template
    .replace('__DATA_JSON__', JSON.stringify(payload))
    .replaceAll('__STAGE_W__', String(ratio.w))
    .replaceAll('__STAGE_H__', String(ratio.h));

  const outDir = path.join(outRoot, print.printId, ratio.name);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${fileSlug(print)}__${ratio.name}.png`);

  const page = await browser.newPage({
    viewport: { width: ratio.w, height: ratio.h },
    deviceScaleFactor: 3,
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await fitDisplay(page);
  await page.locator('.paper').screenshot({ path: outPath, type: 'png' });
  await page.close();
  console.log('✔', outPath);
  return outPath;
}

async function renderStrip(browser, files) {
  const cellW = 280;
  const cellH = 420;
  const cols = 5;
  const rows = Math.ceil(files.length / cols);
  const images = files.map((file, index) => {
    const bytes = fs.readFileSync(file);
    const src = `data:image/png;base64,${bytes.toString('base64')}`;
    const id = path.basename(file).split('_')[0];
    return `<figure><img src="${src}"><figcaption>${id}</figcaption></figure>`;
  });
  const html = `<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#161616;display:grid;grid-template-columns:repeat(${cols}, ${cellW}px);gap:16px;padding:20px;font-family:Georgia,serif}
    img{width:${cellW}px;height:${cellH}px;object-fit:cover;background:#352418;display:block}
    figcaption{margin-top:8px;color:#c8c2b8;font-size:12px;letter-spacing:0.08em}
  </style></head><body>${images.join('')}</body></html>`;

  const page = await browser.newPage({
    viewport: { width: 20 + cols * (cellW + 16) - 16 + 20, height: 20 + rows * (cellH + 28) + 12 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  const stripPath = path.join(outRoot, 'cocoa-board.png');
  await page.screenshot({ path: stripPath, type: 'png' });
  await page.close();
  console.log('✔', stripPath);
}

async function main() {
  if (!targets.length) {
    console.error('No matching Cocoa prints');
    process.exit(1);
  }
  const browser = await chromium.launch();
  try {
    const files = [];
    for (const print of targets) {
      for (const ratio of RATIOS) {
        const outPath = await renderOne(browser, print, ratio);
        if (ratio.name === '2x3') files.push(outPath);
      }
    }
    if (files.length > 1 && !printId) {
      await renderStrip(browser, files);
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone.', targets.length, 'prints ×', RATIOS.length, 'sizes →', outRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
