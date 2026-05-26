// ============================================================
// TOPS Pizza — scheduled SMS drip Worker
// ----------------------------------------------------------------
// Runs daily. Queries D1 for SMS-opted-in leads aged 30 or 60 days
// that haven't received the corresponding drip yet. Sends via Twilio.
//
// 30-day drip: "Haven't seen you in a bit, here's another reason"
// 60-day drip: "We miss you. Wing night Tuesday — your last reminder"
//
// After 60 days with no second visit, we stop sending. We're not spammers.
// ============================================================

export default {
  async scheduled(event, env, ctx) {
    const log = (msg) => console.log(`[drip ${event.scheduledTime}] ${msg}`);
    log("starting drip run");

    // ---- 30-day drip ----
    const day30 = await env.DB.prepare(`
      SELECT id, name, phone
      FROM leads
      WHERE type = 'reviewer-thanks'
        AND sms_optin = 1
        AND phone IS NOT NULL
        AND unsubscribed = 0
        AND welcome_sent = 1
        AND drip_30_sent = 0
        AND created_at <= datetime('now', '-30 days')
        AND created_at >  datetime('now', '-45 days')  -- guard rail: don't backfill old leads
      LIMIT 200
    `).all();

    log(`30-day candidates: ${day30.results.length}`);

    for (const lead of day30.results) {
      const ok = await sendSms({
        to: lead.phone,
        body: build30DayMessage(lead.name),
        env,
      });
      if (ok) {
        await env.DB.prepare(`
          UPDATE leads SET drip_30_sent = 1, drip_30_sent_at = datetime('now') WHERE id = ?
        `).bind(lead.id).run();
      }
    }

    // ---- 60-day drip ----
    const day60 = await env.DB.prepare(`
      SELECT id, name, phone
      FROM leads
      WHERE type = 'reviewer-thanks'
        AND sms_optin = 1
        AND phone IS NOT NULL
        AND unsubscribed = 0
        AND welcome_sent = 1
        AND drip_60_sent = 0
        AND created_at <= datetime('now', '-60 days')
        AND created_at >  datetime('now', '-90 days')  -- guard rail
      LIMIT 200
    `).all();

    log(`60-day candidates: ${day60.results.length}`);

    for (const lead of day60.results) {
      const ok = await sendSms({
        to: lead.phone,
        body: build60DayMessage(lead.name),
        env,
      });
      if (ok) {
        await env.DB.prepare(`
          UPDATE leads SET drip_60_sent = 1, drip_60_sent_at = datetime('now') WHERE id = ?
        `).bind(lead.id).run();
      }
    }

    log(`done — 30: ${day30.results.length}, 60: ${day60.results.length}`);
  },

  // Optional: a HTTP endpoint to trigger a manual run for testing
  // Call: curl https://tops-pizza-drip.<your-subdomain>.workers.dev/?key=YOUR_SECRET
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (env.MANUAL_RUN_KEY && url.searchParams.get("key") === env.MANUAL_RUN_KEY) {
      await this.scheduled({ scheduledTime: new Date().toISOString() }, env, ctx);
      return new Response("Drip run complete (manual). Check Cloudflare logs.", { status: 200 });
    }
    return new Response("OK — scheduled worker. Add ?key=<MANUAL_RUN_KEY> to trigger a manual run.", { status: 200 });
  },
};

// ---- messaging ----

function build30DayMessage(name) {
  const first = (name || "").split(" ")[0];
  const greeting = first ? `Hi ${first}, ` : "Hey — ";
  return `${greeting}been about a month since we saw you at TOPS. Wing night Tuesday is back. Your last coupon is still good. -Jim, Kristina & Peter. Reply STOP to opt out.`;
}

function build60DayMessage(name) {
  const first = (name || "").split(" ")[0];
  const greeting = first ? `${first}, ` : "";
  return `${greeting}we miss you at TOPS Pizza & Sports Bar. Come back this month, mention TOPS-COMEBACK for 20% off — that's the last reminder we'll send. Reply STOP to opt out.`;
}

// ---- Twilio (same helper as the Pages function) ----

async function sendSms({ to, body, env }) {
  if (env.DRY_RUN === "true") {
    console.log(`[DRY_RUN] would send to ${to}: ${body}`);
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
