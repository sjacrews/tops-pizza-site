// ============================================================
// TOPS Pizza — single source of truth for site data
// Edit values here, run `node build.js`, all pages regenerate.
// This is what makes the site easy for VPS Claude (or you) to update.
// ============================================================

export const site = {
  name: "TOPS Pizza & Sports Bar",
  shortName: "TOPS Pizza",
  tagline: "Where cold beer meets hot pizza — and the game's always on.",
  description: "TOPS Pizza & Sports Bar in NW Calgary serves up legendary pizza, pub food, cold drinks, and live sports. Family recipe since 1975. Dine in, take out, or catch the game with us today.",
  url: "https://topspizza.ca",
  yearFounded: 1975, // their own menu page says "since 1975"; About page implies later — confirm with owner
  yearsServing: new Date().getFullYear() - 1975,

  nap: {
    streetAddress: "5602 4 St NW",
    suite: null, // YellowPages lists "7-" prefix — decide canonical form
    locality: "Calgary",
    region: "AB",
    postalCode: "T2K 1B2",
    country: "CA",
    phone: "+14032752722",
    phoneDisplay: "(403) 275-2722",
    neighborhood: "Thorncliffe",
    geo: { latitude: 51.101367, longitude: -114.0706521 },
    placeId: "ChIJY02FpLRlcVMRsckmxNq03Ws", // address-level place_id from Place ID Finder (works for schema.org but NOT for the writereview URL — see googleReviewUrl below for the actual review URL)
    fid: "/g/11gyxl2647", // TOPS-specific Google Feature ID (from Maps URL, May 2026)
    cid: "7771183892810480049", // decimal CID = 0x6bddb4dac426c9b1, the TOPS business hash from Google Maps
    googleMapsUrl: "https://www.google.com/maps/place/5602+4+St+NW,+Calgary,+AB+T2K+1B2,+Canada/@51.101367,-114.073227,17z",
    // Direct Google review write URL — uses the place_id we already have
    // Opens Google Maps directly on the TOPS Pizza listing with the reviews tab visible (!9m1!1b1 flag).
    // Customer clicks "Write a review" from there. One extra click vs. the search.google writereview URL,
    // but reliable — the search URL format requires a ChIJ place_id we couldn't get for the business specifically
    // (the address-level place_id served 3 different businesses at 5602 4 St NW).
    googleReviewUrl: "https://www.google.com/maps/place/Tops+Pizza/@51.1014175,-114.0704116,17z/data=!4m8!3m7!1s0x537165b4a4854d63:0x6bddb4dac426c9b1!8m2!3d51.1014175!4d-114.0704116!9m1!1b1!16s%2Fg%2F11gyxl2647"
  },

  hours: [
    // dayOfWeek: ISO day name; opens/closes: HH:MM (24h). closes > 24:00 means next day.
    { dayOfWeek: "Monday",    opens: "11:00", closes: "24:00" },
    { dayOfWeek: "Tuesday",   opens: "10:00", closes: "25:00" }, // 1am next day
    { dayOfWeek: "Wednesday", opens: "10:00", closes: "25:00" },
    { dayOfWeek: "Thursday",  opens: "10:00", closes: "25:00" },
    { dayOfWeek: "Friday",    opens: "10:00", closes: "26:00" }, // 2am next day
    { dayOfWeek: "Saturday",  opens: "10:00", closes: "26:00" },
    { dayOfWeek: "Sunday",    opens: "11:00", closes: "24:00" },
  ],

  founder: {
    name: "Jim Tsoulamanis",
    role: "Owner",
    wife: "Kristina",
    son: "Peter",
    heritage: "Greek",
    story: "Jim grew up surrounded by traditional Greek cooking. Armed with a dough recipe passed down from the old country, he and his wife Kristina immigrated to Canada and built TOPS Pizza & Sports Bar from the ground up. Their son Peter now plays an active role in carrying the family legacy forward."
  },

  // Brand identity — extracted from the existing topspizza.ca site
  brand: {
    logoUrl: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6643bc5f22a097daa2132.png", // currently served from GHL CDN; replace with local /assets/logo.png once asset is downloaded
    primaryColor: "#E8B23A",   // warm gold from logo
    primaryDark:  "#B88823",   // gold hover/active
    backgroundDark: "#0A0A0A", // near-black hero/header
    accentText: "#FFFFFF",
  },

  // Real images pulled from the existing topspizza.ca site (served through GHL CDN as WebP).
  // Long-term: download these to /assets/ and self-host. For now, hotlinking is fine.
  // Local images (real photos from GBP — self-hosted in /assets/)
  // These take priority over the hotlinked GHL CDN urls below.
  localImages: {
    heroHome: "/assets/tops_pizza_bar.webp",          // bar with Stanley Cup Playoffs on TVs
    heroSportsBar: "/assets/tops_pizza_steak_bar.webp", // steak + sports TVs
    aboutInline: "/assets/tops_pizza_beer_glass_bar.webp", // beer + bar lounge
    pizzaThorncliffe: "/assets/tops_pizza_the_thorncliffe.webp", // real product photo!
    pizzaMeatLovers: "/assets/tops_pizza_beer_meat_lovers.webp",
    caesarSalad: "/assets/tops_pizza_caesar_salad.webp",
    steakSandwich: "/assets/tops_pizza_steak_sandwich.webp",
  },

  images: {
    cdnBase: "https://images.leadconnectorhq.com/image/f_webp/q_80/r_1200/u_",
    heroHome: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6866dc5f22a09dcaa4153.jpeg",
    heroSportsBar: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6866de519ed546d248c86.jpeg",
    foodA: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6866d1870f4b7f84323eb.jpeg",
    foodB: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6866de519ed546d248c86.jpeg",
    foodC: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6866dc5f22a09dcaa4153.jpeg",
    avatarDavid: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e6997d13c4b6b1210ef174.png",
    avatarTerri: "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e699ed37929495b4e3828b.png",
    avatarWill:  "https://assets.cdn.filesafe.space/Ij3sOzQEo9kraqTbmAOy/media/67e69a8b1870f47402433016.png",
    starDecor:   "https://assets.cdn.filesafe.space/75x6oVRlEkU7gyLcePUE/media/33045d7e-5160-4c8f-998e-672414b11c99.png",
  },

  order: {
    skipTheDishes: "https://www.skipthedishes.com/tops-pizza-and-sports-bar-4th-street-northwest",
    uberEats: "https://www.ubereats.com/ca/store/tops-pizza/Jj7lcjQGSmaveypFsPhsZQ",
    doorDash: "https://order.online/store/tops-pizza-&-spotrs-bar-calgary-99576/",
    // Owner has in-house delivery for phone orders. Third-party rates negotiated 10-15%.
  },

  social: {
    // TODO confirm with owner — placeholder URLs left commented
    // facebook: "https://www.facebook.com/topspizzacalgary",
    // instagram: "https://www.instagram.com/topspizza",
  },

  // Citations / sameAs — feeds Restaurant schema and helps Knowledge Graph
  sameAs: [
    "https://www.yelp.ca/biz/tops-pizza-and-sports-bar-calgary",
    "https://www.tripadvisor.com/Restaurant_Review-g154913-d3982850-Reviews-Tops_Pizza_and_Sports_Bar-Calgary_Alberta.html",
    "https://www.yellowpages.ca/bus/Alberta/Calgary/Tops-Pizza-Sports-Bar/1597316.html",
    "https://foodpages.ca/topspizzaandsports",
    "https://www.restaurantji.com/ab/calgary/tops-pizza-/",
    "https://www.skipthedishes.com/tops-pizza-and-sports-bar-4th-street-northwest",
    "https://www.ubereats.com/ca/store/tops-pizza/Jj7lcjQGSmaveypFsPhsZQ",
  ],

  // Aggregate rating — verify exact count from GBP; these reflect what we found publicly
  aggregateRating: {
    ratingValue: "4.3",
    reviewCount: "209" // real GBP count per Google search panel, May 2026
  },

  priceRange: "$$",
  servesCuisine: ["Pizza", "Pub Food", "Burgers", "Pasta", "Wings"],
  acceptsReservations: false,
  hasDelivery: true,
  hasTakeout: true,
  hasDineIn: true,

  // 20 neighborhoods we serve — for the homepage block + Service.areaServed
  neighborhoods: [
    "Thorncliffe", "Huntington Hills", "North Haven Upper", "North Haven",
    "Highland Park", "Queens Park", "Tuxedo Park", "Capitol Hill",
    "Charleswood", "Mt Pleasant", "Triwood", "Confederation Park",
    "Beddington Heights", "MacEwan", "Sandstone Valley", "Highwood",
    "Cambrian Heights", "Collingwood", "Banff Trail", "Balmoral"
  ],

  // Sports bar features for the Sports Bar page schema
  sportsBar: {
    tvCount: 30, // confirm exact count with owner
    leagues: ["NHL", "CFL", "NFL", "MLB", "UFC", "NBA"],
    amenities: ["Pool table", "Jukebox", "VLTs", "Full bar", "31 wing flavours"],
  },
};

