import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const prints = JSON.parse(fs.readFileSync(path.join(HERE, 'prints.json'), 'utf-8'));
const ratios = ['2x3', '4x5', '5x7', '11x14', 'ISO'];
const packRoot = path.join(ROOT, 'output', 'pocket');
const listingDir = path.join(ROOT, 'output', 'pocket', 'listing-photos');
const zipPath = path.join(ROOT, 'output', 'pocket', 'Pocket-Studies-Zine-Posters-11.zip');
const pdfPath = path.join(HERE, 'INFO.pdf');
const infoHtml = path.join(HERE, 'info.html');

fs.mkdirSync(listingDir, { recursive: true });

if (fs.existsSync(zipPath)) fs.unlinkSync(zipPath);
execFileSync('tar', ['-a', '-cf', zipPath, ...ratios], { cwd: packRoot });
console.log('✔', zipPath, `${(fs.statSync(zipPath).size / 1024 / 1024).toFixed(2)} MB`);

const browser = await chromium.launch();

const pdfPage = await browser.newPage();
await pdfPage.goto(`file:///${infoHtml.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
await pdfPage.waitForTimeout(800);
await pdfPage.pdf({
  path: pdfPath,
  format: 'A4',
  printBackground: true,
  margin: { top: '0', bottom: '0', left: '0', right: '0' },
});
await pdfPage.close();
console.log('✔', pdfPath);

const cells = prints
  .map((print) => {
    const name = `${print.printId}_${print.slug}__2x3.jpg`;
    const abs = path.join(packRoot, '2x3', name).replaceAll('\\', '/');
    return `<figure><img src="file:///${abs}"><figcaption>${print.line}</figcaption></figure>`;
  })
  .join('');

const gridHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:2000px;height:2667px;background:#F3EDE4;color:#2A241C}
.wrap{padding:52px 56px}
h1{font:500 48px 'Cormorant Garamond',serif;font-style:italic;text-align:center}
p{font:500 13px 'IBM Plex Mono',monospace;letter-spacing:0.16em;text-transform:uppercase;text-align:center;margin:10px 0 28px;color:#6A5E50}
.grid{display:flex;flex-wrap:wrap;justify-content:center;gap:18px}
figure{width:calc((100% - 54px)/4);background:#EBE3D6}
img{width:100%;height:auto;display:block}
figcaption{font:500 11px 'IBM Plex Mono',monospace;text-align:center;padding:8px 6px 10px;line-height:1.35}
</style></head><body><div class="wrap">
<h1>Pocket Studies</h1>
<p>11 zine still-life prints · cream paper</p>
<div class="grid">${cells}</div>
</div></body></html>`;

async function shotHtml(html, outName, w, h) {
  const tmp = path.join(ROOT, 'output', `_${outName}.html`);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`file:///${tmp.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const out = path.join(listingDir, outName);
  await page.screenshot({ path: out, type: 'jpeg', quality: 88 });
  await page.close();
  fs.unlinkSync(tmp);
  console.log('✔', out);
}

await shotHtml(gridHtml, '00-bundle-grid.jpg', 2000, 2667);

const sizeHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,500;1,500&family=IBM+Plex+Mono:wght@400;500&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:2000px;height:2667px;background:#F3EDE4;color:#2A241C;font-family:'IBM Plex Mono',monospace}
.wrap{padding:96px 100px}
h1{font:500 72px 'Cormorant Garamond',serif;font-style:italic;margin-bottom:12px}
.sub{font:500 16px 'IBM Plex Mono',monospace;letter-spacing:0.16em;text-transform:uppercase;color:#6A5E50;margin-bottom:72px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:22px 16px;border-bottom:1px solid #D4C8B8;font-size:22px}
th{font:500 13px 'IBM Plex Mono',monospace;letter-spacing:0.18em;text-transform:uppercase;color:#6A5E50}
td.ratio{font:500 32px 'Cormorant Garamond',serif}
.note{margin-top:64px;font-size:18px;line-height:1.6;color:#6A5E50}
</style></head><body><div class="wrap">
<h1>Size guide</h1>
<p class="sub">11 prints · 5 ratios · 300 DPI · Pocket Studies</p>
<table>
<tr><th>Ratio</th><th>Prints at</th><th>File</th></tr>
<tr><td class="ratio">2:3</td><td>4×6, 8×12, 12×18, 16×24, 20×30, 24×36</td><td>4500×6750</td></tr>
<tr><td class="ratio">4:5</td><td>8×10, 16×20</td><td>4500×5625</td></tr>
<tr><td class="ratio">5:7</td><td>5×7, 10×14</td><td>4500×6300</td></tr>
<tr><td class="ratio">11:14</td><td>11×14</td><td>4500×5727</td></tr>
<tr><td class="ratio">ISO</td><td>A4, A3, A2</td><td>4500×6363</td></tr>
</table>
<p class="note">Digital download. Print on matte 200gsm. No physical item ships. Frames and rooms in listing photos are inspiration only.</p>
</div></body></html>`;
await shotHtml(sizeHtml, '06-size-chart.jpg', 2000, 2667);

await browser.close();
console.log('\nPocket Studies deliverable ready.');
