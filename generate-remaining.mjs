import fs from 'node:fs';
import path from 'node:path';
import { chromium } from 'playwright';
if (!fs.existsSync('./template.html')) {
  console.error('template.html was removed. Leftover S04/S05 job — first ship is the rendered Anton set. Brief: Notion "Etsy - Typography/Wall Art".');
  process.exit(1);
}

const prints = JSON.parse(fs.readFileSync('./prints.json','utf-8'));
const template = fs.readFileSync('./template.html','utf-8');
const targets = prints.filter(p=>['S04','S05'].includes(p.id));
const RATIOS = [
  { name:'2x3', w:1500, h:2250 },
  { name:'4x5', w:1500, h:1875 },
  { name:'5x7', w:1500, h:2100 },
  { name:'11x14', w:1500, h:1909 },
  { name:'ISO', w:1500, h:2121 },
];
for(const print of targets){
  for(const ratio of RATIOS){
    const html = template.replace('__DATA_JSON__', JSON.stringify(print))
      .replaceAll('{{headline}}', print.headline)
      .replaceAll('{{headline2}}', print.headline2||'');
    const outDir = path.join('output', ratio.name);
    fs.mkdirSync(outDir,{recursive:true});
    const slug = print.headline.toLowerCase().replace(/[^a-z0-9]+/g,'-').slice(0,20);
    const outPath = path.join(outDir, `${print.id}__${slug}__${ratio.name}__${ratio.w*3}x${ratio.h*3}.png`);
    if(fs.existsSync(outPath)){ console.log('skip exists', outPath); continue; }
    const browser = await chromium.launch();
    const page = await browser.newPage({ viewport:{width: ratio.w, height: ratio.h}, deviceScaleFactor:3 });
    await page.setContent(html, {waitUntil:'networkidle'});
    await page.waitForTimeout(1500);
    await page.locator('.paper').screenshot({ path: outPath, type:'png' });
    await browser.close();
    console.log('✔', outPath);
  }
}
console.log('done remaining');
