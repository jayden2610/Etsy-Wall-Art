import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { execFileSync } from 'node:child_process';
import { chromium } from 'playwright';

const HERE = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(HERE, '..');
const prints = JSON.parse(fs.readFileSync(path.join(HERE, 'prints.json'), 'utf-8'));
const ratios = ['2x3', '4x5', '5x7', '11x14', 'ISO'];
const printsRoot = path.join(ROOT, 'output', 'cocoa', 'prints');
const packRoot = path.join(ROOT, 'output', 'cocoa', 'bundle');
const listingDir = path.join(ROOT, 'output', 'cocoa', 'listing-photos');
const zipPath = path.join(ROOT, 'output', 'cocoa', 'Cocoa-Typography-Bundle-20.zip');
const pdfPath = path.join(HERE, 'INFO.pdf');
const infoHtml = path.join(HERE, 'info.html');

fs.mkdirSync(listingDir, { recursive: true });

for (const ratio of ratios) {
  const dest = path.join(packRoot, ratio);
  fs.mkdirSync(dest, { recursive: true });
  for (const print of prints) {
    const name = `${print.printId}_${print.slug}__${ratio}.png`;
    const src = path.join(printsRoot, print.printId, ratio, name);
    if (!fs.existsSync(src)) throw new Error(`Missing ${src}`);
    fs.copyFileSync(src, path.join(dest, name));
  }
}

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
    const name = `${print.printId}_${print.slug}__2x3.png`;
    const abs = path.join(printsRoot, print.printId, '2x3', name).replaceAll('\\', '/');
    return `<figure><img src="file:///${abs}"><figcaption>${print.printId}</figcaption></figure>`;
  })
  .join('');

const gridHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Inter:wght@500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:2000px;height:2667px;background:#352418;color:#E8D5B8}
.wrap{padding:56px 60px}
h1{font:400 42px 'Abril Fatface',serif;letter-spacing:0.04em;text-transform:uppercase;text-align:center}
p{font:500 14px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;text-align:center;margin:10px 0 28px;color:#C9B89A}
.grid{display:grid;grid-template-columns:repeat(5,1fr);gap:16px}
figure{background:#2A1C14}
img{width:100%;height:auto;display:block}
figcaption{font:500 12px Inter,sans-serif;letter-spacing:0.1em;text-align:center;padding:8px 0 10px}
</style></head><body><div class="wrap">
<h1>20 Cocoa Prints</h1>
<p>One Etsy bundle · D11 · packed lockups</p>
<div class="grid">${cells}</div>
</div></body></html>`;

async function shotHtml(html, outName, w, h) {
  const tmp = path.join(ROOT, 'output', `_${outName}.html`);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: w, height: h }, deviceScaleFactor: 1 });
  await page.goto(`file:///${tmp.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  const out = path.join(listingDir, outName);
  await page.screenshot({ path: out, type: 'png' });
  await page.close();
  fs.unlinkSync(tmp);
  console.log('✔', out);
}

await shotHtml(gridHtml, '00-bundle-grid.png', 2000, 2667);

const previewIds = ['C01', 'C07', 'C13'];
for (const id of previewIds) {
  const print = prints.find((row) => row.printId === id);
  const name = `${print.printId}_${print.slug}__2x3.png`;
  const abs = path.join(printsRoot, print.printId, '2x3', name).replaceAll('\\', '/');
  const html = `<!DOCTYPE html><html><body style="margin:0;background:#352418">
    <img src="file:///${abs}" style="width:2000px;height:auto;display:block">
  </body></html>`;
  await shotHtml(html, `${id}-preview.png`, 2000, 3000);
}

const sizeHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:2000px;height:2667px;background:#352418;color:#E8D5B8;font-family:Inter,sans-serif}
.wrap{padding:96px 100px}
h1{font:400 72px 'Abril Fatface',serif;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:12px}
.sub{font:500 18px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#C9B89A;margin-bottom:72px}
table{width:100%;border-collapse:collapse}
th,td{text-align:left;padding:22px 16px;border-bottom:1px solid #5A4030;font-size:22px}
th{font:600 13px Inter,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:#C9B89A}
td.ratio{font:400 32px 'Abril Fatface',serif}
.note{margin-top:64px;font-size:18px;line-height:1.6;color:#C9B89A}
</style></head><body><div class="wrap">
<h1>Size guide</h1>
<p class="sub">20 prints · 5 ratios · 300 DPI · cocoa</p>
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
await shotHtml(sizeHtml, '06-size-chart.png', 2000, 2667);

const zipSlide = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:2000px;height:2667px;background:#352418;color:#E8D5B8;font-family:Inter,sans-serif}
.wrap{padding:96px 100px}
h1{font:400 68px 'Abril Fatface',serif;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:12px}
.sub{font:500 18px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#C9B89A;margin-bottom:56px}
.file{font:600 22px Inter,sans-serif;padding:22px 24px;border:1px solid #5A4030;margin-bottom:48px}
.file span{display:block;font:500 14px Inter,sans-serif;color:#C9B89A;margin-top:6px}
.row{display:flex;justify-content:space-between;align-items:baseline;padding:20px 0;border-bottom:1px solid #5A4030}
.folder{font:400 32px 'Abril Fatface',serif}
.meta{font:500 18px Inter,sans-serif;color:#C9B89A}
.note{margin-top:56px;font-size:18px;line-height:1.6;color:#C9B89A}
</style></head><body><div class="wrap">
<h1>What’s in the zip</h1>
<p class="sub">Cocoa-Typography-Bundle-20.zip · 100 PNGs</p>
<div class="file">Cocoa-Typography-Bundle-20.zip<span>Unzip this. You also get a one-page info PDF on Etsy.</span></div>
<div class="row"><div class="folder">2x3 /</div><div class="meta">20 prints · 4×6 · 8×12 · 12×18 · 16×24 · 20×30 · 24×36</div></div>
<div class="row"><div class="folder">4x5 /</div><div class="meta">20 prints · 8×10 · 16×20</div></div>
<div class="row"><div class="folder">5x7 /</div><div class="meta">20 prints · 5×7 · 10×14</div></div>
<div class="row"><div class="folder">11x14 /</div><div class="meta">20 prints · 11×14</div></div>
<div class="row"><div class="folder">ISO /</div><div class="meta">20 prints · A4, A3, A2</div></div>
<p class="note">300 DPI · sRGB · cocoa paper, cream type. No frames, no room photos. Pick the folder that matches your frame, then print that PNG.</p>
</div></body></html>`;
await shotHtml(zipSlide, '08-zip-contents.png', 2000, 2667);

const flowHtml = `<!DOCTYPE html><html><head><meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Abril+Fatface&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
*{margin:0;padding:0;box-sizing:border-box}
body{width:2000px;height:2667px;background:#352418;color:#E8D5B8;font-family:Inter,sans-serif}
.wrap{padding:96px 100px}
h1{font:400 68px 'Abril Fatface',serif;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:12px}
.sub{font:500 18px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#C9B89A;margin-bottom:72px}
.step{padding:36px 0;border-bottom:1px solid #5A4030}
.n{font:400 22px 'Abril Fatface',serif;letter-spacing:0.12em;color:#C9B89A;margin-bottom:10px}
h2{font:400 40px 'Abril Fatface',serif;text-transform:uppercase;margin-bottom:12px}
p{font:500 22px Inter,sans-serif;line-height:1.5;color:#E8D5B8}
.note{margin-top:56px;font-size:18px;line-height:1.6;color:#C9B89A}
</style></head><body><div class="wrap">
<h1>How to use</h1>
<p class="sub">Digital download · no physical item</p>
<div class="step"><div class="n">01</div><h2>Download</h2><p>After checkout, download both files from Etsy: the zip and the info PDF.</p></div>
<div class="step"><div class="n">02</div><h2>Unzip · pick a size</h2><p>Open the zip. Choose one folder — 2x3, 4x5, 5x7, 11x14, or ISO — that matches your frame.</p></div>
<div class="step"><div class="n">03</div><h2>Print</h2><p>Print the PNG at actual size / 100%, no extra border. Or save as PDF first if the print shop asks for a PDF.</p></div>
<p class="note">Matte 200gsm card works well. Home printer or any print shop. Message us on Etsy if a file has an issue.</p>
</div></body></html>`;
await shotHtml(flowHtml, '09-workflow.png', 2000, 2667);

const infoShot = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
await infoShot.goto(`file:///${infoHtml.replaceAll('\\', '/')}`, { waitUntil: 'networkidle' });
await infoShot.waitForTimeout(800);
await infoShot.screenshot({ path: path.join(listingDir, '07-info-pdf.png'), type: 'png' });
await infoShot.close();
console.log('✔', path.join(listingDir, '07-info-pdf.png'));

await browser.close();
console.log('\nCocoa deliverable ready.');
