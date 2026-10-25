# Find the Animal improvement plan

Turn Find the Animal into a small animal discovery adventure: explore illustrated habitats, find several animals in each scene, and collect them in a local field journal. Keep the immediate pleasure of recognizing a cute animal and tapping it. Give that interaction a clearer purpose, fairer input, and a progression system that introduces new observation skills.

The intended audience is children and families, inferred from the existing artwork and comments in the game code. Design the default experience around relaxed play, readable visual prompts, and forgiving controls. Provide an optional challenge mode for players who want speed or harder matching.

The implementation remains a static, client-side website. All game data, images, effects, audio, and saves live in the browser or bundled files. The Wild Trails redesign described here has now been implemented in the main gameplay files, with deterministic generator tests under `tests/`.

## Current game findings

The existing game has a useful foundation: 30 animals in two visual variants, a visible target reference, pointer input shared by touch and mouse, synthesized sound, and responsive placement. The art is cohesive and friendly. Preserve these strengths while changing the surrounding experience.

| Priority | Finding | Evidence in the current code | Proposed correction |
| --- | --- | --- | --- |
| P0 | Resizing replaces the puzzle and resets its search time. | `game.js:194–202` calls `generateLevel()` from the resize handler. | Resize the view of the existing scene. Preserve the seed, target identities, found animals, assistance, and progress. |
| P0 | A delayed victory can appear over an unsolved replacement board. | `game.js:685` schedules an untracked callback; regeneration at `game.js:290` clears `gameWon` without canceling that callback. Reproduced by winning and then invoking the resize handler before the callback. | Own timers in the round lifecycle; cancel them on exit and guard callbacks with the current round ID. |
| P0 | An image failure can produce an unwinnable round and retain a previous target reference. | `game.js:55–58` accepts failed loads, but `game.js:309–310` still samples all configured identities. `targetAnimal` is not reset at the start of generation. | Choose from successfully loaded identities; reset all round references; show a recoverable loading error if too little content remains. |
| P1 | Recurring hints stop being visible while the canvas is idle. | The first hint calls `render()` at `game.js:459`; the interval at `game.js:460–466` only changes a timestamp. Reproduced with an idle animation scheduler. | Explicitly redraw on a hint, or use a DOM animation managed by the round lifecycle. |
| P1 | Click bounds include transparent corners and gaps around rotated images. | `game.js:676–692` accepts an axis-aligned image bounding box, in reverse drawing order. | Use intentional, generous hit regions with space between them. If retaining the canvas, inverse-transform the pointer and use an authored shape or alpha mask before resolving nearby touch assistance. |
| P1 | The layout allows clipped decoys and partial overlaps around the target. | Only the target receives a visibility check. Decoy fallback placement at `game.js:446–448` skips the overlap test. | Validate every interactive animal against scene bounds and reserved interaction areas. Reject invalid layouts and fall back to a simpler safe layout. |
| P1 | Difficulty stops changing on smaller boards. | `game.js:295–301` caps animal count; camouflage becomes a fixed on/off rule at level 2. Scale and rotation remain fixed ranges. | Author a progression across recognition, shape, similarity, and target count; cap density for readability. |
| P1 | Hints reveal the exact answer on a fixed timer, with no player control. | `game.js:455–467` pulses the target after 15 seconds. | Add an explicit, graduated hint action and configurable automatic assistance. |
| P1 | Every successful tap ends the scene with a full-screen modal. | `game.js:681–685` wins immediately; `index.html:20–27` supplies the same generic message and next-level action. | Find several animals per scene; celebrate individual finds in place and show a result only at scene completion. |
| P1 | The game has no keyboard equivalent or accessible game state. | The canvas has no fallback interaction; the win overlay is a plain `div` without dialog semantics or focus handling. | Use native animal buttons, a semantic interface, concise live announcements, and accessible dialogs. |
| P2 | Habitats only change the page gradient. | `game.js:321–327` rotates three colors while `generateScenery()` always makes grass, clouds, and rocks; animals come from the entire catalog. | Give each habitat its own scene, scenery vocabulary, palette, and animal pool. |
| P2 | Similarity groups disagree with some artwork. | `game.js:10–17` labels the grey elephant as brown and the yellow chick as pink. | Put appearance metadata on the asset variant and author similarity relationships deliberately. |
| P2 | Wrong selections request nonexistent sound files. | `game.js:181–185` requests `assets/sounds/{animal}.mp3`; the repository has no sounds directory. | Ship a small synthesized effect bank first. Request recordings only when listed in a real sound manifest. |
| P2 | Rendering can have several simultaneous animation chains. | `render()`, `animateBurst()`, and `animateConfetti()` schedule independently; some particle movement is performed inside rendering. | Separate animation updates from drawing and run one owned effects scheduler, with time-based movement. |
| P2 | Canvas rendering does not account for display pixel density. | `game.js:198–199` sets backing dimensions to CSS dimensions. | Prefer native image rendering for animals; if canvas remains, size its backing store using a capped device pixel ratio while keeping input coordinates in CSS pixels. |
| P2 | There is no start screen, saved progress, sound control, help, or journey endpoint. | Initialization starts a random round; only the next-level button advances state. | Add a short introduction, habitat map, local journal, settings, and a finite adventure followed by free play. |
| P2 | Documentation covers only 10 of the 30 configured animals. | `README.md` lists a subset of the current asset requirements. | Update running instructions, content authoring rules, controls, and save behavior alongside implementation. |

