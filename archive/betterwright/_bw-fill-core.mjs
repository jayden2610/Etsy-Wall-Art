const title = '20 Minimalist Typography Wall Art Set, Motivational Office Prints, White Anton Poster Bundle, Digital Download';
const description = `DIGITAL WALL ART | Instant Download
20 minimalist white typography prints. Bold Anton type. No physical item ships.

HOW TO USE
1. Download your files
2. Save as PDF
3. Print it out

Print at actual size / 100%, no extra border. Matte 200gsm card works well. Home printer or any print shop.

WHAT YOU GET
20 prints × 5 sizes (2:3, 4:5, 5:7, 11:14, ISO / A-series) · 300 DPI · sRGB

Personal use only. Message us on Etsy if a file has an issue.`;

await overlays.dismiss().catch(() => {});

const titleBox = page.locator('aria-ref=e309');
await human.click(titleBox);
await titleBox.fill(title);

const descBox = page.locator('aria-ref=e318');
await human.click(descBox);
await descBox.fill(description);

const priceBox = page.locator('aria-ref=e402');
await human.click(priceBox);
await priceBox.fill('14.90');

const qtyBox = page.locator('aria-ref=e420');
await human.click(qtyBox);
await qtyBox.fill('999');

await human.click(page.locator('aria-ref=e528'));
await human.click(page.locator('aria-ref=e541'));
await page.locator('aria-ref=e551').selectOption({ label: 'Made to order' });

const v = await snapshot({ diff: true });
return {
  titleVal: await titleBox.inputValue(),
  descLen: (await descBox.inputValue()).length,
  priceVal: await priceBox.inputValue(),
  qtyVal: await qtyBox.inputValue(),
  snapshot: v,
};