// Just the named pizzas we want featured in the POC; full menu lives in pizzas.js (future)
export const featuredPizzas = [
  {
    slug: "the-thorncliffe-pizza",
    name: "The Thorncliffe",
    description: "Our signature pizza named for the neighborhood we’ve called home for nearly 50 years.",
    ingredients: ["Meat sauce", "Pepperoni", "Mushrooms", "Green peppers", "Ham", "Olives", "Feta"],
    neighborhood: "Thorncliffe",
    // Prices vary per pizza — owner to provide per-pizza pricing later.
    // Each pizza will have its own { medium, large, xlarge } once collected.
    priceRange: null,
  },
  {
    slug: "the-huntington-pizza",
    name: "The Huntington",
    description: "Named for Huntington Hills — bold and unapologetic.",
    ingredients: ["Feta", "Cheddar cheese", "Tomatoes", "Banana peppers", "Sausage"],
    neighborhood: "Huntington Hills",
  },
  {
    slug: "the-beddington-pizza",
    name: "The Beddington",
    description: "A Beddington Heights favorite, loaded for the whole crew.",
    ingredients: ["Pepperoni", "Beef", "Ham", "Green peppers", "Tomatoes", "Shrimp"],
    neighborhood: "Beddington Heights",
  },
];

// Just the neighborhoods we're building POC pages for
export const featuredNeighborhoods = [
  {
    slug: "thorncliffe",
    name: "Thorncliffe",
    landmarks: ["Thorncliffe-Greenview Community Association", "Egert Park", "4 Street NW", "Centre Street North"],
    crossStreets: "4 St NW & 56 Ave NW",
    neighborhoodPizza: "the-thorncliffe-pizza",
    deliveryEta: "20–30 min",
  }
];
