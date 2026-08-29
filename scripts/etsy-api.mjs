import fs from "node:fs";
import path from "node:path";

import {
  ENV_PATH,
  ROOT,
  etsyHeaders,
  refreshAccessToken,
  requireCreds,
  upsertEnv,
} from "./etsy-env.mjs";

const API = "https://openapi.etsy.com/v3/application";

/** Alias → listing id + default local files. Flags override. Anton is parked (id only). */
const SETS = {
  anton: { id: "4564670051" },
  cocoa: {
    id: "4564758499",
    photos: "output/cocoa/listing-photos",
    zip: "output/cocoa/Cocoa-Typography-Bundle-20.zip",
    pdf: "cocoa/INFO.pdf",
    desc: "output/cocoa/listing-photos/listing-description.txt",
  },
  pocket: {
    id: "4564965599",
    photos: "output/pocket/listing-photos",
    zip: "output/pocket/Pocket-Studies-Zine-Posters-11.zip",
    pdf: "pocket/INFO.pdf",
    desc: "output/pocket/listing-photos/listing-description.txt",
  },
};

const KNOWN = Object.fromEntries(
  Object.entries(SETS).map(([alias, set]) => [alias, set.id]),
);

function die(message) {
  console.error(message);
  process.exit(1);
}

function argValue(flag) {
  const idx = process.argv.indexOf(flag);
  if (idx < 0) return "";
  return process.argv[idx + 1] || "";
}

function hasFlag(flag) {
  return process.argv.includes(flag);
}

function resolveListingId(raw) {
  if (!raw) return "";
  const key = raw.toLowerCase();
  return KNOWN[key] || raw;
}

function mimeFor(filePath) {
  const ext = path.extname(filePath).toLowerCase();
  if (ext === ".png") return "image/png";
  if (ext === ".jpg" || ext === ".jpeg") return "image/jpeg";
  if (ext === ".pdf") return "application/pdf";
  if (ext === ".zip") return "application/zip";
  return "application/octet-stream";
}

function blobFromFile(filePath) {
  const bytes = fs.readFileSync(filePath);
  return new Blob([bytes], { type: mimeFor(filePath) });
}

function orderListingPhotos(dir) {
  const names = fs.readdirSync(dir).filter((name) => {
    if (name.startsWith("_")) return false;
    if (!/^\d{2}-/.test(name)) return false;
    if (/^(07|08|09)-/.test(name)) return false;
    return /\.(jpe?g|png)$/i.test(name);
  });
  const rank = (name) => {
    if (/^01-/.test(name)) return 1;
    if (/^0[2-5]-/.test(name)) return 2;
    if (/^00-/.test(name)) return 3;
    if (/^06-/.test(name)) return 4;
    return 9;
  };
  return names
    .sort((a, b) => rank(a) - rank(b) || a.localeCompare(b))
    .map((name) => path.join(dir, name));
}

async function api(creds, token, method, urlPath, { json, form } = {}) {
  const headers = etsyHeaders(creds, token);
  const options = { method, headers };
  if (json) {
    headers["Content-Type"] = "application/json";
    options.body = JSON.stringify(json);
  }
  if (form) options.body = form;
  const res = await fetch(`${API}${urlPath}`, options);
  const text = await res.text();
  let body = {};
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { raw: text.slice(0, 240) };
  }
  if (!res.ok) {
    throw new Error(
      `${method} ${urlPath} ${res.status} ${body.error || body.error_description || text.slice(0, 240)}`,
    );
  }
  return body;
}

async function getListing(creds, token, listingId) {
  return api(creds, token, "GET", `/listings/${listingId}`);
}

async function rememberShop(listing) {
  if (listing.shop_id) upsertEnv(ENV_PATH, { ETSY_SHOP_ID: String(listing.shop_id) });
}

async function replaceImages(creds, token, shopId, listingId, photoPaths) {
  const current = await api(
    creds,
    token,
    "GET",
    `/listings/${listingId}/images`,
  );
  const existing = current.results || [];
  for (const image of existing) {
    await api(
      creds,
      token,
      "DELETE",
      `/shops/${shopId}/listings/${listingId}/images/${image.listing_image_id}`,
    );
  }
  const uploaded = [];
  for (const [index, filePath] of photoPaths.entries()) {
    const form = new FormData();
    form.append("image", blobFromFile(filePath), path.basename(filePath));
    form.append("rank", String(index + 1));
    form.append("overwrite", "true");
    const row = await api(
      creds,
      token,
      "POST",
      `/shops/${shopId}/listings/${listingId}/images`,
      { form },
    );
    uploaded.push({ rank: index + 1, file: path.basename(filePath), id: row.listing_image_id });
  }
  return uploaded;
}

