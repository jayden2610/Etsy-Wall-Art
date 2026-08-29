await overlays.dismiss().catch(() => {});
if (!page.url().includes('4564670051')) {
  await page.goto('https://www.etsy.com/your/shops/me/listing-editor/edit/4564670051#media', {
    waitUntil: 'domcontentloaded',
  });
}
const media = page.getByRole('link', { name: /Photo/i }).first();
if (await media.count()) await human.click(media);
const text = await page.evaluate(() => {
  const t = document.body.innerText;
  return {
    digital: (t.match(/Digital files?[\s\S]{0,400}/i) || [])[0],
    photos: (t.match(/Add photos[\s\S]{0,200}/i) || [])[0],
    files: (t.match(/\.zip|\.pdf|Bundle-20|INFO/gi) || []).slice(0, 20),
  };
});
return { url: page.url(), text };
