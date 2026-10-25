# Little Delivery Wagon

A gentle picture-matching delivery game for ages 2–6. Players choose parcels from a little red wagon and match them to picture signs around the neighborhood. Eight authored routes grow from two simple matches to six ordered deliveries.

Open `index.html` directly or serve the folder from any static web host. The game uses plain HTML, CSS, and JavaScript. It has no build step, dependencies, accounts, analytics, runtime requests, or backend.

## Routes

| Route | Deliveries | New idea |
| --- | ---: | --- |
| Morning Bread | 2 | First picture matches |
| Garden Helpers | 3 | More choices |
| Rainy-Day Round | 3 | Similar household destinations |
| Park Picnic | 4 | A wider street |
| Busy Workshop | 4 | Tool and craft vocabulary |
| Market Morning | 5 | Follow a numbered delivery list |
| Festival Street | 5 | Ordered deliveries with new symbols |
| The Grand Round | 6 | A complete-neighborhood finale |

There is no timer or lives system. A wrong match gives a visual and spoken-language-friendly cue, then lets the player try again. Completing a route unlocks the next one. A no-mix-up completion earns a decorative “Kind courier” sticker, but it is not required or stored.

## Controls and accessibility

- Tap or click a parcel, then choose the building with its matching sign.
- Drag-and-drop is available for mouse users; tap-to-select is the touch alternative.
- Keyboard players can use Tab to move and Enter or Space to select.
- The instruction can be read aloud through the browser's speech synthesis when available.
- The layout has large targets, visible focus indicators, reduced-motion support, labels in addition to pictures, and no time pressure.

## Portable progress

Progress is encoded into a validated `LDW1-...` save code in the URL hash. Players can copy either the short code or the whole game link. No progress is sent anywhere and no local storage is used. Hash changes are written with `history.replaceState`, so completing levels does not clutter browser history.

The code stores the set of completed routes. A checksum catches common copying mistakes, and unknown or malformed codes are ignored safely.

## Verification

Run the dependency-free tests with Node.js 18 or later:

```sh
node --test tests/*.test.cjs
```

The tests cover level structure, correct and incorrect matching, ordered routes, unlocking, completion masks, and save-code validation.

## Partial-level progress update

The current save dialog also preserves the in-progress route or night, completed deliveries/check-ins, and mistakes in an LDW2/SCH2 code. Original completion-only codes remain readable. Delayed completion is canceled when leaving or starting another level. Only the opening lesson highlights the matching destination automatically; subsequent lessons invite picture matching. Browser read-aloud uses a local English voice when one is available.


## Generated levels

The route/night menu also has Generated levels. Choose a positive level number
and a challenge setting to make a repeatable fresh stage without unlocking it.
Each stage ends normally; Another level advances only when selected. The eight
campaign stages and their completion remain separate. Save codes (LDW3)
preserve the generated number and partial matches, while older codes still load.
Numbers support up to 60 decimal digits; different numbers may repeat content
from the finite local pool. No account, tracking, storage write, or network request
is needed. See [procedural coverage](../../PROCEDURAL_LEVELS.md).
