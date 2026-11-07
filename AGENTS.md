# Unicorn Birthday Bash — agent guide

PARA bucket: **Project**. Workspace rules: [../../AGENTS.md](../../AGENTS.md). This file overrides them inside this folder. Claude Code reads it directly; don't add a CLAUDE.md.

## What this is

A web game for a 4-year-old. A unicorn's birthday party hub with landing pads that launch party games: Memory Match first, then Unicorn Kart Racing, then a third game to be picked. Local first, then Vercel and a link from narjitaujla.com. Full plan: [docs/PLAN.md](docs/PLAN.md).

## Rules

1. **Made for a 4-year-old.** No reading needed to play, big targets, no fail states or timers, sound on every action.
2. **No network calls, ads, accounts, or tracking.** Static site only.
3. **Each game is a module** in `src/games/<id>/` registered in `src/games/registry.ts`, with an `onExit` prop. The hub shouldn't need changes beyond the registry.
4. **Game logic is pure and tested** (Vitest). Rendering and animation are not unit-tested.
5. **Assets are CC0 or self-made.** Record the source of every third-party asset in `src/assets/CREDITS.md`.

## Current status

Update when a phase finishes or a decision changes.

- **Phase:** 2 (Memory Match) is built as of 2026-11-07, now with 5 difficulties: 4 stars (5x4, 10 pairs) and 5 stars (same deck plus shuffle, peek and wand power cards; see PLAN 2a-bis). Phase 1 (name the unicorn) is built the same day: first launch opens `src/screens/NameScreen.tsx`, and the landing page has a name button with a pencil that reopens it. Build, lint and 35 tests pass. Not yet checked by eye in a browser: the name screen, the 4 and 5 star boards on 1366x768, shuffle/peek/wand animations and sounds, the new bee and penguin art, plus everything listed before (flip and sparkle animations, Phase 0 transition). Sound is synthesized with Web Audio in `src/engine/audio.ts` (no files); Howler is unused. The real test is a 4-year-old finishing Easy.
- **Landing page:** a 2D landing page (unicorn, title, one card per registry game) replaces the placeholder hub as of 2026-11-07, in `src/hub/`. Cards, buttons and panels got a softer look (thin outline, layered shadows, gloss and paper grain via `--shadow`, `--sheen`, `--grain` in `tokens.css`, applied in `global.css`). Build, lint and tests pass; not yet checked by eye.
- **Kart Racing (Phase 4 v1):** built 2026-11-07 in `src/games/kart-racing/`, registry entry now `ready`. One lap of a backyard loop with a white fence, finish rainbow arch, hose arch, pool, sandbox, trees and flowers; 8 balloons to pop (shown as dots, never a score); arrows or WASD, space honks; walls only slow the kart; win screen gives a sticker. Pure logic in `logic.ts` (17 tests, including a scripted driver that finishes the lap). **Not yet checked by eye in a browser:** camera feel, kart model, scenery, balloon pops, sounds. Rapier was NOT installed: movement is hand-rolled kinematics. Not built from the Phase 4 list: trampoline ramp, flowerpot cones as obstacles, touch controls.
- **Next action:** Look at it all in the browser (`npm run dev`), including Kart Racing, fix what looks off, then Phase 3 (3D hub) in [docs/PLAN.md](docs/PLAN.md#phase-3-party-hub-3d).
- **Decided:** decisions table in PLAN section 1 (named unicorn, no friends, sound effects only, keyboard and mouse first, served at narjitaujla.com/unicorn).

## Working method

- Start each session by reading "Current status", then the matching phase in [docs/PLAN.md](docs/PLAN.md).
- Tick the plan checkboxes as tasks finish. End each session by updating "Current status" and committing to `main`.
- Ask before creating the GitHub repo or Vercel project, and before touching the portfolio project.

## Stack

Vite + React + TypeScript, React Three Fiber + drei, Zustand, Framer Motion (`motion`), Howler, canvas-confetti, Vitest. Rapier only from Phase 4. Hosted on Vercel at base path `/unicorn/`.

## Commands

- `npm run dev`, then open http://localhost:5173/unicorn/
- `npx vitest run`
- `npm run build`
