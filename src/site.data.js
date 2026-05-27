// ============================================================
// TOPS Pizza — full dataset for all 60+ pages
// Imported by build.js. Kept separate from site.config.js (which holds branding/NAP/etc)
// to keep that file scannable.
// ============================================================

// ----------------------------------------------------------------
// allNeighborhoods — 20 NW Calgary communities TOPS delivers to.
// Geography references are kept generic-but-true (verified street boundaries,
// no fabricated parks or landmarks). Owner can enrich each later.
// ----------------------------------------------------------------
export const allNeighborhoods = [
  { slug: "thorncliffe", name: "Thorncliffe",
    blurb: "We’re Thorncliffe. The corner of 4 St NW & 56 Ave NW has been the TOPS kitchen since 1975. Egert’s Park is a five-minute walk; the rest of the neighborhood is one block over.",
    crossStreets: "4 St NW & 56 Ave NW",
    boundaries: "Bounded by 64 Ave N, Deerfoot Trail, McKnight Blvd, and 14 St NW / Nose Hill Park",
    landmarks: ["Egert’s Park", "Thorncliffe-Greenview Community Association", "Nose Hill Park (eastern base)"],
    established: 1954,
    uniqueAngle: "Egert’s Park is right here — its playground is being upgraded in 2025. If you’re walking the dog through it, you’re also walking past our door.",
    deliveryEta: "15–25 min",
    neighborhoodPizza: "the-thorncliffe-pizza" },

  { slug: "huntington-hills", name: "Huntington Hills",
    blurb: "Just north of Thorncliffe, between 14 St NW and 4 St NW. Our in-house driver knows the Huntington crescents and cul-de-sacs by memory.",
    crossStreets: "Between 14 St NW, 4 St NW, 64 Ave NW, and Beddington Trail",
    landmarks: ["Huntington Hills Community Association", "Nose Hill Park", "Huntington Hills Library"],
    uniqueAngle: "Huntington Hills was the first big NW expansion north of Thorncliffe — we’ve been delivering up here since both communities were young.",
    deliveryEta: "20–30 min",
    neighborhoodPizza: "the-huntington-pizza" },

  { slug: "north-haven-upper", name: "North Haven Upper",
    blurb: "Upper North Haven sits high on the bench at the base of Nose Hill Park — developed starting 1977, with some of the best city views in the NW.",
    crossStreets: "Around 4A St NW and Northmount Dr NW",
    landmarks: ["Nose Hill Park (south access)", "North Haven Community Hall"],
    uniqueAngle: "Upper North Haven is one of the only NW communities where you can finish your pizza and walk straight onto a Nose Hill trail.",
    deliveryEta: "15–25 min" },

  { slug: "north-haven", name: "North Haven",
    blurb: "Lower North Haven was developed between 1962 and 1971 — established homes, mature trees, and a quiet walk from our Thorncliffe kitchen.",
    crossStreets: "South of John Laurie Blvd NW, west of 4 St NW",
    landmarks: ["Nose Hill Park", "North Haven Community Association", "Nose Hill stone circle (Indigenous heritage site)"],
    uniqueAngle: "North Haven residents led the grassroots fight in the 1970s to protect Nose Hill Park from development — that legacy is the green space that still anchors the whole NW.",
    deliveryEta: "15–25 min" },

  { slug: "highland-park", name: "Highland Park",
    blurb: "Right next door to us — Highland Park is one of our shortest delivery runs, and one of our most frequent. Bounded by McKnight Blvd, Edmonton Trail, 32 Ave, and 4 St.",
    crossStreets: "Around 4 St NW and 40 Ave NW",
    landmarks: ["Highland Park Community Association", "Centre Street corridor", "Edmonton Trail commercial strip"],
    uniqueAngle: "Highland Park sits between us and downtown — direct access via Centre Street or Edmonton Trail. Pizza arrives faster here than anywhere else in our service area.",
    deliveryEta: "12–18 min" },

  { slug: "queens-park", name: "Queens Park",
    blurb: "Small, established pocket near Queens Park Cemetery and Centre Street N. Quick delivery from our Thorncliffe kitchen.",
    crossStreets: "Near Centre St N and 32 Ave NW",
    landmarks: ["Queens Park Cemetery", "Centre Street N corridor"],
    uniqueAngle: "Queens Park is tiny and tightly held — most of our orders here go to the same families we’ve been delivering to for years.",
    deliveryEta: "18–25 min" },

  { slug: "tuxedo-park", name: "Tuxedo Park",
    blurb: "Inner-city Tuxedo Park, established 1929, runs from 16 Ave N to 32 Ave N between Edmonton Trail and 2 St NW. The central park spans two full city blocks.",
    crossStreets: "Around Centre St N and 24 Ave N",
    landmarks: ["Tuxedo Park (the park, 2 city blocks)", "Tuxedo Park Community Hall", "future 16 Ave N LRT station (Green Line)"],
    uniqueAngle: "Tuxedo Park has been a neighborhood since 1929 and is about to get a Green Line LRT stop — old-character homes, new transit, and pizza on the way.",
    deliveryEta: "20–30 min" },

  { slug: "capitol-hill", name: "Capitol Hill",
    blurb: "North of 16 Ave NW, bordered by Confederation Park, 10 St NW, and 19 St NW. Walking distance to SAIT, the University, and the Jubilee Auditorium.",
    crossStreets: "Around 14 St NW and 24 Ave NW",
    landmarks: ["Confederation Park (north border)", "SAIT (across 16 Ave)", "Capitol Hill Community Association"],
    uniqueAngle: "Capitol Hill is full of SAIT students, young professionals, and 1950s starter homes. Pizza orders here spike on Thursday and Sunday nights — we’re ready.",
    deliveryEta: "20–30 min" },

  { slug: "charleswood", name: "Charleswood",
    blurb: "Part of the Triwood community (with Brentwood and Collingwood), at the base of Nose Hill between 14 St NW and Brentwood. Mostly mature 1950s and 60s family homes.",
    crossStreets: "Around 32 Ave NW and 14 St NW",
    landmarks: ["Triwood Community Centre (ice rink, 2 ball fields)", "Canmore Park", "Nose Hill Park"],
    uniqueAngle: "Charleswood backs onto Nose Hill — big yards, family-sized lots, family-sized pizza orders. We deliver here weekly.",
    deliveryEta: "20–30 min" },

  { slug: "mt-pleasant", name: "Mt Pleasant",
    blurb: "Established inner-city neighborhood between Highland Park and Tuxedo Park. Annexed in 1910 with development starting 1912 — Mt Pleasant is one of Calgary’s oldest NW communities.",
    crossStreets: "Around Centre St N and 24 Ave N",
    landmarks: ["Mount Pleasant Community Association", "Riley Park (within walking distance)", "Centre Street N corridor"],
    uniqueAngle: "Mt Pleasant has been a Calgary neighborhood since before the First World War. The Riley family homesteaded next door in 1888. We’ve been here for a fraction of that, but we’ve fed the regulars who walk their dogs in Riley Park for 50 years.",
    deliveryEta: "20–30 min" },

  { slug: "triwood", name: "Triwood",
    blurb: "Triwood is the family of three NW communities — Brentwood, Collingwood, and Charleswood — anchored by the Triwood Community Centre. At the base of Nose Hill Park.",
    crossStreets: "Around Charleswood Dr and 32 Ave NW",
    landmarks: ["Triwood Community Centre (multipurpose hall, ice rink, 2 ball fields)", "Canmore Park", "Nose Hill Park"],
    uniqueAngle: "Triwood orders go up on hockey practice nights — the Triwood arena is right in the middle of the community, and post-game pizza is a household tradition here.",
    deliveryEta: "20–30 min" },

  { slug: "confederation-park", name: "Confederation Park",
    blurb: "Wrapped around the park itself — Confederation Park covers over 400 acres of pathways, tennis courts, baseball diamonds, a wetland, and the City-owned Confederation Park Golf Course.",
    crossStreets: "Around 10 St NW and 30 Ave NW",
    landmarks: ["Confederation Park (400 acres)", "Confederation Park Golf Course", "tobogganing hill"],
    uniqueAngle: "Confederation Park is the green spine of NW Calgary. A long walk through the park is best finished with pizza on the deck. We can help.",
    deliveryEta: "20–30 min" },

  { slug: "beddington-heights", name: "Beddington Heights",
    blurb: "Established 1979, bounded by Berkshire Blvd, Beddington Trail, Beddington Blvd, and 14 St NW. West Nose Creek Park borders the community to the north.",
    crossStreets: "Off Beddington Trail NW",
    landmarks: ["West Nose Creek Park (73 hectares)", "Beddington Heights Community Association", "Nose Hill Park (southwest)"],
    uniqueAngle: "The Beddington pizza is named after this neighborhood — and the regulars who’ve been ordering it since the community was new. West Nose Creek Park to the north makes this one of the most underrated walking neighborhoods in the NW.",
    deliveryEta: "20–30 min",
    neighborhoodPizza: "the-beddington-pizza" },

  { slug: "macewan", name: "MacEwan",
    blurb: "Named after John Walter Grant MacEwan — former Calgary mayor and Lieutenant Governor of Alberta. The community is the only one directly attached to Nose Hill Park, bounded by Country Hills Blvd, 14 St NW, Shaganappi Trail, and the park itself.",
    crossStreets: "Off Country Hills Blvd NW",
    landmarks: ["MacEwan Glen Park (playgrounds, sports fields)", "Nose Hill Park (direct access)", "Country Hills Golf Course"],
    uniqueAngle: "MacEwan is one of the only NW communities where Nose Hill Park is literally your back fence. Call us, take the pizza outside, walk into one of Canada’s largest urban parks.",
    deliveryEta: "25–35 min" },

  { slug: "sandstone-valley", name: "Sandstone Valley",
    blurb: "Family neighborhood developed starting 1982, bounded by Country Hills Blvd, Beddington Trail, Berkshire Blvd, and 14 St NW. Nose Hill Park sits as the scenic backdrop.",
    crossStreets: "Off Sandstone Dr NW",
    landmarks: ["Nose Hill Park (backdrop)", "Sandstone Valley pathways", "West Nose Creek Park (south)"],
    uniqueAngle: "Sandstone Valley is one of NW Calgary’s newer family communities — quiet streets, good schools, and a clean shot at Nose Hill. Pizza on Friday night is a household ritual here.",
    deliveryEta: "25–35 min" },

  { slug: "highwood", name: "Highwood",
    blurb: "Quiet established community between Cambrian Heights and Confederation Park. Bottomlands Park (off-leash) and Egert’s Park are both close by, along with the full 400 acres of Confederation Park.",
    crossStreets: "Around 4 St NW and Northmount Dr NW",
    landmarks: ["Bottomlands Park", "Egert’s Park", "Confederation Park (400 acres)"],
    uniqueAngle: "Highwood is the quiet neighbor — sandwiched between three parks. Order, walk the dog, eat dinner, sleep well.",
    deliveryEta: "18–25 min" },

  { slug: "cambrian-heights", name: "Cambrian Heights",
    blurb: "Mature community adjacent to Confederation Park and within walking distance of Nose Hill Park. Quiet streets, established homes, and easy access to two of Calgary’s biggest green spaces.",
    crossStreets: "Around Cambrian Dr NW and 14 St NW",
    landmarks: ["Confederation Park", "Nose Hill Park", "Cambrian Heights Community Association"],
    uniqueAngle: "Cambrian Heights is what an established NW neighborhood looks like — mature trees, big lots, and pizza orders that are placed by the same families their kids grew up in.",
    deliveryEta: "20–30 min" },

  { slug: "collingwood", name: "Collingwood",
    blurb: "Established 1959, just north of Confederation Park. Quiet, family-friendly, with mid-century homes and mature trees. Part of the Triwood community.",
    crossStreets: "Around Collingwood Dr NW and Cambrian Dr NW",
    landmarks: ["Canmore Park (tennis, walking paths)", "Confederation Park (south)", "Confederation Park Golf Course (3204 Collingwood Dr NW)", "Triwood Community Centre"],
    uniqueAngle: "Collingwood has the Confederation Park Golf Course on its doorstep and Canmore Park inside the community — green space on two sides, pizza on speed dial.",
    deliveryEta: "20–30 min" },

  { slug: "banff-trail", name: "Banff Trail",
    blurb: "Northeast of Crowchild Trail and the Trans-Canada, east of McMahon Stadium and the University of Calgary. Established 1952 — originally called West Capitol Hill.",
    crossStreets: "Around 24 Ave NW and Crowchild Trail NW",
    landmarks: ["McMahon Stadium (home of the Calgary Stampeders)", "University of Calgary", "Banff Trail LRT station", "Jubilee Auditorium", "SAIT", "Motel Village"],
    uniqueAngle: "Banff Trail is the pizza neighborhood for Stampeders home games, U of C house parties, and anybody catching the LRT downtown. Game day delivery here gets busy — call early.",
    deliveryEta: "25–35 min" },

  { slug: "balmoral", name: "Balmoral",
    blurb: "Small inner-NW community around Balmoral School and the Centre St N / 16 Ave corridor. A quick run from our Thorncliffe kitchen.",
    crossStreets: "Around Centre St N and 20 Ave N",
    landmarks: ["Balmoral School", "Centre Street N corridor"],
    uniqueAngle: "Balmoral is small enough that our delivery driver knows most of the houses by name. Order, we’ll be there before the game starts.",
    deliveryEta: "20–30 min" },
];

