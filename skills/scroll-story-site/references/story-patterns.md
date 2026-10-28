# Story patterns

How to turn a product into a scroll story that a reader finishes. The mechanics make it smooth; this
is what makes it land.

## The arc that worked

Eleven chapters plus a close, for a product whose whole pitch is "this number can be trusted":

| # | Role | Headline | Subject | Carrier |
|---|---|---|---|---|
| 0 | Promise | Your AI work, *certified.* | the carrier, large | sways; drag to spin |
| 1 | Problem | Screenshots prove nothing. *Certificates do.* | a dashboard whose number inflates, then shatters | watches |
| 2 | Mechanism 1 | So it counts at the source. | tokens stream agent → relay → provider | is the relay |
| 3 | Mechanism 2 | Sealed the instant it lands. | a security chip | stamps it |
| 4 | Mechanism 3 | Apple vouches for the seal. | a chain of certificate plates | is the last link |
| 5 | Proof | Then it's checked again, in public. | the real last 56 days as bars | scans them |
| 6 | Trust | The count travels. *Your prompts don't.* | privacy glass | catches what passes |
| 7 | Payoff | And it lands where people look. | the real card | lands on its printed seal |
| 8 | Scope | Claude Code and Codex today. *The rest are coming.* | logo tiles, live and glass | is wired to the live ones |
| 9 | Scope | Built for the Mac. *Windows and Linux are next.* | three laptops, one booted | on the booted screen |
| 10 | Price | $6.99. Once. *Yours for good.* | an endless loop with beads | turns gold |
| 11 | Close | Stop claiming. Start proving. | the carrier, centred | rests |

The shape to reuse: **promise → problem → 2-3 mechanism steps → proof → the trust objection →
payoff (the product in the reader's world) → scope / roadmap → price → close.** Products that
aren't about trust swap chapters 3-6 for their own mechanism, but keep the order: problem before
mechanism, proof before payoff, the objection answered before the price.

## The carrier is the story

One object must appear in every chapter and *do the thing the chapter is about*. It watches the
problem, becomes the mechanism, performs the proof, catches what passes the trust test, lands on
the product, gets wired to the integrations, boots the platform, turns gold at the price, rests at
the close. Readers follow an object through a journey far better than they follow a list of
features. If a chapter has nothing for the carrier to do, the chapter is probably a feature, not a
story beat; cut it or fold it into the after section.

## Headlines

- One sentence. Under ten words. Verb early.
- Exactly one `<em>` phrase, usually the second clause, which gets the blue gradient. It's the
  phrase a skimmer reads if they read nothing else: *certified.* / *Certificates do.* /
  *Your prompts don't.* / *Yours for good.*
- Pairs work: "Screenshots prove nothing. Certificates do." "The count travels. Your prompts don't."
  State the wrong belief, then the product's answer.
- Numbers are headlines: "$6.99. Once." A price in the headline is braver and clearer than a
  pricing table.
- The close is an imperative pair: "Stop claiming. Start proving."

## Body copy

- Two or three sentences. The body explains the headline's mechanism in plain words, with one
  concrete number if there is one ("1,873 tokens, from a single reply"), then threads to the next
  chapter.
- Thread the same concrete example through the whole story (one reply, 1,873 tokens: counted,
  sealed, attested, verified, private, on the card). The rail at the bottom lights each stage as
  it passes. The reader is following one thing.
- Say what it doesn't do in the after section ("Proves / Doesn't prove"). Credibility comes from
  the limits, and it pre-empts the comment-section objections.
- Voice: plain, specific, no marketing adjectives. "Nobody has to take our word for anything"
  beats "cryptographically secure".
- Reframes beat negations. "Nobody can fake this one" was replaced by "Your AI work, certified":
  lead with what the reader gets, not what others can't do.
- Don't promise what isn't built. "The rest are coming" with glass tiles is honest and still
  exciting; a logo wall of unsupported tools is not.

## Hero

Copy left, world right, carrier big. A live number under the lede (counting up on load) proves
the product is real before the reader scrolls. The CTA pair is one filled button (the download) and
one text link (how it works). No "free · v1.2 · notarised" line: trust badges in the hero read as
nervousness. Centred heroes with the carrier above were tried and the left-copy layout was
preferred: it gives the eye a start point and the scene a stage.

## After the story

Solid background, normal scroll, in this order: a two-column "Proves / Doesn't prove" (or "What
you get / What it isn't"), FAQ as `<details>` in two columns (also emitted as JSON-LD FAQPage), a
footer with legal links and a contact. No second CTA block; the close chapter was the CTA.

## Pricing chapter

A deal card inside the copy: the price in gold, one comparison that makes the price feel small
("$6.99 buys about 350,000 Opus tokens at API prices. Here it proves every token you'll ever
spend."), four ticks, then the CTA pair. If there's a limit (first 100), put the live count in the
card *and* in the scene (beads turn gold as they sell), and make the limit real: when it's reached,
the chapter changes headline and the buy button leaves. A scarcity that never runs out is a lie
and readers can tell.

## What got pushed back on, so you don't repeat it

- "Animations way too quick" and later "stuck for a brief period then continues": fixed by
  HOLD + PUSH, not by slowing everything (which made it float).
- "Earlier layout was much better" after a centred hero experiment: revert fast, keep the copy
  column.
- "Don't use my stats, use demo stats everywhere": the homepage shows a synthetic profile
  (a named example like @johndoe), never the maker's own real data and never any real user's.
- "Remove made by …" and the version line from the footer and hero: a product page, not a
  portfolio page.
- "Not only on GitHub, you can add it anywhere": name the places (README, portfolio, LinkedIn, X)
  instead of one.
- "For a millisecond I see a logo and then it switches to the medallion": the poster fallback
  must never show while the world loads.
- Real logos, no text in 3D: "Use Claude, OpenAI, Cursor logos. Play with it. Just not the text
  part."
