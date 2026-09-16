// ============================================================
// TOPS Pizza, static site generator (proof-of-concept)
// ----------------------------------------------------------------
// Run:  node build.js
// Output: ./dist/ (5 pages + shared assets)
// Deploy: drag ./dist/ to Cloudflare Pages, or `wrangler pages deploy dist`
// ============================================================

import fs from "node:fs";
import path from "node:path";
import crypto from "node:crypto";
import { fileURLToPath } from "node:url";
import { site, featuredPizzas, featuredNeighborhoods } from "./src/site.config.js";
import { allNeighborhoods, allPizzas, dailySpecials, menuCategories, pizzaSizes, pizzaExtras, wingFlavors } from "./src/site.data.js";


const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT = path.join(__dirname, "dist");
// Auto-link generated/uploaded menu images to items by slug.
// Drop assets/menu/<slug>.webp (or .png/.jpg), and the corresponding item gets image: "/assets/menu/<file>"
// (No need to manually paste image paths into site.data.js, this resolves at build time.)
function slugify(s) { return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, ""); }
const MENU_IMG_DIR = path.join(__dirname, "assets", "menu");
if (fs.existsSync(MENU_IMG_DIR)) {
  const files = fs.readdirSync(MENU_IMG_DIR).filter(f => /\.(webp|png|jpe?g)$/i.test(f));
  const bySlug = {};
  for (const f of files) bySlug[f.replace(/\.[^.]+$/, "")] = `/assets/menu/${f}`;
  let linked = 0;
  for (const cat of menuCategories) {
    if (!cat.items) continue;
    for (const item of cat.items) {
      const slug = slugify(item.name);
      if (!item.image && bySlug[slug]) {
        item.image = bySlug[slug];
        linked++;
      }
    }
  }
  if (linked) console.log(`  Auto-linked ${linked} menu images by slug`);
}