### Generation audit

A deterministic Node harness exercised the existing generator with the actual PNG dimensions and mocked drawing, DOM, and timer APIs. It generated 6,000 rounds: 300 rounds for each combination of four board sizes and levels 1, 2, 5, 10, and 50. These are board dimensions supplied to the generator, not browser layout measurements.

| Board size | Animals at level 1 | Animals at level 2 | Animals at level 10 | Animals at level 50 |
| --- | --- | --- | --- | --- |
| 320 × 500 | 16–18 | 18 | 18 | 18 |
| 390 × 650 | 16–19 | 20–23 | 39 | 39 |
| 740 × 260 | 16–17 | 17 | 17 | 17 |
| 1280 × 700 | 16–19 | 20–23 | 52–55 | 83 |

On the 390 × 650 board at level 10, target and decoy bounding boxes intersected in 113 of 300 rounds. There were 1,851 decoys with bounds extending outside the board across those rounds. These measurements concern rectangular bounds; they do not measure visible pixel overlap. No target centers were blocked in the sampled rounds, so this audit does not establish that ordinary generated rounds were impossible.

The repository contains all 60 configured images. Together they occupy 235,805 bytes, about 230 KiB, with widths of 136–277 pixels and heights of 136–184 pixels. An initial wholesale asset optimization pass is unnecessary. The missing-image defect concerns failure recovery rather than an absent committed PNG.

## Proposed play experience

### Main loop

1. Choose Play or Continue from a welcoming start screen.
2. Enter an unlocked habitat from a simple illustrated map.
3. See a large target portrait and a short instruction such as “Find the owl.”
4. Search a stable scene and tap the matching animal.
5. The found animal gets a brief outline and happy response. It remains in the scene, marked as found and excluded from further guesses. The target card updates after a short, optional transition.
6. Find the remaining animals in that scene. Early rounds have one target; normal rounds have three sequential targets.
7. See a compact result with found portraits, journal additions, and clear Next, Replay, and Map actions.

Introduce the first interaction with a playable tutorial: four large animals, one obvious target, and the instruction “Tap the animal that matches this picture.” The tutorial should take one successful tap to complete. Teach new rules inside the relevant round instead of presenting a long instruction screen.

### Selection and feedback

The default rule is species matching with one eligible instance of the requested species. Use the round artwork consistently in this mode. Avoid showing the same species in both shapes until exact-picture matching has been explicitly introduced.

Later exact-picture rounds ask “Match this picture” and add the shape label when useful. A square bear can then be a deliberate decoy for a round bear. Make that distinction visible in both the prompt and scene; avoid treating a child's correct recognition of a bear as an unexplained mistake.

Wrong animal selections produce a soft wiggle or outline and a helpful message such as “That's the cow. Look for the owl.” The default mode has no lives, countdown, or loss of progress. Empty-space taps have no mistake penalty. Repeated taps during an accepted selection count once. Touch selection commits on pointer release, with a small movement tolerance, so starting a gesture does not immediately make a guess.

