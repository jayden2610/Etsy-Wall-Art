import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';

const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<link href="https://fonts.googleapis.com/css2?family=Anton&family=Inter:wght@400;500;600&display=swap" rel="stylesheet">
<style>
  *{margin:0;padding:0;box-sizing:border-box}
  body{width:2000px;height:2667px;background:#FFFFFF;color:#0A0A0A;font-family:Inter,sans-serif;}
  .wrap{padding:96px 100px;}
  h1{font:400 72px Anton,sans-serif;letter-spacing:0.02em;text-transform:uppercase;margin-bottom:12px;}
  .sub{font:500 18px Inter,sans-serif;letter-spacing:0.16em;text-transform:uppercase;color:#6b6b6b;margin-bottom:72px;}
  table{width:100%;border-collapse:collapse;}
  th,td{text-align:left;padding:22px 16px;border-bottom:1px solid #E8E8E8;font-size:22px;}
  th{font:600 13px Inter,sans-serif;letter-spacing:0.18em;text-transform:uppercase;color:#6b6b6b;}
  td.ratio{font:400 28px Anton,sans-serif;}
  .note{margin-top:64px;font-size:18px;line-height:1.6;color:#6b6b6b;}
</style>
</head>
<body>
<div class="wrap">
  <h1>Size guide</h1>
  <p class="sub">20 prints · 5 ratios · 300 DPI · white</p>
  <table>
    <tr><th>Ratio</th><th>Prints at</th><th>File</th></tr>
    <tr><td class="ratio">2:3</td><td>4×6, 8×12, 12×18, 16×24, 20×30, 24×36</td><td>4500×6750</td></tr>
    <tr><td class="ratio">4:5</td><td>8×10, 16×20</td><td>4500×5625</td></tr>
    <tr><td class="ratio">5:7</td><td>5×7, 10×14</td><td>4500×6300</td></tr>
    <tr><td class="ratio">11:14</td><td>11×14</td><td>4500×5727</td></tr>
    <tr><td class="ratio">ISO</td><td>A4, A3, A2</td><td>4500×6363</td></tr>
  </table>
  <p class="note">Digital download. Print on matte 200gsm. No physical item ships. Frames and rooms in listing photos are inspiration only.</p>
</div>
</body>
</html>`;

const tmp = path.resolve('output', '_size-chart.html');
const out = path.resolve('output', 'listing-photos', '06-size-chart.png');
fs.writeFileSync(tmp, html);
const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: 2000, height: 2667 }, deviceScaleFactor: 1 });
await page.goto('file:///' + tmp.replaceAll('\\', '/'), { waitUntil: 'networkidle' });
await page.waitForTimeout(600);
await page.screenshot({ path: out, type: 'png' });
await browser.close();
fs.unlinkSync(tmp);
console.log('✔', out);
