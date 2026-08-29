await overlays.dismiss().catch(() => {});
const gotIt = page.locator('aria-ref=e363');
if (await gotIt.count()) {
  await human.click(gotIt);
}
const shot = await screenshot({ annotate: true });
const html = await page.evaluate(() => {
  const texts = [...document.querySelectorAll('label, h2, h3, legend, button, a')]
    .map((el) => (el.innerText || '').trim())
    .filter((t) => /digital|download|file|photo|video|physical|ship/i.test(t))
    .slice(0, 40);
  const files = [...document.querySelectorAll('input[type=file]')].map((el) => ({
    name: el.name,
    accept: el.accept,
    multiple: el.multiple,
    id: el.id,
  }));
  return { texts, files, url: location.href };
});
return { shot, html, snapshot: await snapshot({ interactive: true }) };
