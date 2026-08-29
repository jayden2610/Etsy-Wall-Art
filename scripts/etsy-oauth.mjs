import { createHash, randomBytes } from "node:crypto";
import { execFileSync } from "node:child_process";
import fs from "node:fs";
import https from "node:https";
import path from "node:path";

import { ENV_PATH, ROOT, requireCreds, upsertEnv } from "./etsy-env.mjs";

const KEY_PATH = path.join(ROOT, ".etsy-oauth-key.pem");
const CERT_PATH = path.join(ROOT, ".etsy-oauth-cert.pem");
const STATE_PATH = path.join(ROOT, ".etsy-oauth-state.json");
const SCOPES = "listings_r listings_w";
const OPENSSL_CANDIDATES = [
  "openssl",
  "C:\\Program Files\\Git\\usr\\bin\\openssl.exe",
];

function findOpenssl() {
  for (const bin of OPENSSL_CANDIDATES) {
    try {
      execFileSync(bin, ["version"], { stdio: "ignore" });
      return bin;
    } catch {
      // try next
    }
  }
  throw new Error("openssl not found. Install Git for Windows or add openssl to PATH.");
}

function ensureCerts() {
  if (fs.existsSync(KEY_PATH) && fs.existsSync(CERT_PATH)) {
    return { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) };
  }
  const openssl = findOpenssl();
  execFileSync(openssl, [
    "req",
    "-x509",
    "-newkey",
    "rsa:2048",
    "-keyout",
    KEY_PATH,
    "-out",
    CERT_PATH,
    "-days",
    "365",
    "-nodes",
    "-subj",
    "/CN=localhost",
  ]);
  return { key: fs.readFileSync(KEY_PATH), cert: fs.readFileSync(CERT_PATH) };
}

function pkce() {
  const verifier = randomBytes(32).toString("base64url");
  const challenge = createHash("sha256").update(verifier).digest("base64url");
  return { verifier, challenge };
}

function connectUrl({ keystring, redirectUri, state, challenge }) {
  const url = new URL("https://www.etsy.com/oauth/connect");
  url.searchParams.set("response_type", "code");
  url.searchParams.set("client_id", keystring);
  url.searchParams.set("redirect_uri", redirectUri);
  url.searchParams.set("scope", SCOPES);
  url.searchParams.set("state", state);
  url.searchParams.set("code_challenge", challenge);
  url.searchParams.set("code_challenge_method", "S256");
  return url.toString();
}

async function exchangeCode({ keystring, redirectUri, code, verifier }) {
  const body = new URLSearchParams({
    grant_type: "authorization_code",
    client_id: keystring,
    redirect_uri: redirectUri,
    code,
    code_verifier: verifier,
  });
  const res = await fetch("https://api.etsy.com/v3/public/oauth/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
  });
  const json = await res.json();
  if (!res.ok || !json.refresh_token) {
    throw new Error(`Token exchange failed: ${res.status} ${JSON.stringify(json)}`);
  }
  return json;
}

function writeHtml(ok, message) {
  return `<!doctype html><meta charset="utf-8"><title>Etsy OAuth</title>
<body style="font-family:system-ui;padding:2rem;max-width:40rem">
<h1>${ok ? "Granted" : "Failed"}</h1>
<p>${message}</p>
<p>You can close this tab.</p>
</body>`;
}

async function saveTokens(tokens) {
  const userId = String(tokens.access_token || "").split(".")[0];
  upsertEnv(ENV_PATH, {
    ETSY_REFRESH_TOKEN: tokens.refresh_token,
    ETSY_USER_ID: userId,
  });
  if (fs.existsSync(STATE_PATH)) fs.unlinkSync(STATE_PATH);
  return { scopes: tokens.scope, userId, expiresIn: tokens.expires_in };
}

async function exchangeFromUrl(raw) {
  const env = requireCreds();
  const saved = JSON.parse(fs.readFileSync(STATE_PATH, "utf8"));
  const url = new URL(raw);
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  if (error) throw new Error(url.searchParams.get("error_description") || error);
  if (!code) throw new Error("Missing authorization code.");
  if (returnedState !== saved.state) throw new Error("State mismatch.");
  const tokens = await exchangeCode({
    keystring: env.keystring,
    redirectUri: env.redirectUri,
    code,
    verifier: saved.verifier,
  });
  return saveTokens(tokens);
}

const exchangeArg = process.argv.includes("--exchange")
  ? process.argv[process.argv.indexOf("--exchange") + 1]
  : null;
if (exchangeArg) {
  const result = await exchangeFromUrl(exchangeArg);
  console.log(JSON.stringify({ ok: true, ...result }));
  process.exit(0);
}

const env = requireCreds();
const { verifier, challenge } = pkce();
const state = randomBytes(16).toString("hex");
const authUrl = connectUrl({
  keystring: env.keystring,
  redirectUri: env.redirectUri,
  state,
  challenge,
});
fs.writeFileSync(
  STATE_PATH,
  JSON.stringify({ state, verifier, redirectUri: env.redirectUri }),
);
const certs = ensureCerts();
const listenUrl = new URL(env.redirectUri);

const server = https.createServer(certs, async (req, res) => {
  const url = new URL(req.url || "/", `https://localhost:${listenUrl.port}`);
  if (url.pathname !== listenUrl.pathname) {
    res.writeHead(404);
    res.end("not found");
    return;
  }
  const error = url.searchParams.get("error");
  const code = url.searchParams.get("code");
  const returnedState = url.searchParams.get("state");
  try {
    if (error) throw new Error(url.searchParams.get("error_description") || error);
    if (!code) throw new Error("Missing authorization code.");
    if (returnedState !== state) throw new Error("State mismatch.");
    const tokens = await exchangeCode({
      keystring: env.keystring,
      redirectUri: env.redirectUri,
      code,
      verifier,
    });
    const saved = await saveTokens(tokens);
    res.writeHead(200, { "Content-Type": "text/html; charset=utf-8" });
    res.end(writeHtml(true, "Refresh token saved to .env. Return to Cursor."));
    console.log(JSON.stringify({ ok: true, ...saved }));
  } catch (err) {
    res.writeHead(400, { "Content-Type": "text/html; charset=utf-8" });
    res.end(writeHtml(false, err instanceof Error ? err.message : "OAuth failed"));
    console.error(JSON.stringify({ ok: false, error: String(err) }));
  } finally {
    server.close();
  }
});

server.listen(Number(listenUrl.port) || 8443, "127.0.0.1", () => {
  console.log(
    JSON.stringify({
      ok: true,
      waiting: true,
      redirectUri: env.redirectUri,
      authUrl,
    }),
  );
});
