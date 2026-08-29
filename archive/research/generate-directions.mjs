import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

const DIRECTIONS = [
  { id: 'd5', file: 'D05_dusty-blue' },
  { id: 'd6', file: 'D06_white-red-word' },
  { id: 'd8', file: 'D08_airy-tracked' },
];
const W = 1500;
const H = 2250;
const SCALE = 2;
const outDir = path.join('output', 'angle-1-one-file');
const savedDir = path.join('output', 'angle-1-saved');

async function main() {
  fs.mkdirSync(outDir, { recursive: true });
  fs.mkdirSync(savedDir, { recursive: true });
  const fileUrl = pathToFileURL(path.resolve('template-m-directions.html')).href;
  const browser = await chromium.launch();
  try {
    for (const dir of DIRECTIONS) {
      const page = await browser.newPage({
        viewport: { width: W, height: H },
        deviceScaleFactor: SCALE,
      });
      await page.goto(`${fileUrl}?v=${dir.id}&label=0`, { waitUntil: 'networkidle' });
      await page.evaluate(() => document.fonts.ready);
      await page.waitForTimeout(500);
      const outPath = path.join(outDir, `${dir.file}.png`);
      await page.locator('.paper').screenshot({ path: outPath, type: 'png' });
      fs.copyFileSync(outPath, path.join(savedDir, `${dir.file}.png`));
      await page.close();
      console.log('✔', outPath);
    }
  } finally {
    await browser.close();
  }
  console.log('\nDone.', DIRECTIONS.length, 'saved in', savedDir);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
