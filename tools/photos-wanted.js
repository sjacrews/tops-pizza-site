// ============================================================
// tools/photos-wanted.js
// ------------------------------------------------------------
// Prints a list of menu items where AI photos are weak and Peter
// should take real ones. Tag items in site.data.js with:
//   photoQuality: "ai-weak"
// Run: node tools/photos-wanted.js
// Output is plain text — paste into a text to Peter or print.
// ============================================================
import { menuCategories } from "../src/site.data.js";
import { allPizzas } from "../src/site.data.js";

console.log("\n📸  TOPS Photos Wanted — please send real photos of these items:\n");

let count = 0;
for (const cat of menuCategories) {
  if (!cat.items) continue;
  const weak = cat.items.filter(i => i.photoQuality === "ai-weak");
  if (weak.length === 0) continue;
  console.log(`${cat.name}:`);
  for (const item of weak) {
    console.log(`  • ${item.name} ($${item.price})`);
    count++;
  }
  console.log("");
}

const weakPizzas = allPizzas.filter(p => p.photoQuality === "ai-weak");
if (weakPizzas.length) {
  console.log("Pizzas:");
  for (const p of weakPizzas) {
    console.log(`  • ${p.name}`);
    count++;
  }
  console.log("");
}

if (count === 0) {
  console.log("  (none right now — all photos are either acceptable or already real)\n");
} else {
  console.log(`Total: ${count} items wanted.`);
  console.log("\nWhen Peter takes the photos, he can upload via:");
  console.log("  https://tops-pizza-site.pages.dev/owner/  → Send Us a Photo section\n");
}
