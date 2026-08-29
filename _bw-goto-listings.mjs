await page.goto('https://www.etsy.com/your/shops/me/tools/listings', { waitUntil: 'domcontentloaded' });
const s = await snapshot({ interactive: true });
return { url: page.url(), title: await page.title(), snapshot: s };