// ---------- helpers ----------
// esc: HTML-escape AND convert straight apostrophes to typographic apostrophes
const esc = (s) => String(s)
  .replace(/&/g, "&amp;")
  .replace(/</g, "&lt;")
  .replace(/>/g, "&gt;")
  .replace(/"/g, "&quot;")
  .replace(/'/g, "’"); // ’

// img(): build a GHL-CDN URL for a hosted image
const img = (originalUrl) => `${site.images?.cdnBase || 'https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_'}${originalUrl}`;

// smartify: convert any remaining straight ' to typographic ’, but ONLY in text content , 
// skip everything inside <script> and <style> blocks (those need straight quotes for JS/CSS).
// linkifyPhone: wrap any bare phone number in a tel: link so it is tappable.
// Steve, 2026-09-15: "Let's make the phone a clickable link any time we type it."
// There were 188 plain-text occurrences across the site, including inside FAQ
// answers, so this is done once at the template layer rather than in 188 places.
//
// THREE THINGS IT MUST NOT TOUCH, each verified against the source:
//  1. Anything inside a tag, i.e. between < and >. The number appears in
//     <meta property="business:contact_data:phone_number" content="..."> and in
//     page `description` meta. Linkifying an attribute value breaks the markup.
//  2. Text already inside an <a>. There are 21 existing tel: anchors; wrapping
//     one again produces nested anchors, which is invalid HTML.
//  3. <script>/<style> bodies. Two occurrences live in inline JS status
//     messages. smartify() already isolates these blocks, and linkifyPhone is
//     applied only to the same text spans smartify treats as prose.
const linkifyPhone = (text) => {
  const out = [];
  let idx = 0;
  // Split on tags and on whole <a>...</a> spans, leaving both untouched.
  const skip = /<a\b[^>]*>[\s\S]*?<\/a>|<[^>]+>/gi;
  let mm;
  const wrap = (s) =>
    s.replace(/\(403\)\s*275-2722/g, `<a href="tel:${site.nap.phone}">$&</a>`);
  while ((mm = skip.exec(text)) !== null) {
    out.push(wrap(text.slice(idx, mm.index)));
    out.push(mm[0]);
    idx = mm.index + mm[0].length;
  }
  out.push(wrap(text.slice(idx)));
  return out.join("");
};

const smartify = (html) => {
  const parts = [];
  let i = 0;
  const re = /<(script|style)\b[^>]*>[\s\S]*?<\/\1>/gi;
  let m;
  const prose = (s) => linkifyPhone(s.replace(/'/g, "’"));
  while ((m = re.exec(html)) !== null) {
    parts.push(prose(html.slice(i, m.index)));  // text before block, smartify + linkify
    parts.push(m[0]);                            // the block itself, leave alone
    i = m.index + m[0].length;
  }
  parts.push(prose(html.slice(i)));             // trailing text
  return parts.join("");
};

const hoursIso = (h) => {
  // Schema.org openingHours wants HH:MM. If closes >= 24:00, subtract 24 and Google understands it as "next day" via the ISO repeat pattern.
  const fixCloses = (c) => {
    const [hh, mm] = c.split(":").map(Number);
    if (hh >= 24) return `${String(hh - 24).padStart(2, "0")}:${mm.toString().padStart(2, "0")}`;
    return c;
  };
  const dayMap = { Monday: "Mo", Tuesday: "Tu", Wednesday: "We", Thursday: "Th", Friday: "Fr", Saturday: "Sa", Sunday: "Su" };
  return { day: dayMap[h.dayOfWeek], opens: h.opens, closes: fixCloses(h.closes) };
};

const humanHours = (h) => {
  const fmt = (t) => {
    let [hh, mm] = t.split(":").map(Number);
    if (hh >= 24) hh -= 24;
    const period = hh >= 12 ? "PM" : "AM";
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    const mmStr = mm === 0 ? "" : `:${String(mm).padStart(2, "0")}`;
    return `${h12}${mmStr} ${period}`;
  };
  return `${fmt(h.opens)} to ${fmt(h.closes)}`;
};

// ---------- shared schema fragments ----------
const restaurantSchema = () => ({
  "@type": "Restaurant",
  "@id": `${site.url}/#restaurant`,
  "name": site.name,
  "alternateName": site.shortName,
  "description": site.description,
  "url": site.url,
  "telephone": site.nap.phone,
  "priceRange": site.priceRange,
  "image": `${site.url}/assets/og-image.png`,
  "logo": `${site.url}/assets/logo.png`,
  "foundingDate": String(site.yearFounded),
  "founder": { "@type": "Person", "name": site.founder.name, "jobTitle": site.founder.role },
  "address": {
    "@type": "PostalAddress",
    "streetAddress": site.nap.streetAddress,
    "addressLocality": site.nap.locality,
    "addressRegion": site.nap.region,
    "postalCode": site.nap.postalCode,
    "addressCountry": site.nap.country,
  },
  "geo": { "@type": "GeoCoordinates", "latitude": site.nap.geo.latitude, "longitude": site.nap.geo.longitude },
  "hasMap": site.nap.googleMapsUrl,
  "openingHoursSpecification": site.hours.map(h => {
    const iso = hoursIso(h);
    return {
      "@type": "OpeningHoursSpecification",
      "dayOfWeek": `https://schema.org/${h.dayOfWeek}`,
      "opens": iso.opens,
      "closes": iso.closes,
    };
  }),
  "servesCuisine": site.servesCuisine,
  "acceptsReservations": site.acceptsReservations,
  "hasMenu": `${site.url}/menu`,
  "paymentAccepted": ["Cash", "Credit Card", "Debit Card"],
  "currenciesAccepted": "CAD",
  "areaServed": site.neighborhoods.map(n => ({
    "@type": "Place",
    "name": `${n}, Calgary, AB`,
  })),
  "sameAs": site.sameAs,
  "aggregateRating": {
    "@type": "AggregateRating",
    "ratingValue": site.aggregateRating.ratingValue,
    "reviewCount": site.aggregateRating.reviewCount,
    "bestRating": "5",
    "worstRating": "1"
  },
  "amenityFeature": [
    ...site.sportsBar.amenities.map(a => ({ "@type": "LocationFeatureSpecification", "name": a, "value": true })),
    { "@type": "LocationFeatureSpecification", "name": `${site.sportsBar.tvCount}+ TVs`, "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Family-friendly", "value": true },
    { "@type": "LocationFeatureSpecification", "name": "Wheelchair accessible", "value": true },
  ]
});

const breadcrumbSchema = (crumbs) => ({
  "@type": "BreadcrumbList",
  "itemListElement": crumbs.map((c, i) => ({
    "@type": "ListItem",
    "position": i + 1,
    "name": c.name,
    "item": c.url ? `${site.url}${c.url}` : undefined,
  }))
});

const websiteSchema = () => ({
  "@type": "WebSite",
  "@id": `${site.url}/#website`,
  "url": site.url,
  "name": site.name,
  "publisher": { "@id": `${site.url}/#restaurant` }
});

const jsonLd = (schemas) => {
  const graph = { "@context": "https://schema.org", "@graph": schemas };
  return `<script type="application/ld+json">${JSON.stringify(graph, null, 2)}</script>`;
};

// ---------- shared layout ----------
const layout = ({ title, description, canonical, ogImage, schemas, body, noindex }) => `<!doctype html>
<html lang="en-CA">
<head>
<meta charset="utf-8" />
<meta name="viewport" content="width=device-width,initial-scale=1" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-BRBS7BTYV0"></script>
<script>window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}gtag('js',new Date());gtag('config','G-BRBS7BTYV0');</script>
<script>document.addEventListener('click',function(e){var a=e.target.closest?e.target.closest('a'):null;if(!a||!a.href)return;var h=a.href;if(h.indexOf('tel:')===0){gtag('event','call_click',{link_url:h});}else if(/skipthedishes|ubereats|doordash/i.test(h)){var p=/skipthedishes/i.test(h)?'skipthedishes':/ubereats/i.test(h)?'ubereats':'doordash';gtag('event','order_click',{provider:p,link_url:h});}else if(/(google\.[a-z.]+\/maps|maps\.app\.goo\.gl|goo\.gl\/maps|\/dir\/)/i.test(h)){gtag('event','directions_click',{link_url:h});}},true);</script>
<title>${esc(title)}</title>
${noindex ? `<meta name="robots" content="noindex,follow" />\n` : ""}<meta name="description" content="${esc(description)}" />
<link rel="canonical" href="${esc(canonical)}" />
<link rel="icon" type="image/svg+xml" href="/assets/favicon.svg" />
<link rel="apple-touch-icon" href="/assets/favicon.svg" />

<!-- Open Graph -->
<meta property="og:type" content="restaurant" />
<meta property="og:site_name" content="${esc(site.name)}" />
<meta property="og:title" content="${esc(title)}" />
<meta property="og:description" content="${esc(description)}" />
<meta property="og:url" content="${esc(canonical)}" />
<meta property="og:image" content="${esc(ogImage || `${site.url}/assets/og-image.png`)}" />
<meta property="og:image:alt" content="${esc(`${site.name} in ${site.nap.locality}, ${site.nap.region}`)}" />
<meta property="og:locale" content="en_CA" />
<meta property="business:contact_data:street_address" content="${esc(site.nap.streetAddress)}" />
<meta property="business:contact_data:locality" content="${esc(site.nap.locality)}" />
<meta property="business:contact_data:region" content="${esc(site.nap.region)}" />
<meta property="business:contact_data:postal_code" content="${esc(site.nap.postalCode)}" />
<meta property="business:contact_data:country_name" content="Canada" />
<meta property="business:contact_data:phone_number" content="${esc(site.nap.phoneDisplay)}" />

<!-- Twitter -->
<meta name="twitter:card" content="summary_large_image" />
<meta name="twitter:title" content="${esc(title)}" />
<meta name="twitter:description" content="${esc(description)}" />
<meta name="twitter:image" content="${esc(ogImage || `${site.url}/assets/og-image.png`)}" />

<!-- Schema.org JSON-LD -->
${jsonLd(schemas)}

<link rel="stylesheet" href="/assets/style.css?v=${cssVersion}" />
</head>
<body>
${nav()}
<main>
${body}
</main>
${footer()}
</body>
</html>`;

const nav = () => `<header class="site-header">
  <div class="wrap nav">
    <a class="logo" href="/" aria-label="${esc(site.name)}, home">
      <img src="${site.brand.logoUrl}" alt="${esc(site.name)} logo" width="120" height="60" loading="eager" />
    </a>
    <nav class="primary-nav" aria-label="Main">
      <a href="/">Home</a>
      <a href="/menu/">Menu</a>
      <a href="/pizza-menu/">Pizzas</a>
      <a href="/sports-bar/">Sports Bar</a>
      <a href="/delivery/">Delivery</a>
      <a href="/about/">About</a>
      <a href="/faq/">FAQ</a>
      <a href="/contact/">Contact</a>
    </nav>
    <a class="order-cta" href="tel:${site.nap.phone}">
      <span class="cta-label">Order:</span> ${esc(site.nap.phoneDisplay)}
    </a>
  </div>
</header>`;

const footer = () => `<footer class="site-footer">
  <div class="wrap footer-grid">
    <div>
      <h3>${esc(site.name)}</h3>
      <p>${esc(site.tagline)}</p>
      <p><strong>${esc(site.nap.streetAddress)}</strong><br/>${esc(site.nap.locality)}, ${esc(site.nap.region)} ${esc(site.nap.postalCode)}</p>
      <p><a href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a></p>
    </div>
    <div>
      <h3>Hours</h3>
      <ul class="hours">
        ${site.hours.map(h => `<li><span>${esc(h.dayOfWeek)}</span><span>${esc(humanHours(h))}</span></li>`).join("")}
      </ul>
    </div>
    <div>
      <h3>Order</h3>
      <p><a href="tel:${site.nap.phone}">Call us, ${esc(site.nap.phoneDisplay)}</a></p>
      <p>Or order via:</p>
      <ul class="thirdparty">
        <li><a href="${site.order.skipTheDishes}" rel="noopener">Skip the Dishes</a></li>
        <li><a href="${site.order.uberEats}" rel="noopener">Uber Eats</a></li>
        <li><a href="${site.order.doorDash}" rel="noopener">DoorDash</a></li>
      </ul>
    </div>
    <div>
      <h3>Delivery Areas</h3>
      <ul class="neighborhoods">
        ${site.neighborhoods.slice(0, 10).map(n => `<li>${esc(n)}</li>`).join("")}
        <li><em>+ ${site.neighborhoods.length - 10} more NW Calgary communities</em></li>
      </ul>
    </div>
  </div>
  <div class="wrap subfooter">
    <p>&copy; ${new Date().getFullYear()} ${esc(site.name)}. ${esc(site.yearsServing)} years in NW Calgary.</p>
  </div>
</footer>`;

// ---------- homepage FAQ (visible section + FAQPage schema) ----------
// Plain-text hours line (no dashes) built from the real site.hours data.
const faqHoursLine = (() => {
  const fmt = (t) => {
    let [hh, mm] = t.split(":").map(Number);
    if (hh >= 24) hh -= 24;
    const period = hh >= 12 ? "PM" : "AM";
    const h12 = hh === 0 ? 12 : hh > 12 ? hh - 12 : hh;
    const mmStr = mm === 0 ? "" : `:${String(mm).padStart(2, "0")}`;
    return `${h12}${mmStr} ${period}`;
  };
  return site.hours
    .map((h) => `${h.dayOfWeek} ${fmt(h.opens)} to ${fmt(h.closes)}`)
    .join("; ");
})();

// Every answer below is built strictly from facts already in src/site.config.js.
const homeFaqs = [
  {
    q: "How do I order from TOPS Pizza?",
    a: `You can order TOPS Pizza by calling us at ${site.nap.phoneDisplay}, or online through SkipTheDishes, Uber Eats, or DoorDash. We offer dine-in, takeout, and delivery.`,
  },
  {
    q: "Do you deliver?",
    a: `Yes. We deliver across NW Calgary, including ${site.neighborhoods.length}+ neighborhoods such as ${site.neighborhoods.slice(0, 6).join(", ")} and more. You can order delivery by phone at ${site.nap.phoneDisplay} or through SkipTheDishes, Uber Eats, or DoorDash.`,
  },
  {
    q: "What are your hours?",
    a: `Our hours are: ${faqHoursLine}.`,
  },
  {
    q: "Where are you located?",
    a: `We are located at ${site.nap.streetAddress}, ${site.nap.locality}, ${site.nap.region} ${site.nap.postalCode}, in the ${site.nap.neighborhood} neighborhood of NW Calgary.`,
  },
  {
    q: "Do you have a sports bar?",
    a: `Yes. TOPS Pizza & Sports Bar has ${site.sportsBar.tvCount}+ TVs showing ${site.sportsBar.leagues.join(", ")}, plus a full bar, pool table, jukebox, and VLTs in the lounge.`,
  },
  {
    q: "What kind of food do you serve?",
    a: `We serve ${site.servesCuisine.join(", ")}, including our signature neighborhood pizzas. Family recipe since ${site.yearFounded}.`,
  },
  {
    q: "Can I dine in or get takeout?",
    a: `Yes. You can dine in at our ${site.nap.neighborhood} location, order takeout, or have your food delivered. Call us at ${site.nap.phoneDisplay} to place an order.`,
  },
];

// SINGLE SOURCE OF TRUTH for what counts as meat on this site. Defined here,
// above vegFaqs, because vegFaqs evaluates it at DEFINITION time (allPizzas is
// imported at line 13, so this is safe). Do NOT create a second copy: an
// earlier version had this list duplicated in two places, and two copies of a
// safety-critical dietary list drift apart.
//
// NOTE this is a blocklist and it is ONLY safe against allPizzas, whose
// `ingredients` are structured arrays that were checked by hand across all 27.
// It is NOT safe against prose descriptions: run against those it wrongly
// cleared "Boneless Dry Ribs", "Greek Mezedes" (AAA Top Sirloin) and a burger.
// Sides therefore use the explicit VEG_SIDE_NAMES allow-list instead.
const VEG_MEAT_WORDS = ["pepperoni","bacon","ham","beef","sausage","salami","chicken",
  "shrimp","donair","steak","veal","meat","anchov","tuna","sirloin","rib","fish","calamari"];

const isVegetarianPizza = (p) =>
  !(p.ingredients || []).some((i) => VEG_MEAT_WORDS.some((m) => i.toLowerCase().includes(m)));

// Dietary questions, added 2026-09-15. Answers are derived from the menu data
// at build time so they cannot drift from the actual menu. Poutine and soup of
// the day are deliberately NOT claimed as vegetarian, they are unconfirmed.
const vegFaqs = [
  {
    q: "Do you have vegetarian options?",
    a: `Yes. ${allPizzas.filter(isVegetarianPizza).length} of our pizzas have no meat on them, and any pizza can be made without meat. We also have the TOPS Greek Salad, Bread Stix, Onion Rings, Nachos Supreme without the beef, and both desserts. See our vegetarian options page for the full list.`,
  },
  {
    q: "Do you have a gluten free pizza crust?",
    a: `Yes. Gluten free crust is available on ${pizzaExtras.glutenFreeCrust.availableOn.toLowerCase()} for an extra $${pizzaExtras.glutenFreeCrust.price}. It is prepared in a kitchen that also handles wheat, so if you are coeliac please tell us when you order.`,
  },
  {
    q: "Is the vegetarian food vegan?",
    a: `No. Our meat-free pizzas all have cheese on them and the Greek salad has feta. If you need dairy free, call us at ${site.nap.phoneDisplay} and we will tell you honestly what we can and cannot do.`,
  },
];

const faqPageSchema = (faqs) => ({
  "@type": "FAQPage",
  "@id": `${site.url}/#faq`,
  "mainEntity": faqs.map((f) => ({
    "@type": "Question",
    "name": f.q,
    "acceptedAnswer": { "@type": "Answer", "text": f.a },
  })),
});

// heading: pass "" to suppress the <h2>. The dedicated /faq/ page already has
// "Frequently Asked Questions" as its <h1>, so without this it printed the same
// heading twice in a row. Every other caller wants the default.
const faqSection = (faqs, heading = "Frequently Asked Questions") => `
<section class="story wrap" id="faq">
  ${heading ? `<h2>${esc(heading)}</h2>` : ""}
  <div class="faq-list">
    ${faqs
      .map(
        (f) => `
    <div class="faq-item">
      <h3>${esc(f.q)}</h3>
      <p>${esc(f.a)}</p>
    </div>`
      )
      .join("")}
  </div>
</section>
`;

// ============================================================
// PAGE: HOMEPAGE
// ============================================================
const homepage = () => {
  const title = `${site.name} | Menu, Delivery & Takeout in NW Calgary`;
  const description = "See the TOPS menu and order pizza, wings and pub favourites in NW Calgary (Thorncliffe). Dine in, takeout, or delivery via SkipTheDishes, Uber Eats and DoorDash.";
  const canonical = `${site.url}/`;
  const schemas = [
    websiteSchema(),
    restaurantSchema(),
    faqPageSchema(homeFaqs),
    breadcrumbSchema([{ name: "Home", url: "/" }])
  ];

  const body = `
<section class="hero hero-home has-bg" style="background-image: url(${site.localImages?.heroHome || img(site.images.heroHome)})">
  <div class="wrap">
    <p class="eyebrow">Serving NW Calgary since ${site.yearFounded}</p>
    <h1>Hot Pizza. Cold Beer. Every Game.</h1>
    <p class="lede">${esc(site.tagline)} Family recipe, ${site.yearsServing} years deep, ${site.sportsBar.tvCount}+ TVs lit up every night in Thorncliffe.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="tel:${site.nap.phone}">Call to Order, ${esc(site.nap.phoneDisplay)}</a>
      <a class="btn btn-secondary" href="/thorncliffe/">View Delivery Areas</a>
    </div>
  </div>
</section>

<section class="features wrap">
  <div class="feature">
    <span class="feature-icon">🍕</span>
    <h3>Legendary Pizzas</h3>
    <p>Hand-tossed, fresh-made daily from a family recipe untouched since ${site.yearFounded}. Premium toppings, real mozzarella, in-house sauce.</p>
  </div>
  <div class="feature">
    <span class="feature-icon">📺</span>
    <h3>Every Game, Every Night</h3>
    <p>${site.sportsBar.tvCount}+ TVs showing ${site.sportsBar.leagues.join(", ")}. From Flames home games to UFC pay-per-views, you won't miss a snap.</p>
  </div>
  <div class="feature">
    <span class="feature-icon">🍺</span>
    <h3>Full Bar &amp; Pub Eats</h3>
    <p>Cold beer, cocktails, highballs on special. Wings (31 flavours), burgers, pastas, classics. Pool table, jukebox, VLTs in the lounge.</p>
  </div>
</section>

<section class="signature wrap">
  <h2>Pizzas Named For The Neighborhoods We Feed</h2>
  <p class="section-intro">After ${site.yearsServing} years in NW Calgary, the neighborhoods became part of the menu. Three of our most-ordered:</p>
  <div class="pizza-grid">
    ${featuredPizzas.map((p, i) => {
      const imgs = [site.images.foodA, site.images.foodB, site.images.foodC];
      const bgUrl = img(imgs[i % imgs.length]);
      return `
      <a class="pizza-card has-img" href="/${p.slug}/">
        <div class="pizza-card-img" style="background-image: url(${bgUrl})"></div>
        <div class="pizza-card-body">
          <h3>The ${esc(p.name.replace(/^The /, ""))}</h3>
          <p class="ingredients">${p.ingredients.join(", ")}</p>
          <p class="neighborhood">Inspired by ${esc(p.neighborhood)}</p>
        </div>
      </a>
    `;}).join("")}
  </div>
</section>

<section class="story wrap">
  <h2>The Recipe Hasn’t Changed Since ${site.yearFounded}</h2>
  <p>${esc(site.founder.story)}</p>
  <p>Today, every pizza that leaves our oven is made by hand, from scratch, with a dough recipe ${esc(site.founder.name)} brought from Greece, the same in-house sauce, real Alberta-made mozzarella, and the same standard ${site.yearsServing} years on.</p>
  <p><a class="text-link" href="/about/">Read the TOPS story →</a></p>
</section>

${/* The Will C. quote below is a real customer testimonial and it mentions VLTs.

      ONE RULE: it is either VERBATIM or it is GONE. Never a trimmed version. On 2026-09-15 I
      deleted the word VLTs from inside it while still presenting it as the customer's exact
      words, which is misrepresentation. If it ever has to come off, remove the whole quote.
      The verbatim original is preserved at build.js.bak-vlt-230522 line 452.

      On the VLT references site-wide (6 places: this quote, the sports-bar FAQ, the
      sports-bar feature copy, the About history, the sports-bar meta description, the
      "While You're Here" list item, plus llms.txt and site.config.js amenities): they were
      removed 2026-09-15 and RESTORED the same day on Steve's instruction, "We were a little
      too heavy handed to remove them." The reasoning and the AGLC citations live in
      src/site.config.js next to `amenities`, and in projects/tops-pizza-citations/.
      Short version: s.10.20.3 is real but the handbook never distinguishes mentioning from
      advertising. Not settled by the text. AGLC Customer Care 1-800-561-4415 settles it.

      Note this is a JS comment, NOT an HTML comment. An earlier version of this note was
      written as <!-- --> inside the template and shipped straight into dist/index.html.
      Keep explanations out of emitted HTML. */''}
<section class="reviews wrap">
  <h2>What Our Calgary Neighbors Say</h2>
  <p class="rating-summary">⭐ ${site.aggregateRating.ratingValue} / 5 across ${site.aggregateRating.reviewCount}+ reviews</p>
  <div class="review-grid">
    <blockquote class="review">
      <div class="review-head">
        <img class="review-avatar" src="${img(site.images.avatarDavid)}" alt="David S." width="48" height="48" loading="lazy" />
        <cite>David S. <span>· Google</span></cite>
      </div>
      <p>"The meat lovers was excellent. Crust crisp yet light, a good amount of meat and toppings."</p>
    </blockquote>
    <blockquote class="review">
      <div class="review-head">
        <img class="review-avatar" src="${img(site.images.avatarTerri)}" alt="Terri W." width="48" height="48" loading="lazy" />
        <cite>Terri W. <span>· Google</span></cite>
      </div>
      <p>"Friendly environment, cheerful staff. Good food and drinks, reasonable prices."</p>
    </blockquote>
    <blockquote class="review">
      <div class="review-head">
        <img class="review-avatar" src="${img(site.images.avatarWill)}" alt="Will C." width="48" height="48" loading="lazy" />
        <cite>Will C. <span>· Google</span></cite>
      </div>
      <p>"Dining room, lounge, pool, jukebox, VLTs, sports TVs everywhere, 31 flavours of wings."</p>
    </blockquote>
  </div>
</section>
${faqSection(homeFaqs)}
<section class="visit wrap">
  <h2>Our Delivery Zone, All of NW Calgary</h2>
  <p>${esc(site.nap.streetAddress)}, ${esc(site.nap.locality)}, ${esc(site.nap.region)} ${esc(site.nap.postalCode)}</p>
  <p>Walk-in, call in, or order delivery to any of the ${site.neighborhoods.length}+ NW Calgary neighborhoods inside the yellow zone below.</p>
  <div class="map-embed">
    <iframe src="https://www.google.com/maps/d/embed?mid=1Xf1OXWceyyM18AkDkbfjN11Z5P3PJSc&amp;ehbc=2E312F" loading="lazy" title="TOPS Pizza service area map"></iframe>
  </div>
  <a class="btn btn-secondary" href="${site.nap.googleMapsUrl}" rel="noopener">Get Directions to TOPS</a>
</section>
`;

  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: ABOUT
// ============================================================
const about = () => {
  const title = `About TOPS Pizza & Sports Bar, ${site.yearsServing} Years in NW Calgary`;
  const description = `Family-owned since ${site.yearFounded}. The TOPS Pizza recipe was passed down from ${site.founder.name}'s mother and hasn't changed in ${site.yearsServing} years. Our story.`;
  const canonical = `${site.url}/about/`;

  const schemas = [
    restaurantSchema(),
    {
      "@type": "AboutPage",
      "@id": `${canonical}#aboutpage`,
      "url": canonical,
      "name": title,
      "description": description,
      "mainEntity": { "@id": `${site.url}/#restaurant` },
    },
    {
      "@type": "Organization",
      "name": site.name,
      "foundingDate": String(site.yearFounded),
      "founder": { "@type": "Person", "name": site.founder.name },
      "location": { "@id": `${site.url}/#restaurant` },
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "About", url: "/about/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Our Story</p>
    <h1>${esc(site.yearsServing)} Years. One Recipe. One Neighborhood.</h1>
  </div>
</section>

<section class="prose wrap">
  <p class="lede">${esc(site.founder.name)} grew up surrounded by traditional Greek cooking. He carried a family dough recipe across an ocean, opened the doors at ${esc(site.nap.streetAddress)} in ${site.yearFounded}, and ${site.yearsServing} years later that same recipe is still rolled out every morning.</p>

  <figure class="prose-figure">
    <img src="${site.localImages?.aboutInline || img(site.images.foodA)}" alt="The bar and lounge at TOPS Pizza & Sports Bar, NW Calgary" loading="lazy" />
  </figure>

  <h2>From Greece to NW Calgary</h2>
  <p>After immigrating to Canada, ${esc(site.founder.name)} and his wife ${esc(site.founder.wife)} set out to build something special, a neighborhood place that served the food they grew up on, made the way their families made it. New country, new language, a lot of long days and late nights. They built it anyway.</p>
  <p>Today their son ${esc(site.founder.son)} plays an active role in the kitchen and the floor, carrying the family legacy forward into a third generation of Thorncliffe regulars.</p>

  <h2>The Family Recipe</h2>
  <p>The dough is hand-tossed from a recipe ${esc(site.founder.name)} brought from Greece. The sauce is made in-house every morning. The cheese is Alberta-made mozzarella. There’s no shortcut to the way TOPS tasted in ${site.yearFounded}, and we haven’t looked for one.</p>
  <p>It’s why regulars from Huntington Hills, Thorncliffe, Highland Park, and twenty other NW communities have kept coming back across three generations. The TOPS Original, pepperoni, mushrooms, bacon, green peppers, olives, and shrimp, is the same pizza their grandparents ordered.</p>

  <h2>More Than Pizza</h2>
  <p>Over the decades, TOPS grew into the neighborhood’s sports bar too. ${site.sportsBar.tvCount}+ TVs cover every Flames game, every CFL Saturday, every UFC pay-per-view, every NHL playoff push. A full bar, cold beer, daily specials, a pool table, a jukebox, VLTs in the lounge.</p>

  <h2>The Three Pizzas Named For Our Neighborhoods</h2>
  <p>${site.yearsServing} years of feeding NW Calgary earned three of our pizzas the right to wear neighborhood names:</p>
  <ul>
    ${featuredPizzas.map(p => `<li><strong><a href="/${p.slug}/">${esc(p.name)}</a></strong>, ${esc(p.description)}</li>`).join("")}
  </ul>

  <h2>From Our Family to Yours</h2>
  <p>We’re at ${esc(site.nap.streetAddress)} in Thorncliffe. Dine in, take out, call in for delivery, or catch the game from a booth with a pizza and a pint. The kitchen and the bar are open from ${site.hours[0].opens.split(":")[0]} AM past midnight, seven days a week.</p>
  <p><em>You’re not just a customer here. You’re part of the family.</em></p>
  <p><a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a></p>
</section>
`;

  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: SPORTS BAR
// ============================================================
const sportsBar = () => {
  const title = `NW Calgary Sports Bar | Watch NHL, CFL, NFL, UFC at TOPS Pizza`;
  const description = `${site.sportsBar.tvCount}+ TVs covering every game. NHL, CFL, NFL, MLB, UFC and more at TOPS Pizza & Sports Bar in Thorncliffe, NW Calgary. Full bar, daily specials, pool, jukebox, VLTs.`;
  const canonical = `${site.url}/sports-bar/`;

  const schemas = [
    restaurantSchema(),
    {
      "@type": "Service",
      "@id": `${canonical}#sports-viewing`,
      "name": "Live Sports Viewing",
      "description": description,
      "provider": { "@id": `${site.url}/#restaurant` },
      "areaServed": site.neighborhoods.map(n => ({ "@type": "Place", "name": `${n}, Calgary, AB` })),
      "serviceType": "Sports bar / live game viewing",
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Sports Bar", url: "/sports-bar/" }
    ])
  ];

  const body = `
<section class="hero hero-page has-bg" style="background-image: url(${site.localImages?.heroSportsBar || img(site.images.heroSportsBar)})">
  <div class="wrap">
    <p class="eyebrow">Live Sports in NW Calgary</p>
    <h1>${site.sportsBar.tvCount}+ TVs. Every Game. Every Night.</h1>
    <p class="lede">From puck drop to the final whistle, TOPS is where Thorncliffe and NW Calgary watch the game. Hot pizza, cold beer, full bar, and a TV from every angle.</p>
  </div>
</section>

<section class="features wrap">
  <div class="feature">
    <span class="feature-icon">🏒</span>
    <h3>NHL, Flames, Oilers &amp; League-Wide</h3>
    <p>Every Flames home and away game. Playoff push, regular season, alumni nights, we're locked in.</p>
  </div>
  <div class="feature">
    <span class="feature-icon">🏈</span>
    <h3>CFL &amp; NFL Saturdays/Sundays</h3>
    <p>Stampeders games front and centre. NFL Sunday Ticket with every game broadcast across the room.</p>
  </div>
  <div class="feature">
    <span class="feature-icon">🥊</span>
    <h3>UFC Pay-Per-Views</h3>
    <p>Every UFC main event live on the big screens. Get here early, the bar fills up fast on fight nights.</p>
  </div>
</section>

<section class="prose wrap">
  <h2>What Makes TOPS the NW Calgary Sports Bar</h2>
  <p>It's not just the screens, though there are ${site.sportsBar.tvCount}+ of them. It's that you can actually hear the call from any seat, your wings come out hot, and your pint isn't $14. We've been doing this for ${site.yearsServing} years. We know what a sports bar should feel like.</p>

  <h3>What's Here</h3>
  <ul>
    ${site.sportsBar.amenities.map(a => `<li>${esc(a)}</li>`).join("")}
    <li>${site.sportsBar.tvCount}+ HDTVs across the dining room and lounge</li>
    <li>Sound on for the main game; closed-caption on the rest</li>
    <li>Family-friendly dining room, bring the kids until 9pm</li>
    <li>Plenty of parking, 4 St NW at 56 Ave</li>
  </ul>

  <h3>Daily Pub Perks</h3>
  <p>Pub-only specials run all week, wings, pizza, drinks, happy hour. Some are too good to take home. Come in, grab a booth, and find out which night is yours.</p>

  <h3>Big Game Coming Up?</h3>
  <p>Book a table or just walk in. For groups of 10+, call ahead and we'll save you the booth with the best sightline. <a href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a>.</p>
</section>
`;

  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: NEIGHBORHOOD (generic, emits a page for each of the 20 neighborhoods)
// ============================================================
const neighborhoodPage = (nh) => {
  const pizza = nh.neighborhoodPizza ? allPizzas.find(p => p.slug === nh.neighborhoodPizza) : null;
  const title = `Pizza Delivery in ${nh.name}, Calgary, TOPS Pizza & Sports Bar`;
  const description = `Hot pizza & pub favourites delivered fast to ${nh.name}, NW Calgary. ${site.yearsServing} years at ${site.nap.streetAddress}. Call ${site.nap.phoneDisplay}.`;
  const canonical = `${site.url}/${nh.slug}/`;

  const schemas = [
    restaurantSchema(),
    {
      "@type": "Service",
      "@id": `${canonical}#delivery-${nh.slug}`,
      "name": `Pizza Delivery in ${nh.name}, Calgary`,
      "description": description,
      "provider": { "@id": `${site.url}/#restaurant` },
      "serviceType": "Food delivery",
      "areaServed": {
        "@type": "Place",
        "name": `${nh.name}, Calgary, AB`,
        "containedInPlace": { "@type": "City", "name": "Calgary", "containedInPlace": { "@type": "AdministrativeArea", "name": "Alberta" } }
      },
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Delivery Areas", url: "/delivery/" },
      { name: nh.name, url: `/${nh.slug}/` }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">${esc(nh.deliveryEta || "20 to 30 min")} delivery</p>
    <h1>Pizza Delivery in ${esc(nh.name)}, From Your Neighborhood Pizzeria</h1>
    <p class="lede">${esc(nh.blurb)}</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a>
      <a class="btn btn-secondary" href="${site.order.skipTheDishes}" rel="noopener">Order via Skip</a>
    </div>
  </div>
</section>

<section class="prose wrap">
  <h2>Why ${esc(nh.name)} Orders TOPS</h2>
  <p>${esc(nh.uniqueAngle || `We’re at ${nh.crossStreets || site.nap.streetAddress}, close enough that your pizza arrives hot, not lukewarm. Phone orders come from the same kitchen as the dine-in pies. Our in-house driver knows ${nh.name} the way only a ${site.yearsServing}-year neighborhood pizzeria can.`)}</p>

  ${nh.landmarks && nh.landmarks.length ? `
  <h3>Local Landmarks We Deliver Near</h3>
  <ul class="grid-list">
    ${nh.landmarks.map(l => `<li>📍 ${esc(l)}</li>`).join("")}
  </ul>
  ` : ""}

  ${nh.boundaries ? `<p class="text-small"><em>${esc(nh.boundaries)}${nh.established ? ` · Established ${nh.established}` : ""}.</em></p>` : (nh.established ? `<p class="text-small"><em>Established ${nh.established}.</em></p>` : "")}

  ${pizza ? `
  <h2>${esc(nh.name)} Has Its Own Pizza</h2>
  <p>${esc(pizza.description)}</p>
  <ul>
    <li><strong>${esc(pizza.name)}</strong>, ${pizza.ingredients.join(", ")}</li>
  </ul>
  <p><a class="text-link" href="/${pizza.slug}/">See ${esc(pizza.name)} →</a></p>
  ` : `
  <h2>What ${esc(nh.name)} Orders</h2>
  <p>TOPS Original. The Thorncliffe. The Spartan. Meat Lovers. After ${site.yearsServing} years feeding NW Calgary, we know what works. <a class="text-link" href="/pizza-menu/">See the full pizza menu →</a>.</p>
  `}

  <h2>What We Deliver</h2>
  <ul class="grid-list">
    <li>🍕 Signature & classic pizzas (hand-tossed, gluten-free crust available on mediums)</li>
    <li>🍗 Wings, 31 flavours, baked or breaded</li>
    <li>🍔 Burgers, sandwiches & donairs</li>
    <li>🍝 Pastas & TOPS Classics</li>
    <li>🥗 Salads & soups</li>
    <li>🧁 Desserts</li>
  </ul>

  <h2>Phone Order Direct (Best for In-House Delivery)</h2>
  <p>Calling us directly puts your order in front of our in-house driver. We answer the phone, no app, no menu confusion. <a href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a>.</p>

  <h2>Or Order Via Skip, Uber Eats, or DoorDash</h2>
  <p>We’re on all three. Pricing is the same on-site as in-store; delivery times depend on the courier.</p>
  <ul class="thirdparty inline">
    <li><a href="${site.order.skipTheDishes}" rel="noopener">Skip the Dishes</a></li>
    <li><a href="${site.order.uberEats}" rel="noopener">Uber Eats</a></li>
    <li><a href="${site.order.doorDash}" rel="noopener">DoorDash</a></li>
  </ul>

  <h2>Hours</h2>
  <ul class="hours">
    ${site.hours.map(h => `<li><span>${esc(h.dayOfWeek)}</span><span>${esc(humanHours(h))}</span></li>`).join("")}
  </ul>
  <p class="text-small"><em>Kitchen sometimes closes a few minutes before posted close, call to confirm if it’s late.</em></p>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// keep the named export for back-compat (homepage uses it in one place)
const thorncliffePage = () => neighborhoodPage(allNeighborhoods.find(n => n.slug === "thorncliffe"));

// ============================================================
// PAGE: PIZZA (generic, emits a page for each of the 27 named pizzas)
// ============================================================
const pizzaPage = (p) => {
  const title = `${p.name} Pizza, TOPS Pizza & Sports Bar Calgary`;
  const description = `${p.name}: ${p.ingredients.join(", ")}. ${p.description.slice(0, 100)}...`;
  const canonical = `${site.url}/${p.slug}/`;

  const schemas = [
    restaurantSchema(),
    {
      "@type": "MenuItem",
      "@id": `${canonical}#menuitem`,
      "name": p.name,
      "description": p.description,
      "image": `${site.url}/assets/pizza-${p.slug}.jpg`,
      "menuAddOn": p.ingredients.map(i => ({ "@type": "MenuItem", "name": i })),
      "offers": p.prices ? pizzaSizes.map(s => ({
        "@type": "Offer",
        "name": `${s.label} (${s.inches})`,
        "price": p.prices[s.key],
        "priceCurrency": "CAD",
        "availability": "https://schema.org/InStock"
      })) : undefined,
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Pizzas", url: "/pizza-menu/" },
      { name: p.name, url: `/${p.slug}/` }
    ])
  ];

  // Pick a couple of cross-sell pizzas (same category if possible, else neighborhood pizzas)
  const others = allPizzas.filter(x => x.slug !== p.slug).slice(0, 4);

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">${p.category === "neighborhood" ? "Neighborhood Signature" : p.category === "signature" ? "Signature Pizza" : p.category === "specialty" ? "Specialty Pizza" : "Classic Pizza"}</p>
    <h1>${esc(p.name)}</h1>
    <p class="lede">${esc(p.description)}</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="tel:${site.nap.phone}">Order, ${esc(site.nap.phoneDisplay)}</a>
    </div>
  </div>
</section>

${p.image ? `
<section class="wrap">
  <figure class="prose-figure pizza-feature">
    <img src="${p.image}" alt="${esc(p.name)} at TOPS Pizza & Sports Bar, Calgary" loading="lazy" />
  </figure>
</section>
` : ""}

<section class="prose wrap">
  <h2>What’s On It</h2>
  <ul class="ingredients-list">
    ${p.ingredients.map(i => `<li>${esc(i)}</li>`).join("")}
  </ul>

  <h2>Sizes & Pricing</h2>
  ${p.prices ? `
  <table class="price-table">
    <thead><tr><th>Size</th><th>Price (CAD)</th></tr></thead>
    <tbody>
      ${pizzaSizes.map(s => `<tr><td>${s.label} ${s.inches}</td><td>$${p.prices[s.key]}</td></tr>`).join("")}
    </tbody>
  </table>
  ` : `<p>Available in Personal (8"), Medium (10"), Large (12"), and Extra Large (14"). <a href="tel:${site.nap.phone}">Call for pricing</a>.</p>`}
  <h3>Crust Options</h3>
  <ul class="size-list">
    <li><strong>Gluten Free Crust</strong>, Medium only · add $${pizzaExtras.glutenFreeCrust.price}</li>
    <li><strong>Half & Half toppings</strong>, Large and Extra Large only · add $${pizzaExtras.halfAndHalf.price}</li>
    <li><strong>Thin Crust</strong>, Medium, Large, or Extra Large · add $${pizzaExtras.thinCrust.price}</li>
  </ul>
  <p class="text-small"><em>Extra meat or cheese: $${pizzaExtras.extraMeatCheese.prices.personal} / $${pizzaExtras.extraMeatCheese.prices.medium} / $${pizzaExtras.extraMeatCheese.prices.large} / $${pizzaExtras.extraMeatCheese.prices.xlarge} (by size). Extra veg: same.</em></p>

  <h2>How To Order</h2>
  <p><strong>Phone (recommended for delivery):</strong> <a href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a>, our in-house driver brings it to your door.</p>
  <p><strong>Or via:</strong> <a href="${site.order.skipTheDishes}" rel="noopener">Skip the Dishes</a>, <a href="${site.order.uberEats}" rel="noopener">Uber Eats</a>, <a href="${site.order.doorDash}" rel="noopener">DoorDash</a>.</p>
  <p><strong>Dine in:</strong> Walk up, there’s usually a booth.</p>

  <h2>You Might Also Like</h2>
  <div class="pizza-grid small">
    ${others.map(x => `
      <a class="pizza-card" href="/${x.slug}/">
        <div class="pizza-card-body">
          <h3>${esc(x.name)}</h3>
          <p class="ingredients">${x.ingredients.slice(0, 4).join(", ")}${x.ingredients.length > 4 ? "..." : ""}</p>
        </div>
      </a>
    `).join("")}
  </div>
</section>
`;

  return layout({ title, description, canonical, schemas, body });
};

// back-compat shortcut
const thorncliffePizzaPage = () => pizzaPage(allPizzas.find(p => p.slug === "the-thorncliffe-pizza"));

// ============================================================
// PAGE: CONTACT
// ============================================================
const contactPage = () => {
  const title = `Contact TOPS Pizza & Sports Bar, NW Calgary`;
  const description = `Get in touch with TOPS Pizza & Sports Bar. ${site.nap.streetAddress}, ${site.nap.locality}, ${site.nap.region}. Phone ${site.nap.phoneDisplay}.`;
  const canonical = `${site.url}/contact/`;
  const schemas = [
    restaurantSchema(),
    {
      "@type": "ContactPage",
      "@id": `${canonical}#contactpage`,
      "url": canonical,
      "mainEntity": { "@id": `${site.url}/#restaurant` }
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Contact", url: "/contact/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Get In Touch</p>
    <h1>Contact TOPS Pizza & Sports Bar</h1>
    <p class="lede">Phone, walk in, or drop a note. We’re at ${esc(site.nap.streetAddress)} in Thorncliffe.</p>
  </div>
</section>

<section class="prose wrap">
  <h2>Call Us</h2>
  <p><a class="btn btn-primary" href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a></p>
  <p>Phone orders go directly to our in-house driver, best route for delivery in our NW Calgary service area.</p>

  <h2>Visit Us</h2>
  <p><strong>${esc(site.nap.streetAddress)}</strong><br/>${esc(site.nap.locality)}, ${esc(site.nap.region)} ${esc(site.nap.postalCode)}</p>
  <p><a class="text-link" href="${site.nap.googleMapsUrl}" rel="noopener">Get directions →</a></p>

  <h2>Hours</h2>
  <ul class="hours">
    ${site.hours.map(h => `<li><span>${esc(h.dayOfWeek)}</span><span>${esc(humanHours(h))}</span></li>`).join("")}
  </ul>

  <h2>Order Online</h2>
  <ul class="thirdparty inline">
    <li><a href="${site.order.skipTheDishes}" rel="noopener">Skip the Dishes</a></li>
    <li><a href="${site.order.uberEats}" rel="noopener">Uber Eats</a></li>
    <li><a href="${site.order.doorDash}" rel="noopener">DoorDash</a></li>
  </ul>

  <h2>Send Us a Note</h2>
  <p>For catering inquiries, large group bookings, feedback, or anything else, drop a note via our form on the existing site or call directly. (Contact form will integrate with GHL webhook in production.)</p>

  <h2>Find Us on the Map</h2>
  <div class="map-embed">
    <iframe src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d2505.3816921038!2d-114.0704116!3d51.101417500000004!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x537165b4a4854d63%3A0x6bddb4dac426c9b1!2sTops%20Pizza!5e0!3m2!1sen!2sca!4v1754962047352!5m2!1sen!2sca" loading="lazy" title="TOPS Pizza location map"></iframe>
  </div>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: DAILY SPECIAL (generic, emits one per day of week + happy hour)
// ============================================================
const dailySpecialPage = (s) => {
  const title = `${s.title}, TOPS Pizza & Sports Bar NW Calgary`;
  const canonical = `${site.url}/${s.slug}/`;
  const schemas = [
    restaurantSchema(),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Daily Specials", url: "/daily-specials/" },
      { name: s.title, url: `/${s.slug}/` }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">${s.day ? `${esc(s.day)} at TOPS` : "Pub-Only Perks"}</p>
    <h1>${esc(s.h1)}</h1>
    <p class="lede">${esc(s.description)}</p>
  </div>
</section>

<section class="prose wrap">
  <p>${esc(s.body)}</p>

  <h2>How Specials Work at TOPS</h2>
  <p>Most of our pub-only deals run in-house (you have to be at the bar to get them, some deals are just too good to take home). Pricing and timing change from week to week, so the most reliable move is to call.</p>
  <p><a class="btn btn-primary" href="tel:${site.nap.phone}">${esc(s.cta)}</a></p>

  <h2>While You’re Here</h2>
  <ul>
    <li>${site.sportsBar.tvCount}+ TVs covering every NHL, CFL, NFL, MLB, NBA, and UFC game worth watching</li>
    <li>Full bar, cold beer, cocktails, highballs on special</li>
    <li>Wings (31 flavours), pizza, burgers, pastas, salads</li>
    <li>Pool table, jukebox, VLTs in the lounge</li>
    <li>Family-friendly dining room until 9 PM</li>
  </ul>

  <h2>Or Take It Home</h2>
  <p>Phone orders, Skip the Dishes, Uber Eats, DoorDash, all available. <a class="text-link" href="/thorncliffe/">See our NW Calgary delivery areas →</a></p>
</section>
`;
  return layout({ title, description: s.description, canonical, schemas, body });
};

// ============================================================
// PAGE: DAILY SPECIALS LANDING (lists all 7 days + happy hour)
// ============================================================
const dailySpecialsLandingPage = () => {
  const title = `Daily Specials & Happy Hour, TOPS Pizza & Sports Bar NW Calgary`;
  const description = `Daily specials, wing nights, game-day perks, and happy hour at TOPS Pizza & Sports Bar in Thorncliffe, NW Calgary.`;
  const canonical = `${site.url}/daily-specials/`;
  const schemas = [
    restaurantSchema(),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Daily Specials", url: "/daily-specials/" }
    ])
  ];
  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Pub-Only Perks</p>
    <h1>Daily Specials at TOPS Pizza & Sports Bar</h1>
    <p class="lede">In-house specials run all week. Wing nights, pizza pints, weekend game days. Some deals are just too good to take home.</p>
  </div>
</section>

<section class="prose wrap">
  <p>Tap any day below to see what we’re doing, or just call ${esc(site.nap.phoneDisplay)} for tonight’s current pub special.</p>
  <div class="pizza-grid">
    ${dailySpecials.map(s => `
      <a class="pizza-card" href="/${s.slug}/">
        <div class="pizza-card-body">
          <h3>${esc(s.day || "Happy Hour")}</h3>
          <p class="ingredients">${esc(s.title)}</p>
        </div>
      </a>
    `).join("")}
  </div>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: MENU LANDING
// ============================================================
const menuLandingPage = () => {
  const title = `Full Menu, TOPS Pizza & Sports Bar NW Calgary`;
  const description = `The full TOPS menu, pizzas, wings, burgers, pastas, salads, Greek classics, and desserts. NW Calgary’s family pizzeria since ${site.yearFounded}.`;
  const canonical = `${site.url}/menu/`;
  const schemas = [
    restaurantSchema(),
    {
      "@type": "Menu",
      "@id": `${canonical}#menu`,
      "url": canonical,
      "name": `${site.name} Menu`,
      "hasMenuSection": menuCategories.map(c => ({
        "@type": "MenuSection",
        "name": c.name,
        "description": c.description,
        "url": `${site.url}/${c.slug}/`,
      }))
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Menu", url: "/menu/" }
    ])
  ];
  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Our Menu</p>
    <h1>The Full TOPS Menu</h1>
    <p class="lede">Hand-tossed pizzas, 31 wing flavours, Greek classics, pub favourites, ${site.yearsServing} years of family recipes.</p>
  </div>
</section>

<section class="prose wrap">
  <div class="pizza-grid">
    ${menuCategories.map(c => `
      <a class="pizza-card" href="/${c.slug}/">
        <div class="pizza-card-body">
          <h3>${c.icon} ${esc(c.name)}</h3>
          <p class="ingredients">${esc(c.description.slice(0, 110))}${c.description.length > 110 ? "..." : ""}</p>
        </div>
      </a>
    `).join("")}
  </div>

  <h2>Vegetarian and Gluten Free</h2>
  <p>${vegetarianPizzas().length} of our pizzas have no meat on them, and gluten free crust is available on ${pizzaExtras.glutenFreeCrust.availableOn.toLowerCase()}. See <a href="/vegetarian-options/">all vegetarian options</a>.</p>

  <h2>Order</h2>
  <p>Call to order, walk in, or delivery via Skip / Uber / DoorDash. <a class="btn btn-primary" href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a></p>
</section>
${faqSection(vegFaqs)}
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: MENU CATEGORY (generic, emits one per menu section)
// ============================================================
const menuCategoryPage = (cat) => {
  const title = `${cat.name}, TOPS Pizza & Sports Bar Menu (NW Calgary)`;
  const description = cat.description;
  const canonical = `${site.url}/${cat.slug}/`;

  // For the pizzas category, list all 27 pizzas linked to their pages
  const isPizzas = cat.slug === "pizza-menu";

  const schemas = [
    restaurantSchema(),
    {
      "@type": "MenuSection",
      "@id": `${canonical}#section`,
      "name": cat.name,
      "description": cat.description,
      ...(isPizzas ? {
        "hasMenuItem": allPizzas.map(p => ({
          "@type": "MenuItem",
          "name": p.name,
          "url": `${site.url}/${p.slug}/`,
          "description": p.description,
        }))
      } : {})
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Menu", url: "/menu/" },
      { name: cat.name, url: `/${cat.slug}/` }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">${cat.icon} TOPS Menu</p>
    <h1>${esc(cat.name)}</h1>
    <p class="lede">${esc(cat.description)}</p>
  </div>
</section>

<section class="prose wrap">
  ${isPizzas ? `
  <div class="pizza-intro">
    <p><strong>Hand-made the traditional way, from scratch since ${site.yearFounded}.</strong> We make our family secret sauce in-house with only the best selected ingredients and the best quality mozzarella cheese.</p>
  </div>

  <h2>Sizes &amp; Crust Options</h2>
  <ul class="size-list">
    <li><strong>Gluten Free Crust</strong>, Medium pizzas only · add $${pizzaExtras.glutenFreeCrust.price}</li>
    <li><strong>Half &amp; Half toppings</strong>, Large &amp; Extra Large only · add $${pizzaExtras.halfAndHalf.price}</li>
    <li><strong>Thin Crust</strong>, Medium, Large, &amp; Extra Large · add $${pizzaExtras.thinCrust.price}</li>
    <li><strong>Extra meat or cheese</strong>, $${pizzaExtras.extraMeatCheese.prices.personal} / $${pizzaExtras.extraMeatCheese.prices.medium} / $${pizzaExtras.extraMeatCheese.prices.large} / $${pizzaExtras.extraMeatCheese.prices.xlarge} (by size)</li>
    <li><strong>Extra vegetable</strong>, same pricing</li>
  </ul>

  <h2>Our Full Pizza Lineup (${allPizzas.length})</h2>
  <p class="text-small"><em>⭐ = Signature TOPS pizza. Click any pizza for ingredients, sizes, and pricing detail.</em></p>

  <table class="menu-table">
    <thead>
      <tr>
        <th>Pizza</th>
        <th class="ingredients-col">Ingredients</th>
        <th class="price-col">S (8")</th>
        <th class="price-col">M (10")</th>
        <th class="price-col">L (12")</th>
        <th class="price-col">XL (14")</th>
      </tr>
    </thead>
    <tbody>
      ${allPizzas.map(p => `
        <tr>
          <td class="pizza-name">
            <a href="/${p.slug}/">${p.signature ? "⭐ " : ""}${esc(p.name)}</a>
          </td>
          <td class="ingredients-col">${esc(p.ingredients.join(", "))}</td>
          <td class="price-col">$${p.prices?.personal || ", "}</td>
          <td class="price-col">$${p.prices?.medium || ", "}</td>
          <td class="price-col">$${p.prices?.large || ", "}</td>
          <td class="price-col">$${p.prices?.xlarge || ", "}</td>
        </tr>
      `).join("")}
    </tbody>
  </table>

  <h2>Vegetarian and Gluten Free</h2>
  <p>${vegetarianPizzas().length} of these pizzas have no meat on them, and any pizza can be made without. Gluten free crust is available on ${pizzaExtras.glutenFreeCrust.availableOn.toLowerCase()} for $${pizzaExtras.glutenFreeCrust.price}. See <a href="/vegetarian-options/">all vegetarian options</a>.</p>
  ` : `
  ${cat.note ? `<p class="menu-note">${esc(cat.note)}</p>` : ""}
  ${(cat.items || []).map(item => `
    <article class="menu-item${item.signature ? " menu-item-signature" : ""}${item.image ? " menu-item-has-img" : ""}">
      ${item.image ? `<div class="menu-item-img"><img src="${item.image}" alt="${esc(item.name)} at TOPS Pizza" loading="lazy" /></div>` : ""}
      <div class="menu-item-body">
        <header class="menu-item-head">
          <h3>${item.signature ? "<span class=\"sig-mark\" title=\"Signature TOPS dish\">⭐</span> " : ""}${esc(item.name)}</h3>
          <span class="menu-item-price">$${esc(item.price)}</span>
        </header>
        <p class="menu-item-desc">${esc(item.description)}</p>
        ${item.addOns && item.addOns.length ? `<ul class="addons">
          ${item.addOns.map(a => `<li>+ ${esc(a.name)} <span>$${esc(a.price)}</span></li>`).join("")}
        </ul>` : ""}
      </div>
    </article>
  `).join("")}

  ${cat.slug === "appetizers" ? `
  <h2 style="margin-top:40px;">Wing Flavors (31)</h2>
  <p class="text-small">Pick any flavor when you order wings.</p>
  <h3 style="margin-top:18px;">Saucy</h3>
  <div class="flavor-pills">
    ${wingFlavors.saucy.map(f => `<span class="flavor-pill">${esc(f)}</span>`).join("")}
  </div>
  <h3 style="margin-top:18px;">Dry Rubs</h3>
  <div class="flavor-pills">
    ${wingFlavors.dry.map(f => `<span class="flavor-pill flavor-dry">${esc(f)}</span>`).join("")}
  </div>
  ` : ""}
  `}

  <h2>Order</h2>
  <p><a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a></p>
  <p>Or via <a href="${site.order.skipTheDishes}" rel="noopener">Skip</a>, <a href="${site.order.uberEats}" rel="noopener">Uber Eats</a>, <a href="${site.order.doorDash}" rel="noopener">DoorDash</a>.</p>
</section>
${isPizzas ? faqSection(vegFaqs) : ""}
`;
  return layout({ title, description, canonical, schemas, body });
};



// ============================================================
// PAGE: VEGETARIAN OPTIONS
// Built 2026-09-15. TripAdvisor users were asking whether TOPS has vegetarian
// food. It does, and the site never said so: "vegetarian" appeared only on
// /pizza-menu/ and the Vegetarian pizza's own page. Calgary demand, measured
// via DataForSEO 2026-09-15: "vegetarian restaurants calgary" 2,900/mo LOW
// competition, "vegetarian food near me" 1,000/mo LOW, "gluten free pizza
// calgary" 590/mo LOW.
//
// SAFETY RULES FOR THIS PAGE, people with dietary needs read it:
//  - Pizzas are DERIVED from allPizzas ingredients at build time, never a
//    hard-coded list, so the page cannot drift when Peter changes toppings.
//  - Sides use an EXPLICIT ALLOW-LIST of verified item names. A meat-word
//    blocklist was tried and wrongly cleared "Boneless Dry Ribs", "Greek
//    Mezedes" (AAA Top Sirloin) and a burger, because those are prose
//    descriptions. Do not switch this back to a blocklist.
//  - Poutine (gravy is typically beef-based) and Market Soup (changes daily)
//    are NOT listed as vegetarian. They are unconfirmed. Ask Peter.
//  - Caesar Salad and Potato Skins contain bacon and are called out as such.
// ============================================================
// VEG_MEAT_WORDS and isVegetarianPizza are defined once, near vegFaqs above.
const vegetarianPizzas = () => allPizzas.filter(isVegetarianPizza);

// Verified by reading each description in src/site.data.js on 2026-09-15.
const VEG_SIDE_NAMES = ["Bread Stix", "Onion Rings", "Nachos Supreme", "TOPS Greek Salad", "Tiramisu", "Blackout Torte"];

const vegetarianSides = () => {
  const out = [];
  for (const cat of menuCategories) {
    for (const item of cat.items || []) {
      if (VEG_SIDE_NAMES.includes(item.name)) out.push({ ...item, category: cat.name });
    }
  }
  return out;
};

const vegetarianPage = () => {
  const pizzas = vegetarianPizzas();
  const sides = vegetarianSides();
  const title = `Vegetarian Options in NW Calgary | TOPS Pizza & Sports Bar`;
  const description = `${pizzas.length} meat-free pizzas, a Greek salad, bread stix and more at TOPS Pizza & Sports Bar in Thorncliffe, NW Calgary. Gluten free crust available. Dine in, takeout or delivery.`;
  const canonical = `${site.url}/vegetarian-options/`;

  const schemas = [
    restaurantSchema(),
    {
      "@type": "MenuSection",
      "@id": `${canonical}#vegetarian`,
      "name": "Vegetarian Options",
      "description": description,
      "hasMenuItem": [
        ...pizzas.map((p) => ({
          "@type": "MenuItem",
          "name": `${p.name} Pizza`,
          "url": `${site.url}/${p.slug}/`,
          "description": p.ingredients.join(", "),
          "suitableForDiet": "https://schema.org/VegetarianDiet",
        })),
        ...sides.map((s) => ({
          "@type": "MenuItem",
          "name": s.name,
          "description": s.description,
          "suitableForDiet": "https://schema.org/VegetarianDiet",
        })),
      ],
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Menu", url: "/menu/" },
      { name: "Vegetarian Options", url: "/vegetarian-options/" },
    ]),
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">🥬 Meat-Free at TOPS</p>
    <h1>Vegetarian Options in NW Calgary</h1>
    <p class="lede">${pizzas.length} pizzas with no meat on them, plus salads, starters and desserts. Family recipe since ${site.yearFounded}, in Thorncliffe.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a>
      <a class="btn btn-secondary" href="/pizza-menu/">See the full pizza menu</a>
    </div>
  </div>
</section>

<section class="prose wrap">
  <p class="menu-note">Vegetarian, not vegan. Every pizza below has real cheese on it, and the Greek salad has feta. If you need dairy-free, call us and we will tell you honestly what we can and cannot do.</p>

  <h2>Meat-Free Pizzas (${pizzas.length})</h2>
  <p>All available Personal 8", Medium 10", Large 12" and Extra Large 14". <strong>Gluten free crust</strong> is available on ${pizzaExtras.glutenFreeCrust.availableOn.toLowerCase()} for $${pizzaExtras.glutenFreeCrust.price}.</p>

  <div class="pizza-grid">
    ${pizzas.map((p) => `
      <a class="pizza-card" href="/${p.slug}/">
        <div class="pizza-card-body">
          <h3>${p.signature ? "⭐ " : ""}${esc(p.name)}</h3>
          <p class="ingredients">${esc(p.ingredients.join(", "))}</p>
          <p class="menu-item-price">from $${esc(p.prices.personal)}</p>
        </div>
      </a>
    `).join("")}
  </div>

  <h2>Starters, Salads &amp; Desserts</h2>
  ${sides.map((item) => `
    <article class="menu-item${item.image ? " menu-item-has-img" : ""}">
      ${item.image ? `<div class="menu-item-img"><img src="${item.image}" alt="${esc(item.name)} at TOPS Pizza, NW Calgary" loading="lazy" /></div>` : ""}
      <div class="menu-item-body">
        <header class="menu-item-head">
          <h3>${esc(item.name)}</h3>
          <span class="menu-item-price">$${esc(item.price)}</span>
        </header>
        <p class="menu-item-desc">${esc(item.description)}</p>
      </div>
    </article>
  `).join("")}

  <p class="menu-note">Nachos Supreme comes vegetarian as listed. Ground beef is a paid add-on, so just do not add it.</p>

  <h2>Build Your Own</h2>
  <p>Any pizza can be made without meat, and extra vegetables are the same price as any other topping. Tell us what you want on it when you call.</p>
  <p>With a main, you can substitute a Greek Salad, Yam Fries or Onion Rings for $3.95.</p>

  <h2>Good To Know</h2>
  <p>Two dishes read vegetarian and are not. Our <strong>Caesar Salad</strong> has crispy bacon in it, and the <strong>Potato Skins</strong> are filled with bacon. Worth knowing before you order.</p>

  <h2>Order</h2>
  <p><a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a></p>
  <p>Or via <a href="${site.order.skipTheDishes}" rel="noopener">Skip</a>, <a href="${site.order.uberEats}" rel="noopener">Uber Eats</a>, <a href="${site.order.doorDash}" rel="noopener">DoorDash</a>.</p>
</section>
${faqSection(vegFaqs)}
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: FAQ
// /faq/ returned 404 until 2026-09-15. The seven homepage questions existed
// only on the homepage. This gives them a real page and adds the dietary
// questions people were asking on TripAdvisor.
// ============================================================
const faqPage = () => {
  const faqs = [...homeFaqs, ...vegFaqs];
  const title = `Frequently Asked Questions | TOPS Pizza & Sports Bar`;
  const description = `Hours, delivery areas, vegetarian and gluten free options, ordering and the sports bar at TOPS Pizza & Sports Bar in Thorncliffe, NW Calgary.`;
  const canonical = `${site.url}/faq/`;
  const schemas = [
    restaurantSchema(),
    faqPageSchema(faqs),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "FAQ", url: "/faq/" },
    ]),
  ];
  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Questions</p>
    <h1>Frequently Asked Questions</h1>
    <p class="lede">The things people ask us most. If your question is not here, call us at ${esc(site.nap.phoneDisplay)} and a person will answer.</p>
  </div>
</section>
${faqSection(faqs, "")}
<section class="prose wrap">
  <h2>Still Stuck?</h2>
  <p><a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a> or see the <a href="/menu/">full menu</a>, <a href="/vegetarian-options/">vegetarian options</a>, or <a href="/delivery/">delivery areas</a>.</p>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: DELIVERY LANDING (lists all 20 NW Calgary neighborhoods)
// ============================================================
const deliveryLandingPage = () => {
  const title = `Delivery Areas, TOPS Pizza & Sports Bar NW Calgary`;
  const description = `TOPS Pizza & Sports Bar delivers to ${allNeighborhoods.length}+ NW Calgary neighborhoods including Thorncliffe, Huntington Hills, Highland Park, Beddington Heights, and more. In-house driver, hot delivery.`;
  const canonical = `${site.url}/delivery/`;
  const schemas = [
    restaurantSchema(),
    {
      "@type": "Service",
      "@id": `${canonical}#delivery-area`,
      "name": "Pizza Delivery, NW Calgary",
      "description": description,
      "provider": { "@id": `${site.url}/#restaurant` },
      "serviceType": "Food delivery",
      "areaServed": allNeighborhoods.map(n => ({
        "@type": "Place",
        "name": `${n.name}, Calgary, AB`,
      }))
    },
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Delivery Areas", url: "/delivery/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">${allNeighborhoods.length} NW Calgary Neighborhoods</p>
    <h1>We Deliver Across NW Calgary</h1>
    <p class="lede">${site.yearsServing} years of TOPS regulars, from Thorncliffe to Beddington, Banff Trail to Balmoral. Phone orders go to our in-house driver. Apps available too.</p>
    <div class="hero-cta">
      <a class="btn btn-primary" href="tel:${site.nap.phone}">Call ${esc(site.nap.phoneDisplay)}</a>
      <a class="btn btn-secondary" href="${site.order.skipTheDishes}" rel="noopener">Order via Skip</a>
    </div>
  </div>
</section>

<section class="prose wrap">
  <h2>Pick Your Neighborhood</h2>
  <p>Each neighborhood page has its own delivery details, landmarks we deliver near, and (where applicable) the signature TOPS pizza named after it.</p>
  <div class="pizza-grid tight">
    ${allNeighborhoods.map(nh => `
      <a class="pizza-card" href="/${nh.slug}/">
        <div class="pizza-card-body">
          <h3>${esc(nh.name)}</h3>
          <p class="ingredients">${esc(nh.crossStreets || "NW Calgary")}</p>
          ${nh.deliveryEta ? `<p class="neighborhood">${esc(nh.deliveryEta)} delivery</p>` : ""}
        </div>
      </a>
    `).join("")}
  </div>

  <h2>Our Service Area</h2>
  <p>Most NW Calgary pockets bounded roughly by Country Hills Blvd to the north, Centre St N to the east, 16 Ave N to the south, and Crowchild Trail to the west, give or take a few neighborhoods on each edge.</p>
  <div class="map-embed">
    <iframe src="https://www.google.com/maps/d/embed?mid=1Xf1OXWceyyM18AkDkbfjN11Z5P3PJSc&amp;ehbc=2E312F" loading="lazy" title="TOPS Pizza service area map"></iframe>
  </div>

  <h2>How To Order</h2>
  <p><strong>Phone (recommended):</strong> <a href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a>, straight to our in-house driver.</p>
  <p><strong>Apps:</strong> <a href="${site.order.skipTheDishes}" rel="noopener">Skip the Dishes</a>, <a href="${site.order.uberEats}" rel="noopener">Uber Eats</a>, <a href="${site.order.doorDash}" rel="noopener">DoorDash</a>.</p>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: REVIEW LANDING (QR-code destination)
// Parallel paths, Google review vs private feedback. No sentiment gate.
// Policy-compliant per Google's contributor policies.
// ============================================================
const reviewLandingPage = () => {
  const title = `Leave a Review, TOPS Pizza & Sports Bar`;
  const description = `Help TOPS Pizza & Sports Bar, leave a quick Google review, or share private feedback with the owners.`;
  const canonical = `${site.url}/review/`;
  const schemas = [
    restaurantSchema(),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Leave a Review", url: "/review/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Thank You for Visiting</p>
    <h1>How Was Your Visit?</h1>
    <p class="lede">A 30-second review keeps a 50-year family business cooking. Pick whichever feels right.</p>
  </div>
</section>

<section class="review-funnel wrap">
  ${/* Mobile only. On a phone the second card sits below the fold, so a visitor can miss
       that there IS a choice (Steve, 2026-09-16). On desktop both cards are visible side
       by side at once, so the same shortcut would just be noise: hence display:none until
       720px. These link straight to the destinations rather than anchoring down to the
       cards, which saves a tap. */''}
  <p class="choose-row">
    <span class="choose-label">Choose one:</span>
    <a href="${site.nap.googleReviewUrl}" target="_blank" rel="noopener">⭐ Google review</a>
    <a href="/review/feedback/">💬 Private feedback</a>
  </p>

  <div class="review-paths">
    <a class="path-card path-google" href="${site.nap.googleReviewUrl}" target="_blank" rel="noopener">
      <div class="path-icon star-row" aria-hidden="true"><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span><span>⭐</span></div>
      <h2>Post a Photo Review on Google</h2>
      <p>Takes 30 seconds. Helps new customers find us in NW Calgary search.</p>
      <p class="tip">📸 <em>If you took a photo of your food, add it. Reviews with a picture are the ones people actually stop and read.</em></p>
      <span class="path-cta">Write My Review →</span>
    </a>

    <a class="path-card path-feedback" href="/review/feedback/">
      <div class="path-icon" aria-hidden="true">💬</div>
      <h2>Give Private Feedback</h2>
      <p>Tell Jim and the family directly, what worked, what didn’t, what we can do better.</p>
      <p class="tip">📩 <em>Goes straight to the owners, not public.</em></p>
      <span class="path-cta">Open Form →</span>
    </a>
  </div>

  <p class="review-fineprint">Both options are equally welcome. We read every word, public reviews help us grow, and private feedback helps us improve.</p>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: REVIEW FEEDBACK FORM (private)
// Posts to /api/feedback → Cloudflare Pages Function → GHL webhook
// ============================================================
const reviewFeedbackPage = () => {
  const title = `Send Private Feedback, TOPS Pizza & Sports Bar`;
  const description = `Share private feedback with the owners of TOPS Pizza & Sports Bar in NW Calgary. We read every message.`;
  const canonical = `${site.url}/review/feedback/`;
  const schemas = [
    restaurantSchema(),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Leave a Review", url: "/review/" },
      { name: "Private Feedback", url: "/review/feedback/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Private, Goes Straight to the Owners</p>
    <h1>Tell Us What Happened</h1>
    <p class="lede">Jim, Kristina, and Peter read every message. Anonymous is fine. The more honest you are, the more useful it is.</p>
  </div>
</section>

<section class="prose wrap" style="max-width:640px;">
  <form id="feedback-form" class="feedback-form" action="/api/feedback" method="POST" novalidate>
    ${/* The CASL disclosure used to sit here too. Removed 2026-09-16 on Steve's note that
         once is enough. It is NOT gone from the page: the same frequency + STOP language
         lives on the sms_optin checkbox below, which is the actual point of consent and
         where CASL wants it. Do not delete that one. */''}
    <input type="text" name="company" class="honeypot" tabindex="-1" autocomplete="off" />

    <label>
      <span class="field-label">What brought you in?</span>
      <select name="visit_reason">
        <option value="">Choose one, optional</option>
        <option value="friends">Out with friends</option>
        <option value="date">Date night</option>
        <option value="game">To watch a game</option>
        <option value="family">Family dinner</option>
        <option value="team">With a team or group</option>
        <option value="pool">Pool and the lounge</option>
        <option value="vlts">The VLTs</option>
        <option value="takeout">Takeout or delivery</option>
        <option value="other">Something else</option>
      </select>
    </label>

    <label>
      <span class="field-label">How was your visit overall?</span>
      <div class="sentiment-row">
        <label class="sentiment"><input type="radio" name="sentiment" value="great" /><span>😀 Great</span></label>
        <label class="sentiment"><input type="radio" name="sentiment" value="ok" /><span>🙂 OK</span></label>
        <label class="sentiment"><input type="radio" name="sentiment" value="meh" /><span>😐 Meh</span></label>
        <label class="sentiment"><input type="radio" name="sentiment" value="bad" /><span>😞 Bad</span></label>
      </div>
    </label>

    <fieldset class="rating-block">
      <legend>Three quick ones</legend>

      <div class="rating-row">
        <span class="field-label">The food</span>
        <div class="rating-opts">
          <label><input type="radio" name="rating_food" value="great" /><span>😀 Great</span></label>
          <label><input type="radio" name="rating_food" value="ok" /><span>🙂 OK</span></label>
          <label><input type="radio" name="rating_food" value="meh" /><span>😐 Meh</span></label>
          <label><input type="radio" name="rating_food" value="bad" /><span>😞 Bad</span></label>
        </div>
      </div>

      <div class="rating-row">
        <span class="field-label">The service</span>
        <div class="rating-opts">
          <label><input type="radio" name="rating_service" value="great" /><span>😀 Great</span></label>
          <label><input type="radio" name="rating_service" value="ok" /><span>🙂 OK</span></label>
          <label><input type="radio" name="rating_service" value="meh" /><span>😐 Meh</span></label>
          <label><input type="radio" name="rating_service" value="bad" /><span>😞 Bad</span></label>
        </div>
      </div>

      <div class="rating-row">
        <span class="field-label">Delivery, if you ordered in</span>
        <div class="rating-opts">
          <label><input type="radio" name="rating_delivery" value="great" /><span>😀 Great</span></label>
          <label><input type="radio" name="rating_delivery" value="ok" /><span>🙂 OK</span></label>
          <label><input type="radio" name="rating_delivery" value="meh" /><span>😐 Meh</span></label>
          <label><input type="radio" name="rating_delivery" value="bad" /><span>😞 Bad</span></label>
          ${/* "Didn't" stays plain on purpose. It is not a rating, it means the question did
               not apply, so a face would imply a sentiment the answer does not carry. */''}
          <label><input type="radio" name="rating_delivery" value="na" /><span>Didn't</span></label>
        </div>
      </div>

      <p class="rating-note">Delivery through Skip, Uber or DoorDash is their driver, not our kitchen. Telling us here is the only way we find out.</p>
    </fieldset>

    <label>
      <span class="field-label">How long did you wait?</span>
      <input type="text" name="wait_time" placeholder="Optional, roughly. e.g. about 20 minutes" />
    </label>

    <label>
      <span class="field-label">What did we get right?</span>
      <textarea name="went_well" rows="3" placeholder="Optional. Even one thing helps us know what to keep doing."></textarea>
    </label>

    <label>
      <span class="field-label">What happened? <em>(required)</em></span>
      <textarea name="story" rows="5" required placeholder="The food, the service, the wait, the atmosphere, whatever stood out."></textarea>
    </label>

    <label>
      <span class="field-label">If it wasn't a 5-star experience, how could we make the next one better?</span>
      <textarea name="fix" rows="3" placeholder="Optional. Even a one-line suggestion helps."></textarea>
    </label>

    <fieldset class="contact-fields">
      <legend>Want a response from us? <em>(optional)</em></legend>
      <label>
        <span class="field-label">Your name</span>
        <input type="text" name="name" autocomplete="name" />
      </label>
      <label>
        <span class="field-label">Email</span>
        <input type="email" name="email" autocomplete="email" />
      </label>
      <label>
        <span class="field-label">Phone</span>
        <input type="tel" name="phone" autocomplete="tel" />
      </label>
    </fieldset>

    ${/* The thank-you COUPON offer was retired 2026-06-15 and the code path that issued
         one only ever fired from /review/bonus/, which is now just a redirect. So this
         checkbox promised customers something that could never arrive, for three months.
         Reworded to what the opt-in actually does: let Peter reply. Do not re-add a
         coupon promise unless the issuing path is live again AND Peter is offering one.
         Steve, 2026-09-15: "We can't offer any incentives anymore. He doesn't really
         want to." Google also prohibits incentives for reviews outright. */''}
    <label class="checkbox-row">
      <input type="checkbox" name="sms_optin" value="yes" />
      <span>📱 <strong>OK to text me back</strong> about this, if a reply is easier than email (1 to 2 messages a month at most, reply STOP any time). Uses the number above.</span>
    </label>

    <button type="submit" class="btn btn-primary">Send Feedback</button>
    <p class="form-status" id="form-status" role="status" aria-live="polite"></p>
  </form>
</section>

<script>
  (function(){
    const form = document.getElementById('feedback-form');
    const status = document.getElementById('form-status');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (form.company.value) return; // honeypot
      status.textContent = 'Sending…';
      status.className = 'form-status sending';
      const data = Object.fromEntries(new FormData(form));
        data.type = 'feedback';
      try {
        const res = await fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          window.location = '/review/thanks/';
        } else {
          const err = await res.text();
          status.textContent = 'Hmm, something went wrong. You can also call us at ${site.nap.phoneDisplay}.';
          status.className = 'form-status error';
        }
      } catch (err) {
        status.textContent = 'Network error, try again, or call us at ${site.nap.phoneDisplay}.';
        status.className = 'form-status error';
      }
    });
  })();
</script>
`;
  return layout({ title, description, canonical, schemas, body });
};


// ============================================================
// PAGE: REVIEW BONUS (intermediate step before bouncing to Google)
// Soft-tied "thanks for visiting" coupon, frames it as gratitude
// for the visit, not payment for the review. Email is optional.
// ============================================================
// NOTE (2026-06-15): the thank-you COUPON offer is retired (owner not offering a
// discount yet, pending price/terms review with their accountant). This page is kept
// only as a redirect so any printed/cached /review/bonus/ links land on the new
// two-option review page (5-star Google review OR private feedback).
const reviewBonusPage = () => {
  const title = `Leave a Review, TOPS Pizza & Sports Bar`;
  const description = `Leave a 5-star Google review or send private feedback to TOPS Pizza & Sports Bar.`;
  const canonical = `${site.url}/review/`;
  const schemas = [];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">One sec…</p>
    <h1>Taking you to our review page</h1>
    <p class="lede">If you’re not redirected, <a class="text-link" href="/review/">tap here</a>.</p>
  </div>
</section>
<script>window.location.replace('/review/');</script>
`;
  return layout({ title, description, canonical, schemas, body });
};

const _reviewBonusPage_RETIRED = () => {
  const title = `Thanks for Visiting, TOPS Pizza & Sports Bar`;
  const description = `Quick stop on the way to Google, drop your email for a thank-you coupon, then head over to leave your review.`;
  const canonical = `${site.url}/review/bonus/`;
  const schemas = [
    restaurantSchema(),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Leave a Review", url: "/review/" },
      { name: "Thank You", url: "/review/bonus/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Thanks for Visiting</p>
    <h1>One Quick Thing Before You Go</h1>
    <p class="lede">Drop your mobile number and we’ll <strong>text you a thank-you coupon</strong> for your next visit, for your next visit. Or skip ahead to Google.</p>
  </div>
</section>

<section class="prose wrap" style="max-width:520px;">
  <form id="bonus-form" class="feedback-form" action="/api/feedback" method="POST" novalidate>
    <p class="casl-note">By submitting, you consent to receive SMS or email from TOPS Pizza &amp; Sports Bar. Frequency: 1 to 2 messages/month. Reply STOP to unsubscribe. Standard message and data rates may apply.</p>
    <input type="text" name="company" class="honeypot" tabindex="-1" autocomplete="off" />
    <input type="hidden" name="type" value="reviewer-thanks" />

    <label>
      <span class="field-label">First name</span>
      <input type="text" name="name" autocomplete="given-name" placeholder="Your first name" />
    </label>

    <label>
      <span class="field-label">Mobile number <em>(we’ll text the coupon)</em></span>
      <input type="tel" name="phone" autocomplete="tel" placeholder="(403) 555-1234" />
    </label>

    <label>
      <span class="field-label">Or email <em>(optional)</em></span>
      <input type="email" name="email" autocomplete="email" placeholder="you@example.com" />
    </label>

    <label class="checkbox-row">
      <input type="checkbox" name="sms_optin" value="yes" checked />
      <span>📱 <strong>Text me my coupon</strong> + occasional pub-special updates (max 1 to 2/month). Standard message rates apply. Reply <strong>STOP</strong> to opt out anytime.</span>
    </label>

    <button type="submit" class="btn btn-primary" id="bonus-submit">Text Me My Coupon → Open Google</button>
    <p class="form-status" id="bonus-status" role="status" aria-live="polite"></p>
  </form>

  <p class="review-fineprint" style="text-align:left;">
    <a class="text-link" href="${site.nap.googleReviewUrl}" target="_blank" rel="noopener">Skip and just open Google →</a><br/>
    <em>No problem, the coupon offer stays open for next time.</em>
  </p>
</section>

<script>
  (function(){
    const form = document.getElementById('bonus-form');
    const status = document.getElementById('bonus-status');
    const submit = document.getElementById('bonus-submit');
    const GOOGLE_URL = '${site.nap.googleReviewUrl}';
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      if (form.company.value) return;
      status.textContent = 'Opening Google…';
      status.className = 'form-status sending';
      submit.disabled = true;
      const data = Object.fromEntries(new FormData(form));
      // Open Google NOW, synchronously, while the click's user activation is still
      // valid. window.open() after an "await" gets popup-blocked by browsers, so the
      // review tab never opened, that was the bug.
      const gtab = window.open(GOOGLE_URL, '_blank', 'noopener');
      // Fire the coupon submit; keepalive lets it finish even as we navigate away.
      try {
        fetch('/api/feedback', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data),
          keepalive: true
        });
      } catch (err) {
        // Opt-in form: a failed submit shouldn't block the review flow.
      }
      // If the popup was still blocked, send THIS tab to Google so the review happens.
      if (!gtab) { window.location = GOOGLE_URL; return; }
      window.location = '/review/thanks/?from=bonus';
    });
  })();
</script>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: REVIEW THANKS (after form submission)
// ============================================================
const reviewThanksPage = () => {
  const title = `Thanks, TOPS Pizza & Sports Bar`;
  const description = `Thanks for your feedback. We read every message.`;
  const canonical = `${site.url}/review/thanks/`;
  const schemas = [
    restaurantSchema(),
    breadcrumbSchema([
      { name: "Home", url: "/" },
      { name: "Leave a Review", url: "/review/" },
      { name: "Thanks", url: "/review/thanks/" }
    ])
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow" id="thanks-eyebrow">Message Received</p>
    <h1 id="thanks-heading">Thanks, We Got It.</h1>
    <p class="lede" id="thanks-lede">Jim, Kristina, and Peter will read it personally. If you left contact info and want a response, we’ll be in touch.</p>
  </div>
</section>

<section class="prose wrap">
  <div id="from-feedback">
    <h2>One More Thing</h2>
    <p>If you’re also up for a public Google review, that’s the single biggest favor you can do for a 50-year family business. New customers really do read them before deciding where to order. If you have a photo of your food, add it, those are the ones people stop on.</p>
    <p><a class="btn btn-primary" href="${site.nap.googleReviewUrl}" target="_blank" rel="noopener">Write a Google Review</a></p>
  </div>
</section>
`;
  return layout({ title, description, canonical, schemas, body });
};

// ============================================================
// PAGE: STAFF COUPON REDEEM (/redeem/), private (noindex), no PIN
// Staff type a coupon code -> validate against D1 -> mark redeemed ->
// auto thank-you SMS to the customer. Shows the offer terms.
// ============================================================
const reviewRedeemPage = () => {
  const title = `Redeem Coupon, TOPS Pizza & Sports Bar (Staff)`;
  const description = `Staff tool: redeem a customer's $5 coupon.`;
  const canonical = `${site.url}/redeem/`;
  const schemas = [];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Staff Tool</p>
    <h1>Redeem a Coupon</h1>
    <p class="lede">Type the code from the customer's text and tap Redeem. They'll get an automatic thank-you text.</p>
  </div>
</section>

<section class="prose wrap" style="max-width:520px;">
  <form id="redeem-form" onsubmit="return false;">
    <label>
      <span class="field-label">Coupon code</span>
      <input type="text" id="redeem-code" autocomplete="off" autocapitalize="characters" spellcheck="false"
        placeholder="TOPS-XXXX" style="text-transform:uppercase;font-size:22px;letter-spacing:2px;text-align:center;" />
    </label>
    <button type="submit" class="btn btn-primary" id="redeem-btn" style="width:100%;">Check &amp; Redeem</button>
  </form>

  <div id="redeem-result" style="margin-top:20px;padding:18px;border-radius:12px;display:none;font-size:17px;"></div>

  <div class="casl-note" style="margin-top:24px;">
    <strong>Offer terms:</strong> $5 off a minimum $25 order. Not valid on wing nights or in combination with other specials/offers. One-time use.
  </div>
</section>

<script>
  (function(){
    var form = document.getElementById('redeem-form');
    var input = document.getElementById('redeem-code');
    var btn = document.getElementById('redeem-btn');
    var result = document.getElementById('redeem-result');
    function show(bg, color, html){
      result.style.display = 'block';
      result.style.background = bg;
      result.style.color = color;
      result.innerHTML = html;
    }
    form.addEventListener('submit', async function(){
      var code = (input.value || '').trim().toUpperCase();
      if (!code) { input.focus(); return; }
      btn.disabled = true; btn.textContent = 'Checking…';
      show('#f4f4f4', '#333', 'Checking…');
      try {
        var res = await fetch('/api/redeem', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ code: code })
        });
        var d = await res.json();
        if (d.ok && d.status === 'redeemed') {
          show('#e6f7e9', '#11631f', '✅ <strong>' + (d.amount || '$5') + ' redeemed' + (d.firstName ? ' for ' + d.firstName : '') + '.</strong><br/>Apply $5 off (min $25, not wing nights). ' + (d.smsSent ? 'Thank-you text sent. 📱' : ''));
          input.value = '';
        } else if (d.status === 'already_redeemed') {
          show('#fde8e8', '#9b1c1c', '⛔ <strong>Already redeemed.</strong>' + (d.redeemedAt ? '<br/>Used on ' + d.redeemedAt : '') + '<br/>Do not apply the discount.');
        } else {
          show('#fff7e6', '#8a5a00', '⚠️ <strong>' + (d.message || 'Code not found.') + '</strong><br/>Do not apply the discount.');
        }
      } catch (e) {
        show('#fde8e8', '#9b1c1c', '⚠️ Network error, try again.');
      } finally {
        btn.disabled = false; btn.textContent = 'Check & Redeem';
      }
    });
  })();
</script>
`;
  const html = layout({ title, description, canonical, schemas, body });
  return html.replace(
    '<meta name="viewport"',
    '<meta name="robots" content="noindex, nofollow" />\n<meta name="viewport"'
  );
};


// ============================================================
// PAGE: OWNER UPDATE PORTAL (/owner/)
// Lightweight form for the owner to request site changes.
// Text input + Web Speech API voice input (browser-native, no API key).
// Auth: protected by Cloudflare Access at the /owner/* path (configure in CF dashboard).
// ============================================================
const ownerPortalPage = () => {
  const title = `Owner Portal, TOPS Pizza`;
  const description = `Request changes to topspizza.ca, for the owners.`;
  const canonical = `${site.url}/owner/`;
  const schemas = [
    // No SEO schema, this is a private internal page. Include noindex meta in template.
  ];

  const body = `
<section class="hero hero-page">
  <div class="wrap">
    <p class="eyebrow">Internal, TOPS Owners Only</p>
    <h1>Request a Site Change</h1>
    <p class="lede">Type or speak what you want changed. Steve gets a text message right away, makes the change, and pushes it live, usually same day for small things.</p>
  </div>
</section>

<section class="prose wrap" style="max-width:680px;">
  <form id="owner-form" class="feedback-form" method="POST" novalidate>

    <label>
      <span class="field-label">What kind of change?</span>
      <select name="category" required>
        <option value="specials">Daily special (Monday/Tuesday/etc)</option>
        <option value="menu">Menu item (pizza, wings, etc)</option>
        <option value="hours">Hours change</option>
        <option value="content">Other page content (about, sports bar, etc)</option>
        <option value="photo">Photo update</option>
        <option value="other">Something else</option>
      </select>
    </label>

    <label>
      <span class="field-label">How urgent?</span>
      <div class="sentiment-row">
        <label class="sentiment"><input type="radio" name="urgency" value="low" checked /><span>📝 Whenever</span></label>
        <label class="sentiment"><input type="radio" name="urgency" value="medium" /><span>⚠️ This week</span></label>
        <label class="sentiment"><input type="radio" name="urgency" value="high" /><span>🚨 ASAP</span></label>
      </div>
    </label>

    <label>
      <span class="field-label">What do you want changed?</span>
      <textarea name="request_text" id="request-text" rows="8" required placeholder="e.g. Monday special is now half-price wings 5 to 8 PM. Or: change Tuesday night football special wording. Or: add a new pizza called The Olympian, feta, kalamata, gyro meat, tzatziki drizzle."></textarea>
      <button type="button" id="voice-btn" class="btn btn-secondary" style="margin-top:8px; align-self:flex-start; color:var(--black); border-color:var(--gold);">
        🎤 Or tap to speak instead
      </button>
      <span id="voice-status" class="text-small" style="margin-top:4px;"></span>
    </label>

    <button type="submit" class="btn btn-primary">Send Request to Steve</button>
    <p class="form-status" id="owner-status" role="status" aria-live="polite"></p>
  </form>

  <div style="margin-top:40px; padding:20px; background:var(--cream); border-radius:8px;">
    <h3 style="margin-bottom:8px;">Tips for fast turnaround</h3>
    <ul style="margin-bottom:0; font-size:14px; color:var(--grey-700);">
      <li>Be specific: "change Monday special to 'half price wings 5 to 8 PM, dine-in only'" beats "update Monday special".</li>
      <li>For menu items: include the full name, ingredients, and what makes it special.</li>
      <li>For hours: list the day(s) and the exact new opening / closing time.</li>
      <li>For photos: use the photo-upload section below, much easier than texting Steve.</li>
    </ul>
  </div>
</section>

<section class="hero hero-page" style="background: var(--black); padding: 50px 0 30px;">
  <div class="wrap">
    <p class="eyebrow">Photo Upload</p>
    <h2 style="color: var(--white); font-size: 32px;">Send Us a Photo</h2>
    <p class="lede">Just took a photo of a pizza, a meal, the bar, or anything else? Drop it here with a name. Steve gets the file, wires it into the right spot on the site, you don't have to think about it.</p>
  </div>
</section>

<section class="prose wrap" style="max-width:680px;">
  <form id="photo-form" class="feedback-form" method="POST" enctype="multipart/form-data" novalidate>

    <label>
      <span class="field-label">What is this a photo of?</span>
      <input type="text" name="item_name" required placeholder="e.g. TOPS Original pizza, Sports bar interior, Caesar salad" />
    </label>

    <label>
      <span class="field-label">Photo file <em>(max 15 MB; iPhone HEIC, JPG, or PNG all work)</em></span>
      <input type="file" name="file" accept="image/*" required style="padding: 8px; background: var(--cream);" />
    </label>

    <label>
      <span class="field-label">Notes <em>(optional, anything Steve should know about this photo?)</em></span>
      <textarea name="notes" rows="3" placeholder="e.g. 'New menu item we're adding', 'Replace the existing Hawaiian photo', 'For the homepage hero'"></textarea>
    </label>

    <button type="submit" class="btn btn-primary">Upload Photo</button>
    <p class="form-status" id="photo-status" role="status" aria-live="polite"></p>
  </form>

  <div style="margin-top:32px; padding:18px 22px; background:var(--cream); border-radius:8px;">
    <h3 style="margin-bottom:8px; font-size:16px;">What happens after you upload</h3>
    <ol style="margin-bottom:0; font-size:14px; color:var(--grey-700); padding-left:20px;">
      <li>The photo lands on the TOPS server (Cloudflare R2)</li>
      <li>Steve gets a text with the photo name + a link to view it</li>
      <li>Steve confirms it looks right, then wires it into the matching page on the site</li>
      <li>Usually same-day or next-day depending on Steve's schedule</li>
    </ol>
  </div>
</section>

<script>
  (function(){
    const form = document.getElementById('owner-form');
    const status = document.getElementById('owner-status');
    const textarea = document.getElementById('request-text');
    const voiceBtn = document.getElementById('voice-btn');
    const voiceStatus = document.getElementById('voice-status');

    // Form submit
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      status.textContent = 'Sending…';
      status.className = 'form-status sending';
      const data = Object.fromEntries(new FormData(form));
      try {
        const res = await fetch('/api/owner-request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(data)
        });
        if (res.ok) {
          const json = await res.json();
          status.textContent = 'Sent! Steve got the notification. Request #' + (json.requestId || '?');
          status.className = 'form-status';
          form.reset();
        } else {
          status.textContent = 'Something went wrong. Try again or text Steve directly.';
          status.className = 'form-status error';
        }
      } catch (err) {
        status.textContent = 'Network error. Try again or text Steve directly.';
        status.className = 'form-status error';
      }
    });

    // Web Speech API for voice input, browser-native, no API key
    const Speech = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!Speech) {
      voiceBtn.disabled = true;
      voiceStatus.textContent = 'Voice input not supported in this browser. Try Chrome or Safari.';
    } else {
      let recognition = null;
      let listening = false;
      voiceBtn.addEventListener('click', () => {
        if (listening) {
          recognition && recognition.stop();
          return;
        }
        recognition = new Speech();
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-CA';
        let finalText = textarea.value;
        recognition.onresult = (e) => {
          let interim = '';
          for (let i = e.resultIndex; i < e.results.length; i++) {
            if (e.results[i].isFinal) finalText += (finalText ? ' ' : '') + e.results[i][0].transcript;
            else interim += e.results[i][0].transcript;
          }
          textarea.value = finalText + (interim ? ' ' + interim : '');
        };
        recognition.onstart = () => {
          listening = true;
          voiceBtn.textContent = '⏹ Tap to stop';
          voiceStatus.textContent = 'Listening… speak naturally.';
        };
        recognition.onerror = (e) => {
          voiceStatus.textContent = 'Voice error: ' + e.error + '. Type instead.';
        };
        recognition.onend = () => {
          listening = false;
          voiceBtn.textContent = '🎤 Or tap to speak instead';
          if (voiceStatus.textContent.startsWith('Listening')) voiceStatus.textContent = '';
        };
        recognition.start();
      });
    }

    // === Photo upload form ===
    const photoForm = document.getElementById('photo-form');
    const photoStatus = document.getElementById('photo-status');
    if (photoForm) {
      photoForm.addEventListener('submit', async (e) => {
        e.preventDefault();
        const fileInput = photoForm.querySelector('input[name="file"]');
        if (!fileInput.files[0]) {
          photoStatus.textContent = 'Pick a photo first.';
          photoStatus.className = 'form-status error';
          return;
        }
        const fileSize = fileInput.files[0].size;
        if (fileSize > 15 * 1024 * 1024) {
          photoStatus.textContent = 'File is too big, max 15 MB. Try a smaller photo.';
          photoStatus.className = 'form-status error';
          return;
        }
        photoStatus.textContent = 'Uploading… (' + Math.round(fileSize / 1024) + ' KB)';
        photoStatus.className = 'form-status sending';
        const fd = new FormData(photoForm);
        try {
          const res = await fetch('/api/owner-photo', { method: 'POST', body: fd });
          if (res.ok) {
            const json = await res.json();
            photoStatus.textContent = 'Sent! Steve got the notification. Photo #' + (json.photoId || '?') + '. You can upload another or close this page.';
            photoStatus.className = 'form-status';
            photoForm.reset();
          } else {
            const err = await res.json().catch(() => ({}));
            photoStatus.textContent = 'Upload failed: ' + (err.error || 'unknown error') + '. Try again or text Steve directly.';
            photoStatus.className = 'form-status error';
          }
        } catch (err) {
          photoStatus.textContent = 'Network error during upload. Try again.';
          photoStatus.className = 'form-status error';
        }
      });
    }
  })();
</script>
`;

  // Owner page is private, explicitly noindex
  const html = layout({ title, description, canonical, schemas, body });
  return html.replace(
    '<meta name="viewport"',
    '<meta name="robots" content="noindex, nofollow" />\n<meta name="viewport"'
  );
};

// ============================================================
// CSS (single file, hand-written, no build dependency)
// ============================================================
// cssVersion: content hash of the stylesheet, appended to its <link href> so the URL
// changes whenever the CSS changes. Cloudflare Pages serves /assets/* with
// `cache-control: public, max-age=14400`, so without this a returning visitor keeps the
// OLD stylesheet for up to FOUR HOURS after a deploy. Steve hit exactly that on
// 2026-09-15: the layout change was live on the origin and invisible in his browser.
//
// Note to future me: every verification that day appended ?cb=<timestamp> to the URL,
// which bypasses the very cache being tested. That proved the origin correct and proved
// nothing about what a real visitor sees. Verify WITHOUT a cache buster.
//
// Safe despite being defined after layout() (line ~207): layout() is an arrow function
// that is only INVOKED from the writePage block further down, long after this runs.
// The declaration itself lives AFTER the css literal closes, because hashing `css`
// before its own `const` initialises throws a temporal-dead-zone ReferenceError.
const css = `
:root {
  /* TOPS brand palette, gold on black, matching the existing logo */
  --gold: #E8B23A;
  --gold-bright: #F5C84A;
  --gold-dark: #B88823;
  --black: #0A0A0A;
  --black-soft: #1A1A1A;
  --grey-900: #2D2D2D;
  --grey-700: #4A4A4A;
  --grey-500: #777;
  --grey-300: #C0C0C0;
  --grey-100: #EEE;
  --cream: #FBF6EE;
  --white: #fff;
  /* Aliases so existing rules don't break */
  --red: var(--gold);
  --red-dark: var(--gold-dark);
}
* { box-sizing: border-box; margin: 0; padding: 0; }
html { scroll-behavior: smooth; }
body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; color: var(--grey-900); background: var(--cream); line-height: 1.55; -webkit-font-smoothing: antialiased; }
.wrap { max-width: 1140px; margin: 0 auto; padding: 0 24px; }

/* Header */
.site-header { background: var(--black); color: var(--white); position: sticky; top: 0; z-index: 50; box-shadow: 0 2px 8px rgba(0,0,0,.15); }
.site-header .nav { display: flex; align-items: center; justify-content: space-between; padding: 14px 24px; gap: 16px; flex-wrap: wrap; }
.logo { display: flex; align-items: center; gap: 10px; color: var(--white); text-decoration: none; font-weight: 900; }
.logo-mark { background: var(--red); color: var(--white); width: 40px; height: 40px; border-radius: 6px; display: grid; place-items: center; font-size: 22px; font-weight: 900; letter-spacing: -1px; }
.logo-text { font-size: 18px; line-height: 1; letter-spacing: 1px; }
.logo-text small { font-size: 10px; font-weight: 500; opacity: .7; letter-spacing: 1.5px; }
.primary-nav { display: flex; gap: 22px; flex-wrap: wrap; }
.primary-nav a { color: var(--white); text-decoration: none; font-size: 15px; font-weight: 500; opacity: .9; transition: opacity .15s; }
.primary-nav a:hover { opacity: 1; color: var(--gold); }
.order-cta { background: var(--gold); color: var(--black); text-decoration: none; padding: 10px 18px; border-radius: 6px; font-weight: 700; font-size: 15px; transition: background .15s; }
.order-cta:hover { background: var(--gold-bright); }
.order-cta .cta-label { opacity: .75; font-weight: 500; }
.logo img { display: block; height: 56px; width: auto; max-width: 140px; }

/* Hero */
.hero { background: var(--black); color: var(--white); padding: 90px 0 70px; position: relative; overflow: hidden; }
.hero.has-bg { background-size: cover; background-position: center; }
.hero.has-bg::before { content: ""; position: absolute; inset: 0; background: linear-gradient(135deg, rgba(10,10,10,.88) 0%, rgba(10,10,10,.72) 50%, rgba(10,10,10,.55) 100%); z-index: 1; }
.hero.has-bg .wrap { position: relative; z-index: 2; }
.hero::after { content: ""; position: absolute; right: -100px; top: -50px; width: 400px; height: 400px; background: radial-gradient(circle, var(--gold) 0%, transparent 70%); opacity: .15; z-index: 1; }
.hero-home { padding: 130px 0 110px; }
.hero-page { padding: 80px 0 60px; }
.eyebrow { color: var(--gold); font-size: 13px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; margin-bottom: 16px; }
.hero h1 { font-size: clamp(36px, 6vw, 60px); line-height: 1.05; font-weight: 900; letter-spacing: -1px; margin-bottom: 20px; max-width: 800px; }
.hero .lede { font-size: 19px; opacity: .9; max-width: 720px; margin-bottom: 32px; }
.hero-cta { display: flex; gap: 14px; flex-wrap: wrap; }

/* Buttons */
.btn { display: inline-block; padding: 14px 26px; border-radius: 6px; text-decoration: none; font-weight: 700; transition: all .15s; font-size: 15px; }
.btn-primary { background: var(--gold); color: var(--black); }
.btn-primary:hover { background: var(--gold-bright); transform: translateY(-1px); color: var(--black); }
.btn-secondary { background: transparent; color: var(--white); border: 2px solid var(--white); }
.btn-secondary:hover { background: var(--white); color: var(--black); }
.text-link { color: var(--gold-dark); font-weight: 700; text-decoration: none; }
.text-link:hover { text-decoration: underline; }

/* Sections */
section { padding: 60px 0; }
section.features, section.signature, section.story, section.reviews, section.visit, section.prose { padding: 60px 24px; }
h2 { font-size: clamp(26px, 3.5vw, 36px); font-weight: 900; letter-spacing: -.5px; margin-bottom: 14px; line-height: 1.15; }
h3 { font-size: 20px; font-weight: 800; margin-bottom: 10px; }
.section-intro { color: var(--grey-700); font-size: 17px; max-width: 680px; margin-bottom: 28px; }

/* Features grid */
.features { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 28px; padding-top: 50px; padding-bottom: 50px; }
.feature { background: var(--white); padding: 30px 26px; border-radius: 10px; box-shadow: 0 2px 12px rgba(0,0,0,.05); }
.feature-icon { font-size: 38px; display: block; margin-bottom: 14px; }
.feature h3 { color: var(--black); margin-bottom: 8px; }
.feature p { color: var(--grey-700); font-size: 15px; }

/* Pizza grid */
.signature { background: var(--white); }
.pizza-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 20px; margin-top: 16px; }
.pizza-grid.small { grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); }
/* .tight: for the 20 delivery neighbourhood cards. Steve, 2026-09-15: "I just want
   to tighten up the large squares and make them smaller, so that visitors don't have
   to scroll as much to find the communities and click through." A neighbourhood card
   holds a name, a cross-street and a delivery time, so it does not need a 260px
   column. At 200px the list goes from 3 columns to 5 (7 rows down to 4). Scoped as a
   modifier so the 32 other pages using .pizza-grid are untouched. */
