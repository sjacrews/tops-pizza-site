# tools/references/

Drop reference photos here for items where the AI needs visual guidance.

## How to use

1. Find a good reference photo (Google Images, food blog, etc.). Save it to this folder with a clear filename like `boneless-dry-ribs-reference.jpg`.
2. In `src/site.data.js`, add a `referenceImage:` field to that item:

```js
{ name: "Boneless Dry Ribs", price: "16.95",
  description: "...",
  visualHint: "...",
  referenceImage: "boneless-dry-ribs-reference.jpg",  // <-- filename inside tools/references/
},
```

3. Regenerate just that one item:

```
node tools/generate-menu-images.js --item=boneless-dry-ribs --overwrite
```

The script reads the reference, attaches it to the Gemini API call as multimodal input, and prepends a prompt instruction to "use the attached reference image as your guide."

## What makes a good reference

- The actual dish you want (TOPS-style boneless ribs, not generic ribs)
- Decent lighting, clear view of the food
- Roughly similar plating style to what you want generated
- JPG, PNG, or WebP — any reasonable size

## Don't commit reference images to git

Reference photos are usually pulled from other sites and shouldn't be redistributed. Add a `.gitignore` line if you want to be careful:

```
tools/references/*.jpg
tools/references/*.jpeg
tools/references/*.png
tools/references/*.webp
!tools/references/README.md
```