After an individual find, use approximately 200–350 ms of restrained feedback. After scene completion, offer a larger but skippable celebration. Respect reduced motion and never place confetti over the next target while searching.

### Assistance

Provide an always-visible Hint button with three escalating steps: highlight a broad scene region; reduce distraction outside that region; finally outline the animal. Assistance has no cooldown in the relaxed mode. A replay or challenge can track assistance separately.

Keep the target portrait available throughout normal play. Add an optional instruction readout using a locally available browser speech voice only when supported; skip speech if no local voice is available. All instructions remain understandable without speech. Pause elapsed search time and animation when the page is hidden or a menu is open.

Offer automatic help as a setting. If enabled, suggest a hint after sustained inactivity rather than silently disclosing the answer after 15 seconds. Early tutorial rounds may use a direct hint to teach the controls.

## Interface and visual design

### Screen layout

Use a compact navigation row with habitat name, round progress, pause, and sound. Place a substantial target card immediately above the scene on phones; on wide screens it can sit beside the scene. A 72–96 CSS pixel reference portrait gives children more detail than the current 36-pixel mobile preview.

Make the scene the visual center of the page. Use a warm paper-colored interface, dark readable text, rounded cards, and a restrained habitat accent. Keep decorative display lettering to short titles and use a readable system font for controls and instructions. Avoid loading external fonts.

Keep Hint and the target within reach while playing. Put collection and settings in the start screen and pause menu. Prevent the interface from becoming a row of equally prominent icons competing with the target.

On desktop, cap the scene's usable width and use extra space for the target card and habitat framing. Do not spread a level's handful of animals over the entire monitor. On mobile, use safe-area padding and dynamic viewport sizing with fallbacks. Give the board an explicit size and allow page scrolling where short landscape screens or text enlargement require it.

### Habitat art

Replace arbitrary grass, rocks, and clouds with composed scenes. Start with a farm containing a barn, fences, a pond, garden beds, and open meadow. Animals sit in plausible spaces and contrast against their local background. Decorative objects frame search regions while leaving interaction areas clear.

Use three layers: a quiet background, scenery landmarks, and animals. Add foreground decoration only in positions that cannot obscure an animal or its controls. Vary landmark arrangements between rounds so a habitat feels alive without changing everything into undirected noise.

Build scenery from original local SVG assets and CSS. Use the existing PNGs as collectible animal stickers during the first playable slice. Their recognizable faces make a coherent starting style; they are portraits rather than full animal bodies, so the scene should intentionally present them as stickers or characters peeking from clear locations.

If the first slice benefits from richer animal art, commission or create a consistent set of full-body vector animals for scene use and retain portraits for the target cards and journal. Test several recognizably different species first. Avoid committing to 60 replacements before validating the result.

### Asset specification

Every animal entry should include an ID, display name, allowed habitats, art variants, visible traits, similarity partners, optional sound, and asset attribution. Appearance belongs to the particular illustration: a yellow chick and a grey elephant should have those actual appearance tags.

Keep a consistent outline weight, lighting direction, eye treatment, and visual scale. Fit animals by their meaningful silhouette rather than file width alone; elongated tusks, ears, and tails should not make a face unreadably small. Supply authored bounds and hit shapes for unusual silhouettes when needed.

Keep the exact same illustration in the target portrait and the scene for matching rounds. Variants should have an explicit gameplay role. Track the provenance and usage rights of the existing assets before expanding or redistributing the art collection.

## Leveling and replay

### Adventure structure

Target six habitats with eight authored rounds each, for 48 adventure rounds. This is a content target to tune after the first habitat, not a requirement to build every scene before testing the game.

| Habitat | Scene vocabulary | Example animals from the current catalog |
| --- | --- | --- |
| Farm Meadow | Barn, fences, pond, vegetable beds | Cow, pig, goat, horse, chicken, chick, dog, duck, rabbit |
| Woodland | Clearing, trunks, leaf piles, stream | Bear, moose, owl, rabbit, frog, snake |
| Savanna | Acacia shapes, grass islands, waterhole | Elephant, giraffe, zebra, buffalo, rhino, hippo |
| Rainforest | Broad leaves, canopy, vines, riverbank | Monkey, gorilla, parrot, sloth, frog, snake, crocodile |
| Bamboo Grove | Bamboo clusters, paths, pool, shaded clearings | Panda, monkey, frog, owl |
| Coast and Sea | Beach, rocks, open water, cold-coast scenes | Whale, narwhal, walrus, penguin |

