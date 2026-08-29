import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const outDir = path.resolve('output', 'listing-photos');
fs.mkdirSync(outDir, { recursive: true });

const zipHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:2000px;height:2667px;background:#FFFFFF;color:#0A0A0A;font-family:Inter,sans-serif;}
  .wrap{padding:96px 100px;}
  h1{font:400 68px Anton,sans-serif;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:12px;}
  .sub{font:500 18px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;margin-bottom:56px;}
  .file{font:600 22px Inter,sans-serif;padding:22px 24px;border:1px solid #E8E8E8;margin-bottom:48px;}
  .file span{display:block;font:500 14px Inter,sans-serif;color:#6b6b6b;margin-top:6px;letter-spacing:0;}
  .row{display:flex;justify-content:space-between;align-items:baseline;padding:20px 0;border-bottom:1px solid #E8E8E8;}
  .folder{font:400 32px Anton,sans-serif;}
  .meta{font:500 18px Inter,sans-serif;color:#6b6b6b;}
  .note{margin-top:56px;font-size:18px;line-height:1.6;color:#6b6b6b;}
</style>
</head>
<body>
<div class="wrap">
  <h1>What’s in the zip</h1>
  <p class="sub">Etsy-Typography-Bundle-20.zip · 4.4 MB · 100 PNGs</p>
  <div class="file">Etsy-Typography-Bundle-20.zip<span>Unzip this. You also get a one-page info PDF on Etsy.</span></div>
  <div class="row"><div class="folder">2x3 /</div><div class="meta">20 prints · 4×6 · 8×12 · 12×18 · 16×24 · 20×30 · 24×36</div></div>
  <div class="row"><div class="folder">4x5 /</div><div class="meta">20 prints · 8×10 · 16×20</div></div>
  <div class="row"><div class="folder">5x7 /</div><div class="meta">20 prints · 5×7 · 10×14</div></div>
  <div class="row"><div class="folder">11x14 /</div><div class="meta">20 prints · 11×14</div></div>
  <div class="row"><div class="folder">ISO /</div><div class="meta">20 prints · 4500×6363 · A4, A3, A2</div></div>
  <p class="note">300 DPI · sRGB · white paper, black Anton. No frames, no room photos. Pick the folder that matches your frame, then print that PNG.</p>
</div>
</body>
</html>`;

const flowHtml = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:2000px;height:2667px;background:#FFFFFF;color:#0A0A0A;font-family:Inter,sans-serif;}
  .wrap{padding:96px 100px;}
  h1{font:400 68px Anton,sans-serif;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:12px;}
  .sub{font:500 18px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;margin-bottom:72px;}
  .step{padding:36px 0;border-bottom:1px solid #E8E8E8;}
  .n{font:400 22px Anton,sans-serif;letter-spacing:0.12em;color:#6b6b6b;margin-bottom:10px;}
  h2{font:400 40px Anton,sans-serif;text-transform:uppercase;margin-bottom:12px;}
  p{font:500 22px Inter,sans-serif;line-height:1.5;color:#333;}
  .note{margin-top:56px;font-size:18px;line-height:1.6;color:#6b6b6b;}
</style>
</head>
<body>
<div class="wrap">
  <h1>How to use</h1>
  <p class="sub">Digital download · no physical item</p>
  <div class="step"><div class="n">01</div><h2>Download</h2><p>After checkout, download both files from Etsy: the zip and the info PDF.</p></div>
  <div class="step"><div class="n">02</div><h2>Unzip · pick a size</h2><p>Open the zip. Choose one folder — 2x3, 4x5, 5x7, 11x14, or ISO — that matches your frame.</p></div>
  <div class="step"><div class="n">03</div><h2>Print</h2><p>Print the PNG at actual size / 100%, no extra border. Or save as PDF first if the print shop asks for a PDF.</p></div>
  <p class="note">Matte 200gsm card works well. Home printer or any print shop. Message us on Etsy if a file has an issue.</p>
</div>
</body>
</html>`;

const browser = await chromium.launch();

async function shot(html, name) {
  const tmp = path.resolve('output', `_${name}.html`);
  const out = path.join(outDir, name);
  fs.writeFileSync(tmp, html);
  const page = await browser.newPage({ viewport: { width: 2000, height: 2667 }, deviceScaleFactor: 1 });
  await page.goto('file:///' + tmp.replaceAll('\\', '/'), { waitUntil: 'networkidle' });
  await page.waitForTimeout(500);
  await page.screenshot({ path: out, type: 'png' });
  await page.close();
  fs.unlinkSync(tmp);
  console.log('✔', out);
}

const pdfPage = await browser.newPage({ viewport: { width: 794, height: 1123 }, deviceScaleFactor: 3 });
await pdfPage.goto('file:///' + path.resolve('info.html').replaceAll('\\', '/'), { waitUntil: 'networkidle' });
await pdfPage.waitForTimeout(800);
await pdfPage.screenshot({ path: path.join(outDir, '07-info-pdf.png'), type: 'png' });
await pdfPage.close();
console.log('✔', path.join(outDir, '07-info-pdf.png'));

await shot(zipHtml, '08-zip-contents.png');
await shot(flowHtml, '09-workflow.png');
await browser.close();