// ----------------------------------------------------------------
// allPizzas — TOPS’s full pizza menu (extracted from topspizza.ca/pizza-menu)
// Each pizza has its own page so we can rank for "[pizza-name] Calgary" + "[pizza-name] NW Calgary"
// Pricing is per-pizza and lives outside this file (call to confirm).
// ----------------------------------------------------------------
export const allPizzas = [
  // ---- SIGNATURE DISHES (marked with ⭐ on the in-store menu) ----
  { slug: "tops-original", name: "TOPS Original", category: "signature", signature: true,
    ingredients: ["Pepperoni", "Mushrooms", "Bacon", "Green Peppers", "Olives", "Shrimp"],
    description: "The pizza Jim's mother made. Three generations of NW Calgary regulars have ordered the same pie.",
    prices: { personal: "18.95", medium: "24.95", large: "29.95", xlarge: "34.95" } },

  { slug: "the-thorncliffe-pizza", name: "The Thorncliffe", category: "signature", signature: true,
    ingredients: ["Meat Sauce", "Pepperoni", "Mushrooms", "Green Peppers", "Ham", "Olives", "Feta"],
    description: "Our signature pizza named for the neighborhood we've called home since 1975.",
    neighborhood: "Thorncliffe",
    image: "/assets/tops_pizza_the_thorncliffe.webp",
    prices: { personal: "18.95", medium: "24.95", large: "29.95", xlarge: "34.95" } },

  { slug: "the-huntington-pizza", name: "The Huntington", category: "signature", signature: true,
    ingredients: ["Feta", "Cheddar Cheese", "Tomatoes", "Banana Peppers", "Sausage"],
    description: "Named for Huntington Hills — cheese-forward with a kick from the banana peppers.",
    neighborhood: "Huntington Hills",
    prices: { personal: "18.95", medium: "25.95", large: "29.95", xlarge: "34.95" } },

  { slug: "the-beddington-pizza", name: "The Beddington", category: "signature", signature: true,
    ingredients: ["Pepperoni", "Beef", "Ham", "Green Peppers", "Tomatoes", "Shrimp"],
    description: "A Beddington Heights favorite, loaded for the whole crew.",
    neighborhood: "Beddington Heights",
    prices: { personal: "18.95", medium: "25.95", large: "29.95", xlarge: "34.95" } },

  { slug: "peters-pizza", name: "Peters Pizza", category: "signature", signature: true,
    ingredients: ["Olive Oil", "Tomatoes", "Feta", "Strip Bacon", "Parmesan", "NO Pizza Sauce", "NO Mozzarella"],
    description: "Named for Peter, Jim and Kristina's son. No sauce, no mozzarella — just olive oil, feta, bacon, and Greek soul.",
    prices: { personal: "18.95", medium: "25.95", large: "28.95", xlarge: "33.95" } },

  { slug: "the-spartan", name: "The Spartan", category: "signature", signature: true,
    ingredients: ["Donair Meat", "Onions", "Feta", "Olives", "Tomatoes", "Red Peppers", "Banana Peppers"],
    description: "Our Greek-rooted family on a pizza. Donair meat, feta, olives — the way the old country would have made it.",
    prices: { personal: "19.95", medium: "25.95", large: "29.95", xlarge: "34.95" } },

  { slug: "tops-pub-special", name: "TOPS Pub Special", category: "signature", signature: true,
    ingredients: ["Pepperoni", "Salami", "Mushrooms", "Onions", "Beef", "Bacon", "Ham", "Tomatoes", "Pineapple", "Green Peppers", "Olives", "Shrimp"],
    description: "Everything on the truck. The pizza that goes best with a cold pint and a hockey game.",
    image: "/assets/tops_pizza_pub_special.webp",
    prices: { personal: "23.95", medium: "28.95", large: "32.95", xlarge: "38.95" } },

  // ---- SPECIALTY / NAMED PIZZAS ----
  { slug: "bbq-cajun-chicken", name: "BBQ Cajun Chicken", category: "specialty",
    ingredients: ["Onions", "Bacon", "BBQ Cajun Chicken", "Red Peppers"],
    description: "Sweet, smoky, and just enough heat.",
    prices: { personal: "21.95", medium: "25.95", large: "28.95", xlarge: "33.95" } },

  { slug: "californian", name: "Californian", category: "specialty",
    ingredients: ["Marinara Sauce", "Spinach", "Onion", "Red Pepper", "Artichoke Hearts", "Feta", "Tomato", "Basil"],
    description: "Lighter pie, vegetable-forward — artichoke hearts and fresh basil. Good lunch option.",
    prices: { personal: "21.25", medium: "25.25", large: "28.25", xlarge: "33.25" } },

  { slug: "all-canadian", name: "All Canadian", category: "specialty",
    ingredients: ["Pepperoni", "Mushroom", "Bacon", "Ham", "Green Pepper"],
    description: "The TOPS take on Canada's national pizza.",
    prices: { personal: "21.25", medium: "26.25", large: "29.25", xlarge: "34.25" } },

  { slug: "chicken-alfredo", name: "Chicken Alfredo", category: "specialty",
    ingredients: ["White Sauce", "Spinach", "Mushroom", "Chicken", "Bacon", "Green Peppers"],
    description: "Creamy white-sauce pizza — a quiet menu favourite.",
    prices: { personal: "21.95", medium: "26.95", large: "29.95", xlarge: "35.95" } },

  { slug: "the-new-yorker", name: "The New Yorker", category: "specialty",
    ingredients: ["Sautéed Onions", "Mushrooms", "AAA Steak", "Strip Bacon", "Green Peppers", "Red Peppers"],
    description: "AAA steak, strip bacon, sautéed onions — big slices, bold flavours, no apologies.",
    prices: { personal: "24.95", medium: "28.95", large: "32.95", xlarge: "39.95" } },

  { slug: "greek", name: "Greek", category: "specialty",
    ingredients: ["Onions", "Green Peppers", "Tomatoes", "Feta", "Olives"],
    description: "Jim's nod to home. The dough recipe came from Greece — this pizza wears the heritage.",
    prices: { personal: "17.95", medium: "24.95", large: "27.95", xlarge: "31.95" } },

  { slug: "hawaiian", name: "Hawaiian", category: "specialty",
    ingredients: ["Ham", "Pineapple"],
    description: "Pineapple on pizza. Yes it counts. Yes we'll make it.",
    prices: { personal: "17.95", medium: "21.95", large: "26.95", xlarge: "30.95" } },

  { slug: "meat-lovers", name: "Meat Lovers", category: "specialty",
    ingredients: ["Pepperoni", "Salami", "Beef", "Bacon", "Ham"],
    description: "For the table that argues about toppings. This ends the argument.",
    image: "/assets/tops_pizza_beer_meat_lovers.webp",
    prices: { personal: "22.95", medium: "26.95", large: "30.95", xlarge: "35.95" } },

  { slug: "vegetarian", name: "Vegetarian", category: "specialty",
    ingredients: ["Onions", "Mushrooms", "Tomatoes", "Pineapples", "Green Peppers", "Olives"],
    description: "Six vegetables, real cheese, fresh dough. No fake meat needed.",
    prices: { personal: "17.95", medium: "24.95", large: "27.95", xlarge: "33.95" } },

  { slug: "cheese-lovers", name: "Cheese Lovers", category: "specialty",
    ingredients: ["Feta", "Mozzarella", "Cheddar Cheese"],
    description: "Three cheeses, one pizza. For the cheese-first eater.",
    prices: { personal: "17.95", medium: "24.95", large: "27.95", xlarge: "32.95" } },

  { slug: "popeye", name: "Popeye", category: "specialty",
    ingredients: ["Spinach", "Feta", "Spicy Chicken", "Tomatoes"],
    description: "Spinach and feta meet spicy chicken — heat with substance.",
    prices: { personal: "21.95", medium: "25.95", large: "28.95", xlarge: "34.95" } },

  { slug: "mexican", name: "Mexican", category: "specialty",
    ingredients: ["Onions", "Beef", "Tomatoes", "Jalapenos", "Cheddar", "Banana Peppers"],
    description: "Taco night, pizza night, same night.",
    prices: { personal: "18.95", medium: "25.95", large: "28.95", xlarge: "33.95" } },

  { slug: "spicy-jalapeno-sausage", name: "Spicy Jalapeño Sausage", category: "specialty",
    ingredients: ["Pepperoni", "Salami", "Onions", "Sausage", "Jalapeños"],
    description: "Heat-seekers, this one is yours.",
    prices: { personal: "17.95", medium: "24.95", large: "27.95", xlarge: "32.95" } },

  { slug: "the-italian", name: "The Italian", category: "specialty",
    ingredients: ["Pepperoni over and under the cheese"],
    description: "Pepperoni layered above AND below the cheese. Different bite top to bottom.",
    prices: { personal: "17.95", medium: "22.95", large: "27.95", xlarge: "32.95" } },

  // ---- CLASSIC / SIMPLE PIZZAS ----
  { slug: "cheese-pizza", name: "Cheese Pizza", category: "classic",
    ingredients: ["Mozzarella", "House-made tomato sauce"],
    description: "Just cheese, just right. Real Alberta-made mozzarella on our family-recipe sauce since 1975.",
    prices: { personal: "16.50", medium: "20.50", large: "25.50", xlarge: "28.50" } },

  { slug: "pepperoni-pizza", name: "Pepperoni", category: "classic",
    ingredients: ["Pepperoni", "Mozzarella"],
    description: "The pizza everyone orders at least once a month.",
    prices: { personal: "16.75", medium: "20.75", large: "25.75", xlarge: "29.75" } },

  { slug: "beef-and-onion", name: "Beef & Onion", category: "classic",
    ingredients: ["Seasoned Beef", "Onions", "Mozzarella"],
    description: "Simple, hearty, gets the job done.",
    prices: { personal: "16.75", medium: "20.75", large: "25.75", xlarge: "29.75" } },

  { slug: "pepperoni-and-mushroom", name: "Pepperoni & Mushroom", category: "classic",
    ingredients: ["Pepperoni", "Mushroom", "Mozzarella"],
    description: "The combination that never goes out of style.",
    prices: { personal: "16.75", medium: "20.75", large: "25.75", xlarge: "28.75" } },

  { slug: "pepperoni-mushroom-and-bacon", name: "Pepperoni, Mushroom & Bacon", category: "classic",
    ingredients: ["Pepperoni", "Mushroom", "Bacon", "Mozzarella"],
    description: "Bacon makes everything better.",
    prices: { personal: "17.95", medium: "21.95", large: "26.95", xlarge: "30.95" } },

  { slug: "pepperoni-mushrooms-and-green-peppers", name: "Pepperoni, Mushrooms & Green Peppers", category: "classic",
    ingredients: ["Pepperoni", "Mushrooms", "Green Peppers", "Mozzarella"],
    description: "A balanced Thursday-night order.",
    prices: { personal: "17.75", medium: "21.75", large: "26.75", xlarge: "30.75" } },
];