These are proposed thematic pools. Author separate subscenes where species come from different regions; the coast chapter should not imply that penguins and narwhals share one natural habitat. Keep educational copy tied to observable features initially. Review any later habitat facts before shipping them.

Unlock the next habitat after completing six of the current habitat's eight rounds. Make the remaining rounds optional to finish later. Unlocks depend on completion, never speed or medals. Replays remain available from the map, and Continue returns to the unfinished scene when a valid save is available.

### Skill progression

Use difficulty recipes that change a small number of deliberate parameters. The following table gives initial total animal counts, including targets. Counts are starting values for playtesting; scene capacity and legibility can lower them.

| Round | Skill taught | Initial total animals | Targets | Rule |
| --- | --- | --- | --- | --- |
| 1 | Recognize the reference | 4–6 | 1 | Large, distinct species; direct tutorial assistance |
| 2 | Search several regions | 8–10 | 2 sequential | Distinct species; open spacing |
| 3 | Recognize similar colors | 10–12 | 3 sequential | Same-color decoys with different silhouettes |
| 4 | Match the exact picture | 10–14 | 3 sequential | Introduce round and square variants clearly |
| 5 | Distinguish similar faces | 12–16 | 3 sequential | Authored similarity pairs and helpful feedback |
| 6 | Track a short checklist | 12–18 | 3 simultaneous | Find any remaining target from a visible tray |
| 7 | Combine learned skills | 16–22 | 3 | Similarity and modest rotation; no new rule |
| 8 | Complete a habitat expedition | 18–24 | 4 | A longer mixed scene and habitat completion reward |

Later habitats begin with the skills already taught, while briefly explaining any new art or rule. Vary the visual composition and similarity recipe rather than resetting every chapter to the same tutorial. Keep identical campaign rules on different devices; use a legible item count that fits the smallest supported layout.

Do not make later rounds harder by shrinking all controls. Reserve at least a 48 × 48 CSS pixel interaction region, aiming for 56 pixels in the default mode. Keep the distinguishing parts of an animal readable. If the screen cannot fit the planned scene, use a compact presentation with stable scene regions, scrolling, or an explicit zoom view; preserve every remaining target and found state. Avoid silently dropping animals when rotating the phone.

Keep searching scenes still. Motion can punctuate feedback or an explicit hint, but continuously moving targets would introduce a different motor task and make fair selection harder.

### Rewards and collection

Award an animal sticker the first time the player finds that species. The journal shows discovered portraits and a clear silhouette for undiscovered animals, grouped by habitat. Repeated discoveries can complete a small habitat stamp rather than producing an unlimited currency.

Each completed scene always earns its completion stamp. Optional replay badges can recognize an unassisted clear and careful selections. Store those independently so using a hint does not erase a previous achievement. Use speed records only in challenge mode. No reward is required to access basic assistance.

### Additional modes

Ship Adventure and relaxed Free Play first. Free Play lets the player choose habitat and a simple difficulty preset; generation stays within safe scene capacity.

Add Challenge after the core experience works: optional elapsed-time records, explicit restart, a consistent difficulty preset, and clear pause rules. Add Memory Match later, where the reference briefly appears before searching, with a readily available reveal action.

A daily scene is an optional final addition. Derive its seed from the local calendar date and a content version. State that records live on this device. No server clock, online leaderboard, login, or remote challenge service is required.

## Code implementation

### Rendering decision

Prefer an SVG scenery layer with absolutely positioned native HTML buttons for the animals, plus a small non-interactive effects canvas if useful. The supported scenes have a few dozen animals, which makes native controls a practical choice. This supplies keyboard focus, semantic labels, image scaling, and CSS feedback without reconstructing them inside canvas.

Reserve non-overlapping button regions in the layout. Make the generous clickable area an intentional part of the design; transparent image pixels should not create an invisible region that steals taps from another animal. If more natural overlapping art is added later, use precise authored hit shapes and an explicit input resolver.

