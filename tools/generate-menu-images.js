// ============================================================
// TOPS Pizza — Gemini "Nano Banana" menu image generator
// ----------------------------------------------------------------
// Generates appetizing food photography for menu items that don't
// yet have a real photo. Saves to /assets/menu/<slug>.webp
//
// Setup (one-time):
//   1. Get a free Gemini API key: https://aistudio.google.com/apikey
//   2. set GEMINI_API_KEY=your_key_here   (Windows cmd)
//      $env:GEMINI_API_KEY="your_key"     (PowerShell)
//      export GEMINI_API_KEY=...          (bash)
//   3. From the tops-pizza-site folder: node tools/generate-menu-images.js
//
// Optional flags:
//   --category=appetizers      Only generate for one category
//   --item=tops-poutine        Only generate for one item
//   --overwrite                Regenerate even if image already exists
//   --limit=5                  Cap how many to generate this run
//
// After running, the script prints suggested site.data.js patches
// (image: "/assets/menu/<slug>.webp") for each generated item.
// ============================================================

import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { menuCategories } from "../src/site.data.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PROJECT_ROOT = path.resolve(__dirname, "..");
const OUTPUT_DIR = path.join(PROJECT_ROOT, "assets", "menu");
const MODEL = "gemini-2.5-flash-image";
const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
  console.error("✗ GEMINI_API_KEY env var not set. Get a free key at https://aistudio.google.com/apikey");
  process.exit(1);
}

// Parse flags
const args = process.argv.slice(2);
const opts = {};
for (const a of args) {
  const [k, v] = a.replace(/^--/, "").split("=");
  opts[k] = v || true;
}

fs.mkdirSync(OUTPUT_DIR, { recursive: true });

// Collect all items needing images
function slugify(s) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

const queue = [];
for (const cat of menuCategories) {
  if (!cat.items) continue;
  if (opts.category && cat.slug !== opts.category) continue;
  for (const item of cat.items) {
    const slug = slugify(item.name);
    if (opts.item && slug !== opts.item) continue;
    const filename = `${slug}.webp`;
    const outpath = path.join(OUTPUT_DIR, filename);
    if (!opts.overwrite && fs.existsSync(outpath)) {
      console.log(`  skip (exists): ${filename}`);
      continue;
    }
    queue.push({
      category: cat.name,
      categorySlug: cat.slug,
      slug,
      filename,
      outpath,
      item,
    });
  }
}

if (opts.limit) {
  queue.splice(parseInt(opts.limit, 10));
}

console.log(`\n📸 Generating ${queue.length} menu images via ${MODEL}...\n`);

// Prompt template — tuned for appetizing pub/restaurant food photography
function buildPrompt(item, categoryName) {
  const setting = "on a rustic dark wooden table at a neighborhood pub, warm overhead lighting, slight bokeh background showing a sports bar atmosphere out of focus";
  const styleNotes = "professional food photography, overhead 3/4 angle, vibrant natural colors, appetizing presentation, restaurant-quality plating, sharp focus on the food, high resolution";
  const hint = item.visualHint ? `IMPORTANT visual reference: ${item.visualHint}. ` : "";
  // If a reference image is attached, tell the model to match its composition/style
  const refIntro = item.referenceImage
    ? "Use the attached reference image as your guide for composition, plating style, and what this specific dish should look like. Recreate this dish in the same style but with TOPS-pub atmosphere. "
    : "";
  return `${refIntro}${hint}Photograph of ${item.name}: ${item.description.replace(/\.$/, "")}. ${setting}. ${styleNotes}. No text, no logos, no people, no hands.`;
}

// Call Gemini API — optionally with a reference image (multimodal input)
async function generateImage(prompt, referenceImagePath) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent?key=${API_KEY}`;
  const requestParts = [{ text: prompt }];

  // If a reference image is provided, attach it as inline_data
  if (referenceImagePath) {
    if (!fs.existsSync(referenceImagePath)) {
      throw new Error(`Reference image not found: ${referenceImagePath}`);
    }
    const imgBuf = fs.readFileSync(referenceImagePath);
    const ext = path.extname(referenceImagePath).toLowerCase().slice(1);
    const mimeMap = { jpg: "image/jpeg", jpeg: "image/jpeg", png: "image/png", webp: "image/webp" };
    const mime = mimeMap[ext] || "image/jpeg";
    requestParts.push({ inline_data: { mime_type: mime, data: imgBuf.toString("base64") } });
  }

  const body = { contents: [{ parts: requestParts }] };

  const res = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Gemini API ${res.status}: ${errText.slice(0, 300)}`);
  }

  const json = await res.json();
  const parts = json?.candidates?.[0]?.content?.parts || [];
  const imgPart = parts.find((p) => p.inlineData?.mimeType?.startsWith("image/"));
  if (!imgPart) {
    throw new Error("No image in response. Full response: " + JSON.stringify(json).slice(0, 500));
  }
  return Buffer.from(imgPart.inlineData.data, "base64");
}

// Sequential to respect free-tier rate limits
const successes = [];
const failures = [];
for (let i = 0; i < queue.length; i++) {
  const job = queue[i];
  process.stdout.write(`  [${i + 1}/${queue.length}] ${job.filename} ... `);
  try {
    const prompt = buildPrompt(job.item, job.category);
    const refPath = job.item.referenceImage
      ? path.join(__dirname, "references", job.item.referenceImage)
      : null;
    if (refPath) console.log(`\n     (using reference: ${job.item.referenceImage})`);
    const imgBuf = await generateImage(prompt, refPath);

    // Gemini returns PNG; save raw, then convert via sharp if available
    const tmpPng = job.outpath.replace(/\.webp$/, ".png");
    fs.writeFileSync(tmpPng, imgBuf);

    // Try to convert to webp via sharp (if installed). Otherwise keep PNG.
    try {
      const { default: sharp } = await import("sharp");
      await sharp(tmpPng).resize(1200, 1200, { fit: "inside" }).webp({ quality: 85 }).toFile(job.outpath);
      fs.unlinkSync(tmpPng);
      console.log(`✓ ${(fs.statSync(job.outpath).size / 1024).toFixed(0)} KB`);
    } catch {
      // sharp not installed — keep the PNG, just rename the extension
      const pngOut = job.outpath.replace(/\.webp$/, ".png");
      console.log(`✓ ${(fs.statSync(pngOut).size / 1024).toFixed(0)} KB (PNG — npm install sharp for webp conversion)`);
      job.filename = job.filename.replace(/\.webp$/, ".png");
    }

    successes.push(job);

    // Throttle — Gemini free tier is ~10 RPM
    if (i < queue.length - 1) await new Promise((r) => setTimeout(r, 7000));
  } catch (err) {
    console.log(`✗ ${err.message}`);
    failures.push({ ...job, error: err.message });
  }
}

console.log(`\nDone. Success: ${successes.length}, Failed: ${failures.length}\n`);

if (successes.length) {
  console.log("Suggested site.data.js updates (paste into matching items):\n");
  for (const job of successes) {
    console.log(`  [${job.category}] ${job.item.name}:`);
    console.log(`    image: "/assets/menu/${job.filename}",`);
  }
  console.log("\nThen run: node build.js && npm run deploy");
}

if (failures.length) {
  console.log("\nFailures:");
  for (const f of failures) console.log(`  ✗ ${f.filename}: ${f.error}`);
}
