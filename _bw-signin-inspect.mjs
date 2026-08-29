const creds = await credentials.list({ text: 'etsy' });
const shot = await screenshot({ kind: 'question' });
const full = await snapshot();
return {
  url: page.url(),
  creds,
  shot,
  snapshot: full,
};