Keep backgrounds and effects non-interactive. Keep found animals visible but remove them from the selection order. A selected animal's ID must travel through one input handler, regardless of whether the action came from a mouse, touch, or keyboard.

If canvas remains for the full scene, use a broad rectangle test followed by inverse-rotation and inverse-scale hit testing. Use the same visual transform for input and drawing, cache masks during asset loading, and resolve opaque visible pixels before padded touch regions. Add an equivalent semantic control layer and assistance mode.

### Files and boundaries

Use vanilla JavaScript and CSS. Preserve direct `index.html` launch by loading ordered local scripts with `defer`, wrapping code in closures, and exposing one small application namespace. Keep authored data in JavaScript files instead of requiring JSON fetches under `file://`. A bundler and an application framework are unnecessary for this scope.

| File or folder | Responsibility |
| --- | --- |
| `index.html` | Semantic app shell, navigation, target area, scene, dialogs, loading and status regions |
| `styles.css` | Tokens, responsive layout, component states, focus, contrast, motion preferences |
| `src/data/animals.js` | Art manifests, display names, variants, appearance traits, habitat pools, attribution |
| `src/data/habitats.js` | Scene templates, landmarks, palettes, safe placement regions |
| `src/data/levels.js` | Authored difficulty recipes and campaign ordering |
| `src/core/random.js` | Seeded random source and Fisher–Yates shuffle |
| `src/core/generator.js` | Pure scene generation, similarity selection, target uniqueness, layout validation |
| `src/core/state.js` | App and round transitions, accepted selections, found sets, lifecycle ownership |
| `src/core/storage.js` | Versioned local save, validation, migration, and memory fallback |
| `src/ui/scene.js` | Animal buttons, resize presentation, feedback, and scene rendering |
| `src/ui/screens.js` | Home, map, journal, results, settings, and focus management |
| `src/audio.js` | Optional synthesized effects and any explicitly bundled recordings |
| `assets/scenes/` | Habitat scenery assets |
| `tests/` | Deterministic generator, round lifecycle, persistence, and interaction checks |

Retire `game.js` after the replacement is integrated. Avoid maintaining two competing implementations of progression or click behavior. Introduce these boundaries while building the first habitat, rather than moving the entire old file around before testing any improvement.

### State and scene guarantees

Represent app states explicitly: loading, home, map, playing, paused, results, and journal. A round owns its ID, seed, level recipe, animal instances, remaining targets, found IDs, assistance, active search time, and cancellable tasks.

Scene generation must guarantee that every requested target exists exactly once under that round's matching rule; every asset exists in the usable manifest; every interactive animal has a valid readable position; and accepting a find changes progress once. Use a shuffled target bag to reduce immediate repetition. Replace the random sort used for target-cell selection with Fisher–Yates.

Generate the animal identities and variation choices once. Layout is a separate operation. On resize, preserve scene identity, target order, found animals, and assistance; preserve landmark relationships and positions where space permits. If safe reflow moves animals, perform it deliberately without creating a different puzzle. Start timers only after loading and the introduction are complete.

Validate proposed layouts with bounded retries. After the retry limit, choose a simple safe arrangement or lower optional decoration and decoy density before the round starts. Never place an animal with an unchecked fallback. Author target availability for similarity rules instead of selecting arbitrary animal and style combinations until something works.

### Local saves

Use a namespaced, versioned `localStorage` save for completed rounds, unlocked habitats, discovered animals, best badges, settings, and the current scene seed plus found IDs. Save after meaningful events. Validate types, IDs, and the content version before restoring. Migrate simple changes and recover gracefully from malformed or obsolete saves.

Catch storage read and write failures and continue with an in-memory session. Provide a clearly labeled reset-progress action with confirmation because it erases the local collection. No account or remote storage is involved.

### Performance and audio

Load the interface and first habitat before optional content. The existing animal bank is small enough that loading all 60 images is reasonable; show real progress and robust error recovery. Avoid unnecessary network probes for sounds and avoid fetches to external services.

Use one animation scheduler for active effects, time-based updates, bounded particle counts, and cancellation on state transitions. Cache static scenery and let the page idle during searching. Stop effects while hidden. If an effects canvas is used, cap its pixel density when needed for memory and rendering cost.

