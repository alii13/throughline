---
name: scroll-story-site
description: Build a landing page or homepage as one scroll-driven story told inside a persistent Three.js 3D world (the method behind tokenproof.pages.dev). Use this whenever the user wants a "3D homepage", "scrollytelling", "a site that tells the product's story as you scroll", "chapters", "like the tokenproof site", a hero object that travels through scenes, or any premium product landing page where plain sections would feel generic. Also use it when the user hands you a storyline, a chapter list or a set of screens and wants a site built from it. Covers deriving the story, the carrier object, the palette and the scenes from the product (so every site is its own), the scroll conductor, chapter poses as data, copy panels that never cut off, the no-WebGL fallback, and the screenshot sweep that proves it works at every size.
---

# Scroll story site

One page, one story, one 3D world. Native scroll is the only control: each chapter of the story is a
station in the world, the camera glides between stations as the reader scrolls, and a single
"carrier" object (the product's own thing made solid) travels through every scene and lands on the
real product at the end. Copy crossfades while the camera travels, so no scene is ever shown without
its words and no words without their scene.

Two halves. The **plumbing** (scroll conductor, page contract, fit script, fallback, sweep) is
solved and lives in `assets/`; reuse it as is. The **story** (carrier, palette, material family,
arc, every scene, the copy) is derived from the product every time; `references/variation.md` is
the derivation and `references/scene-cookbook.md` the build patterns. The user will bring
different products, different storylines, different objects and different screens. If the result
could be tokenproof with the words swapped, the derivation was skipped.

## The method

Work in this order. Each step has a check; don't move on until it passes.

### 1. Derive the story from the product, before any code

Read `references/variation.md` first. Then ask for, or draft, the storyline as a table, one row per
chapter, 6 to 12 rows including a hero and a close. Every row answers three things:

| # | Headline (what the reader learns) | Subject (the one object in the scene) | What the carrier does there |
|---|---|---|---|
| 0 | hero: the promise | the carrier itself, large | sways, invites a drag |
| 1 | the problem | the bad version, as an object that fails | watches |
| … | mechanism, proof, objection, payoff, scope, price, as the pitch needs | … | … |
| n | close | the carrier, centred | rests |

Decide, and write down, before building:

- **The carrier.** What single object does this product put into the world, protect, move or stamp?
  (A seal for a proof tool, a key for auth, a packet for infra, a lens for analytics, a coin for
  payments, a film frame for video.) Build the brand's logo into it if there is one. It must read
  at hero size and at landing size.
- **The palette and material family.** Background leaning toward the brand hue; accent as the
  brand's primary at glow intensity; one "money" colour used once. Cool steel is one of four
  families in `variation.md`, not the default for everything.
- **The arc.** Pick by what the reader must believe by the end (trusted / faster / connects /
  beautiful / protects / a device). The arc table in `variation.md` gives chapter counts and
  orders. Fewer chapters beat padded ones.
- **The one example threaded through.** A single concrete thing (one reply, one request, one file)
  that each chapter does something to, named in the copy and in the rail if there is one.

Rules that make any story work:

- **One subject per chapter.** Two objects compete; the reader's eye and the copy both lose.
- **The carrier has a job in every chapter.** A chapter it only watches is a feature, not a beat.
- **Each headline is one sentence with one `<em>` phrase** (the gradient). Body two or three
  sentences. More won't fit a phone at any type size.
- **Hero copy left, world right**, unless the product's artefact is itself wide and horizontal.
- **End on solid ground.** After the last chapter, a normal section: what it does and doesn't do,
  FAQ, footer.

Check: read the table top to bottom as a paragraph. It should read as one story about one thing,
and no row should be explained by "the template had it". Show the table to the user before
building; it's cheap to change now and expensive after.

### 2. Set up the page from the template

Copy `assets/index.template.html` and `assets/world.template.js`. The page is the contract the
world relies on; keep these parts and read `references/page-contract.md` before changing them:

- `<section class="ch" data-ch="N">` per chapter, in order, as **scroll spacers** (210vh each, the
  hero 170vh, the close 130vh). Their only job is to give the scroll a length.
- Inside each, `.copy > .panel` with the `<h2>` and `<p class="sub">`. With `.webgl` on `<html>`
  every `.copy` is `position: fixed` and crossfades on `--op`; without it they're sticky, so the
  page still reads as a plain article.
- `<script id="tp-data" type="application/json">` carries whatever the world needs from the server
  (real numbers, an artefact as a data URL). The world never fetches.
- The `--fit` script scales each panel's type until it fits between nav and bottom padding; it
  reruns on resize and when the world adds `.webgl`.
- The poster fallback shows only on `html:not(.js)` or `.nowebgl` (set by a 5 s timeout if the
  world never drew). Never while loading, or the reader sees a flat logo flash.

Replace the template's colours, type and copy with the derived palette and story now, not at the
end. Check: with `world.js` not yet loaded, the page reads top to bottom as a plain article in the
product's own colours.

### 3. Build the world, one station per chapter

Station `c` is a `THREE.Group` at `x = c * STATION`; everything in a scene is local to its group;
`stations[c].visible = |at - c| < 0.985` means only the current and neighbouring stations exist on
any frame. Build in this order:

1. **Studio and materials.** `studio()` bakes the environment map that lights every metal (the
   single biggest reason surfaces look expensive). Swap `M` for the derived family from
   `variation.md`; keep one family per site. Warm or tint the studio's cards to match.
2. **The carrier**, in `carrierObject()`, centred, with its own cloned body material so one
   chapter can recolour it. Added to `scene`, never to a station. Delete the placeholder medallion.
3. **One station per row of the table.** Delete both placeholder stations. For each scene find the
   nearest pattern in `references/scene-cookbook.md` (fourteen built and shipped: shatter, stream,
   stamp, chain, scan, glass, landing, tiles, devices, loop, and the timing patterns) and rebuild it
   around the product's own subject. Canvas textures for anything with text or a logo; `InstancedMesh`
   for anything repeated; keep a station under ~60 lines plus ~15 in the frame loop.
4. **The chapter poses, as data.** `CHAPTERS[c] = { md, off, yo, cam, target, carrier: { p, r, s } }`,
   all station-relative. Tune at 1440×900 with the copy column on the left: the subject sits in the
   right 53%. `off` keeps that on narrower desktops; `md` pulls back on phones; `yo` drops the
   frame on phones.
5. **The landing.** In the payoff chapter the carrier sits on the real artefact at the exact spot
   the artefact shows it, computed from the artefact's own pixel coordinates (see the cookbook,
   section 10, and gotchas). This is the story's payoff; get it exact.

