const search = page.getByRole('textbox', { name: /Search by title/i });
if (await search.count()) {
  await search.fill('Anton');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}
const text = await page.evaluate(() => document.body.innerText.slice(0, 4000));
const shot = await screenshot({ kind: 'proof' });
return { url: page.url(), text, shot };
