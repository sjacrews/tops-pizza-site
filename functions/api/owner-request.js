// ============================================================
// Cloudflare Pages Function — POST /api/owner-request
// ----------------------------------------------------------------
// Receives a change request from the owner via /owner/ form.
// Stores in D1 + sends SMS notification to Steve.
//
// Auth: protected by Cloudflare Access at /owner/* path level.
// (Configure in Cloudflare dashboard → Zero Trust → Access → Applications.)
// CF Access adds an email header we can record for audit.
// ============================================================

export async function onRequestPost({ request, env }) {
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  // Validate
  if (!data.request_text || data.request_text.trim().length < 5) {
    return json({ ok: false, error: "Please describe the change you want" }, 400);
  }
  const category = ["menu", "hours", "specials", "content", "photo", "other"].includes(data.category)
    ? data.category : "other";
  const urgency = ["low", "medium", "high"].includes(data.urgency) ? data.urgency : "medium";

  // Email from Cloudflare Access JWT (if Access is configured)
  const submittedBy =
    request.headers.get("cf-access-authenticated-user-email") ||
    data.submitted_by ||
    "anonymous";

  // Insert into D1
  let requestId = null;
  if (env.DB) {
    try {
      const result = await env.DB.prepare(`
        INSERT INTO owner_requests (submitted_by, category, urgency, request_text, user_agent, ip)
        VALUES (?, ?, ?, ?, ?, ?)
      `).bind(
        submittedBy,
        category,
        urgency,
        data.request_text.trim(),
        request.headers.get("user-agent") || null,
        request.headers.get("cf-connecting-ip") || null,
      ).run();
      requestId = result.meta?.last_row_id || null;
    } catch (err) {
      console.error("D1 insert (owner_requests) failed:", err);
    }
  }

  // Notify Steve via SMS (or whoever STEVE_NOTIFY_NUMBER points to)
  if (env.STEVE_NOTIFY_NUMBER) {
    const urgencyMark = urgency === "high" ? "🚨 HIGH" : urgency === "medium" ? "⚠️ MED" : "📝 low";
    const truncated = data.request_text.length > 280
      ? data.request_text.slice(0, 277) + "..."
      : data.request_text;
    const smsBody = `[TOPS owner request #${requestId || "?"}] ${urgencyMark} · ${category}\nFrom: ${submittedBy}\n\n${truncated}`;
    await sendSms({ to: env.STEVE_NOTIFY_NUMBER, body: smsBody, env });
  }

  return json({ ok: true, requestId });
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
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    console.warn("Twilio env not configured");
    return false;
  }
  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const form = new URLSearchParams({ To: to, From: env.TWILIO_FROM_NUMBER, Body: body });
  try {
    const res = await fetch(url, {
      method: "POST",
      headers: {
        "Authorization": `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: form.toString(),
    });
    if (!res.ok) {
      console.error(`Twilio ${res.status}: ${await res.text()}`);
      return false;
    }
    return true;
  } catch (err) {
    console.error("Twilio fetch error:", err);
    return false;
  }
}
