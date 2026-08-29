import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';

const variants = [
  { id:'A-anton', font:'anton', label:'A — ANTON (Brutalist Bold, Etsy Bestseller Look)' },
  { id:'B-bebas', font:'bebas', label:'B — BEBAS NEUE (Tall & Airy, Modern Gym)' },
  { id:'C-space', font:'space', label:'C — SPACE GROTESK (Geometric Soft, Scandi)' },
  { id:'D-syne', font:'syne', label:'D — SYNE (Extra Bold Rounded, Trendy)' },
  { id:'E-archivo', font:'archivo', label:'E — ARCHIVO BLACK (Ultra Dense, Streetwear)' },
  { id:'F-serif', font:'serif', label:'F — DM SERIF (Elegant Premium, Editorial)' },
];

const templatePath = path.resolve('template-variants.html');
const outDir = path.resolve('output/variants');
fs.mkdirSync(outDir, {recursive:true});

const browser = await chromium.launch();
for(const v of variants){
  const page = await browser.newPage({ viewport:{width:1500, height:2250}, deviceScaleFactor:3 });
  await page.goto('file:///' + templatePath.replaceAll('\\','/') + `?font=${v.font}`, {waitUntil:'networkidle'});
  await page.waitForTimeout(1500);
  const outPath = path.join(outDir, `${v.id}__4500x6750.png`);
  await page.locator('.paper').screenshot({ path: outPath, type:'png' });
  console.log('✔', v.label, '→', outPath);
  await page.close();
  
  // also make a labeled preview with caption outside (combine later)
}
await browser.close();
console.log('\nDone — check output/variants/');
