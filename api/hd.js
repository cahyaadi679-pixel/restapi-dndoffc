const fs = require("fs");
const os = require("os");
const path = require("path");
const { spawn } = require("child_process");

/**
 * HD Enhancer (basic upscale + denoise + sharpen).
 * GET only (matches loader):
 *   /hd?apikey=skyy&url=https://...&scale=2&mode=fast&type=image|video
 *
 * Returns:
 *   { status:true, mime, base64, used_ffmpeg, note }
 *
 * Notes:
 * - If ffmpeg exists -> enhance.
 * - If not -> passthrough (still status:true, used_ffmpeg:false).
 */

function isLikelyImageByExt(u) {
  const ext = (path.extname(u || "").toLowerCase() || "");
  return [".png", ".jpg", ".jpeg", ".webp"].includes(ext);
}
function isLikelyVideoByExt(u) {
  const ext = (path.extname(u || "").toLowerCase() || "");
  return [".mp4", ".mov", ".mkv", ".webm"].includes(ext);
}
function extFromMime(mime, url) {
  if (mime) {
    if (mime.includes("png")) return ".png";
    if (mime.includes("jpeg") || mime.includes("jpg")) return ".jpg";
    if (mime.includes("webp")) return ".webp";
    if (mime.includes("mp4")) return ".mp4";
    if (mime.includes("quicktime")) return ".mov";
    if (mime.includes("x-matroska")) return ".mkv";
  }
  // fallback from url
  const ext = (path.extname(url || "") || "").toLowerCase();
  return ext || ".bin";
}
function mimeFromExt(ext, kind) {
  const e = (ext || "").toLowerCase();
  if (kind === "video") return "video/mp4";
  if (e === ".png") return "image/png";
  if (e === ".webp") return "image/webp";
  return "image/jpeg";
}
function safeInt(v, def) {
  const n = parseInt(v, 10);
  return Number.isFinite(n) ? n : def;
}

async function runFfmpeg(args) {
  return new Promise((resolve, reject) => {
    const p = spawn("ffmpeg", args, { stdio: ["ignore", "ignore", "pipe"] });
    let err = "";
    p.stderr.on("data", (d) => (err += d.toString()));
    p.on("error", (e) => reject(e));
    p.on("close", (code) => {
      if (code === 0) resolve(true);
      else reject(new Error(`ffmpeg failed (code ${code}): ${err.slice(0, 300)}`));
    });
  });
}

async function enhanceWithFfmpeg({ inPath, outPath, kind, scale, mode }) {
  const s = Math.max(1, scale || 2);

  if (kind === "image") {
    const vf = [
      `scale=iw*${s}:ih*${s}:flags=lanczos`,
      "hqdn3d=1.5:1.5:6:6",
      "unsharp=5:5:0.8:5:5:0.0",
    ].join(",");

    const args = ["-y", "-i", inPath, "-vf", vf, outPath];
    await runFfmpeg(args);
    return;
  }

  // video
  const vf = [
    `scale=iw*${s}:ih*${s}:flags=lanczos`,
    "hqdn3d=1.5:1.5:6:6",
    "unsharp=5:5:0.6:5:5:0.0",
  ].join(",");

  const preset = mode === "quality" ? "medium" : "veryfast";
  const crf = mode === "quality" ? "19" : "22";

  const args = [
    "-y",
    "-i", inPath,
    "-vf", vf,
    "-c:v", "libx264",
    "-preset", preset,
    "-crf", crf,
    "-pix_fmt", "yuv420p",
    "-c:a", "aac",
    "-b:a", "128k",
    outPath,
  ];
  await runFfmpeg(args);
}

module.exports = {
  name: "HD (Upscale/Denoise/Sharpen)",
  desc: "Basic HD enhancer (returns base64). Region independent.",
  category: "Tools",
  path: "/hd?apikey=&url=&scale=2&mode=fast&type=image",

  async run(req, res) {
    const { apikey, url, scale, mode, type } = req.query;

    if (!apikey || !global.apikey?.includes(apikey)) {
      return res.json({ status: false, error: "Invalid API key" });
    }
    if (!url) return res.json({ status: false, error: "url is required" });

    const s = Math.max(1, Math.min(4, safeInt(scale, 2)));
    const m = mode === "quality" ? "quality" : "fast";

    // Determine kind
    let kind = "image";
    if (type === "video") kind = "video";
    else if (type === "image") kind = "image";
    else if (isLikelyVideoByExt(url)) kind = "video";
    else if (isLikelyImageByExt(url)) kind = "image";

    // Download
    let buf;
    try {
      buf = await global.getBuffer(url);
      if (!buf || buf?.error) throw new Error("Failed to download");
    } catch (e) {
      return res.json({ status: false, error: `Download failed: ${e.message}` });
    }

    const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "hd-"));
    const inExt = extFromMime("", url);
    const outExt = (kind === "video") ? ".mp4" : (inExt === ".png" ? ".png" : ".jpg");
    const inPath = path.join(tmpDir, "in" + inExt);
    const outPath = path.join(tmpDir, "out" + outExt);

    fs.writeFileSync(inPath, Buffer.from(buf));

    let usedFfmpeg = false;
    let note = "";

    try {
      await enhanceWithFfmpeg({ inPath, outPath, kind, scale: s, mode: m });
      usedFfmpeg = true;
    } catch (e) {
      // passthrough fallback
      usedFfmpeg = false;
      note = "ffmpeg not available or failed — returned original.";
      try { fs.copyFileSync(inPath, outPath); } catch (_) {}
    }

    let outBuf;
    try {
      outBuf = fs.readFileSync(outPath);
    } catch (e) {
      // ultimate fallback
      outBuf = fs.readFileSync(inPath);
      note = note || "output read failed — returned original.";
    }

    try { fs.rmSync(tmpDir, { recursive: true, force: true }); } catch (_) {}

    const mime = mimeFromExt(outExt, kind);
    return res.json({
      status: true,
      mime,
      base64: outBuf.toString("base64"),
      used_ffmpeg: usedFfmpeg,
      note,
    });
  },
};