// Crust & topping pricing (from the in-store menu)
export const pizzaExtras = {
  glutenFreeCrust: { label: "Gluten Free Crust", availableOn: "Medium only", price: "3.00" },
  halfAndHalf:     { label: "Half & Half", availableOn: "Large and Extra Large only", price: "2.00" },
  thinCrust:       { label: "Thin Crust", availableOn: "Medium, Large, Extra Large", price: "3.00" },
  extraMeatCheese: { label: "Extra Meat or Cheese", prices: { personal: "2.75", medium: "3.25", large: "3.25", xlarge: "4.75" } },
  extraVegetable:  { label: "Extra Vegetable",      prices: { personal: "2.75", medium: "3.25", large: "3.25", xlarge: "4.75" } },
};

// Pizza size labels for display
export const pizzaSizes = [
  { key: "personal", label: "Personal", inches: "8in" },
  { key: "medium",   label: "Medium",   inches: "10in" },
  { key: "large",    label: "Large",    inches: "12in" },
  { key: "xlarge",   label: "Extra Large", inches: "14in" },
];

// ----------------------------------------------------------------
// dailySpecials — evergreen "what's the vibe on [day]" content
// Owner hasn't updated actual offer details in 1+ year, so these pages are
// designed to rank for "[day] specials NW Calgary" without depending on a
// specific offer. Each has a "call for tonight's specifics" CTA.
// ----------------------------------------------------------------
export const dailySpecials = [
  { slug: "monday-night-food-special", day: "Monday", title: "Monday at TOPS",
    h1: "Monday Night at TOPS Pizza & Sports Bar",
    description: "Easy Monday dinners in NW Calgary. Pizza, wings, and pub favourites at TOPS in Thorncliffe.",
    body: "Mondays at TOPS are easy. The crowd is thinner, the booths are open, and the kitchen still treats your pizza like it’s Friday. We pour cold pints, run our usual in-house specials, and turn the game on. Whether you’re killing time between meetings or kicking off the week with the family, TOPS is open from 11 AM past midnight.",
    cta: "Call for tonight’s pub-special details" },
  { slug: "tuesday-night-food-special", day: "Tuesday", title: "Tuesday Wing Night at TOPS",
    h1: "Tuesday Wings at TOPS Pizza & Sports Bar",
    description: "Tuesday wings in NW Calgary — 31 flavours, baked or breaded, in-house pub specials at TOPS Thorncliffe.",
    body: "Tuesday is wing day at TOPS. Thirty-one flavours from Suicide to Honey Garlic, salt-and-pepper to Montreal Spice. Bring the crew, order a pile, watch the game. We run pub-only specials Tuesday nights — the deal is too good to take home.",
    cta: "Call for tonight’s wing pricing" },
  { slug: "wednesday-night-food-special", day: "Wednesday", title: "Wednesday at TOPS",
    h1: "Wednesday Night at TOPS Pizza & Sports Bar",
    description: "Midweek pizza & pints in NW Calgary. Hump-day specials and a quiet booth at TOPS Thorncliffe.",
    body: "Get through the week. TOPS on a Wednesday is the move — quieter than the weekend, but every TV is still on, the kitchen is still hot, and the pub-only specials are still pouring. Bring a friend, split a pizza, leave happy.",
    cta: "Call for tonight’s in-house specials" },
  { slug: "thursday-night-food-special", day: "Thursday", title: "Thursday Night Football at TOPS",
    h1: "Thursday Nights at TOPS — Football & Pizza",
    description: "Thursday Night Football at TOPS in NW Calgary. 30+ TVs, cold beer, hot pizza.",
    body: "Thursday night football lands at TOPS. The big screens are on, the wings are flying out of the kitchen, the bar is humming. Walk in, grab a booth with a sightline, settle in for kickoff.",
    cta: "Call ahead for groups of 8+" },
  { slug: "friday-night-food-special", day: "Friday", title: "Friday Night at TOPS",
    h1: "Friday Night at TOPS Pizza & Sports Bar",
    description: "Kick off the weekend in NW Calgary — Friday pizza, wings, pints, sports at TOPS Thorncliffe.",
    body: "Friday is when TOPS earns its name in NW Calgary. The bar fills up, every TV has a game on, the pizza comes out of the oven faster than you can finish the last slice. Walk in any time from 10 AM until 2 AM Saturday morning.",
    cta: "Call ahead to save a booth for a group" },
  { slug: "saturday-night-food-special", day: "Saturday", title: "Saturday Game Day at TOPS",
    h1: "Saturday at TOPS — Game Day in NW Calgary",
    description: "Saturday game day at TOPS Pizza & Sports Bar in NW Calgary — CFL, NHL, UFC, pizza, cold beer.",
    body: "Saturday at TOPS is built for game day. CFL afternoons, NHL evenings, UFC pay-per-views on the back screens. Order The TOPS Original, get a pint, and stay through last call at 2 AM.",
    cta: "Big group? Call ahead — we’ll save the booth with the best sightline" },
  { slug: "sunday-night-food-special", day: "Sunday", title: "Sunday Family Night at TOPS",
    h1: "Sunday at TOPS — Family Dinner, NFL, Pizza",
    description: "Sunday at TOPS Pizza & Sports Bar in NW Calgary. NFL on the TVs, family pizza on the table.",
    body: "Sunday is family Sunday at TOPS. Kids are welcome in the dining room until 9 PM. NFL is on the screens for everyone else. Pizza, pasta, salads — order for the whole family, dine in or take home.",
    cta: "Pickup, delivery, or dine-in — call to order" },
  { slug: "happy-hour", day: null, title: "Happy Hour at TOPS",
    h1: "Happy Hour at TOPS Pizza & Sports Bar",
    description: "Happy hour drink and snack specials at TOPS Pizza & Sports Bar in NW Calgary’s Thorncliffe.",
    body: "Happy hour at TOPS runs weekday afternoons. Drink specials, snack deals, and a quiet bar before the dinner rush. The kind of spot where you can actually hear the conversation. Walk in, sit at the bar, ask what’s on today.",
    cta: "Call to confirm today’s happy-hour times" },
];

