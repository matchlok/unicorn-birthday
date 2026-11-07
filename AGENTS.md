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

- **Phase:** 2 (Memory Match) is built as of 2026-11-07: build, lint and 18 tests pass. Not yet checked by eye in a browser: all three difficulties, the hard grid on 1366x768, flip and sparkle animations. Phase 0 transition check is also still open. Sound files are not in `public/sfx/` yet, so the game is silent. The real test is a 4-year-old finishing Easy.
- **Next action:** Look at it in the browser, then Phase 1 (name the unicorn) in [docs/PLAN.md](docs/PLAN.md#phase-1-name-the-unicorn), which also needs the store initial scene switched to `name` when `unicornName` is null (marked in `src/engine/store.ts` and `SceneRouter.tsx`). Then Phase 3 (3D hub).
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