Check: scrub through each chapter (`sNow` in the console) at 1440, 1180 and 1024 wide. Subject in
the right half, carrier doing its job, no placeholder geometry left anywhere.

### 4. Tune the conductor

The conductor is written; understand it before touching it (`references/world-architecture.md`
has every formula and why). The feel is four numbers, tuned over many rounds of "too fast", "feels
stuck", "floats":

- **Smoothing 0.2 s on wall time.** Lower snaps, higher floats.
- **HOLD 0.3**: the camera settles for the first 30% of a chapter's scroll, then glides. This is
  what lets the reader read.
- **PUSH 0.07**: during the hold the camera eases 7% closer, then back out over the glide. This is
  the fix for "stuck": without it the hold is a dead zone where scrolling does nothing visible.
- **ACT 0.6**: each scene's action finishes by 60% of its chapter, before the camera leaves.

Change one at a time and show the user; feel is theirs to judge, in short phrases. Don't batch feel
changes.

Check: scroll top to bottom at a steady pace. Nothing feels stuck, rushes, pops or teleports.
Scroll back up: every action reverses cleanly.

### 5. Prove it with a screenshot sweep

Run `scripts/sweep.sh <url> <absolute_out_dir>`. It opens the page headless at 1440×900, 1180×800,
1024×768 and 390×844, scrolls into every chapter's hold, and screenshots each plus the after
section. Look at every image for copy cut off under the nav or past the bottom, copy overlapping
the subject, the carrier missing its landing, and the hero figure hidden on the shortest height.
Fix in this order: copy length, then `off`/`md`/`yo`, then the pose. Delete the screenshots once
clean, then scroll it yourself in a real browser for feel.

### 6. Finish and check sameness

- Reduced motion: `t` stops, no flight arc, smoothing off, page effects skip.
- Head: title, description, canonical, Open Graph and Twitter `summary_large_image` with a 1200×630
  `og.png`, JSON-LD for the product (and FAQPage if there's a FAQ), `robots.txt`, sitemap.
- Performance: Three.js pinned via the import map; every station compiled and every texture
  uploaded before the first frame; the loop stops when the tab is hidden or the after section
  covers the screen.
- Run the **sameness check** at the end of `references/variation.md`. Two or more "same as
  tokenproof" answers means back to step 1.

## When a chapter needs something new

In order: a CSS effect in the copy panel (a counting number, a beam round a card) before a 3D one;
an `InstancedMesh` before many meshes; a canvas texture before an image; a new station before a
conductor change. The conductor is the last thing to edit.

## Files

- `assets/index.template.html`: the page contract with four chapters and the after section. Plumbing
  plus placeholder copy and the default palette; everything visible gets replaced.
- `assets/world.template.js`: studio, the cool-steel family, a placeholder carrier, two placeholder
  stations, the full conductor. Runs as is; the placeholders are deleted, never shipped.
- `scripts/sweep.sh`: the screenshot sweep.
- `references/variation.md`: deriving carrier, palette, material family, arc and scenes from the
  product; the sameness check. Read first.
- `references/scene-cookbook.md`: fourteen shipped scene patterns with code and timing.
- `references/world-architecture.md`: every formula in the conductor and why.
- `references/page-contract.md`: the CSS/HTML the world depends on, the fit script, fallback, mobile.
- `references/story-patterns.md`: the tokenproof arc as one worked example, headline and copy rules,
  and what got pushed back on.
- `references/gotchas.md`: the mistakes already made once.
