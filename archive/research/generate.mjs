import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

if (!fs.existsSync('./template.html')) {
  console.error(`template.html was removed.

First ship is the rendered Anton set in output/ (see README.md).
Product brief: Notion "Etsy - Typography/Wall Art"
https://app.notion.com/p/3ca67992bfc981e5a4b3d41d93f2c8eb

To explore a new set (volume catalog or a new high-quality system), add a new template file and pass it here — do not recreate the shipped Anton lockup.`);
  process.exit(1);
}

const prints = JSON.parse(fs.readFileSync('./prints.json', 'utf-8'));
const template = fs.readFileSync('./template.html', 'utf-8');

const args = process.argv.slice(2);
function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const one = argValue('--one');
const idsRaw = argValue('--ids');
const outRoot = argValue('--out') || path.join('output', 'Etsy-Typography-Bundle-20');

let targets = prints;
if (one) targets = prints.filter((p) => p.id === one);
if (idsRaw) {
  const set = new Set(idsRaw.split(',').map((s) => s.trim()).filter(Boolean));
  targets = prints.filter((p) => set.has(p.id));
}

const RATIOS = [
  { name: '2x3', w: 1500, h: 2250 },
  { name: '4x5', w: 1500, h: 1875 },
  { name: '5x7', w: 1500, h: 2100 },
  { name: '11x14', w: 1500, h: 1909 },
  { name: 'ISO', w: 1500, h: 2121 },
];

function slug(print) {
  return print.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

async function renderOne(browser, print, ratio) {
  const html = template
    .replace('__DATA_JSON__', JSON.stringify(print))
    .replaceAll('__STAGE_W__', String(ratio.w))
    .replaceAll('__STAGE_H__', String(ratio.h));

  const outDir = path.join(outRoot, ratio.name);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(
    outDir,
    `${print.id}__${slug(print)}__${ratio.name}__${ratio.w * 3}x${ratio.h * 3}.png`,
  );

  const page = await browser.newPage({
    viewport: { width: ratio.w, height: ratio.h },
    deviceScaleFactor: 3,
  });
  await page.setContent(html, { waitUntil: 'networkidle' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(400);
  await page.locator('.paper').screenshot({ path: outPath, type: 'png' });
  await page.close();
  console.log('✔', outPath);
  return outPath;
}

async function main() {
  if (!targets.length) {
    console.error('No matching prints');
    process.exit(1);
  }
  fs.mkdirSync(outRoot, { recursive: true });
  const browser = await chromium.launch();
  try {
    for (const print of targets) {
      for (const ratio of RATIOS) {
        if (one && ratio.name !== '2x3') continue;
        await renderOne(browser, print, ratio);
      }
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone. Wrote', targets.length, 'prints to', outRoot);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