/* align-items:start is THE fix, and it took Steve asking three times before I found it.
   Grid items default to stretch, so every card in a row takes the height of the TALLEST
   card in that row. Thorncliffe has one cross-street line, Huntington Hills has three, so
   Thorncliffe was stretched to Huntington's height and showed a band of empty cream below
   its text. THAT is the "space all around the card" he kept circling. It was never padding
   and never font size; I shrank both twice without touching the cause.
   Steve: "keep the font and spacing the same but reduce the size of the card."
   NOTE: this comment lives INSIDE the css template literal. No backticks and no dollar-brace
   in here, ever. A backtick around the word stretch ended the literal and broke the build. */
.pizza-grid.tight { grid-template-columns: repeat(auto-fit, minmax(240px, 1fr)); gap: 12px; align-items: start; }
/* Kill the DOUBLE padding. .pizza-card:not(.has-img) adds 16px top and bottom and
   .pizza-card-body adds more on top of it, so a card wrapped ~56px of padding around
   ~60px of text. That stacking, not the numbers, was the real cause of the empty
   space. Inside .tight the outer padding is zero and only the body padding applies.
   Steve, 2026-09-15: "there is still a lot of space between all around the community
   name details." */
.pizza-grid.tight .pizza-card:not(.has-img) { padding: 0; }
.pizza-grid.tight .pizza-card-body { padding: 10px 14px 10px; }
/* Font sizes and text spacing are deliberately NOT overridden here. I had shrunk them to
   17px / 13px / 11px and Steve asked for them back at default. The card shrinks, the words
   do not. Do not re-add these. */