async function replaceFiles(creds, token, shopId, listingId, filePaths) {
  const current = await api(
    creds,
    token,
    "GET",
    `/shops/${shopId}/listings/${listingId}/files`,
  );
  const keepNames = new Set(filePaths.map((filePath) => path.basename(filePath)));
  const uploaded = [];
  for (const filePath of filePaths) {
    const form = new FormData();
    form.append("file", blobFromFile(filePath), path.basename(filePath));
    const row = await api(
      creds,
      token,
      "POST",
      `/shops/${shopId}/listings/${listingId}/files`,
      { form },
    );
    uploaded.push({ file: path.basename(filePath), id: row.listing_file_id });
  }
  for (const file of current.results || []) {
    if (keepNames.has(file.filename)) continue;
    await api(
      creds,
      token,
      "DELETE",
      `/shops/${shopId}/listings/${listingId}/files/${file.listing_file_id}`,
    );
  }
  return uploaded;
}

async function cmdStatus() {
  const creds = requireCreds();
  const token = await refreshAccessToken(creds);
  const me = await api(creds, token, "GET", `/users/${creds.userId || "me"}/shops`).catch(
    () => null,
  );
  console.log(
    JSON.stringify(
      {
        ok: true,
        shopId: creds.shopId || me?.results?.[0]?.shop_id || null,
        listings: KNOWN,
      },
      null,
      2,
    ),
  );
}

async function cmdGet(listingId) {
  if (!listingId) die("Need listing id or cocoa|anton|pocket");
  const creds = requireCreds();
  const token = await refreshAccessToken(creds);
  const listing = await getListing(creds, token, listingId);
  await rememberShop(listing);
  const images = await api(creds, token, "GET", `/listings/${listingId}/images`);
  const files = listing.shop_id
    ? await api(creds, token, "GET", `/shops/${listing.shop_id}/listings/${listingId}/files`)
    : { results: [] };
  console.log(
    JSON.stringify(
      {
        listing_id: listing.listing_id,
        state: listing.state,
        title: listing.title,
        price: listing.price,
        type: listing.listing_type || listing.type,
        tags: listing.tags,
        images: (images.results || []).map((row) => ({
          rank: row.rank,
          id: row.listing_image_id,
        })),
        files: (files.results || []).map((row) => row.filename),
      },
      null,
      2,
    ),
  );
}

async function cmdPush() {
  if (hasFlag("--publish") || hasFlag("--active")) {
    die("Refuse to publish. Omit --publish / --active. Draft only.");
  }
  const listingArg = argValue("--listing");
  const listingId = resolveListingId(listingArg);
  if (!listingId) die("Need --listing <id|cocoa|anton|pocket>");
  const set = SETS[listingArg.toLowerCase()] || {};

  const photoDir = argValue("--photos") || set.photos || "";
  const zipPath = argValue("--zip") || set.zip || "";
  const pdfPath = argValue("--pdf") || set.pdf || "";
  const descPath = argValue("--desc") || set.desc || "";
  const title = argValue("--title");
  const tagsRaw = argValue("--tags");
  const dryRun = hasFlag("--dry-run");

  const photoPaths = photoDir ? orderListingPhotos(path.resolve(ROOT, photoDir)) : [];
  const filePaths = [zipPath, pdfPath]
    .filter(Boolean)
    .map((filePath) => path.resolve(ROOT, filePath));
  for (const filePath of [...photoPaths, ...filePaths]) {
    if (!fs.existsSync(filePath)) die(`Missing file: ${filePath}`);
  }

  const creds = requireCreds();
  const token = await refreshAccessToken(creds);
  const listing = await getListing(creds, token, listingId);
  await rememberShop(listing);
  if (listing.state === "active" && (photoPaths.length || filePaths.length)) {
    console.error("Listing is active. Uploading files/photos on an active listing is allowed; still not publishing.");
  }

  const patch = { type: "download" };
  if (title) patch.title = title;
  if (descPath) patch.description = fs.readFileSync(path.resolve(ROOT, descPath), "utf8");
  if (tagsRaw) patch.tags = tagsRaw.split(",").map((tag) => tag.trim()).filter(Boolean);

  const plan = {
    listingId,
    state: listing.state,
    shopId: listing.shop_id,
    patch: Object.keys(patch),
    photos: photoPaths.map((filePath) => path.basename(filePath)),
    files: filePaths.map((filePath) => path.basename(filePath)),
    dryRun,
  };
  if (dryRun) {
    console.log(JSON.stringify({ ok: true, ...plan }, null, 2));
    return;
  }

  if (Object.keys(patch).length) {
    await api(creds, token, "PATCH", `/shops/${listing.shop_id}/listings/${listingId}`, {
      json: patch,
    });
  }
  const images = photoPaths.length
    ? await replaceImages(creds, token, listing.shop_id, listingId, photoPaths)
    : [];
  const files = filePaths.length
    ? await replaceFiles(creds, token, listing.shop_id, listingId, filePaths)
    : [];
  const after = await getListing(creds, token, listingId);
  if (after.state === "active" && listing.state !== "active") {
    die("Listing became active. Stop and check Shop Manager — this CLI must not publish.");
  }
  console.log(
    JSON.stringify(
      {
        ok: true,
        listingId,
        state: after.state,
        title: after.title,
        images,
        files,
      },
      null,
      2,
    ),
  );
}

const command = process.argv[2] || "status";
if (command === "status") await cmdStatus();
else if (command === "get") await cmdGet(resolveListingId(process.argv[3]));
else if (command === "push") await cmdPush();
else die(`Unknown command: ${command}. Use status | get | push.`);
