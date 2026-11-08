# Unicorn Birthday Bash — implementation plan

A web game for a 4-year-old. A unicorn (named by the player) is having a birthday party on a floating lawn. She walks onto one of three landing pads to pick a party game, Mario Party style. Memory Match ships first, Kart Racing comes later, and the third pad stays "coming soon".

Runs locally first, then is served at **narjitaujla.com/unicorn**.

This file is the source of truth for building it. A new session should read [../AGENTS.md](../AGENTS.md) "Current status", then the phase below that matches it, and work through the tasks in order. Tick the checkboxes as tasks finish.

---

## 1. Decisions (settled 2026-11-07)

| Topic | Decision |
|---|---|
| Games | Pad 1 Memory Match (build now). Pad 2 Kart Racing (Phase 4, locked until then). Pad 3 "coming soon" present. |
| Characters | The player names the unicorn. No friend characters in the hub for now. Creatures appear only on memory cards. |
| Audio | Sound effects only. No voice lines. Mute toggle in the corner. |
| Platform | Desktop web with keyboard and mouse first. As of 2026-11-08, iPhone then iPad are in scope: touch controls and small-screen layouts (Phase 6). |
| Hosting | Its own Vercel project, built with base path `/unicorn/`. The portfolio (Next.js 15) proxies `/unicorn/*` to it with a rewrite. |
| Art | "Toy-box diorama": rounded, low-poly, pastel, bouncy (section 3). |
| Engine | Vite + React + TypeScript + React Three Fiber (section 4). |

## 2. Design rules for a 4-year-old

These apply to every screen. Check each phase against them before calling it done.

1. **No reading needed to play.** Choices are pictures, colors, and stars. Text is only for a grown-up (name entry, small labels).
2. **Big targets.** Clickable things are at least 88px in both dimensions. The cursor shows a pointer on everything clickable.
3. **No losing.** No timers, no fail states, no scores shown to the child. Mistakes get a soft sound and reset.
4. **Every action has feedback**, both a sound and a motion (bounce, wobble, sparkle).
5. **Mashing is safe.** Input locks during animations. Double-clicks and key repeat never break state.
6. **Always a way home.** A big "back to party" button (house icon) sits top-left in every game.
7. **No network, ads, accounts, or tracking.** The only storage is `localStorage` for the unicorn's name, mute, and stickers, and every access is wrapped in try/catch.

## 3. Art direction: toy-box diorama

Everything should look like plastic toys and cake on a tabletop: chunky, rounded, soft-lit, pastel.

### Color tokens (`src/styles/tokens.css`)

```css
:root {
  --pink: #FFB3D9;      /* primary, unicorn, Memory pad */
  --pink-deep: #FF7EB9; /* pressed / accents */
  --lavender: #C8B6FF;
  --mint: #B8F2E6;      /* Kart pad */
  --butter: #FFE66D;    /* Mystery pad, stars */
  --sky: #A0E7FF;
  --peach: #FFC9A8;
  --grape: #5B3A8C;     /* outlines, text */
  --cream: #FFF8F0;     /* card faces, panels */
  --grass: #9BE39B;
  --radius: 28px;
  --outline: 5px solid var(--grape);
  --shadow: 0 8px 0 rgba(91, 58, 140, 0.25); /* chunky "toy" drop shadow */
}
```

The sky is a vertical gradient from `--pink` (bottom) to `--lavender` (top).

### Type
**Fredoka** (Google Fonts, weights 500 and 700) for all UI.

### 3D look
- `MeshToonMaterial` with a 3-step gradient map (`src/engine/three/toonGradient.ts`) on every mesh, so all models share one shading style.
- One warm directional light (`#FFF1DC`, intensity about 2, soft shadows, small shadow map, 1024) plus hemisphere light (sky `--lavender`, ground `--grass`).
- drei `<ContactShadows>` under characters instead of hard shadows where possible.
- Everything rounded: drei `<RoundedBox>`, capsules, spheres, tori. No sharp cones except the horn (give it a rounded tip).
- Optional outline: drei `<Outlines>` in `--grape` on the unicorn and pads only.

### 2D look (menus and cards)
Cream panels, 5px grape outlines, 28px radius, chunky offset drop shadow. Buttons squash on press (scale 0.92) and spring back.

### Motion
Use springs everywhere: Framer Motion `type: "spring", stiffness: 400, damping: 15` for UI, and lerp or damping helpers (`THREE.MathUtils.damp`) in 3D. Successes always get confetti and sparkles.

