# tools/

One-off helper scripts. Not part of the build pipeline — run manually as needed.

## generate-menu-images.js

Generates appetizing food photography for menu items using Google's Gemini 2.5 Flash Image model ("Nano Banana"). Saves output to `assets/menu/<slug>.webp`.

### Setup

1. Get a free Gemini API key: https://aistudio.google.com/apikey
2. Set the env var:

   - **Windows (cmd)**: `set GEMINI_API_KEY=your_key_here`
   - **Windows (PowerShell)**: `$env:GEMINI_API_KEY="your_key_here"`
   - **macOS/Linux**: `export GEMINI_API_KEY=your_key_here`

3. (Optional but recommended) Install `sharp` for webp conversion:

   ```bash
   npm install sharp
   ```

   Without `sharp`, the script saves PNGs instead of webp (~3-5x larger files but still works).

### Usage

From the `tops-pizza-site` folder:

```bash
# Generate for ALL menu items missing images
node tools/generate-menu-images.js

# Only one category
node tools/generate-menu-images.js --category=appetizers

# Only one specific item
node tools/generate-menu-images.js --item=tops-poutine

# Cap total to test
node tools/generate-menu-images.js --limit=3

# Regenerate ones that already exist (overwrites)
node tools/generate-menu-images.js --overwrite
```

### Costs

- **Gemini free tier**: typically 10 requests/minute, ~1,500/day. Plenty for menu generation.
- **Paid tier** (if you exceed free): a fraction of a cent per image.
- ~30 menu items at ~1 image each = under $1 even at retail pricing.

### After generation

The script prints suggested `image:` config lines for each item it generated. Paste them into the matching entries in `src/site.data.js`, then:

```bash
node build.js
npm run deploy
```

The new images go live. Replace any with real photos later via the `/owner/` portal upload flow when Peter sends them.

### Notes on prompt quality

The prompt template is in `generate-menu-images.js` under `buildPrompt()`. It aims for:
- Pub/restaurant setting (not pristine studio)
- Overhead 3/4 angle (most appetizing for food)
- Warm overhead lighting
- Bokeh sports-bar background

If a generated image isn't great, regenerate just that one with `--item=<slug> --overwrite`, or tweak the prompt template and re-run.
