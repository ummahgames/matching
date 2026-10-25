# Sleepy Creature Hotel

A gentle bedtime matching game for ages 3–6. Choose a creature in the lobby, read its picture wishes, and find the hotel room showing the same signs. Eight authored nights progress from two single-wish guests to six guests with paired preferences.

Open `index.html` directly or serve the directory from any static host. It uses plain HTML, CSS, and JavaScript with no dependencies, accounts, analytics, runtime requests, or backend.

## Play and progression

- Nights 1–5 teach size, light, temperature, sound, texture, stars, and books through single-picture matches.
- Nights 6–8 combine two wishes, such as dark and quiet or cool and soft.
- A wrong room gives a gentle cue and leaves the guest in the lobby.
- Completing a night unlocks the next. There is no timer, lives system, currency, or repeat-play requirement.
- Mouse, touch, and keyboard are supported. Browser speech synthesis can read the current instruction aloud.

## Portable progress

Completed nights are stored in a validated `SCH1-...` code in the URL hash. The save dialog can copy the code or the complete link. The game does not use local storage.

## Verification

```sh
node --test tests/*.test.cjs
```

Tests cover campaign structure, unique room assignments, matching, sequential unlocking, and every possible completion mask.

## Partial-level progress update

The current save dialog also preserves the in-progress route or night, completed deliveries/check-ins, and mistakes in an LDW2/SCH2 code. Original completion-only codes remain readable. Delayed completion is canceled when leaving or starting another level. Only the opening lesson highlights the matching destination automatically; subsequent lessons invite picture matching. Browser read-aloud uses a local English voice when one is available.


## Generated levels

The route/night menu also has Generated levels. Choose a positive level number
and a challenge setting to make a repeatable fresh stage without unlocking it.
Each stage ends normally; Another level advances only when selected. The eight
campaign stages and their completion remain separate. Save codes (SCH3)
preserve the generated number and partial matches, while older codes still load.
Numbers support up to 60 decimal digits; different numbers may repeat content
from the finite local pool. No account, tracking, storage write, or network request
is needed. See [procedural coverage](../../PROCEDURAL_LEVELS.md).
