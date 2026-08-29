await overlays.dismiss().catch(() => {});

const search = page.getByRole('textbox', { name: /Search by title/i });
if (await search.count()) {
  await search.fill('Anton');
  await page.getByRole('button', { name: 'Search', exact: true }).click();
}

const data = await page.evaluate(() => {
  const anchors = [...document.querySelectorAll('a')].map((a) => ({
    href: a.href,
    text: (a.innerText || '').trim().slice(0, 180),
  })).filter((a) =>
    /listing-editor|listing\/|listings\/\d|edit/i.test(a.href + a.text),
  );
  const body = document.body.innerText;
  return {
    anchors: anchors.slice(0, 40),
    hasTitle: body.includes('20 Minimalist Typography'),
    draftLine: (body.match(/Draft\d?/) || [])[0],
    snippet: body.includes('20 Minimalist')
      ? body.slice(body.indexOf('20 Minimalist') - 80, body.indexOf('20 Minimalist') + 300)
      : body.slice(0, 800),
  };
});

return { url: page.url(), data };
