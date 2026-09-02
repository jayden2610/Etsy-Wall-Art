# Etsy Open API (TypographySG)

Primary path: `node scripts/etsy-api.mjs` from `etsy-typography`. Do not use Browser MCP or BetterWright for listing edits unless the API is down.

## Auth

`.env` (gitignored):

```
ETSY_KEYSTRING=
ETSY_SHARED_SECRET=
ETSY_REDIRECT_URI=https://localhost:8443/oauth/callback
ETSY_REFRESH_TOKEN=
ETSY_USER_ID=
ETSY_SHOP_ID=
```

- Seller App, own shop only. [Register](https://www.etsy.com/developers/documentation/getting_started/register)
- OAuth 2 + PKCE: `node scripts/etsy-oauth.mjs`
- Scopes: `listings_r listings_w`
- Access token 1 hour; refresh 90 days. `etsy-api.mjs` refreshes on each run.
- Callback must match Your Apps character-for-character. `localhost` is a hostname; `127.0.0.1` is rejected.
- `x-api-key` is `keystring:shared_secret`. Trim `.env` values — trailing spaces 403.

Never commit `.env`. Never paste the shared secret in chat.

## CLI

```bash
node scripts/etsy-api.mjs status
node scripts/etsy-api.mjs get cocoa
node scripts/etsy-api.mjs pull-photos --listing cocoa
node scripts/etsy-api.mjs push --listing cocoa --photos <dir> --zip <zip> --pdf <pdf> --desc <txt> --title "..."
node scripts/etsy-api.mjs push --listing cocoa --dry-run
node scripts/etsy-api.mjs push --listing cocoa --photos-only
```

Aliases: `cocoa` `pocket` `combined` `singlish` `kopitiam` `home-bundle` `travel` `travel-ready` (defaults included) · `anton` (parked, id only) · or a numeric listing id.

`push --listing cocoa` fills photos / zip / PDF / description from `SETS` in `scripts/etsy-api.mjs`. Flags override.

`--photos-only` uploads listing images and skips zip, PDF, and title/description/tag/price/`type` patches. Use it for cover-card updates, especially live Travel. Do not unpublish Travel.

`push` never sends `state=active`. `--publish` / `--active` exit.

Photo order in a folder: `01-` cover card (tight oak, ≥40% of a 1:1 tile), `02-`–`05-` rooms, `10-`–`13-` clean prints, `00-` grid, `06-` size chart. Skip `_` prefixes and `07`/`08`/`09` slides. Cap 10. Wide living room is never `01-` — see [rooms.md](rooms.md).

## Endpoints used

| Job | Endpoint | Notes |
|---|---|---|
| Read listing | `GET /v3/application/listings/{id}` | |
| Update copy | `PATCH /v3/application/shops/{shop}/listings/{id}` | title, description, tags, `type=download`. Omit `state`. |
| Images | `GET/DELETE/POST .../listings/{id}/images` | rank 1 = hero |
| Digital files | `GET/DELETE/POST .../listings/{id}/files` | zip + PDF, 5×20 MB |
| Custom wall text | `POST .../listings/{id}/personalization?supports_multiple_personalization_questions=true` | optional text, `add_on_price` 4.90 |
| Aspect chips | `PUT .../listings/{id}/properties/{property_id}` | second slice |

Docs: [Listings](https://developers.etsy.com/documentation/tutorials/listings) · [Personalization](https://developers.etsy.com/documentation/tutorials/personalization-migration) · [OAuth](https://developers.etsy.com/documentation/essentials/oauth2)

## Still human

- First publish (USD 0.20 listing fee)
- Visual QA in Shop Manager
- Cannot PATCH an active listing back to `draft` (only `inactive`)

## BetterWright fallback (API down only)

`betterwright run` is a 30s hard cap. One action per script.

1. Save draft = DOM click `/save (as )?draft/i`. Never `human.click` the footer.
2. Item Options = `.../edit/{LISTING_ID}#item-options` only. The nav link opens `/listing-editor/create`.
3. Leave a dirty page with `window.onbeforeunload = null` first.
4. `setInputFiles` only accepts files in the BetterWright artifact dir.
5. Success URL contains `opened-from=listing-editor-success`.

`archive/betterwright/` is leftover click scripts. Do not treat them as a CLI.