// ----------------------------------------------------------------
// menuCategories — landing pages for each menu section
// ----------------------------------------------------------------
export const menuCategories = [
  {
    slug: "pizza-menu", name: "Pizzas", short: "Pizzas",
    icon: "🍕",
    description: "Hand-tossed pizzas made fresh daily from a family recipe rolled out since 1975. Real Alberta mozzarella, in-house sauce, and toppings worth their weight.",
    note: "See the full pizza menu — all 27 pies — for ingredients, sizes (Personal 8\" / Medium 10\" / Large 12\" / Extra Large 14\") and pricing.",
    // Pizzas live in allPizzas, this category page just links to that list
    linksToList: true,
  },

  {
    slug: "appetizers", name: "Appetizers", short: "Apps",
    icon: "🍗",
    description: "Wings (31 flavours), Greek mezedes, boneless dry ribs, steak bites, nachos supreme, bread stix. The TOPS lineup of starters and shareables.",
    items: [
      { name: "Chicken Wings", price: "16.95", signature: true,
        description: "Golden fried wings, tossed in one of our many flavors (see the wing-flavours list below).",
        addOns: [{ name: "Ranch Dip", price: "1.50" }] },
      { name: "Boneless Dry Ribs", price: "16.95",
        description: "Marinated for 24 hours in our home-made marinade. Served with ranch dip.",
        visualHint: "Loose pile of irregular hand-cut deep-fried pork chunks in the COUNTRY-STYLE-RIB cut: thick chunky strips and rough rectangular pieces about 1.5 to 3 inches long, varied widths, hand-butchered look — NOT bite-sized cubes and NOT actual rib bones. Golden-brown deep-fried crispy exterior with visible reddish-brown dry seasoning (paprika, salt, pepper, garlic powder) clinging to the pieces. Pieces of varied sizes piled loosely on a white pub plate with a small white ramekin of creamy ranch dip on the side. Western Canadian pub style — looks like deep-fried pork shoulder country-style ribs, hand-cut into rustic chunks of irregular shapes.",
        photoQuality: "ai-weak", // AI keeps generating uniform breaded chunks — replace with real photo from Peter ASAP
      },
      { name: "Potato Skins", price: "16.95",
        description: "Four crispy baked potato skins, filled with bacon, cheese, fresh tomatoes and green onion. Served with sour cream." },
      { name: "Greek Mezedes", price: "17.99", signature: true,
        description: "Succulent pieces of AAA Top Sirloin perfectly seared and seasoned in our family secret marinade. Served with garlic toast.",
        visualHint: "Sliced or cubed seared AAA sirloin steak with golden-brown crust, plated on a white plate with two thick triangles of golden garlic toast alongside. NOT a Greek tapas/meze platter — this is a single-item sirloin appetizer." },
      { name: "Steak Bites", price: "17.99",
        description: "Succulent pieces of Top Sirloin perfectly seared and seasoned, served with our spicy mayo dip." },
      { name: "Calamari", price: "17.99",
        description: "Crispy and tender calamari with sweet red onion and our authentic homemade tzatziki dip." },
      { name: "TOPS Poutine", price: "13.99",
        description: "French fries topped with melted mozzarella cheese and gravy." },
      { name: "Chicken Fingers", price: "17.50",
        description: "Breaded chicken tenders served with a mountain of fries. Served with plum sauce." },
      { name: "Bread Stix", price: "15.50",
        description: "Oven baked, topped with garlic butter, a pinch of salt, and parmesan cheese. Served with our homemade marinara sauce.",
        visualHint: "Pizzeria-style bread sticks: rectangular strips of golden-brown oven-baked pizza dough about 6 inches long, brushed with garlic butter, sprinkled with parmesan, arranged in a row on a wooden board with a small bowl of red marinara dipping sauce.",
        addOns: [{ name: "Mozza Cheese", price: "3.95" }] },
      { name: "Onion Rings", price: "12.95",
        description: "Served with our spicy mayo sauce." },
      { name: "Nachos Supreme", price: "24.50",
        description: "Hand-cut corn tortillas baked with mozzarella and aged cheddar cheese. Topped with tomatoes, jalapeños, onions, and black olives. Served with sour cream and salsa on the side.",
        addOns: [
          { name: "Ground Beef", price: "3.95" },
          { name: "Extra Cheese", price: "3.95" },
        ] },
    ],
  },

  {
    slug: "soups--salads", name: "Soups & Salads", short: "Salads",
    icon: "🥗",
    description: "Fresh salads with imported Greek ingredients, house-made soup, and our signature Greek Salad — straight-from-Greece feta, olives, and olive oil.",
    items: [
      { name: "Market Soup", price: "8.95",
        description: "Ask your server for today's soup of the day." },
      { name: "TOPS Greek Salad", price: "17.95", signature: true,
        description: "An authentic Greek salad is hard to find in Calgary — but not at TOPS. Imported Greek barrel feta cheese, Kalamata olives, and Greek extra virgin olive oil, straight from Greece. Fresh tomatoes, cucumbers, green peppers and red onions. Served with warm pita bread and our home-made tzatziki." },
      { name: "Caesar Salad", price: "14.50",
        description: "Fresh romaine lettuce, homemade croutons, crispy bacon, and grated parmesan." },
      { name: "Calamari Salad", price: "24.50", signature: true,
        description: "Greek-style tender calamari resting on top of our famous Greek salad. With our imported ingredients directly from Greece. Served with warm pita bread and our home-made tzatziki." },
    ],
  },

  {
    slug: "burgers--sandwiches", name: "Burgers & Sandwiches", short: "Burgers",
    icon: "🍔",
    description: "Hand-formed burgers, classic sandwiches, donairs. Cooked the way pub food should be.",
    note: "All selections come with your choice of Fries or Soup of the Day. Substitute side for Greek Salad, Caesar Salad, Yam Fries, or Onion Rings for $3.95.",
    items: [
      { name: "6oz Steak Sandwich", price: "21.00",
        description: "AAA premium Alberta beef, seasoned and charbroiled to your liking, served on garlic toast.",
        addOns: [{ name: "9oz Top Sirloin upgrade", price: "26.00" }] },
      { name: "Beef Dip", price: "19.95",
        description: "Shaved prime rib on a torpedo bun, served with au jus, just for dipping." },
      { name: "TOPS Twin Burger", price: "26.95", signature: true,
        description: "Twin patties, twin bacon, twin onion rings and twin cheddar cheese, topped with our spicy mayo." },
      { name: "Big Cheddar Bacon Burger", price: "20.50",
        description: "Melted cheddar, glazed with BBQ and double bacon." },
      { name: "BAM!N Burger", price: "19.95",
        description: "Melted mozzarella cheese and sautéed mushrooms." },
      { name: "Spicy Chicken Bacon Burger", price: "19.95",
        description: "Breaded chicken breast, melted cheddar, glazed with Franks Hot Sauce and ranch sauce." },
      { name: "Quesadilla", price: "19.95",
        description: "Grilled chicken breast, onions, fresh tomatoes, green peppers. Blended with cheddar and mozzarella cheese in an oven-baked flour tortilla. Served with salsa and sour cream." },
      { name: "Clubhouse", price: "20.95",
        description: "Grilled chicken breast, bacon, tomato, lettuce, cheddar cheese and mayonnaise, stacked on a triple-decker of golden toast." },
      { name: "Philly Cheese Steak", price: "21.95",
        description: "Shaved prime rib, grilled fresh red peppers, green peppers, onions, cheddar cheese, and glazed in our own Philly steak sauce." },
      { name: "Donair", price: "18.95", signature: true,
        description: "Shaved donair meat, seasoned and wrapped in a warm pita. Filled with fresh tomatoes and red onion, covered in our homemade tzatziki.",
        visualHint: "Halifax/Calgary-style donair: shaved spiced ground beef rolled in a warm white pita, filled with diced tomatoes and red onions, drizzled generously with creamy white tzatziki sauce, tightly wrapped so the filling shows at one cut end, served on parchment paper on a plate." },
    ],
  },

  {
    slug: "pastas", name: "Pastas", short: "Pasta",
    icon: "🍝",
    description: "Comfort-food pastas. Family-recipe meat sauce, real cream sauces, oven-baked.",
    note: "All our pastas are served with garlic bread. You can add meatballs for $4.95, or have it oven baked in mozza cheese for $3.95.",
    items: [
      { name: "TOPS Lasagna", price: "17.95", signature: true,
        description: "Our famous lasagna — layers of noodles smothered in our home-made meat sauce, covered in mozzarella cheese, then oven baked." },
      { name: "TOPS Spaghetti", price: "15.95",
        description: "Spaghetti noodles covered in our home-made meat sauce." },
      { name: "Fettuccini Chicken Alfredo", price: "23.95",
        description: "Fettuccini noodles reduced in a creamy cream sauce with grilled chicken." },
      { name: "Spaghetti Italiano", price: "17.95",
        description: "Italian sausage and our home-made meat sauce." },
      { name: "Louisiana Chicken Pasta", price: "23.95",
        description: "Penne pasta, spinach and chicken in a creamy rosé sauce combined with southern flavours. Served with garlic bread." },
      { name: "Bacon Mac N Cheese", price: "21.95",
        description: "Smoked bacon, penne noodles baked in a creamy sauce, oven baked with a cheddar and mozza cheese top." },
    ],
  },

  {
    slug: "tops-classics", name: "TOPS Classics", short: "Classics",
    icon: "🇬🇷",
    description: "The dishes Jim's been making since 1975. Pub-classic comfort plates.",
    items: [
      { name: "Fish and Chips", price: "23.95", signature: true,
        description: "Our fish is beer-battered, served with our home-made tartar sauce and fries." },
      { name: "Pepper Steak", price: "24.95",
        description: "Tender beef, onions, tomatoes, green peppers and mushrooms all sautéed in our delicious sauce. Served with rice on the side and pita bread." },
      { name: "Veal Cutlet", price: "23.95",
        description: "Baked breaded veal, topped with our delicious gravy. Served with garlic toast, vegetables, and fries." },
    ],
  },

  {
    slug: "desserts", name: "Desserts", short: "Desserts",
    icon: "🧁",
    description: "Italian classics to finish off the meal.",
    items: [
      { name: "Tiramisu", price: "9.95",
        description: "Lady finger biscuits dipped in espresso, with mascarpone cheese mousse, topped with cocoa sugar." },
      { name: "Blackout Torte", price: "9.95",
        description: "Moist chewy cake filled and covered with chocolate truffle cream. Decorated with Belgian chocolate cream nestled in a fudge crepe." },
    ],
  },
];

// Wing flavors — 31 total per the menu (21 saucy + 10 dry)
export const wingFlavors = {
  saucy: ["Suicide", "Hot", "Medium", "Mild", "Spicy BBQ", "Spicy Parmesan", "Honey Hot", "Greek", "Zesty Greek", "Spicy Greek", "BBQ", "Teriyaki", "Teriyaki Hot", "Honey Garlic", "Chili Lime", "Chipotle", "Pineapple Currie", "Honey Mustard", "Jamaican Jerk", "Sweet Chili", "Hot Mustard"],
  dry: ["Salt & Pepper", "Salt & Vinegar", "Lemon Pepper", "All Dressed", "Dill Pickle", "Tex Mex", "Nacho", "White Cheddar", "Cajun", "Montreal Spice"],
};
