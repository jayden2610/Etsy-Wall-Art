import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const prints = JSON.parse(fs.readFileSync('./prints-board2.json', 'utf-8'));
const template = fs.readFileSync('./template-board2.html', 'utf-8');
const args = process.argv.slice(2);

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const dirId = argValue('--dir');
const outRoot = argValue('--out') || path.join('output', 'angle-1-m02-board');
const targets = dirId ? prints.filter((print) => print.dir === dirId) : prints;
const ratio = { name: '2x3', w: 1500, h: 2250 };

function slug(print) {
  const name = print.dirName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  return `${print.printId}__${print.dir}__${name}`;
}

async function renderOne(browser, print) {
  const html = template
    .replace('__DATA_JSON__', JSON.stringify(print))
    .replaceAll('__STAGE_W__', String(ratio.w))
    .replaceAll('__STAGE_H__', String(ratio.h));

  const outDir = path.join(outRoot, print.printId, ratio.name);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug(print)}__${ratio.name}.png`);

  const page = await browser.newPage({
    viewport: { width: ratio.w, height: ratio.h },
    deviceScaleFactor: 2,
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.locator('.paper').screenshot({ path: outPath, type: 'png' });
  await page.close();
  console.log('✔', outPath);
  return outPath;
}

async function renderStrip(browser, files, printsForStrip) {
  const cellW = 420;
  const cellH = 630;
  const cells = files.map((file, i) => {
    const bytes = fs.readFileSync(file);
    const src = `data:image/png;base64,${bytes.toString('base64')}`;
    const print = printsForStrip[i];
    const label = `${print.dir.toUpperCase()}  ·  ${print.dirName}`;
    return `<figure><img src="${src}"><figcaption>${label}</figcaption></figure>`;
  });
  const html = `<!DOCTYPE html><html><head><style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{background:#161616;display:flex;gap:20px;padding:24px 24px 20px;font-family:Georgia,serif}
    figure{width:${cellW}px}
    img{width:${cellW}px;height:${cellH}px;object-fit:cover;background:#fff;display:block}
    figcaption{margin-top:10px;color:#c8c2b8;font-size:13px;letter-spacing:0.08em;text-transform:uppercase}
  </style></head><body>${cells.join('')}</body></html>`;

  const page = await browser.newPage({
    viewport: { width: 24 + files.length * (cellW + 20) - 20 + 24, height: cellH + 70 },
    deviceScaleFactor: 1,
  });
  await page.setContent(html, { waitUntil: 'load' });
  const stripPath = path.join(outRoot, 'board-400.png');
  await page.screenshot({ path: stripPath, type: 'png' });
  await page.close();
  console.log('✔', stripPath);
}

async function main() {
  if (!targets.length) {
    console.error('No matching prints');
    process.exit(1);
  }
  const browser = await chromium.launch();
  try {
    const files = [];
    for (const print of targets) {
      files.push(await renderOne(browser, print));
    }
    if (files.length > 1) {
      await renderStrip(browser, files, targets);
    }
  } finally {
    await browser.close();
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
