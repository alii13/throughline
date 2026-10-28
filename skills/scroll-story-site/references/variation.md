# Variation: making each site its own

The conductor, the page contract and the fit script are plumbing; they stay. Everything the reader
actually sees is derived from the product, and if two products come out looking alike the derivation
was skipped. This file is the derivation.

## What stays and what must change

| Stays (plumbing) | Changes every time (derived from the product) |
|---|---|
| scroll conductor, HOLD/PUSH/ACT, smoothing | the carrier: shape, size, what it's made of |
| stations along x, culling, precompile | the palette: background, ink, accent, the "money" colour |
| copy crossfade, fit script, fallback | the material family (cool steel is one of several) |
| chapter poses as *data* | the pose values themselves, tuned per scene |
| the screenshot sweep | the arc: how many chapters, which beats, in what order |
| | every scene's subject and action |
| | the hero's live figure (or none), the rail's stages (or no rail) |
| | the after section's two columns, FAQ, footer |
| | type: the system stack is a default, not a rule |

The placeholder stations in the template (a shattering card, a stream through the carrier) are
there so the file runs. Shipping either one unchanged is a bug.

## Deriving the carrier

The carrier is the product's own thing made solid. Ask: *what single object does this product put
into the world, or what does it protect, move, or stamp?* Then give it a material that matches what
it does.

| Product kind | Carrier candidates | Why |
|---|---|---|
| proof / verification / signing | a seal, a medallion, a wax stamp, a notary's embosser | it stamps things; it can land on the artefact it certifies |
| auth / access / secrets | a key, a keycard, a padlock shackle that opens | it unlocks scenes; it can fit a lock in the payoff chapter |
| payments / fintech | a coin, a card, a receipt that prints | it flips, it drops into a slot, it tallies |
| networking / infra / data pipelines | a packet, a glowing envelope, a capsule | it travels through pipes, queues, gates |
| analytics / observability | a lens, a probe, a prism that splits light into bars | it looks at things and reveals them |
| messaging / collaboration | a paper plane, a speech bubble made solid, a tile | it is delivered, it lands on a board |
| design / creative tools | a brush, a pen nib, a swatch chip, a frame | it draws the scene it's in |
| video / media | a film frame, a lens element, a reel | it captures, it projects |
| AI agents / automation | a small robot core, a spark, a token cube | it executes the steps |
| health / fitness | a pulse ring, a capsule, a heart line made solid | it beats, it measures |
| hardware / devices | the device itself, small | it boots, it docks |
| education / knowledge | a page, a card that flips, a lightbulb filament | it is learned, it lights |

Rules: one object, centred geometry, readable at 0.08 scale (it will be small when it lands) and at
1.0 (hero). If the brand has a logo, build the logo *into* the carrier (the tube path on the
tokenproof medallion), don't paste it on as a texture. Build it in `carrierObject()` and keep the
cloned body material so a chapter can recolour it.

## Deriving the palette and material family

Start from the brand's colours. Pick a near-black background that leans toward the brand hue
(`#06080b` is blue-black; a warm brand wants `#0b0806`; a green one `#060b08`). The accent is the
brand's primary at high intensity for glows (`setRGB` values above 1 with `toneMapped: false`). The
"money" colour (used once, for the price) is a second metal that contrasts the family.

Four families that work with the studio env map. Swap `M` for one of them; don't mix two.

**Cool steel** (default; trust, security, precision):
steel (roughnessMap brushed, 0.72 grey), chrome (0.06 roughness), enamel in the brand colour
(clearcoat 1), dark bodies (near-black clearcoat), glass for "not yet". Money colour: gold.

**Warm brass and copper** (finance, craft, heritage, anything that should feel earned):
```js
brass:  new THREE.MeshPhysicalMaterial({ color: linear(0.85, 0.62, 0.28), metalness: 1, roughness: 0.3, roughnessMap: brushed(), envMap: env }),
copper: new THREE.MeshPhysicalMaterial({ color: linear(0.88, 0.42, 0.28), metalness: 1, roughness: 0.18, envMap: env }),
leather: new THREE.MeshPhysicalMaterial({ color: linear(0.08, 0.05, 0.035), roughness: 0.75, clearcoat: 0.3, clearcoatRoughness: 0.5, envMap: env }),
```
Studio: warm the big right card to `[0.9, 0.68, 0.45]`. Money colour: silver-white chrome.

**Matte ceramic and paper** (health, education, calm consumer products, anything that should not
look like a machine):
```js
ceramic: new THREE.MeshPhysicalMaterial({ color: linear(0.9, 0.9, 0.88), roughness: 0.55, clearcoat: 0.6, clearcoatRoughness: 0.35, envMap: env, envMapIntensity: 0.6 }),
paper:   new THREE.MeshStandardMaterial({ color: linear(0.95, 0.94, 0.9), roughness: 0.95, metalness: 0, envMap: env, envMapIntensity: 0.3 }),
tint:    new THREE.MeshPhysicalMaterial({ color: <brand>, roughness: 0.4, clearcoat: 0.8, envMap: env }),
```
Background lifts to a deep tone rather than black (`#0e0f14` or a very dark brand tint); fog
density 0.03. Money colour: a single polished brass. Glows are softer (values around 1.4).

