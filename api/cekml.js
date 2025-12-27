const crypto = require("crypto");

/**
 * Cek ML (Mobile Legends) — nickname + region (region may be Unknown)
 * Query:
 *   /cekml?apikey=skyy&uid=123&zone=456
 *
 * Notes:
 * - Primary provider: GempayTopup (username + region) if GEMPAY_API_KEY is set
 * - Fallback: APIGames (username only) if APIGAMES_MERCHANT_ID + APIGAMES_SECRET_KEY set
 */

const GEMPAY_ENDPOINT = "https://gempaytopup.com/api/check-ml";
const APIGAMES_BASE = "https://v1.apigames.id";

const GEMPAY_API_KEY = process.env.GEMPAY_API_KEY || "";
const APIGAMES_MERCHANT_ID = process.env.APIGAMES_MERCHANT_ID || "";
const APIGAMES_SECRET_KEY = process.env.APIGAMES_SECRET_KEY || "";

function md5(str) {
  return crypto.createHash("md5").update(str).digest("hex");
}

function apigamesSignature() {
  if (!APIGAMES_MERCHANT_ID || !APIGAMES_SECRET_KEY) return "";
  return md5(`${APIGAMES_MERCHANT_ID}${APIGAMES_SECRET_KEY}`);
}

async function safeFetchJson(url, opts) {
  try {
    const res = await fetch(url, opts);
    const text = await res.text();
    let json = {};
    try { json = JSON.parse(text); } catch { json = { raw: text }; }
    return { ok: res.ok, status: res.status, json };
  } catch (e) {
    return { ok: false, status: 0, json: { error: e.message } };
  }
}

async function checkViaGempay(uid, zone) {
  if (!GEMPAY_API_KEY) return { ok: false, error: "GEMPAY_API_KEY not set" };

  const body = new URLSearchParams({ uid, zone }).toString();
  const { ok, status, json } = await safeFetchJson(GEMPAY_ENDPOINT, {
    method: "POST",
    headers: {
      "X-API-KEY": GEMPAY_API_KEY,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body,
  });

  if (!ok) return { ok: false, error: `Gempay HTTP ${status}`, raw: json };
  if (!json?.success) return { ok: false, error: json?.message || "Gempay: invalid", raw: json };

  return {
    ok: true,
    nickname: json?.username || "",
    region: json?.region || "Unknown",
    provider: "gempay",
  };
}

async function checkViaApigames(uid) {
  const sig = apigamesSignature();
  if (!sig) return { ok: false, error: "APIGames ENV not set" };

  const url =
    `${APIGAMES_BASE}/merchant/${encodeURIComponent(APIGAMES_MERCHANT_ID)}` +
    `/cek-username/mobilelegend?user_id=${encodeURIComponent(uid)}&signature=${encodeURIComponent(sig)}`;

  const { ok, status, json } = await safeFetchJson(url, { method: "GET" });
  if (!ok) return { ok: false, error: `APIGames HTTP ${status}`, raw: json };

  const isValid = !!json?.data?.is_valid;
  if (!isValid) return { ok: false, error: json?.message || "Not found", raw: json };

  return {
    ok: true,
    nickname: json?.data?.username || "",
    region: "Unknown",
    provider: "apigames",
  };
}

async function checkML(uid, zone) {
  // primary
  const a = await checkViaGempay(uid, zone);
  if (a.ok) return a;

  // fallback
  const b = await checkViaApigames(uid);
  if (b.ok) return b;

  return { ok: false, error: b.error || a.error || "Lookup failed" };
}

module.exports = {
  name: "Cek ML (Nickname/Region)",
  desc: "Cek nickname dan region (region bisa Unknown)",
  category: "Tools",
  path: "/cekml?apikey=&uid=&zone=",

  async run(req, res) {
    const { apikey, uid, zone } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }
    if (!uid || !zone) {
      return res.json({ status: false, error: "uid dan zone wajib" });
    }

    const result = await checkML(String(uid).trim(), String(zone).trim());

    if (!result.ok) {
      return res.json({
        status: false,
        id: String(uid),
        zone: String(zone),
        nickname: "",
        region: "Unknown",
        provider: result.provider || "none",
        error: result.error || "Lookup failed",
      });
    }

    return res.json({
      status: true,
      id: String(uid),
      zone: String(zone),
      nickname: result.nickname,
      region: result.region || "Unknown",
      provider: result.provider,
    });
  },
};