.pizza-card { display: block; background: var(--cream); border: 2px solid transparent; border-radius: 8px; text-decoration: none; color: var(--grey-900); transition: all .15s; overflow: hidden; }
/* Tightened 2026-09-15 (Steve: "these are really big, we could make them a
   little smaller"). Text-only cards were stacking this padding ON TOP of
   .pizza-card-body's padding, so a neighbourhood card with three short lines
   rendered as a tall mostly-empty box. Affects 32 pages: delivery
   neighbourhoods, daily specials, menu categories, related pizzas, the
   vegetarian pizzas and the homepage. Image cards keep their 160px photo. */
.pizza-card:not(.has-img) { padding: 16px 18px; }
.pizza-card:hover { border-color: var(--gold); transform: translateY(-2px); box-shadow: 0 6px 18px rgba(232, 178, 58, .15); }
.pizza-card h3 { color: var(--black); margin-bottom: 6px; }
.pizza-card-img { width: 100%; height: 160px; background-size: cover; background-position: center; background-color: var(--grey-100); }
.pizza-card-body { padding: 14px 18px 16px; }
.pizza-card .ingredients { font-size: 14px; color: var(--grey-700); margin-bottom: 8px; }
.pizza-card .neighborhood { font-size: 12px; color: var(--grey-500); text-transform: uppercase; letter-spacing: 1px; font-weight: 600; }