Provide a persistent sound toggle and initialize audio after a user gesture. Handle unavailable or suspended audio contexts gracefully. Distinguish selection, find, hint, and scene-completion sounds with a small synthesized palette. Label any later recorded animal call accurately rather than presenting a generic boop as a real call.

## Accessibility

Every control needs a readable label and a visible focus state. Support keyboard navigation through animal buttons and activation with Enter or Space. If a scene becomes tiring to tab through, use a documented arrow-key navigation pattern and preserve logical spatial order.

Give the target portrait a meaningful accessible description. Use a concise live status for changed targets and accepted finds, without announcing every decorative event. Use a real dialog or equivalent focus-managed result screen; restore focus to the next meaningful control after leaving it.

The visual search challenge inherently changes when animal names are spoken by a screen reader. Offer an accessible animal matching mode with a named target and labeled choices. Treat it as a legitimate assisted way to complete the adventure and collect animals. Do not hide names to preserve the visual puzzle at the expense of usability.

Respect reduced motion and offer a static hint outline. Use shape, text, and outline in addition to color for states. Support text enlargement without clipping navigation or hiding the target. Keep speech, audio, and animations optional and independent of successful play.

## Delivery sequence

| Phase | Concrete work | Completion gate |
| --- | --- | --- |
| 1 Core correctness | Round lifecycle, usable asset manifest, repeatable generation, safe hit regions, resize preservation, canceled victory and hint callbacks | Generator and lifecycle checks pass; assets failing or resizing cannot create a false win or remove a required target |
| 2 Farm vertical slice | New interface, one farm scene, tutorial, three-target rounds, hint ladder, result screen, settings, native controls | A complete eight-round habitat works with mouse, touch, and keyboard; all interactions remain legible in compact layouts |
| 3 Progression and journal | Map, unlock rules, collection, local saving and restoration, replay badges | Completing and replaying a habitat produces correct rewards; reload and save failure both behave predictably |
| 4 Habitat expansion | Remaining scenes, authored difficulty recipes, shape matching, similarity rounds, checklist rounds | Every campaign recipe has valid content and safe layouts; habitat progression adds recognizable variety |
| 5 Optional replay modes | Free Play presets, Challenge, then optional Memory Match and daily scenes | Modes reuse the validated core, explain their rules, and keep records local |
| 6 Release quality | Art consistency, attribution, documentation, motion and audio polish, compatibility review | The validation matrix passes and a short child/family playtest reveals no blocking confusion |

The first major decision point is the farm slice. Confirm that several finds in a stable scene are enjoyable, the portraits read well against scenery, and exact-picture matching is understandable before expanding the artwork and campaign. User observation should tune target counts and similarity; it should not be replaced by assumptions about age or reaction speed.

## Validation and acceptance

Keep implementation and automated inspection in code. The current review did not access the web interface. Later human playtesting can verify readability and enjoyment, which a mocked generator cannot establish.

Automated checks should cover these behaviors:

- Generate thousands of seeds for every matching rule and habitat; assert unique eligible targets, correct counts, usable assets, safe bounds, and reserved interaction areas.
- Restore a round from its seed and found IDs; verify the same identities and progression after reload.
- Resize or rotate during search, feedback, pause, and results; verify no replacement puzzle, lost find, duplicate reward, or stale callback.
- Simulate missing images, unsupported audio, invalid saves, and unavailable storage; verify recoverable play or a useful loading error.
- Accept repeated pointer events and keyboard activation; verify each animal can be found once and future or already-found targets obey the round rule.
- Advance virtual timers and the animation scheduler; verify hints redraw, callbacks cancel, hidden-page time is excluded, and reduced motion does not hide information.
- Verify all references in the asset manifest and level data, and validate local script syntax and load order.

For responsive acceptance, cover at least 320-pixel and 390-pixel phone widths, short landscape layouts, tablets, and desktop; also cover enlarged text and high pixel density. Use code-driven layout inspection when authorized, without requiring manual interaction with the web interface. Direct-file launch must still work, and a static local server must produce the same core behavior.

The first release succeeds when a new player understands the first tap, can complete a short expedition with assistance, sees meaningful progress, and can return to it later. Every target must be present and selectable, the scene must survive resizing, and advancement must add a new search decision rather than merely incrementing a level number.
