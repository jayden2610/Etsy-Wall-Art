import fs from "node:fs";
import path from "node:path";

export const ROOT = path.resolve(import.meta.dirname, "..");
export const ENV_PATH = path.join(ROOT, ".env");
const TOKEN_URL = "https://api.etsy.com/v3/public/oauth/token";

export function loadEnv(file = ENV_PATH) {
  const out = {};
  if (!fs.existsSync(file)) return out;
  for (const line of fs.readFileSync(file, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq < 1) continue;
    const key = trimmed.slice(0, eq);
    let value = trimmed.slice(eq + 1);
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value.trim();
  }
  return out;
}

export function upsertEnv(file, updates) {
  let text = fs.existsSync(file) ? fs.readFileSync(file, "utf8") : "";
  if (text && !text.endsWith("\n")) text += "\n";
  for (const [key, value] of Object.entries(updates)) {
    const line = `${key}=${value}`;
    const pattern = new RegExp(`^${key}=.*$`, "m");
    if (pattern.test(text)) text = text.replace(pattern, line);
    else text += `${line}\n`;
  }
  fs.writeFileSync(file, text);
}

export function requireCreds(env = loadEnv()) {
  const keystring = env.ETSY_KEYSTRING?.trim();
  const secret = env.ETSY_SHARED_SECRET?.trim();
  const refreshToken = env.ETSY_REFRESH_TOKEN?.trim();
  if (!keystring || !secret) {
    throw new Error(
      "Add ETSY_KEYSTRING and ETSY_SHARED_SECRET to .env. Do not paste them in chat.",
    );
  }
  return {
    keystring,
    secret,
    refreshToken,
    redirectUri: env.ETSY_REDIRECT_URI?.trim() || "https://localhost:8443/oauth/callback",
    shopId: env.ETSY_SHOP_ID?.trim() || "",
    userId: env.ETSY_USER_ID?.trim() || "",
  };
}

export function apiKeyHeader(creds) {
  return `${creds.keystring}:${creds.secret}`;
}

export async function refreshAccessToken(creds = requireCreds()) {
  if (!creds.refreshToken) {
    throw new Error("No ETSY_REFRESH_TOKEN. Run node scripts/etsy-oauth.mjs first.");
  }
  const res = await fetch(TOKEN_URL, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "x-api-key": apiKeyHeader(creds),
    },
    body: new URLSearchParams({
      grant_type: "refresh_token",
      client_id: creds.keystring,
      refresh_token: creds.refreshToken,
    }),
  });
  const json = await res.json();
  if (!res.ok || !json.access_token) {
    throw new Error(`Token refresh failed: ${res.status} ${json.error || ""}`.trim());
  }
  if (json.refresh_token && json.refresh_token !== creds.refreshToken) {
    upsertEnv(ENV_PATH, { ETSY_REFRESH_TOKEN: json.refresh_token });
    creds.refreshToken = json.refresh_token;
  }
  return json.access_token;
}

export function etsyHeaders(creds, accessToken) {
  return {
    "x-api-key": apiKeyHeader(creds),
    Authorization: `Bearer ${accessToken}`,
  };
}
