# Find the Animal: Wild Trails

A client-side animal discovery game for children and families. Players explore six illustrated habitats, complete 48 progressively harder trails, collect 30 animals in a field journal, and can also play custom or daily trails.

## Portable progress update

The current page uses a **Save code** control and a URL fragment to carry progress. Bookmark the updated link or copy its code before closing. A pre-existing browser save can be read for migration; updated progress is kept in memory and the fragment instead of being written to localStorage. Existing JSON backup controls remain available where implemented. Lower sections describing browser storage document the original persistence implementation; the portable adapter now supplies that storage interface.

Opening the portable save dialog pauses active action play. Loading a code reloads the page and applies each game’s existing save validation. This change was checked through source, automated tests, and DOM/Canvas stubs; no new browser or physical-device validation was performed.

## Run

Open `index.html` directly, or serve this directory from any static file server. The game has no build step, server, account, analytics, or network dependency.

Progress, discoveries, badges, and settings are saved to `localStorage` when the browser permits it. If storage is unavailable, the current session remains playable in memory.

## Controls

- Mouse or touch: choose an animal directly.
- Keyboard: use Tab to move among animal choices, then Enter or Space to choose.
- Hint: reveals a region first, then highlights the target.
- Pause: stops the challenge clock and keeps the scene intact.

## Game structure

- Adventure contains six habitats with eight trails each. Complete six trails to unlock the next habitat.
- Later trails introduce exact portrait matching and multi-animal ranger lists.
- Free Play supports three difficulty levels and an optional challenge clock.
- Daily Trail uses a deterministic seed based on the local calendar date.
- All 30 animals have round and square PNG variants under `assets/`.

## Verification

Run the built-in Node tests:

```sh
node --test tests/game.test.cjs
```

The tests generate 12,000 deterministic rounds, check gameplay invariants, verify unlock and save behavior, confirm all declared assets exist, and check that JavaScript DOM references match the HTML shell.
