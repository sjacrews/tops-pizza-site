# RESOLVED 2026-09-15. Guard retired. Nothing here blocks a deploy.

This file existed to stop a VLT removal shipping before the AGLC question was answered.
The question is answered, the removal shipped, **and then Steve reversed it.** Final state
below. Read it before touching anything VLT related, so this does not get flip-flopped again.

## FINAL STATE: VLT references are ON the site, by Steve's decision

**Steve, 2026-09-15:** *"Put the vlt references back on the website. We were a little too
heavy handed to remove them."*

Restored in all six places plus two data files:
1. the Will C. customer testimonial (homepage)
2. the sports-bar FAQ answer
3. the sports-bar feature copy
4. the About history paragraph
5. the sports-bar meta description
6. the "While You're Here" list item
plus `llms.txt` and the `amenities` array in `src/site.config.js`.

## What the handbook actually says, and where I was WRONG

Archived: `~/workspace/projects/tops-pizza-citations/AGLC-liquor-licensee-handbook-2026-09-10.pdf`
plus the extracted clauses. Handbook edition dated **2026-09-10**.

**Real and in-section, s.10.20.3:** *"With the exception of providing free food or
non-alcoholic beverages to players as a means of 'customer service', proposed advertising or
promotional materials must be approved in advance by AGLC."* A prior-approval rule.

**MY OVERSTATEMENT, corrected.** I told Steve the handbook "defines advertising to include
websites". That definition is **s.7.1.1(a)**, which opens *"For all of Section 7:"* and
Section 7 is the **LIQUOR** advertising section. **Section 10 (Video Lottery) has its own
definitions list, h) through w), and never defines "advertising" at all.** So the definition
I leaned on does not formally govern the VLT rules. That was the load-bearing part of my
argument and it does not hold.

**Ambiguous, s.10.20.4(h):** advertising must not *"be placed on any AGLC non-regulated
websites or websites with a direct link to an AGLC non-regulated gaming site (free or pay)
or 'fantasy sports' sites."* Readable as "any site AGLC does not regulate" OR as
gaming/fantasy-sports sites only. The text does not settle it.

**The decisive gap:** the handbook nowhere distinguishes MENTIONING an amenity from
ADVERTISING it. Steve's reading is not excluded anywhere; it simply is not addressed.

**To settle it for real:** AGLC Customer Care **1-800-561-4415**, retailnetworks@aglc.ca
(handbook s.10.25). Peter is the retailer, so it is his call to make. He has NOT been asked.

## Supporting data

Calgary search volume, DataForSEO 2026-09-15: **"vlt near me" 1,000/mo, LOW competition**;
"vlt"/"vlts" 390/mo each; "vlt calgary" 70/mo but with a **$22.27 CPC**. There is real
commercial intent behind the term, which supports Steve's "too heavy handed" read.

## The standing rule on the testimonial

The Will C. quote is **either verbatim or gone. Never trimmed.** I deleted the word VLTs from
inside it while still presenting it as his exact words, which is misrepresentation. Verbatim
original preserved at `build.js.bak-vlt-230522` line 452.

## Also shipped today, unrelated and CORRECT, do not revert

- **Wing count 50 -> 31**, confirmed by Peter. NOTE: the backup line that carries the VLT text
  also carries "Wings (50 flavours)", so a wholesale revert to `build.js.bak-vlt-230522`
  re-introduces the wrong number. Restore VLT lines surgically, never by file copy.
- **Aggregate rating 4.3/209 -> 4.2/221**, measured from the Places API. Feeds schema.org.

## Deploy gotchas that cost real time today

- CF Pages project is **`tops-pizza-site`**, NOT `tops-pizza`. Recorded in
  [[reference-site-deploy-map]] and in this repo's `package.json`.
  `npx wrangler pages deploy dist --project-name=tops-pizza-site --branch=main --commit-dirty=true`
- **WebFetch 502s on every aglc.ca URL.** Use `curl` with a Mozilla UA.
- Guessed `/documents/*handbook*.pdf` filenames all 404: they are HTML pages. Route in is
  `aglc.ca/sitemap.xml` -> `/documents/liquor-licensee-handbook` -> the PDF linked on it.
- Never put explanations in HTML comments inside the template. One of mine shipped into
  dist/index.html carrying the exact string the whole exercise was about.