### Assets
- **Creature card art:** hand-written inline SVG React components in `src/games/memory-match/creatures/`, one per creature, each on a 200×200 viewBox. Use simple geometric shapes, a dominant color per creature, and big friendly eyes. No external art needed.
- **Unicorn 3D model:** built from primitives in `src/hub/UnicornModel.tsx` (spec in Phase 3). No model download needed.
- **Props** (cake, balloons, presents, bunting): built from primitives too. If something needs a real model later, use CC0 packs from Kenney.nl or Quaternius.com and record it in `src/assets/CREDITS.md`.
- **Sounds:** CC0 sound effects from Kenney's "Interface Sounds" and "Digital Audio" packs (kenney.nl/assets). Download them manually, convert the chosen files to `.mp3` or `.ogg`, and put them in `public/sfx/`. Record each source in `CREDITS.md`. Sound list in section 6.

## 4. Stack

Versions current on npm on 2026-11-07 are shown for reference. At scaffold time, install with `npm i <pkg>@<exact version>` (exact, no `^`) and record the installed versions in the table.

| Package | Purpose | Version seen 2026-11-07 |
|---|---|---|
| vite + @vitejs/plugin-react | Dev server and build | 8.3.6 / 6.2.1 |
| react, react-dom | UI | 19.3.1 |
| typescript | Types (use what the Vite template installs) | template |
| three, @react-three/fiber, @react-three/drei | 3D hub and kart game | 0.187.0 / 9.8.2 / 10.7.9 |
| @react-three/rapier | Kart physics (Phase 4 only, don't install earlier) | 2.2.0 |
| zustand | Global game state | 5.1.0 |
| motion | Framer Motion for 2D UI animation | 14.10.1 |
| howler (+ @types/howler) | Sound effects | 2.2.4 |
| canvas-confetti (+ @types/canvas-confetti) | Win celebrations | 1.9.4 |
| vitest, @testing-library/react, jsdom | Tests | 5.1.0 / 16.3.3 / latest |

Node is v24.13.0 and npm 11.6.2 on this machine.

**Not using:** Phaser (2D-only, so we'd need a second engine for karts), Unity or Godot (heavy web exports, awkward in a portfolio), Tailwind (plain CSS modules and tokens are enough for a few screens).

## 5. Architecture

### Folder layout

```
unicorn-birthday-bash/
  AGENTS.md
  docs/PLAN.md
  index.html
  vite.config.ts            # base: '/unicorn/'
  vercel.json               # SPA fallback (section 9)
  public/
    sfx/*.mp3
    favicon.svg
  src/
    main.tsx
    App.tsx                 # <AudioUnlock/> + <SceneRouter/> + <TopBar/>
    styles/
      tokens.css
      global.css            # font, body bg gradient, cursor, reset
    engine/
      store.ts              # zustand store (below)
      persist.ts            # safe localStorage get/set
      audio.ts              # howler wrapper: play(name), setMuted
      useKeys.ts            # keyboard state hook for hub and kart
      SceneRouter.tsx       # renders current scene with transition
      Transition.tsx        # pink "iris wipe" between scenes
      three/toonGradient.ts
      ui/
        BigButton.tsx
        HomeButton.tsx      # top-left house icon -> hub
        MuteButton.tsx      # top-right speaker icon
        Stars.tsx           # 1-3 stars for difficulty
        celebrate.ts        # confetti burst helper
    screens/
      NameScreen.tsx        # first launch: name the unicorn
    hub/
      PartyHub.tsx          # <Canvas> + scene
      Island.tsx            # lawn, cake, balloons, presents, bunting
      UnicornModel.tsx      # primitive-built unicorn, prop: walking
      Player.tsx            # movement, camera follow, click-to-walk
      LandingPad.tsx        # pad visuals + proximity state
      PadPrompt.tsx         # DOM overlay: big Play button
      BirthdayBanner.tsx    # "Happy Birthday, <name>!"
    games/
      registry.ts
      types.ts
      memory-match/
        MemoryMatch.tsx     # orchestrates picker -> board -> win
        DifficultyPicker.tsx
        Board.tsx
        Card.tsx
        WinScreen.tsx
        logic.ts
        logic.test.ts
        creatures/index.ts  # list of Creature { id, color, Svg }
        creatures/*.tsx
      kart-racing/          # Phase 4
    assets/CREDITS.md
```

### Game contract (`src/games/types.ts`)

```ts
export type GameResult = { completed: boolean };

export type GameProps = {
  onExit: (result: GameResult) => void;
};

export type GameEntry = {
  id: 'memory-match' | 'kart-racing' | 'mystery';
  padColor: string;            // CSS token value
  icon: 'cards' | 'kart' | 'present';
  status: 'ready' | 'locked' | 'coming-soon';
  component?: React.LazyExoticComponent<React.ComponentType<GameProps>>;
};
```

`registry.ts` exports `GAMES: GameEntry[]` with the three entries. Game components load with `React.lazy`, so the hub doesn't download kart code until needed. The hub reads only the registry. Adding a game means adding a folder and one entry.

### Store (`src/engine/store.ts`)

```ts
type Scene =
  | { kind: 'name' }
  | { kind: 'hub' }
  | { kind: 'game'; id: GameEntry['id'] };

type State = {
  scene: Scene;
  unicornName: string | null;   // persisted
  muted: boolean;               // persisted
  stickers: Record<string, number>; // gameId -> wins, persisted
  hubSpawn: { x: number; z: number } | null; // return-to-pad position
  goTo: (scene: Scene) => void;
  setName: (name: string) => void;
  toggleMute: () => void;
  addSticker: (gameId: string) => void;
};
```

On load: if `unicornName` is null, the scene is `name`, otherwise `hub`. Persist with `persist.ts` (a hand-rolled try/catch wrapper; zustand's `persist` middleware is fine too if wrapped in a safe storage adapter). Keys are prefixed `ubb:`.

When leaving the hub for a game, save the unicorn's position as `hubSpawn`, so she reappears standing next to the pad she used.

### Scene router

`SceneRouter` renders `NameScreen`, `PartyHub`, or the lazy game component in `<Suspense fallback={<Loading/>}>`. Scene changes play `Transition`: a pink circle grows to cover the screen (300ms), the scene swaps, then the circle shrinks (300ms). Use `AnimatePresence` from `motion`.

The hub `<Canvas>` unmounts while a game is open. That's simpler and frees the GPU for the kart game.

### Audio (`src/engine/audio.ts`)

- One `Howl` per sound, created lazily, `preload: true`.
- `play(name: SfxName)` does nothing while muted.
- Browsers block audio until a user gesture. The first pointerdown or keydown anywhere calls `Howler.ctx.resume()`. Howler handles most of this, but test it in Chrome.
- `MuteButton` toggles `Howler.mute()` and the store.

### Keyboard (`src/engine/useKeys.ts`)

Tracks Arrow keys and WASD (and Space or Enter as "action") in a ref updated by `keydown` and `keyup` listeners on `window`. Returns a ref (not state) so `useFrame` can read it every frame without re-rendering. Clear all keys on `blur` so the unicorn doesn't keep walking after an alt-tab. Call `preventDefault` on arrows and space so the page doesn't scroll.

## 6. Sound list

| Name | When | Suggested source (Kenney) |
|---|---|---|
| `click` | Any button press | Interface Sounds: `click_002` |
| `flip` | Card flips | Interface Sounds: `switch_003` or a soft "pop" |
| `match` | Pair matched | Digital Audio: `powerUp2` |
| `nomatch` | Pair wrong (soft, not harsh) | Interface Sounds: `drop_001` (low volume) |
| `win` | Game complete | Digital Audio: `powerUp7` or a jingle |
| `padEnter` | Unicorn steps on a pad | Interface Sounds: `confirmation_001` |
| `step` | Footsteps in the hub (quiet, throttled to about 4/sec) | Interface Sounds: `tick_001` |
| `locked` | Clicking a locked pad | Interface Sounds: `error_004` (soft) |

Exact file names can differ. Pick by ear, keep each under 50 KB, and normalize volume. If the files aren't ready, `audio.ts` must fail silently so the game still works without sound.

---

## 7. Phases and tasks

Each phase ends with a check in the browser and a commit to `main`.

### Phase 0: Scaffold

- [x] From the project folder: `npm create vite@latest . -- --template react-ts`. The folder already has `AGENTS.md`, `docs/`, and `.gitignore`. If the tool refuses a non-empty folder, scaffold in the scratchpad and copy the files in, keeping the existing `.gitignore` entries.
- [x] Install runtime deps (exact versions): `three @react-three/fiber @react-three/drei zustand motion howler canvas-confetti`. Dev deps: `@types/three @types/howler @types/canvas-confetti vitest @testing-library/react jsdom`.
- [x] `vite.config.ts`: `base: '/unicorn/'`, react plugin, Vitest `environment: 'jsdom'`. Add `"test": "vitest"` to scripts.
- [x] Delete the template demo (counter, logos, App.css).
- [x] `index.html`: title "Unicorn Birthday Bash", Fredoka from Google Fonts, `<meta name="viewport" content="width=device-width, initial-scale=1">`.
- [x] `tokens.css` and `global.css`: tokens from section 3, body gradient background, `font-family: Fredoka`, `user-select: none`, `overscroll-behavior: none`, full-viewport `#root`.
- [x] `store.ts`, `persist.ts`, `SceneRouter.tsx`, `Transition.tsx`, `BigButton`, `HomeButton`, `MuteButton`.
- [x] Placeholder hub: a DOM screen with one BigButton "Memory Match" that goes to `{ kind: 'game', id: 'memory-match' }`. Placeholder game: a HomeButton that goes back to the hub.
- [x] `registry.ts` and `types.ts` with all three entries (memory-match `ready`, kart-racing `locked`, mystery `coming-soon`).
- [x] `src/assets/CREDITS.md` with a header and an empty table.

**Done when:** `npm run dev` opens at `http://localhost:5173/unicorn/`, the placeholder hub goes to the placeholder game and back with the pink transition, `npm run build` passes, and `npx vitest run` passes (an empty suite is fine).

### Phase 1: Name the unicorn

`NameScreen.tsx`, shown on first launch and from a small pencil button next to the name in the hub.

- [x] A cream panel with a big unicorn illustration (reuse the unicorn card SVG from Phase 2, or a placeholder until it exists).
- [x] Prompt: "What's the birthday unicorn's name?" (for the grown-up to read aloud).
- [x] A text input (autofocus, max 16 characters, trimmed, letters, numbers, spaces, and `'`/`-` only) plus three suggestion chips: **Sparkle**, **Rainbow**, **Stardust**. Clicking a chip fills the input.
- [x] A big "Let's party!" button (disabled while empty). Enter also submits.
- [x] Saves to the store (persisted) and goes to the hub.

**Done when (built, not yet checked in a browser):** a fresh browser (clear `localStorage`) shows the name screen, the name survives a reload, and the screen doesn't reappear after a reload.

### Phase 2: Memory Match (playable from the placeholder hub)

#### 2a. Logic (`logic.ts`, pure, no React)

```ts
export type Difficulty = 'easy' | 'medium' | 'hard';

export const DIFFICULTY = {
  easy:   { cols: 3, rows: 2, pairs: 3, peekMs: 2000 },
  medium: { cols: 4, rows: 3, pairs: 6, peekMs: 1200 },
  hard:   { cols: 4, rows: 4, pairs: 8, peekMs: 0 },
} as const;

export type Card = { uid: number; creatureId: string; matched: boolean };

export type GameState = {
  cards: Card[];
  faceUp: number[];      // indices currently face up and not matched (0, 1 or 2)
  locked: boolean;       // true while two unmatched cards are showing
  moves: number;         // pairs attempted (grown-up info only)
};

export function buildDeck(creatureIds: string[], pairs: number, rng?: () => number): Card[];
export function initialState(deck: Card[]): GameState;
export function flip(state: GameState, index: number): GameState;   // ignores matched, face-up, or locked
export function resolve(state: GameState): GameState;               // after nomatch delay: flips both back, unlocks
export function isWin(state: GameState): boolean;
export function shuffle<T>(items: T[], rng?: () => number): T[];   // Fisher-Yates
```

Rules:
- `buildDeck` picks `pairs` creatures at random from the list, duplicates each, and shuffles. `rng` defaults to `Math.random`. Tests pass a seeded RNG (a tiny mulberry32 in the test file).
- `flip` on the second card: if both match, mark them matched and clear `faceUp` (no lock). If not, set `locked: true` and leave both face up. Increment `moves` on every second flip.
- `resolve` clears `faceUp` and unlocks. The component calls it after 900ms.
- `flip` returns the same state object for ignored flips, so React skips the re-render.

Tests (`logic.test.ts`):
- [x] Deck has `pairs * 2` cards, each creature exactly twice, and unique `uid`s.
- [x] Seeded RNG gives a deterministic order.
- [x] Flipping a matched card, a face-up card, or any card while locked changes nothing.
- [x] Match path: two matching flips mark both matched and leave `faceUp` empty.
- [x] No-match path: locks, then `resolve` unlocks and flips both back.
- [x] `isWin` is true only when every card is matched.
- [x] A full simulated game on each difficulty reaches `isWin`.

#### 2a-bis. Extra difficulties (added 2026-11-07)

- 4 stars (`expert`): 5�4 board, 10 pairs, no peek. Needs 10 creatures, so `bee` and `penguin` were added.
- 5 stars (`wild`): the same 5�4 deck plus five **power cards** (a badge on a normal creature card, a twinkle on its back). A power fires once, after the flipped pair is settled: `shuffle` (hidden cards swap places, animated), `peek` (1-2 hidden cards show for 1.7s), `wand` (one hidden pair matches itself). Logic is `addPowers`, `applyPower`, `endPeek` in `logic.ts`, tested.
- Picker has five cards (keys 1-5). The 5-star preview shows gold dots for the power cards.

#### 2b. Creatures (`creatures/`)

Eight inline SVG components, 200×200 viewBox, each with a different dominant color so a child can match by color as well as shape:

| id | Dominant color | Look |
|---|---|---|
| `unicorn` | white + pink mane | White head in profile, golden horn, rainbow mane |
| `witch` | purple | Round green-cheeked face, purple pointy hat with a star |
| `dragon` | green | Round green head, small wings, a tiny puff of smoke |
| `fairy` | sky blue | Small face, big translucent wings, a wand star |
| `mermaid` | teal | Face with orange hair and a teal tail curl |
| `ghost` | white + lavender bg | Friendly sheet ghost with rosy cheeks |
| `owl` | brown/orange | Round body, huge eyes, ear tufts |
| `gnome` | red | Red tall hat, white beard, round nose |

All of them get big shiny eyes (white circle with a highlight), rosy cheeks, a smile, and grape outlines at a stroke width of 6. Each card face gets a soft background circle in the creature's color so color matching works at a glance. Export `CREATURES: { id, name, color, Svg }[]` from `creatures/index.ts`. `name` is for alt text and grown-ups only.

Card back: a lavender card with a white star-and-horn emblem, in `Card.tsx`.

#### 2c. Screens

`MemoryMatch.tsx` holds a local phase: `'pick' | 'play' | 'win'`.

**DifficultyPicker:**
- [x] Three big cards side by side: 1, 2, and 3 stars (`Stars.tsx`) on pastel backgrounds (mint, butter, pink). Under the stars, a tiny preview of the grid (3×2, 4×3, 4×4 dots) so a child sees "more cards".
- [x] Hover wobbles, click plays `click` and starts the game.
- [x] Keyboard: 1, 2, 3 keys pick a difficulty.

**Board:**
- [x] CSS grid sized from `DIFFICULTY[d].cols`. Cards keep a 3:4 ratio and size to fit the viewport with `min(...)` so a 4×4 grid fits on a 1366×768 laptop with no scrolling. Minimum card width is 120px.
- [x] Peek: when the round starts, all cards show face-up for `peekMs`, then flip down together (only if `peekMs > 0`). Input stays locked during the peek.
- [x] Clicking a card calls `flip` and plays `flip`. On a match: both cards bounce (scale 1 → 1.15 → 1), a sparkle burst plays over them, `match` sounds, and they stay face-up with a gold border. On a mismatch: both shake gently, `nomatch` plays quietly, and after 900ms `resolve` runs.
- [x] The flip animation is a CSS 3D flip: `.card-inner` with `transform-style: preserve-3d` rotating `rotateY(180deg)` over 350ms with a slight overshoot, front and back faces with `backface-visibility: hidden`.
- [x] Keyboard (nice to have): arrow keys move a focus ring across cards, and Space or Enter flips.
- [x] A small grey "moves: N" label in the bottom-right corner for grown-ups. Easy to remove if distracting.

**WinScreen:**
- [x] Triggered when `isWin` becomes true, 600ms after the last match so the last bounce plays.
- [x] `celebrate()` fires three confetti bursts in the palette colors, and `win` plays.
- [x] "Yay, <name>!" in big letters, plus the unicorn card art bouncing.
- [x] Calls `addSticker('memory-match')`.
- [x] Two big buttons: replay (circular arrow icon, same difficulty) and back to party (house icon, calls `onExit({ completed: true })`). A small "change difficulty" link returns to the picker.

**Done when:** all logic tests pass. In the browser, all three difficulties play to a win, rapid clicking never shows three face-up cards, and the hard grid fits on a 1366×768 window. **Then the real test:** a 4-year-old finishes Easy without help and asks to play again.

### Phase 3: Party hub (3D)

Replaces the placeholder hub. Everything is in one R3F `<Canvas shadows dpr={[1, 2]}>`.

#### 3a. Scene (`Island.tsx`)
- [ ] A round grass island: a flattened cylinder, radius 12, height 1.5, `--grass` top and a peach "cake layer" side so the island itself looks like a cake. It floats in the gradient sky (canvas `alpha` with the CSS gradient behind it).
- [ ] A giant three-tier birthday cake at the center (stacked cylinders: pink, cream, lavender, with sphere "frosting dots" around each rim), five candles with flickering flame spheres (scale jitter in `useFrame`). It's a collision obstacle with radius 2.2.
- [ ] Six to eight balloons around the edge (spheres plus thin line strings) bobbing on a sine wave with random phases.
- [ ] Four or five presents (`RoundedBox` with crossed ribbon boxes) as decoration and obstacles.
- [ ] Bunting: a triangle-flag string looping between two poles behind the cake.
- [ ] `BirthdayBanner.tsx`: drei `<Text>` (or `<Html>`) arching over the cake, "Happy Birthday, <name>!" in Fredoka. Load the font file from Google Fonts' TTF or bundle it in `public/fonts/`.
- [ ] Little floating sparkles (drei `<Sparkles>`, count about 40, pastel colors).

#### 3b. Unicorn model (`UnicornModel.tsx`)
Built from primitives, about 1.2 units tall, all `MeshToonMaterial`:
- Body: white capsule lying horizontally.
- Four legs: short white capsules, with lavender sphere "hooves".
- Neck and head: a tilted capsule plus a sphere head with a sphere snout.
- Eyes: black spheres with tiny white highlight spheres. Cheeks: pink flattened spheres.
- Horn: a gold cone with a rounded tip (a small sphere at the top) and a slight spiral (stacked torus rings).
- Mane and tail: a chain of five or six small spheres in rainbow colors (pink, butter, mint, sky, lavender).
- A tiny party hat (striped cone) because it's her birthday.
- Prop `walking: boolean`. While walking, the legs swing on a sine wave, the body bobs, and the tail sways. Idle does a gentle breathing scale.

#### 3c. Movement (`Player.tsx`)
No physics engine in the hub. Use simple kinematic movement:
- [ ] Read `useKeys()` in `useFrame`. Arrows and WASD move on the XZ plane **relative to the camera** (up = away from the camera). Speed is 4 units/s with damped acceleration so it doesn't feel twitchy.
- [ ] The unicorn turns smoothly to face her movement direction (`damp` on the rotation, shortest-angle).
- [ ] Collision: clamp to island radius minus 1. Push out of the cake circle and present circles (circle-vs-circle, unicorn radius 0.6).
- [ ] **Click-to-walk:** clicking the ground (an invisible plane with `onClick`) or a pad sets a target point. The unicorn walks there in a straight line, sliding around obstacles with the same push-out. Any arrow key press cancels the target.
- [ ] Camera: a fixed offset behind and above, about (0, 7, 9), looking at the unicorn, following with damping. It's Mario Party's angled board view, not orbit controls.
- [ ] `step` sound while moving, throttled.
- [ ] Spawn at `hubSpawn` if set, otherwise in front of the cake facing the camera.

#### 3d. Landing pads (`LandingPad.tsx`, `PadPrompt.tsx`)
Three pads placed at 120° apart around the cake, radius about 7 from the center, so they're far enough apart that a child reaches one at a time.
- [ ] Each pad is a slightly raised disc (radius 1.6) in its `padColor`, with a glowing emissive ring that pulses, and a floating icon above it that spins slowly and bobs. Icons are built from primitives: **cards** (two tilted rounded boxes with a star), **kart** (a little rounded box on four torus wheels), **present** (box with ribbon and a "?").
- [ ] Pad status visuals: `ready` pads glow. `locked` pads are greyed with a padlock icon. `coming-soon` pads have the present icon and a softer glow.
- [ ] Proximity: when the unicorn's center is within the pad radius, the pad is "active". Its ring brightens, `padEnter` plays once, and the icon jumps.
- [ ] `PadPrompt` (a DOM overlay outside the Canvas, centered at the bottom): for a `ready` pad, a huge pink "Play!" button with the game icon. Clicking it, or pressing Space or Enter, saves `hubSpawn` and goes to the game. For `locked` or `coming-soon` pads, it shows a padlock or present with "Coming soon!" and plays `locked`. There's no Play button.
- [ ] Clicking a pad directly walks the unicorn onto it (click-to-walk target = pad center), which then triggers the prompt. One click and one more click on Play gets a child into a game.

#### 3e. Hub UI
- [ ] Top-right: `MuteButton`. Top-left: the unicorn's name with a small pencil icon (opens `NameScreen`).
- [ ] Sticker shelf (bottom-left): one small star per Memory Match win, up to 10, then "10+". Stickers survive reload.
- [ ] A one-time hint for the grown-up on first visit: a small bubble near the bottom, "Use the arrow keys or click to walk to a pad!", that disappears after the first move.

**Done when:**
- The unicorn walks around with arrows and with clicks, can't leave the island or walk through the cake, and the camera follows smoothly.
- The Memory pad opens Memory Match, and "back to party" returns her standing next to that pad.
- The kart and mystery pads show "coming soon" instead of a Play button.
- The game holds 60fps on the laptop (check the Performance panel). Draw calls stay under about 150 (log `gl.info.render.calls` once in dev).
- The bundle loads the hub fast: initial JS under 1 MB gzipped, and Memory Match is lazy-loaded.

### Phase 4: Kart Racing v1 (built 2026-11-07, needs an eyes-on pass)

Built without Rapier: arcade kinematics in `logic.ts` fit the "walls only slow you down" rule and are unit-tested. Still open: trampoline ramp, touch controls, and a browser check of camera, model and scenery.

- Install `@react-three/rapier`. The kart game is its own lazy chunk.
- Backyard course on a flat lawn: a closed loop marked by a white-fence border, flowerpot cones, a sandbox to drive around, a kiddie pool, a garden hose arch, and a gentle trampoline ramp.
- Unicorn sits in a rounded kart (primitive-built). Camera is a close chase cam or first-person behind the horn; try both and pick what's less dizzying for a 4-year-old.
- Arcade controls with arrows: up accelerates, down brakes or reverses, left and right steer. Speed capped low, gentle steering, no spin-outs, and bumping walls just slows the kart down.
- Collect floating balloons along the course (each one pops with confetti). One lap, and a finish arch with confetti and a sticker.
- Flip the registry entry from `locked` to `ready`.
- Later ideas: friend karts on splines, rainbow-boost pads, a bubble shield, touch controls for iPad.

### Phase 5: Ship at narjitaujla.com/unicorn

**Game project (this repo):**
- [ ] `vite.config.ts` already has `base: '/unicorn/'`. The build outputs to `dist/`, with assets referenced as `/unicorn/assets/...`.
- [ ] Vite puts `dist/index.html` at the root, but the files must be served under `/unicorn/`. Simplest: set `build.outDir: 'dist/unicorn'` and add a `vercel.json`:
  ```json
  {
    "outputDirectory": "dist",
    "rewrites": [{ "source": "/unicorn/(.*)", "destination": "/unicorn/index.html" }]
  }
  ```
  (The app has no client routes yet, so the rewrite only matters if routes are added later.)
- [ ] Push the repo to GitHub (private is fine), import it into Vercel as a new project with framework "Vite". Note the deployment URL, such as `unicorn-birthday-bash.vercel.app`. **Ask before creating the GitHub repo or Vercel project.**
- [ ] Check `https://unicorn-birthday-bash.vercel.app/unicorn/` works on its own.

**Portfolio project (`narjit-aujla-portfolio`, Next.js 15):** a separate task in that project, done from a session started there.
- [ ] Add a rewrite to `next.config.ts`:
  ```ts
  const nextConfig: NextConfig = {
    async rewrites() {
      return [
        { source: '/unicorn', destination: 'https://unicorn-birthday-bash.vercel.app/unicorn/' },
        { source: '/unicorn/:path*', destination: 'https://unicorn-birthday-bash.vercel.app/unicorn/:path*' },
      ];
    },
  };
  ```
- [ ] Add a project card on the portfolio linking to `/unicorn`.
- [ ] Check `narjitaujla.com/unicorn` loads, sounds play, and a reload keeps the unicorn's name.

**Pre-ship checks:**
- [ ] Latest Chrome, Safari, and Firefox on the laptop. Quick check on an iPad, where only clicking or tapping needs to work for now.
- [ ] Total download under 5 MB, Lighthouse performance over 80 on desktop.
- [ ] Favicon (unicorn head SVG), page title, and an Open Graph image (screenshot of the hub) for the portfolio link preview.
- [ ] `CREDITS.md` complete. A small "credits" link on the hub (for grown-ups) shows it.
- [ ] Short portfolio write-up: what it is, the stack, and one or two things learned.

### Phase 6: iPhone and iPad (touch and small screens)

Added 2026-11-08. iPhone first (390x844 portrait is the target, 375x667 iPhone SE the smallest), then iPad. Keyboard and mouse keep working exactly as now.

**What's broken on iPhone today, and why:**
- **Memory Match cards run off the screen after 3 columns.** `.mm-board` in `memory-match.css` sizes cards as `max(120px, ...)` and subtracts 240px of width for the corner buttons. On a 390px-wide phone the real fit is about 40px, so the 120px floor wins and 4 or 5 columns (3 x 120 + gaps is already 392px) overflow. `body` is `overflow: hidden`, so the extra columns are just cut off.
- **Kart Racing has no way to drive.** `useKeys.ts` only reads the keyboard. The arrow pictures in `DriveHint` look like buttons but aren't.
- **Smaller things that will bite next:** the difficulty picker's five 190x260 cards wrap into one column and get cut off; `100vh` on iOS Safari includes the hidden toolbar, so bottoms get clipped; nothing respects the notch or home-bar safe areas; double-tap zooms the page; long-press selects or opens the callout; win screens put three big buttons in one row (too wide for a phone).

#### 6a. Shared groundwork
- [ ] `index.html` viewport: `width=device-width, initial-scale=1, viewport-fit=cover`. Add `apple-mobile-web-app-capable` and a theme color so "Add to Home Screen" runs full screen.
- [ ] `global.css`: `touch-action: manipulation` (no double-tap zoom), `-webkit-touch-callout: none`, `-webkit-tap-highlight-color: transparent`. Swap `100vh` for `100dvh` everywhere (hub, board, win screens).
- [ ] Safe areas: corner buttons, kart HUD and touch controls offset by `env(safe-area-inset-*)`.
- [ ] Layout tokens in `tokens.css` for small screens: a `--corner` size (88px desktop, 72px phone; still a thumb-sized target) and `--edge` gap (16px, 10px phone). Use one breakpoint, `(max-width: 600px)`, plus orientation queries where layout flips.
- [ ] Audio: confirm the Web Audio context resumes on the first `touchend`/`pointerup` on iOS (it already resumes on click; check it in Safari). Note for grown-ups: the iPhone silent switch mutes Web Audio.
- [ ] `whileHover` wiggles can stick after a tap on touch. Gate them behind `@media (hover: hover)` or Motion's hover (which ignores touch); check by eye.

#### 6b. Memory Match on a phone
- [ ] **Flip the grid in portrait.** When the screen is taller than wide, lay the deck out as rows x cols instead of cols x rows (5x4 becomes 4x5, 3x2 becomes 2x3). Card order is just an index, so `logic.ts` doesn't change. Pick the layout in `Board.tsx` from a small `useOrientation()` hook (matchMedia `(orientation: portrait)`), and pass the effective `cols` to keyboard focus movement too.
- [ ] **Size cards from the space actually free.** Drop the 120px floor. In portrait, reserve a top band for the corner buttons instead of 240px of side width; in landscape keep the side reserve. Gap shrinks to 10px on phones. Expected card width on 390x844: about 80px for 4 columns (5 stars), about 110px for 3 columns (1 to 3 stars all fit 3 or 4 wide). Pure helper `boardLayout(viewport, cols, rows) -> { cols, rows, cardW }` in `layout.ts` with Vitest cases for iPhone SE, iPhone 15, iPad portrait and landscape, and the laptop.
- [ ] Hide the grown-up `moves` label on phones (it collides with the bottom row).
- [ ] **Difficulty picker:** on phones, a 2-column grid of smaller cards (about 150x170) with the 5-star card spanning both columns, so all five fit without scrolling. Shrink the dot preview to match.
- [ ] Win screen: buttons wrap, or stack in a column, under 600px.
- [ ] Rule check: 4-star and 5-star cards come out around 80px, under the 88px rule. Accept this for 4 and 5 stars only (those are for older kids or grown-ups); 1 to 3 stars must stay 88px or bigger.

#### 6c. Kart Racing touch controls
- [ ] **On-screen pedals, shown only on touch devices** (`(pointer: coarse)` or the first `touchstart`). Left thumb: two big steer buttons, ◀ and ▶. Right thumb: one big green "go" pedal, with a small "back" pedal above it. Each is 96px or more, sits in the bottom corners inside the safe area, and gives a squish plus a click sound on press. Reuse the existing key-cap look so the art matches the keyboard hint.
- [ ] Multi-touch: steer and go at the same time. Use pointer events with `setPointerCapture`, track pressed buttons per pointer id, and release on `pointerup`, `pointercancel` and `blur` so a finger sliding off never leaves the kart stuck.
- [ ] Merge sources in one input hook: rename `useKeys` to `useDriveInput`, which returns the same `DriveInput` from keys OR touch. `logic.ts` doesn't change. Keep the merge pure (`combineInput(keys, touch)`) and test it.
- [ ] Honk: tap the kart, or a small horn button near the top.
- [ ] `DriveHint` on touch: point at the go pedal (pulsing hand) instead of showing keyboard keys.
- [ ] Orientation: the race is best in landscape. In portrait, still playable (raise the camera FOV a little so the road isn't a sliver), plus a friendly "turn me sideways" phone picture that fades on its own. Never blocks play.
- [ ] Option to try with the kid if steering is too hard: "auto-go", where the kart rolls forward on its own and the child only steers. Build it behind a constant, decide after a kid test.

#### 6d. Hub, name screen, the rest
- [ ] Hub: game cards about 140px wide in a row that fits (3 across on a 390px phone, or 2 plus 1); shrink the unicorn and title by height so nothing is cut off in landscape.
- [ ] Name screen: when the iOS keyboard opens, the input and OK button stay visible (use `visualViewport` or a top-aligned layout on phones).
- [ ] Confirm-leave panel fits on 375px wide.

#### 6e. iPad (after iPhone)
- [ ] Most of this falls out of 6a to 6d. Check 820x1180 and 1024x1366 in both orientations: memory cards should land around 140 to 180px; pedals stay in the corners.
- [ ] Optional PWA manifest so it can live on the home screen (Later ideas, section 10).

#### Done when
- [ ] Playwright screenshots (device emulation: iPhone SE, iPhone 15, iPad Air, both orientations) of the hub, picker, every Memory Match difficulty, the kart race and both win screens: nothing cut off, nothing scrolls.
- [ ] Build, lint and all tests pass, including the new `boardLayout` and `combineInput` tests.
- [ ] On a real iPhone in Safari: finish Memory Match Easy and Expert by tapping, and drive one kart lap with thumbs, sounds on.
- [ ] Desktop still plays exactly as before.

---

## 8. Testing approach

- **Unit (Vitest):** all pure logic, meaning Memory Match `logic.ts`, `persist.ts` (including a throwing `localStorage`), and later the kart lap and checkpoint logic.
- **Manual in the browser:** every phase's "Done when" list. Rendering and animation aren't unit-tested.
- **Kid test:** after Phase 2 and Phase 3, watch a young child play for five minutes without helping. Write down where they get stuck in "Kid test notes" below and fix those first.

## 9. Kid test notes

_(Add dated notes here after each play session.)_

## 10. Later ideas (not planned)

- iPad: touch joystick for the 3D hub (kart touch controls and phone layouts moved to Phase 6), and an "Add to Home Screen" PWA manifest.
- Recorded voice lines.
- Friend characters (witch, dragon, and others) at the party.
- More creatures and themed card decks.
- The third game (pad 3). Candidates: balloon pop, cake decorating, pin the horn on the unicorn.
