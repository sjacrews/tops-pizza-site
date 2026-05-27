// ============================================================
// Cloudflare Pages Function — POST /api/owner-photo
// ----------------------------------------------------------------
// Receives multipart/form-data: file + name + notes
// Stores the image in R2, metadata in D1, texts Steve the URL.
//
// Bindings required (in wrangler.toml + Cloudflare dashboard):
//   env.DB        — D1 database (same as feedback function)
//   env.PHOTOS    — R2 bucket binding (named PHOTOS, points at tops-pizza-photos)
//   env.PUBLIC_R2_BASE — e.g. "https://pub-xxxxx.r2.dev" (R2 public URL prefix)
//   env.TWILIO_*  — same as other functions
//   env.STEVE_NOTIFY_NUMBER
// ============================================================

export async function onRequestPost({ request, env }) {
  // Auth: this endpoint is path-protected by Cloudflare Access at /api/owner-photo
  // CF adds the authenticated user's email as a header.
  const submittedBy = request.headers.get("cf-access-authenticated-user-email") || "anonymous";

  // Parse multipart form
  let form;
  try {
    form = await request.formData();
  } catch (err) {
    return json({ ok: false, error: "Expected multipart/form-data" }, 400);
  }

  const file = form.get("file");
  const itemName = (form.get("item_name") || "").toString().trim();
  const notes = (form.get("notes") || "").toString().trim();

  // Validate
  if (!file || typeof file === "string") {
    return json({ ok: false, error: "No file uploaded" }, 400);
  }
  if (!itemName || itemName.length < 2) {
    return json({ ok: false, error: "Item name required (what's the photo of?)" }, 400);
  }
  if (!file.type || !file.type.startsWith("image/")) {
    return json({ ok: false, error: "Only image files allowed" }, 400);
  }
  // Size cap: 15MB (R2 supports much larger but iPhone photos are typically 2-8MB)
  if (file.size > 15 * 1024 * 1024) {
    return json({ ok: false, error: "Max file size is 15MB" }, 400);
  }
  if (!env.PHOTOS) {
    return json({ ok: false, error: "R2 bucket not configured" }, 500);
  }

  // Generate a safe R2 key
  const ext = (file.name.split(".").pop() || "jpg").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeName = itemName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
  const ts = new Date().toISOString().replace(/[:.]/g, "-").slice(0, 19);
  const key = `uploads/${ts}-${safeName}.${ext}`;

  // Stream upload to R2
  try {
    await env.PHOTOS.put(key, file.stream(), {
      httpMetadata: { contentType: file.type },
      customMetadata: {
        submittedBy,
        itemName,
        originalName: file.name,
      },
    });
  } catch (err) {
    console.error("R2 put failed:", err);
    return json({ ok: false, error: "Storage upload failed" }, 500);
  }

  // Build public URL
  const publicBase = (env.PUBLIC_R2_BASE || "").replace(/\/$/, "");
  const r2Url = publicBase ? `${publicBase}/${key}` : key;

  // Insert metadata into D1
  let photoId = null;
  if (env.DB) {
    try {
      const result = await env.DB.prepare(`
        INSERT INTO owner_photos (submitted_by, item_name, notes, r2_key, r2_url, mime, size_bytes)
        VALUES (?, ?, ?, ?, ?, ?, ?)
      `).bind(submittedBy, itemName, notes || null, key, r2Url, file.type, file.size).run();
      photoId = result.meta?.last_row_id || null;
    } catch (err) {
      console.error("D1 insert failed:", err);
    }
  }

  // SMS Steve
  if (env.STEVE_NOTIFY_NUMBER) {
    const sizeKb = Math.round(file.size / 1024);
    const smsBody = `[TOPS photo upload #${photoId || "?"}]\nFrom: ${submittedBy}\nItem: ${itemName}\nSize: ${sizeKb} KB${notes ? `\nNotes: ${notes.slice(0, 100)}` : ""}\n\nView: ${r2Url}`;
    await sendSms({ to: env.STEVE_NOTIFY_NUMBER, body: smsBody, env });
  }

  return json({ ok: true, photoId, url: r2Url });
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function sendSms({ to, body, env }) {
  if (env.DRY_RUN === "true") {
    console.log(`[DRY_RUN] would notify ${to}: ${body}`);
    return true;
  }
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) return false;
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const form = new URLSearchParams({ To: to, From: env.TWILIO_FROM_NUMBER, Body: body });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: { "Authorization": `Basic ${auth}`, "Content-Type": "application/x-www-form-urlencoded" },
      body: form.toString(),
    });
    return res.ok;
  } catch (err) {
    console.error("Twilio fetch error:", err);
    return false;
  }
}
