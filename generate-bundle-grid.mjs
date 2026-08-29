import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const prints = JSON.parse(fs.readFileSync('./prints.json', 'utf-8'));
const bundle = path.resolve('output', 'Etsy-Typography-Bundle-20');
const srcDir = path.join(bundle, '2x3');
const files = prints.map((p) => {
  const slug = p.headline.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const name = `${p.id}__${slug}__2x3__4500x6750.png`;
  const abs = path.join(srcDir, name);
  if (!fs.existsSync(abs)) throw new Error(`Missing ${abs}`);
  return { id: p.id, headline: p.headline, headline2: p.headline2 || '', src: abs.replaceAll('\\', '/') };
});

const cells = files
  .map(
    (f) => `<figure>
      <img src="file:///${f.src}" alt="${f.headline}">
      <figcaption>${f.id} · ${f.headline} ${f.headline2}</figcaption>
    </figure>`,
  )
  .join('\n');

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{background:#FFFFFF;width:2400px;height:3000px;}
  .wrap{padding:48px 56px 56px;}
  h1{font:600 26px Inter,sans-serif;letter-spacing:0.28em;text-transform:uppercase;color:#0A0A0A;text-align:center;}
  p{font:500 13px Inter,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b;text-align:center;margin:8px 0 28px;}
  .grid{display:grid;grid-template-columns:repeat(5,1fr);gap:18px;}
  figure{background:#FFFFFF;border:1px solid #E8E8E8;padding:10px 10px 14px;}
  img{width:100%;height:auto;display:block;}
  figcaption{font:500 11px Inter,sans-serif;letter-spacing:0.08em;text-transform:uppercase;color:#6b6b6b;text-align:center;margin-top:10px;}
</style>
</head>
<body>
<div class="wrap">
  <h1>20 Motivational Prints</h1>
  <p>One Etsy bundle · Anton · White</p>
  <div class="grid">${cells}</div>
</div>
</body>
</html>`;

const tmp = path.resolve('output', '_bundle-grid.html');
fs.writeFileSync(tmp, html);
const outPath = path.join(bundle, 'listing-grid-all-20.png');
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2400, height: 3000 }, deviceScaleFactor: 1 });
await page.goto('file:///' + tmp.replaceAll('\\', '/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(800);
await page.screenshot({ path: outPath, type: 'png', fullPage: false });
await browser.close();
fs.unlinkSync(tmp);
console.log('✔', outPath);
