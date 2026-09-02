# Paper → house

The print has to look like it belongs on that wall. Pick the room from the **paper**, not from whichever plate is handy.

## Cover cards

`01-` is a **cover card**, not a room tour. After a 1:1 center crop (Etsy shop tile), the framed sheet must fill **at least 40%** of the tile (target ~50%). Combined pine close-up (`output/combined/listing-photos/01-hero-pine-closeup.jpg`, formerly `05-pine-closeup.jpg`) is the visual bar.

- Wide living room, desk lifestyle, hallway, and gallery wall are **`02-`–`05-` only**.
- At most one listing in the shop may use the monstera living-room plate as `01-`. The shop-cover cleanup uses **zero**.
- Paper still picks the house. Kopitiam stays on its HDB plates. Do not force it onto the Anton apartment to “unify lighting.” Unify crop tightness and oak, not the wall.
- Gallery wall is for sets as photo 2, never the cover (three distant frames fail the 40% rule).
- Keep the full buyer sheet in the oak. Do not lockup-crop letters. Do not add a fake mat. Do not change print recipes (Pocket pear / Travel sketch are sparse on purpose; the cover gets closer to the frame, not a redesigned PNG).

Crops live in [`scripts/cover-crops.json`](../../../scripts/cover-crops.json). Apply with `python scripts/crop-listing-hero.py`.

## How to choose a later room

1. Sample the buyer PNG corners. That is the paper.
2. Use the row below. If two rows could fit, pick the one whose wall will not swallow the paper.
3. One paper family per listing set. Do not mix a cocoa hero with a white-Anton desk unless the user asked for a contrast shot.

| Paper | Looks like | House | Why |
|---|---|---|---|
| **White + black type** (Anton gym, full `#FFFFFF`) | Cool, graphic, office | Bright plaster, desk, close crop. Avoid cream-on-cream walls that make the sheet disappear | White paper needs a wall with some tone, or furniture that proves scale |
| **Cocoa / packed brown** (`#352418` + cream) | Warm, adult, hangable | Cream wall, oak, linen, plant, morning window. Living room before desk — but living room is `02+`, not the cover | Brown on a dark wall dies. Brown on a warm cream wall reads as an object |
| **Warm color field** (mustard, rust, clay, tomato) | Living-room / entry | Same warm apartment language as cocoa. Mustard likes a quieter wall | Color field is already a block of chroma — keep the room neutral |
| **Cool color field** (dusty blue, sage) | Bedroom / quieter sitting room | Soft daylight, less oak-heavy if the print is already cool | Blue on a yellow-cream wall can look sickly — prefer cooler plaster |
| **Kopitiam still-life** | HDB / kopitiam house | The HDB plates in `output/kopitiam/listing-photos/plates/`. Not the Anton monstera room | Different paper, different house. Crop tight; do not re-house |

## Hard mismatches

- Cocoa / dark paper on a charcoal or olive wall — the frame vanishes
- White paper on a blown-out white wall with no furniture — the sheet becomes the wall
- Kids art over a laptop desk — wrong house
- Gym Anton in a boho living room as the *hero* — allowed as a later shot, not the thumbnail for a white office set

## No matching plate

Do not force a bad house. Options, in order:

1. Ask the user which room they want for this paper
2. Image-gen an **empty** thin light-oak frame on a wall that matches the row above — no letters, no quote
3. Sit the real PNG. Never image-gen the typography into the room.