/* Story */
.story { background: var(--cream); }
.story p { max-width: 760px; font-size: 17px; color: var(--grey-700); margin-bottom: 16px; }

/* FAQ */
#faq .faq-list { max-width: 820px; margin-top: 24px; }
#faq .faq-item { padding: 22px 24px; margin-bottom: 16px; background: var(--white); border-radius: 8px; border-left: 4px solid var(--gold); box-shadow: 0 2px 12px rgba(0,0,0,.05); }
#faq .faq-item h3 { color: var(--black); margin-bottom: 8px; }
#faq .faq-item p { font-size: 16px; color: var(--grey-700); line-height: 1.6; margin-bottom: 0; max-width: none; }

/* Reviews */
.reviews { background: var(--white); }
.rating-summary { color: var(--gold-dark); font-size: 20px; font-weight: 700; margin-bottom: 28px; }
.review-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(260px, 1fr)); gap: 22px; }
.review { background: var(--cream); padding: 24px; border-radius: 8px; border-left: 4px solid var(--gold); }
.review-head { display: flex; align-items: center; gap: 12px; margin-bottom: 14px; }
.review-avatar { width: 48px; height: 48px; border-radius: 50%; object-fit: cover; flex-shrink: 0; }
.review p { font-style: italic; font-size: 16px; margin-bottom: 0; color: var(--grey-900); }
.review cite { font-style: normal; font-size: 14px; color: var(--black); font-weight: 700; }
.review cite span { color: var(--grey-500); font-weight: 500; margin-left: 4px; }

