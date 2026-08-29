import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';
const variants = ['v1a','v1b','v1c','v1d'];
const tpl = path.resolve('template-v1-refined.html');
const outDir = path.resolve('output/v1-refined');
fs.mkdirSync(outDir,{recursive:true});
const browser = await chromium.launch();
for(const v of variants){
  const page = await browser.newPage({ viewport:{width:1500, height:2250}, deviceScaleFactor:3 });
  await page.goto('file:///' + tpl.replaceAll('\\','/') + `?v=${v}`, {waitUntil:'networkidle'});
  await page.waitForTimeout(1200);
  const out = path.join(outDir, `${v}__4500x6750.png`);
  await page.locator('.paper').screenshot({ path: out, type:'png' });
  console.log('✔', v, out);
  await page.close();
}
await browser.close();
console.log('Done');
