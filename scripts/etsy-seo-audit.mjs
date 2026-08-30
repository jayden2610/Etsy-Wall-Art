#!/usr/bin/env node
/**
 * Etsy Demand Agent — SEO audit for TypographySG listings.
 * Reads live listing title/tags via Open API when .env is present;
 * always scores against marketing/keyword-banks.json.
 *
 * Usage:
 *   node scripts/etsy-seo-audit.mjs
 *   node scripts/etsy-seo-audit.mjs --listing cocoa
 *   node scripts/etsy-seo-audit.mjs --listing pocket --json
 */

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

import { ENV_PATH, ROOT, requireCreds, refreshAccessToken, etsyHeaders } from "./etsy-env.mjs";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const API = "https://openapi.etsy.com/v3/application";
const BANKS_PATH = path.join(ROOT, "marketing", "keyword-banks.json");

const SETS = {
  cocoa: { id: "4564758499", bank: "cocoa" },
  pocket: { id: "4564965599", bank: "pocket" },
  anton: { id: "4564670051", bank: null, parked: true },
};

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

function loadBanks() {
  return JSON.parse(fs.readFileSync(BANKS_PATH, "utf8"));
}

async function api(creds, token, method, urlPath) {
  const headers = etsyHeaders(creds, token);
  const res = await fetch(`${API}${urlPath}`, { method, headers });
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

function scoreTags(tags, bankTags) {
  const findings = [];
  let score = 40;
  const list = Array.isArray(tags) ? tags : [];
  const normalized = list.map((t) => String(t).trim().toLowerCase());
  const bankSet = new Set((bankTags || []).map((t) => t.toLowerCase()));

  if (list.length === 0) {
    findings.push({ level: "FAIL", code: "no_tags", message: "No tags on listing" });
    return { score: 0, findings };
  }
  if (list.length < 10) {
    findings.push({
      level: "WARN",
      code: "few_tags",
      message: `Only ${list.length} tags — aim for 13`,
    });
    score -= 10;
  } else if (list.length >= 12 && list.length <= 13) {
    score += 15;
    findings.push({ level: "OK", code: "tag_count", message: `${list.length} tags` });
  } else {
    score += 8;
    findings.push({ level: "OK", code: "tag_count", message: `${list.length} tags` });
  }

  const tooLong = list.filter((t) => String(t).length > 20);
  if (tooLong.length) {
    findings.push({
      level: "FAIL",
      code: "tag_too_long",
      message: `Tags over 20 chars: ${tooLong.join(" | ")}`,
    });
    score -= 25;
  } else {
    score += 15;
  }

  const dupes = normalized.filter((t, i) => normalized.indexOf(t) !== i);
  if (dupes.length) {
    findings.push({
      level: "FAIL",
      code: "duplicate_tags",
      message: `Duplicate tags: ${[...new Set(dupes)].join(", ")}`,
    });
    score -= 15;
  }

  const overlap = normalized.filter((t) => bankSet.has(t)).length;
  const overlapRatio = bankTags?.length ? overlap / Math.min(13, bankTags.length) : 0;
  if (overlapRatio >= 0.4) {
    score += 20;
    findings.push({
      level: "OK",
      code: "bank_overlap",
      message: `${overlap} tags match keyword bank`,
    });
  } else if (bankTags?.length) {
    score += 5;
    findings.push({
      level: "WARN",
      code: "bank_overlap_low",
      message: `Only ${overlap} tags overlap the bank — rewrite toward buyer phrases`,
    });
  }

  const hasDigital =
    normalized.some((t) => t.includes("digital") || t.includes("printable") || t.includes("download"));
  if (!hasDigital) {
    findings.push({
      level: "WARN",
      code: "missing_digital_signal",
      message: "No digital/printable/download tag",
    });
    score -= 8;
  } else {
    score += 10;
  }

  return { score: Math.max(0, Math.min(40, score)), findings, overlap };
}

function scoreTitle(title, titleSeeds, avoid) {
  const findings = [];
  let score = 0;
  const t = (title || "").trim();
  const lower = t.toLowerCase();

  if (!t) {
    findings.push({ level: "FAIL", code: "no_title", message: "Missing title" });
    return { score: 0, findings };
  }

  if (t.length < 40) {
    findings.push({
      level: "WARN",
      code: "title_short",
      message: `Title only ${t.length} chars — use more buyer phrases`,
    });
    score += 10;
  } else if (t.length <= 140) {
    score += 25;
    findings.push({ level: "OK", code: "title_length", message: `${t.length} chars` });
  } else {
    findings.push({
      level: "WARN",
      code: "title_long",
      message: `Title ${t.length} chars — trim past ~140`,
    });
    score += 15;
  }

  const seedHit = (titleSeeds || []).some((seed) => {
    const words = seed.toLowerCase().split(/\s+/).slice(0, 3);
    return words.every((w) => lower.includes(w));
  });
  const phraseHits = [
    "wall art",
    "digital download",
    "printable",
    "typography",
    "poster",
    "print",
  ].filter((p) => lower.includes(p));
  if (phraseHits.length >= 2) {
    score += 25;
    findings.push({
      level: "OK",
      code: "title_buyer_phrases",
      message: `Contains: ${phraseHits.join(", ")}`,
    });
  } else {
    score += 8;
    findings.push({
      level: "WARN",
      code: "title_weak_phrases",
      message: "Front-load wall art / printable / digital download",
    });
  }
  if (seedHit) {
    score += 10;
    findings.push({ level: "OK", code: "title_seedish", message: "Close to a title seed" });
  }

  for (const bad of avoid || []) {
    if (lower.includes(String(bad).toLowerCase())) {
      findings.push({
        level: "FAIL",
        code: "title_avoid",
        message: `Title contains avoided phrase: ${bad}`,
      });
      score -= 20;
    }
  }

  const internalLeads = ["cocoa", "pocket studies", "japandi", "botanical set", "anton"];
  for (const lead of internalLeads) {
    if (lower.startsWith(lead)) {
      findings.push({
        level: "WARN",
        code: "title_internal_lead",
        message: `Do not lead with internal name "${lead}"`,
      });
      score -= 10;
    }
  }

  return { score: Math.max(0, Math.min(60, score)), findings };
}

function propose(bank) {
  if (!bank) return null;
  return {
    titleSuggestion: bank.titleSeeds?.[0] || null,
    tagsSuggestion: (bank.tags || []).slice(0, 13),
  };
}

function auditListing({ alias, listing, bankKey, banks, parked }) {
  const bank = bankKey ? banks.sets[bankKey] : null;
  const titlePart = scoreTitle(listing?.title, bank?.titleSeeds, bank?.avoid);
  const tagPart = scoreTags(listing?.tags, bank?.tags);
  let total = titlePart.score + tagPart.score;
  const findings = [...titlePart.findings, ...tagPart.findings];

  if (parked) {
    findings.unshift({
      level: "INFO",
      code: "parked",
      message: "Parked — do not treat as shop face or SEO priority",
    });
  }

  if (listing?.state && listing.state !== "active" && listing.state !== "draft") {
    findings.push({
      level: "INFO",
      code: "state",
      message: `Listing state: ${listing.state}`,
    });
  }

  if (listing?.state === "draft") {
    findings.push({
      level: "INFO",
      code: "draft",
      message: "Still draft — SEO now, publish only when you say so",
    });
  }

  total = Math.max(0, Math.min(100, total));
  const grade = total >= 80 ? "PASS" : total >= 55 ? "NEEDS_WORK" : "FAIL";

  return {
    alias,
    listingId: listing?.listing_id || SETS[alias]?.id || null,
    state: listing?.state || (listing?.offline ? "offline" : "unknown"),
    title: listing?.title || null,
    tags: listing?.tags || [],
    parked: Boolean(parked),
    score: total,
    grade,
    findings,
    proposal: propose(bank),
  };
}

async function fetchListing(creds, token, listingId) {
  return api(creds, token, "GET", `/listings/${listingId}`);
}

async function main() {
  const banks = loadBanks();
  const only = argValue("--listing").toLowerCase();
  const asJson = hasFlag("--json");
  const aliases = only
    ? [only]
    : Object.keys(SETS).filter((a) => a !== "anton");

  let creds = null;
  let token = null;
  let online = false;
  if (fs.existsSync(ENV_PATH)) {
    try {
      creds = requireCreds();
      token = await refreshAccessToken(creds);
      online = true;
    } catch (err) {
      if (!asJson) {
        console.error(`API offline (${err.message}). Scoring with empty live fields + banks only.`);
      }
    }
  } else if (!asJson) {
    console.error("No .env — offline mode. Proposals from keyword banks only.");
  }

  const reports = [];
  for (const alias of aliases) {
    const meta = SETS[alias];
    if (!meta) die(`Unknown listing alias: ${alias}. Use cocoa|pocket|anton|<id>`);
    let listing = {
      listing_id: meta.id,
      title: "",
      tags: [],
      state: "unknown",
      offline: !online,
    };
    if (online) {
      try {
        listing = await fetchListing(creds, token, meta.id);
      } catch (err) {
        listing = {
          listing_id: meta.id,
          title: "",
          tags: [],
          state: "error",
          error: err.message,
          offline: true,
        };
        if (!asJson) console.error(`${alias}: fetch failed — ${err.message}`);
      }
    }
    reports.push(
      auditListing({
        alias,
        listing,
        bankKey: meta.bank,
        banks,
        parked: meta.parked,
      }),
    );
  }

  if (asJson) {
    console.log(JSON.stringify({ ok: true, online, reports }, null, 2));
    return;
  }

  for (const report of reports) {
    console.log(`\n=== ${report.alias} (${report.listingId}) — ${report.grade} ${report.score}/100 ===`);
    console.log(`state: ${report.state}`);
    if (report.title) console.log(`title: ${report.title}`);
    if (report.tags?.length) console.log(`tags (${report.tags.length}): ${report.tags.join(", ")}`);
    for (const f of report.findings) {
      console.log(`  [${f.level}] ${f.code}: ${f.message}`);
    }
    if (report.proposal?.titleSuggestion) {
      console.log(`  propose title: ${report.proposal.titleSuggestion}`);
    }
    if (report.proposal?.tagsSuggestion?.length) {
      console.log(`  propose tags: ${report.proposal.tagsSuggestion.join(", ")}`);
    }
  }
  console.log("");
}

await main();
