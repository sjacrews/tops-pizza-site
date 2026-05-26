// ============================================================
// Cloudflare Pages Function — POST /api/feedback
// ----------------------------------------------------------------
// Handles both review-funnel forms:
//   - type=feedback         → private feedback form (sentiment, story, fix)
//   - type=reviewer-thanks  → bonus page (name, email/phone for coupon)
//
// Flow:
//   1. Validate (honeypot + required fields per type)
//   2. Generate a unique coupon code (for reviewer-thanks)
//   3. Insert into D1 'leads' table
//   4. If sms_optin=yes AND phone present → fire welcome SMS via Twilio
//   5. Return success JSON
//
// Bindings (in wrangler.toml + Cloudflare dashboard):
//   env.DB                — D1 database binding
//   env.TWILIO_ACCOUNT_SID
//   env.TWILIO_AUTH_TOKEN
//   env.TWILIO_FROM_NUMBER
//   env.COUPON_CODE_PREFIX  (e.g. "TOPS")
//   env.DRY_RUN             ("true" = log instead of send)
// ============================================================

export async function onRequestPost({ request, env }) {
  // Parse JSON
  let data;
  try {
    data = await request.json();
  } catch {
    return json({ ok: false, error: "Invalid JSON" }, 400);
  }

  // Honeypot
  if (data.company && data.company.trim() !== "") {
    return json({ ok: true });
  }

  const type = data.type || "feedback";

  // Validate
  if (type === "feedback") {
    if (!data.story || data.story.trim().length < 3) {
      return json({ ok: false, error: "Story is required" }, 400);
    }
  } else if (type === "reviewer-thanks") {
    // For the bonus page: need either a phone or email
    if (!isPhone(data.phone) && !isEmail(data.email)) {
      return json({ ok: false, error: "Phone or email required" }, 400);
    }
  }

  const phone = normalizePhone(data.phone);
  const email = (data.email || "").toLowerCase().trim() || null;
  const smsOptin = (data.sms_optin === "yes" || data.sms_optin === true) && phone ? 1 : 0;
  const emailOptin = (data.email_optin === "yes" || data.email_optin === true || data.coupon_optin === "yes") && email ? 1 : 0;

  // Generate coupon code if this is a reviewer-thanks signup
  const couponCode = type === "reviewer-thanks"
    ? `${env.COUPON_CODE_PREFIX || "TOPS"}-${randomCode(4)}`
    : null;

  // Insert into D1
  let leadId = null;
  if (env.DB) {
    try {
      const result = await env.DB.prepare(`
        INSERT INTO leads (
          type, source, name, email, phone,
          sms_optin, email_optin,
          sentiment, story, fix,
          user_agent, ip
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).bind(
        type,
        "tops-pizza-site/review",
        (data.name || "").trim() || null,
        email,
        phone,
        smsOptin,
        emailOptin,
        data.sentiment || null,
        data.story || null,
        data.fix || null,
        request.headers.get("user-agent") || null,
        request.headers.get("cf-connecting-ip") || null,
      ).run();
      leadId = result.meta?.last_row_id || null;
    } catch (err) {
      console.error("D1 insert failed:", err);
      // Continue anyway — we'd rather lose storage than break the funnel
    }
  } else {
    console.warn("DB binding not configured. Submission:", { type, name: data.name, email, phone });
  }

  // Send the immediate welcome SMS (only for reviewer-thanks signups with SMS opt-in)
  if (type === "reviewer-thanks" && smsOptin && phone) {
    const smsBody = buildWelcomeSms(data.name, couponCode);
    const smsResult = await sendSms({ to: phone, body: smsBody, env });

    if (smsResult.ok && leadId && env.DB) {
      // Mark welcome_sent
      await env.DB.prepare(`
        UPDATE leads SET welcome_sent = 1, welcome_sent_at = datetime('now') WHERE id = ?
      `).bind(leadId).run().catch(() => {});
    }
  }

  // TODO (future): send welcome email via Cloudflare Email Workers if email_optin && !sms_optin

  return json({ ok: true, coupon: couponCode });
}

// ---------- helpers ----------

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

function isEmail(s) {
  return typeof s === "string" && /^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(s.trim());
}

function isPhone(s) {
  if (!s) return false;
  const digits = String(s).replace(/\D/g, "");
  return digits.length >= 10;
}

// Normalize to E.164 (+1XXXXXXXXXX for North America)
function normalizePhone(raw) {
  if (!raw) return null;
  const digits = String(raw).replace(/\D/g, "");
  if (digits.length === 10) return `+1${digits}`;
  if (digits.length === 11 && digits.startsWith("1")) return `+${digits}`;
  if (digits.length >= 10) return `+${digits}`;
  return null;
}

function randomCode(len = 4) {
  const chars = "ABCDEFGHJKMNPQRSTUVWXYZ23456789"; // no I/O/0/1 ambiguity
  let out = "";
  const arr = new Uint8Array(len);
  crypto.getRandomValues(arr);
  for (const b of arr) out += chars[b % chars.length];
  return out;
}

function buildWelcomeSms(name, coupon) {
  const first = (name || "").split(" ")[0];
  const greeting = first ? `Hi ${first}, ` : "";
  return `${greeting}thanks for visiting TOPS Pizza & Sports Bar! Your thank-you coupon: ${coupon} — 15% off your next visit. Show on phone. Reply STOP to opt out.`;
}

// Send SMS via Twilio HTTP API (no SDK needed in CF Workers)
async function sendSms({ to, body, env }) {
  if (env.DRY_RUN === "true") {
    console.log(`[DRY_RUN] would send SMS to ${to}: ${body}`);
    return { ok: true, dryRun: true };
  }

  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) {
    console.warn("Twilio env vars not configured. Skipping send.");
    return { ok: false, error: "twilio not configured" };
  }

  const url = `https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`;
  const auth = btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`);
  const form = new URLSearchParams({
    To: to,
    From: env.TWILIO_FROM_NUMBER,
    Body: body,
  });

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
      const text = await res.text();
      console.error(`Twilio API ${res.status}: ${text}`);
      return { ok: false, status: res.status, error: text };
    }
    return { ok: true };
  } catch (err) {
    console.error("Twilio fetch error:", err);
    return { ok: false, error: String(err) };
  }
}