/* Visit */
.visit { text-align: center; background: var(--black); color: var(--white); }
.visit h2 { color: var(--white); }
.visit p { margin-bottom: 14px; opacity: .85; }
.visit .btn-secondary { margin-top: 12px; }

/* Prose */
.prose { background: var(--white); }
.prose .wrap { max-width: 760px; }
.prose .lede { font-size: 19px; color: var(--grey-700); margin-bottom: 30px; line-height: 1.5; }
.prose h2 { margin-top: 36px; margin-bottom: 14px; }
.prose h3 { margin-top: 28px; }
.prose p { margin-bottom: 16px; font-size: 16px; color: var(--grey-700); line-height: 1.65; }
.prose ul { margin-bottom: 20px; padding-left: 22px; }
.prose li { margin-bottom: 8px; color: var(--grey-700); }
.prose a { color: var(--gold-dark); }
.prose a:hover { color: var(--black); }
.prose .btn { color: var(--black); }
.prose .btn-secondary { color: var(--white); }
.text-small { font-size: 13px; color: var(--grey-500); }
.grid-list { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 8px; list-style: none; padding-left: 0; }
.grid-list li { padding-left: 0; }

/* Inline figure inside prose section */
.prose-figure { margin: 24px 0; border-radius: 10px; overflow: hidden; box-shadow: 0 4px 16px rgba(0,0,0,.12); aspect-ratio: 16/9; }
.prose-figure img { display: block; width: 100%; height: 100%; object-fit: cover; object-position: center top; }
.prose-figure.pizza-feature { aspect-ratio: 16/9; max-width: 760px; margin-left: auto; margin-right: auto; }
.prose-figure.pizza-feature img { object-position: center; }