**Neon glass** (developer tools, nightlife, gaming, anything that should feel electric):
```js
neon:  new THREE.MeshBasicMaterial({ color: new THREE.Color().setRGB(0.3, 2.6, 1.8), toneMapped: false }),       // brand hue, hot
smoke: new THREE.MeshPhysicalMaterial({ color: 0x000000, roughness: 0.1, transmission: 0.9, thickness: 0.6, ior: 1.5, attenuationColor: new THREE.Color(<brand>), attenuationDistance: 1.2, envMap: env }),
```
Most bodies are `smoke` glass with `neon` edges (thin boxes or tubes along edges). Background pure
black; dust brighter and in the brand hue. Money colour: white-hot neon.

Whichever family: everything live is the family's solid; everything "coming" is glass at 55% alpha
with a dashed line. That rule survives any palette.

## Deriving the arc

The tokenproof arc (promise → problem → 3 mechanism steps → proof → trust objection → payoff →
scope → price → close) fits a product whose pitch is trust. Other pitches have other arcs. Pick by
what the reader must believe by the end:

| The pitch is… | Arc | Chapters |
|---|---|---|
| "this can be trusted" | problem → mechanism ×3 → proof → objection → payoff | 9-12 |
| "this is faster / easier" | the slow way (felt, not told) → the fast way, as one continuous action across 2-3 chapters → what you do with the time → price | 6-8 |
| "this connects things" | the islands → the carrier visits each → they light up together → what emerges → price | 6-8 |
| "this makes something beautiful" | a blank → the carrier draws, chapter by chapter, the finished thing → it's placed in the world → price | 6-9 |
| "this protects you" | the threat arrives → the carrier intercepts → what gets through (nothing) → the receipt → price | 6-8 |
| "this is a device" | the box opens → each part, one per chapter → assembled → in your hand → price | 7-10 |

Fewer chapters is better than padded ones. A chapter the carrier does nothing in is the first to
cut. If the product has no pricing yet, the arc ends on the payoff and the close.

## Deriving scenes

For each beat, pick the *physical metaphor the product's own domain supplies*, then look up the
nearest recipe in `scene-cookbook.md` for the build pattern:

| Beat | Ask | Example subjects (domain → subject) |
|---|---|---|
| the problem | what does the bad version look like as an object, and how does it fail? | a dashboard number that inflates then shatters (proof); a tangle of cables that won't connect (infra); a form with 40 fields scrolling forever (onboarding); a stack of invoices toppling (finance) |
| mechanism | what moves, through what, and what changes about it? | tokens through a relay (proxy); light through a prism into bars (analytics); a key through three locks (auth); a packet through gates that each stamp it (pipeline) |
| proof | what real data can the server hand the world? | real daily bars scanned by a beam; real latency as a landscape; a real commit graph as towers |
| objection | what does the reader fear, as an object, and what happens to it? | prompts shattering on glass while counts pass (privacy); a copy of the key failing to turn (security); a bill that stays the same size (pricing) |
| payoff | what real artefact does the product produce, and where does the carrier land on it? | the card's printed seal; the badge on a README; a dashboard tile; a device's screen |
| scope | what's live, what's coming, as the same object twice? | logo tiles live vs glass; laptops booted vs booting; regions lit vs dim on a map |
| price | one shape that means "for good", "per month", or "per use" | an endless loop with beads (lifetime); a calendar page that flips (monthly); a meter that ticks (usage) |

Three tests for a scene before building it: it has one subject; the carrier has a job in it; the
action is a function of scroll that reverses cleanly.

## Deriving the hero figure and the rail

The hero's live number must be the product's own: tokens for a token counter, requests for an API,
files for a storage tool, minutes saved for a scheduler. If the product has no honest number yet,
don't invent one; use a short live status line ("v1.0 · signed and notarised" style trust lines are
not it either) or nothing. The rail lists the stages the carrier passes, in the product's words
(counted → sealed → attested → verified → private → on your card). Products without a linear
pipeline don't get a rail.

## The sameness check (run before showing the user)

Open the new site next to tokenproof.pages.dev and answer honestly:

1. Could a stranger tell which product each is from the 3D alone, with the copy hidden? If not, the
   carrier or the scenes are generic.
2. Is the material family and the background the same? If the product isn't about trust and
   precision, cool steel on blue-black is probably the wrong default.
3. Is the chapter count the same and in the same order? Coincidence is possible once; check the
   arc table.
4. Does any scene exist because the template had it (the shattering card, the stream) rather than
   because the product needed it?
5. Does the copy follow tokenproof's sentence shapes ("X prove nothing. Y do.") because they're
   right for this product, or because they were nearby?

Two or more "yes, same" answers means go back to the story table and derive again. The user will
see it in one scroll.
