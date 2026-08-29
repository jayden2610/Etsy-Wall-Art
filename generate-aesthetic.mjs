import { chromium } from 'playwright';
import path from 'node:path';
import fs from 'node:fs';

const variants = ['v1','v2','v3','v4','v5','v6'];
const templatePath = path.resolve('template-aesthetic.html');
const outDir = path.resolve('output/aesthetic');
fs.mkdirSync(outDir,{recursive:true});

const browser = await chromium.launch();
for(const v of variants){
  const page = await browser.newPage({ viewport:{width:1500, height:2250}, deviceScaleFactor:3 });
  await page.goto('file:///' + templatePath.replaceAll('\\','/') + `?v=${v}`, {waitUntil:'networkidle'});
  await page.waitForTimeout(1300);
  const outPath = path.join(outDir, `${v}__4500x6750.png`);
  await page.locator('.paper').screenshot({ path: outPath, type:'png' });
  console.log('✔', v, outPath);
  await page.close();
}
await browser.close();
console.log('Done');
