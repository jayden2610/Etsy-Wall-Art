import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const prints = JSON.parse(fs.readFileSync('./prints-angle1.json', 'utf-8'));
const template = fs.readFileSync('./template-angle1.html', 'utf-8');
const args = process.argv.slice(2);

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const one = argValue('--one');
const outRoot = argValue('--out') || path.join('output', 'angle-1-motivational');
const targets = one ? prints.filter((print) => print.id === one) : prints;

const RATIOS = [
  { name: '2x3', w: 1500, h: 2250 },
  { name: '4x5', w: 1500, h: 1875 },
  { name: '5x7', w: 1500, h: 2100 },
  { name: '11x14', w: 1500, h: 1909 },
  { name: 'ISO', w: 1500, h: 2121 },
];

function slug(print) {
  return print.line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
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
    `${print.id}__${slug(print)}__${print.dir}__${ratio.name}.png`,
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
        await renderOne(browser, print, ratio);
      }
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
