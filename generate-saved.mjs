import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const prints = JSON.parse(fs.readFileSync('./prints-saved.json', 'utf-8'));
const template = fs.readFileSync('./template-saved.html', 'utf-8');
const args = process.argv.slice(2);

function argValue(flag) {
  const i = args.indexOf(flag);
  return i >= 0 ? args[i + 1] : null;
}

const printId = argValue('--print');
const dirId = argValue('--dir');
const sizesAll = args.includes('--sizes');
const outRoot = argValue('--out') || path.join('output', 'angle-1-finished');

let targets = prints;
if (printId) targets = targets.filter((print) => print.printId === printId);
if (dirId) targets = targets.filter((print) => print.dir === dirId);

const RATIOS = sizesAll
  ? [
      { name: '2x3', w: 1500, h: 2250 },
      { name: '4x5', w: 1500, h: 1875 },
      { name: '5x7', w: 1500, h: 2100 },
      { name: '11x14', w: 1500, h: 1909 },
      { name: 'ISO', w: 1500, h: 2121 },
    ]
  : [{ name: '2x3', w: 1500, h: 2250 }];

function slug(print) {
  return `${print.printId}__${print.dir}__${print.line.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')}`;
}

async function renderOne(browser, print, ratio) {
  const html = template
    .replace('__DATA_JSON__', JSON.stringify(print))
    .replaceAll('__STAGE_W__', String(ratio.w))
    .replaceAll('__STAGE_H__', String(ratio.h));

  const outDir = path.join(outRoot, print.printId, ratio.name);
  fs.mkdirSync(outDir, { recursive: true });
  const outPath = path.join(outDir, `${slug(print)}__${ratio.name}.png`);

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
  const savedDir = path.join('output', 'angle-1-saved');
  const m01Names = {
    d5: 'D05_dusty-blue.png',
    d6: 'D06_white-red-word.png',
    d8: 'D08_airy-tracked.png',
    d11: 'D11_packed-cocoa.png',
    d12: 'D12_sentence-clay.png',
  };
  const m02Names = {
    d8: 'D08_m02-remember-why.png',
    d11: 'D11_m02-remember-why.png',
    d12: 'D12_m02-remember-why.png',
  };
  const savedNames = printId === 'M01' && sizesAll
    ? m01Names
    : printId === 'M02'
      ? m02Names
      : null;
  if (savedNames) {
    fs.mkdirSync(savedDir, { recursive: true });
    for (const print of targets) {
      const destName = savedNames[print.dir];
      if (!destName) continue;
      const src = path.join(outRoot, print.printId, '2x3', `${slug(print)}__2x3.png`);
      const dest = path.join(savedDir, destName);
      fs.copyFileSync(src, dest);
      console.log('saved', dest);
    }
  }
  console.log('\nDone.', targets.length, 'looks ×', RATIOS.length, 'sizes →', outRoot);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