/* Ingredients list */
.ingredients-list { list-style: none; padding-left: 0; display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 24px; }
.ingredients-list li { background: var(--cream); color: var(--grey-900); padding: 6px 14px; border-radius: 100px; font-size: 14px; font-weight: 600; border: 1px solid var(--grey-100); }

/* Menu item cards (Appetizers, Burgers, Pastas, Classics, etc.) */
.menu-note { padding: 14px 18px; background: var(--cream); border-left: 4px solid var(--gold); border-radius: 6px; font-size: 14px; color: var(--grey-700); margin-bottom: 28px; font-style: italic; }
.menu-item { padding: 18px 0; border-bottom: 1px solid var(--grey-100); }
.menu-item.menu-item-has-img { display: grid; grid-template-columns: 140px 1fr; gap: 18px; align-items: start; }
.menu-item-img { width: 140px; height: 140px; border-radius: 8px; overflow: hidden; flex-shrink: 0; background: var(--cream); }
.menu-item-img img { width: 100%; height: 100%; object-fit: cover; display: block; }
.menu-item-body { min-width: 0; }
@media (max-width: 560px) {
  .menu-item.menu-item-has-img { grid-template-columns: 90px 1fr; gap: 12px; }
  .menu-item-img { width: 90px; height: 90px; }
}
.menu-item:last-child { border-bottom: none; }
.menu-item-head { display: flex; justify-content: space-between; align-items: baseline; gap: 14px; margin-bottom: 6px; }
.menu-item-head h3 { margin: 0; font-size: 19px; color: var(--black); flex: 1; line-height: 1.25; }
.menu-item-head .sig-mark { color: var(--gold-dark); }
.menu-item-price { font-weight: 700; font-size: 17px; color: var(--gold-dark); font-variant-numeric: tabular-nums; white-space: nowrap; }
.menu-item-desc { font-size: 15px; line-height: 1.55; color: var(--grey-700); margin: 0; }
.menu-item-signature { background: linear-gradient(180deg, #FFFDF5 0%, transparent 100%); padding-left: 14px; padding-right: 14px; border-radius: 6px; }
.menu-item-signature .menu-item-head h3 { color: var(--black); }
.addons { list-style: none; padding: 0; margin: 8px 0 0; display: flex; flex-wrap: wrap; gap: 10px; }
.addons li { font-size: 13px; color: var(--grey-700); background: var(--cream); padding: 4px 10px; border-radius: 100px; }
.addons li span { color: var(--gold-dark); font-weight: 600; margin-left: 4px; }

/* Wing flavor pills */
.flavor-pills { display: flex; flex-wrap: wrap; gap: 8px; margin-bottom: 12px; }
.flavor-pill { background: var(--cream); color: var(--grey-900); padding: 6px 14px; border-radius: 100px; font-size: 13px; font-weight: 500; border: 1px solid var(--grey-100); }
.flavor-pill.flavor-dry { background: var(--white); border-color: var(--gold); color: var(--black); }

/* Pizza menu flat-list table (matches original GHL site layout) */
.pizza-intro { background: var(--cream); padding: 18px 22px; border-radius: 8px; margin-bottom: 28px; }
.pizza-intro p { margin: 0; font-size: 16px; color: var(--grey-900); }
.menu-table { width: 100%; border-collapse: collapse; margin: 18px 0; font-size: 14px; background: var(--white); }
.menu-table thead { background: var(--black); color: var(--white); }
.menu-table th { padding: 12px 10px; text-align: left; font-size: 13px; letter-spacing: 0.5px; }
.menu-table th.price-col { text-align: right; width: 70px; }
.menu-table th.ingredients-col { width: 40%; }
.menu-table td { padding: 12px 10px; border-bottom: 1px solid var(--grey-100); vertical-align: top; }
.menu-table td.pizza-name { font-weight: 600; min-width: 180px; }
.menu-table td.pizza-name a { color: var(--black); text-decoration: none; }
.menu-table td.pizza-name a:hover { color: var(--gold-dark); text-decoration: underline; }
.menu-table td.ingredients-col { color: var(--grey-700); font-size: 13px; }
.menu-table td.price-col { text-align: right; font-variant-numeric: tabular-nums; color: var(--grey-900); }
.menu-table tbody tr:hover { background: var(--cream); }
@media (max-width: 720px) {
  .menu-table { font-size: 12px; }
  .menu-table th, .menu-table td { padding: 8px 6px; }
  .menu-table th.ingredients-col, .menu-table td.ingredients-col { display: none; }
}

/* Size list (replaces price table, prices vary per pizza) */
.size-list { list-style: none; padding: 0; max-width: 480px; margin-bottom: 14px; }
.size-list li { padding: 10px 14px; background: var(--cream); border-radius: 6px; margin-bottom: 8px; font-size: 15px; }
.size-list li strong { color: var(--black); margin-right: 8px; }

/* Service area map */
.map-embed { margin: 24px 0; border-radius: 8px; overflow: hidden; box-shadow: 0 4px 14px rgba(0,0,0,.1); }
.map-embed iframe { display: block; width: 100%; height: 420px; border: 0; }

/* Hours list, tight, scannable */
.hours { list-style: none; padding: 0; max-width: 380px; }
.hours li { display: flex; justify-content: space-between; padding: 3px 0; font-size: 14px; line-height: 1.35; }
.hours li span:first-child { font-weight: 600; }
.hours li span:last-child { color: var(--grey-700); font-variant-numeric: tabular-nums; }

/* Third party order links */
.thirdparty { list-style: none; padding: 0; font-size: 14px; }
.thirdparty li { margin-bottom: 6px; }
.thirdparty.inline { display: flex; flex-wrap: wrap; gap: 14px; padding-left: 0; }
.thirdparty.inline li { background: var(--cream); padding: 8px 16px; border-radius: 100px; border: 1px solid var(--grey-100); }
.thirdparty a { color: var(--gold-dark); text-decoration: none; font-weight: 600; }
.thirdparty a:hover { color: var(--black); text-decoration: underline; }

.neighborhoods { list-style: none; padding: 0; font-size: 14px; columns: 2; column-gap: 16px; }
.neighborhoods li { margin-bottom: 4px; color: var(--grey-300); }
.neighborhoods em { color: var(--gold); font-style: normal; font-size: 13px; }

/* Footer */
.site-footer { background: var(--black); color: var(--grey-300); padding-top: 50px; margin-top: 40px; }
.footer-grid { display: grid; grid-template-columns: repeat(auto-fit, minmax(220px, 1fr)); gap: 30px; padding-bottom: 30px; }
.footer-grid h3 { color: var(--white); margin-bottom: 14px; font-size: 15px; letter-spacing: 1px; text-transform: uppercase; }
.footer-grid p { font-size: 14px; margin-bottom: 10px; }
.footer-grid a { color: var(--gold); text-decoration: none; }
.footer-grid a:hover { color: var(--white); }
.subfooter { border-top: 1px solid var(--grey-700); padding: 18px 24px; text-align: center; font-size: 13px; color: var(--grey-500); }


/* ===== Review funnel ===== */
.review-funnel { padding: 50px 24px 80px; }
.review-paths { display: grid; grid-template-columns: repeat(auto-fit, minmax(280px, 1fr)); gap: 24px; max-width: 880px; margin: 0 auto; }
.path-card { display: block; background: var(--white); border: 2px solid var(--grey-100); border-radius: 12px; padding: 32px 28px; text-decoration: none; color: var(--grey-900); transition: all .15s; text-align: center; }
.path-card:hover { transform: translateY(-3px); box-shadow: 0 8px 24px rgba(0,0,0,.08); }
.path-google { background: linear-gradient(180deg, #FFFDF5, var(--cream)); border-color: var(--gold); }
.path-google:hover { border-color: var(--gold-dark); }
.path-feedback { background: var(--cream); }
.path-card .path-icon { font-size: 52px; margin-bottom: 12px; line-height: 1; }
/* Five stars, graduated out from the middle: Steve, 2026-09-16, "smaller 2 on the outside
   and the bigger star in the middle". Sized in em so the row scales off the 52px above and
   the card height does not move. The div keeps aria-hidden, so this is never read aloud. */
.path-card .star-row { display: flex; align-items: center; justify-content: center; gap: 3px; }
.path-card .star-row span { line-height: 1; }
.path-card .star-row span:nth-child(1), .path-card .star-row span:nth-child(5) { font-size: .42em; }
.path-card .star-row span:nth-child(2), .path-card .star-row span:nth-child(4) { font-size: .64em; }
.path-card h2 { font-size: 24px; margin-bottom: 12px; color: var(--black); }
.path-card p { font-size: 15px; color: var(--grey-700); margin-bottom: 10px; }
.path-card .tip { font-size: 13px; color: var(--grey-500); }
.path-card .path-cta { display: inline-block; margin-top: 12px; color: var(--gold-dark); font-weight: 700; font-size: 15px; }
.path-card:hover .path-cta { color: var(--black); }
/* Hidden on desktop by design, see the note at the markup. */
.choose-row { display: none; }
.review-fineprint { text-align: center; color: var(--grey-500); font-size: 13px; max-width: 600px; margin: 32px auto 0; font-style: italic; }

/* ===== Feedback form ===== */
.feedback-form { display: flex; flex-direction: column; gap: 18px; max-width: 100%; }
.feedback-form label { display: flex; flex-direction: column; gap: 6px; }
.feedback-form .field-label { font-weight: 600; font-size: 14px; color: var(--grey-900); }
.feedback-form .field-label em { color: var(--grey-500); font-style: normal; font-weight: 400; font-size: 12px; }
.feedback-form input[type=text], .feedback-form input[type=email], .feedback-form input[type=tel], .feedback-form textarea {
  font: inherit; padding: 10px 12px; border: 1px solid var(--grey-300); border-radius: 6px; background: var(--white); color: var(--grey-900); width: 100%; box-sizing: border-box;
}
.feedback-form textarea { resize: vertical; min-height: 80px; font-family: inherit; }
.feedback-form input:focus, .feedback-form textarea:focus { outline: 2px solid var(--gold); outline-offset: 1px; border-color: var(--gold); }
.feedback-form .honeypot { position: absolute; left: -9999px; width: 1px; height: 1px; opacity: 0; }
.sentiment-row { display: flex; flex-wrap: wrap; gap: 8px; margin-top: 4px; }
.sentiment { display: inline-flex; align-items: center; cursor: pointer; padding: 8px 14px; border: 1px solid var(--grey-300); border-radius: 100px; transition: all .15s; background: var(--white); }
.sentiment:has(input:checked) { border-color: var(--gold); background: var(--cream); font-weight: 700; }
.sentiment input { position: absolute; opacity: 0; pointer-events: none; }
.sentiment span { font-size: 14px; }
/* Three-ask block, added 2026-09-16. Food / service / delivery split out so a late
   third-party driver has somewhere to land that is not Peter's public rating. Reuses
   the .sentiment pill pattern deliberately rather than inventing a third look. */
.rating-block { border: 1px solid var(--grey-300); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 16px; }
.rating-block legend { font-size: 13px; font-weight: 600; color: var(--grey-700); padding: 0 8px; }
.rating-row { display: flex; flex-direction: column; gap: 7px; }
.rating-opts { display: flex; flex-wrap: wrap; gap: 8px; }
.rating-opts label { display: inline-flex; align-items: center; cursor: pointer; padding: 7px 14px; border: 1px solid var(--grey-300); border-radius: 100px; background: var(--white); transition: all .15s; }
.rating-opts label:has(input:checked) { border-color: var(--gold); background: var(--cream); font-weight: 700; }
.rating-opts input { position: absolute; opacity: 0; pointer-events: none; }
.rating-opts span { font-size: 14px; }
.rating-note { font-size: 12.5px; color: var(--grey-700); line-height: 1.5; margin: 0; padding: 10px 12px; background: var(--cream); border-radius: 6px; }

/* The visit-reason dropdown. The rule above names input types explicitly, so a
   <select> inherits nothing without this. */
.feedback-form select {
  font: inherit; padding: 10px 12px; border: 1px solid var(--grey-300); border-radius: 6px; background: var(--white); color: var(--grey-900); width: 100%; box-sizing: border-box;
}
.feedback-form select:focus { outline: 2px solid var(--gold); outline-offset: 1px; border-color: var(--gold); }

.contact-fields { border: 1px dashed var(--grey-300); border-radius: 8px; padding: 18px; display: flex; flex-direction: column; gap: 14px; }
.contact-fields legend { font-size: 13px; color: var(--grey-700); padding: 0 8px; }
.contact-fields legend em { color: var(--grey-500); font-weight: 400; font-style: normal; }
.feedback-form .btn { align-self: flex-start; }
.form-status { font-size: 14px; color: var(--grey-700); min-height: 20px; }
.form-status.sending { color: var(--gold-dark); }
.form-status.error { color: #B3261E; }
.checkbox-row { display: flex; align-items: flex-start; gap: 10px; padding: 14px 16px; background: var(--cream); border-radius: 8px; border: 1px dashed var(--gold); cursor: pointer; }
.checkbox-row input[type=checkbox] { margin-top: 3px; transform: scale(1.2); accent-color: var(--gold); flex-shrink: 0; }
.checkbox-row span { font-size: 14px; line-height: 1.5; color: var(--grey-900); }
.checkbox-row strong { color: var(--black); }
.casl-note { font-size: 12px; color: var(--grey-500); padding: 10px 14px; background: #FAFAF7; border-radius: 6px; line-height: 1.5; }

@media (max-width: 720px) {
  .review-paths { grid-template-columns: 1fr; }
  .choose-row { display: flex; flex-wrap: wrap; justify-content: center; align-items: center; gap: 8px; margin: 0 0 20px; }
  .choose-row .choose-label { width: 100%; text-align: center; font-size: 13px; font-weight: 600; color: var(--grey-700); margin-bottom: 2px; }
  .choose-row a { font-size: 14px; font-weight: 700; color: var(--grey-900); text-decoration: none; border: 1px solid var(--gold); background: var(--cream); border-radius: 100px; padding: 9px 15px; }
}

/* Phones: claw back the width .rating-block's own padding costs, so all four face
   options sit on ONE line like the sentiment row above them. Measured 2026-09-16 at
   390px: without this, "Bad" wraps to a second line on all three rows. The sentiment
   row fits four because it is not inside a padded fieldset. */
@media (max-width: 460px) {
  .rating-block { padding: 14px 9px; }
  .rating-opts { gap: 6px; }
  .rating-opts label { padding: 7px 10px; }
  .rating-opts span { font-size: 13.5px; }
}

/* Responsive tweaks */
@media (max-width: 720px) {
  /* The sticky header was eating roughly a third of a phone screen before any content
     (Steve, 2026-09-16). Cause: .primary-nav is width:100%, which breaks the flex line,
     and because the DOM order is logo -> nav -> order button, the button was pushed to a
     THIRD row. order:3 puts the logo and the Order button back on one row and lets the
     links wrap underneath. The eight links genuinely cannot fit one line at 390px, they
     measure ~470px, so two tight rows is the target, not one. */
  .site-header .nav { padding: 8px 14px; gap: 8px; }
  .logo img { height: 40px; }
  .primary-nav { width: 100%; order: 3; justify-content: center; padding-top: 2px; gap: 6px 14px; }
  .primary-nav a { font-size: 14px; }
  .order-cta { font-size: 14px; padding: 8px 14px; }
  .hero { padding: 60px 0 50px; }
  .hero-home { padding: 70px 0 60px; }
  .neighborhoods { columns: 1; }
}
`;

// Content hash of the stylesheet, appended to its <link href>. See the note above
// the css literal for why this exists. Declared HERE, after the literal closes,
// because hashing `css` before its own const initialises is a TDZ ReferenceError.
const cssVersion = crypto.createHash("md5").update(css).digest("hex").slice(0, 8);

// ---------- favicon ----------
const favicon = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64">
  <rect width="64" height="64" rx="10" fill="#C8102E"/>
  <text x="32" y="46" font-family="-apple-system,sans-serif" font-size="40" font-weight="900" fill="#fff" text-anchor="middle">T</text>
</svg>`;

// ---------- write everything ----------
function writePage(relPath, html) {
  const full = path.join(OUT, relPath);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  fs.writeFileSync(full, html);
  console.log("  ✓ " + relPath);
}

// Clean output
// Skip clean, Windows-mounted folder denies recursive unlink. writeFileSync overwrites.
fs.mkdirSync(OUT, { recursive: true });
fs.mkdirSync(path.join(OUT, "assets"), { recursive: true });

console.log("Building TOPS Pizza site (full)...\n");

// ---------- core pages ----------
writePage("index.html",         smartify(homepage()));
writePage("about/index.html",   smartify(about()));
writePage("contact/index.html", smartify(contactPage()));
writePage("sports-bar/index.html", smartify(sportsBar()));
writePage("delivery/index.html",   smartify(deliveryLandingPage()));
writePage("vegetarian-options/index.html", smartify(vegetarianPage()));
writePage("faq/index.html",        smartify(faqPage()));

// ---------- 20 neighborhood pages ----------
console.log("\n  Neighborhoods:");
for (const nh of allNeighborhoods) {
  writePage(`${nh.slug}/index.html`, smartify(neighborhoodPage(nh)));
}

// ---------- 27 pizza pages ----------
console.log("\n  Pizzas:");
for (const p of allPizzas) {
  writePage(`${p.slug}/index.html`, smartify(pizzaPage(p)));
}

// ---------- 8 daily special pages + landing ----------
console.log("\n  Daily specials:");
writePage("daily-specials/index.html", smartify(dailySpecialsLandingPage()));
for (const s of dailySpecials) {
  writePage(`${s.slug}/index.html`, smartify(dailySpecialPage(s)));
}

// ---------- menu landing + category pages ----------
console.log("\n  Menu:");
writePage("menu/index.html", smartify(menuLandingPage()));
for (const c of menuCategories) {
  writePage(`${c.slug}/index.html`, smartify(menuCategoryPage(c)));
}

// ---------- review funnel (3 pages) ----------
console.log("\n  Review funnel:");
writePage("review/index.html",          smartify(reviewLandingPage()));
writePage("review/feedback/index.html", smartify(reviewFeedbackPage()));
writePage("review/bonus/index.html",    smartify(reviewBonusPage()));
writePage("review/thanks/index.html",   smartify(reviewThanksPage()));
writePage("redeem/index.html",          smartify(reviewRedeemPage()));

// ---------- owner update portal (1 page, noindex, Cloudflare Access-protected) ----------
console.log("\n  Owner portal:");
writePage("owner/index.html", smartify(ownerPortalPage()));

// ---------- shared assets ----------
fs.writeFileSync(path.join(OUT, "assets", "style.css"), css);
console.log(`  ✓ assets/style.css  (cache-bust v=${cssVersion})`);

fs.writeFileSync(path.join(OUT, "assets", "favicon.svg"), favicon);

// Recursively copy local image assets to dist/assets/ (handles assets/menu/ etc.)
const ASSETS_SRC = path.join(__dirname, "assets");
function copyRecursive(src, dest) {
  let count = 0;
  if (!fs.existsSync(src)) return 0;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) {
      count += copyRecursive(srcPath, destPath);
    } else if (entry.isFile()) {
      fs.copyFileSync(srcPath, destPath);
      count++;
    }
  }
  return count;
}
if (fs.existsSync(ASSETS_SRC)) {
  const copied = copyRecursive(ASSETS_SRC, path.join(OUT, "assets"));
  console.log(`  Copied ${copied} local assets (recursive) to dist/assets/`);
}

// ---------- sitemap.xml, all URLs ----------
const allUrls = [
  `${site.url}/`,
  `${site.url}/about/`,
  `${site.url}/contact/`,
  `${site.url}/sports-bar/`,
  `${site.url}/menu/`,
  `${site.url}/daily-specials/`,
  `${site.url}/delivery/`,
  `${site.url}/vegetarian-options/`,
  `${site.url}/faq/`,
  ...allNeighborhoods.map(nh => `${site.url}/${nh.slug}/`),
  ...allPizzas.map(p => `${site.url}/${p.slug}/`),
  ...dailySpecials.map(s => `${site.url}/${s.slug}/`),
  ...menuCategories.map(c => `${site.url}/${c.slug}/`),
  `${site.url}/review/`,
];
const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${allUrls.map(u => {
  const isHome = u === `${site.url}/`;
  const priority = isHome ? "1.0" : (u.includes("/about/") || u.includes("/contact/") || u.includes("/menu/") || u.includes("/sports-bar/")) ? "0.9" : "0.7";
  return `  <url><loc>${u}</loc><changefreq>weekly</changefreq><priority>${priority}</priority></url>`;
}).join("\n")}
</urlset>`;
fs.writeFileSync(path.join(OUT, "sitemap.xml"), sitemap);

// ---------- robots.txt ----------
fs.writeFileSync(path.join(OUT, "robots.txt"), `User-agent: *\nAllow: /\nSitemap: ${site.url}/sitemap.xml\n`);

// ---------- llms.txt (AI-discoverability index; source file beside build.js) ----------
const llmsSrc = path.join(__dirname, "llms.txt");
if (fs.existsSync(llmsSrc)) fs.copyFileSync(llmsSrc, path.join(OUT, "llms.txt"));

// ---------- 404 page ----------
// Cloudflare Pages serves dist/404.html with a real 404 status for unmatched routes.
// Without it, dead URLs soft-404 to the homepage at 200, which Google flags as duplicate.
const notFoundBody = `<section class="hero" style="text-align:center">
  <div class="wrap">
    <h1>Page not found</h1>
    <p class="lede">We could not find that page. It may have moved, or that menu item is no longer available. Try one of these:</p>
    <p style="margin-top:18px">
      <a class="btn" href="/">Home</a>
      <a class="btn" href="/menu/">Full menu</a>
      <a class="btn" href="/pizza-menu/">Pizzas</a>
      <a class="btn" href="/contact/">Contact</a>
    </p>
    <p style="margin-top:18px">Hungry now? Call us at <a href="tel:${site.nap.phone}">${esc(site.nap.phoneDisplay)}</a>.</p>
  </div>
</section>`;
fs.writeFileSync(path.join(OUT, "404.html"), layout({
  title: `Page not found | ${site.name}`,
  description: "That page could not be found. Browse the Top's Pizza menu or get in touch.",
  canonical: `${site.url}/404`,
  schemas: [],
  body: notFoundBody,
  noindex: true,
}));

// ---------- _redirects (discontinued pizzas -> menu; keeps old Google/links off a 404) ----------
const goneItems = ["the-italian-pizza","tops-original-pizza","californian-pizza","chicken-alfredo-pizza","hawaiian-pizza","popeye-pizza"];
const redirects = goneItems.flatMap(s => [`/${s}  /menu/  301`, `/${s}/  /menu/  301`]).join("\n") + "\n";
fs.writeFileSync(path.join(OUT, "_redirects"), redirects);

console.log(`\n✓ Built ${allUrls.length} pages + assets to: ${OUT}`);
console.log(`  - 4 core pages (Home, About, Contact, Sports Bar)`);
console.log(`  - 2 dietary/support pages (/vegetarian-options/, /faq/)`);
console.log(`  - ${allNeighborhoods.length} neighborhood pages`);
console.log(`  - ${allPizzas.length} pizza pages`);
console.log(`  - ${dailySpecials.length + 1} daily-specials pages (+ landing)`);
console.log(`  - ${menuCategories.length + 1} menu pages (+ landing)`);
console.log(`  - 4 review-funnel pages (/review/, /review/bonus/, /review/feedback/, /review/thanks/)`);
console.log(`  - 1 owner portal page (/owner/, noindex, requires CF Access auth)`);
console.log("\nPreview locally:  npm run preview");
console.log("Deploy:           npm run deploy");
