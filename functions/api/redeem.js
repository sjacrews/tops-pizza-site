// ============================================================
// Cloudflare Pages Function — POST /api/redeem
// Staff redeems a $5 coupon by code. Validates against D1, marks it
// redeemed (one-time), and auto-texts the customer a thank-you.
// Unprotected by request (no PIN) — returns first name only, no other PII.
//   env.DB                — D1 (coupons table)
//   env.TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER
//   env.DRY_RUN           ("true" = log SMS instead of sending)
// ============================================================
export async function onRequestPost({ request, env }) {
  let data;
  try { data = await request.json(); } catch { return json({ ok: false, error: "Invalid request" }, 400); }

  const code = String(data.code || "").trim().toUpperCase();
  if (!/^[A-Z0-9-]{4,16}$/.test(code)) {
    return json({ ok: false, status: "invalid", message: "Enter a valid coupon code." }, 200);
  }
  if (!env.DB) return json({ ok: false, error: "Storage not configured" }, 500);

  const row = await env.DB.prepare(
    "SELECT code, name, phone, amount, redeemed, redeemed_at FROM coupons WHERE code = ?"
  ).bind(code).first();

  if (!row) {
    return json({ ok: false, status: "invalid", message: "Code not found. Double-check the spelling." }, 200);
  }

  const firstName = (row.name || "").trim().split(/\s+/)[0] || "";

  if (row.redeemed) {
    return json({
      ok: false, status: "already_redeemed", firstName,
      redeemedAt: row.redeemed_at,
      message: `Already redeemed${row.redeemed_at ? " on " + fmtDate(row.redeemed_at) : ""}.`,
    }, 200);
  }

  // Mark redeemed (guard against a double-tap race with the redeemed=0 condition).
  const upd = await env.DB.prepare(
    "UPDATE coupons SET redeemed = 1, redeemed_at = datetime('now') WHERE code = ? AND redeemed = 0"
  ).bind(code).run();
  if (!upd.meta || upd.meta.changes === 0) {
    return json({ ok: false, status: "already_redeemed", firstName, message: "Already redeemed." }, 200);
  }

  // Auto thank-you SMS to the customer (non-blocking on failure).
  let smsSent = false;
  if (row.phone) {
    const body = `${firstName ? "Hi " + firstName + ", t" : "T"}hanks for redeeming your ${row.amount || "$5"} coupon and for visiting TOPS Pizza & Sports Bar — we appreciate you! See you again soon. Reply STOP to opt out.`;
    smsSent = await sendSms({ to: row.phone, body, env });
  }

  return json({
    ok: true, status: "redeemed", firstName, amount: row.amount || "$5", smsSent,
    message: `${row.amount || "$5"} coupon redeemed${firstName ? " for " + firstName : ""}.`,
  }, 200);
}

function fmtDate(s) {
  try { return new Date(s.replace(" ", "T") + "Z").toLocaleString("en-CA", { timeZone: "America/Edmonton" }); }
  catch { return s; }
}

function json(body, status = 200) {
  return new Response(JSON.stringify(body), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}

async function sendSms({ to, body, env }) {
  const toNorm = normalizePhone(to);
  if (!toNorm) return false;
  if (env.DRY_RUN === "true") { console.log(`[DRY_RUN] redeem SMS to ${toNorm}: ${body}`); return true; }
  if (!env.TWILIO_ACCOUNT_SID || !env.TWILIO_AUTH_TOKEN || !env.TWILIO_FROM_NUMBER) return false;
  try {
    const res = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${env.TWILIO_ACCOUNT_SID}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: "Basic " + btoa(`${env.TWILIO_ACCOUNT_SID}:${env.TWILIO_AUTH_TOKEN}`),
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({ To: toNorm, From: env.TWILIO_FROM_NUMBER, Body: body }),
    });
    return res.ok;
  } catch { return false; }
}

function normalizePhone(raw) {
  if (!raw) return null;
  const d = String(raw).replace(/\D/g, "");
  if (d.length === 10) return `+1${d}`;
  if (d.length === 11 && d.startsWith("1")) return `+${d}`;
  if (d.length >= 10) return `+${d}`;
  return null;
}
