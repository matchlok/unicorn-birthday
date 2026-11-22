# Unicorn Birthday Bash — agent guide

PARA bucket: **Project**. Workspace rules: [../../AGENTS.md](../../AGENTS.md). This file overrides them inside this folder. Claude Code reads it directly; don't add a CLAUDE.md.

## What this is

A web game for a 4-year-old. A unicorn's birthday party hub with landing pads that launch party games: Memory Match, Unicorn Kart Racing, and Red Rocks Romp (a side-scrolling platformer). Local first, then Vercel and a link from narjitaujla.com. Full plan: [docs/PLAN.md](docs/PLAN.md).

## Rules

1. **Made for a 4-year-old.** No reading needed to play, big targets, no fail states or timers, sound on every action.
2. **No network calls, ads, accounts, or tracking.** Static site only.
3. **Each game is a module** in `src/games/<id>/` registered in `src/games/registry.ts`, with an `onExit` prop. The hub shouldn't need changes beyond the registry.
4. **Game logic is pure and tested** (Vitest). Rendering and animation are not unit-tested.
5. **Assets are CC0 or self-made.** Record the source of every third-party asset in `src/assets/CREDITS.md`.

## Current status

Update when a phase finishes or a decision changes.

- **Phase:** Phases 0, 1, 2 (Memory Match, 5 difficulties), Kart Racing v1, Phase 6a/6b/6c (iPhone groundwork, portrait Memory Match, kart touch pedals), Phase 3 (3D party hub with a display per game) and Phase 7 (Red Rocks Romp platformer on pad 3) are built. Little has been checked on a real device. The real test is a 4-year-old finishing Easy.
- **Recent investigation:** the Chrome freeze after entering the unicorn's name was a zero-length looping keep-alive WAV in `audio.ts`. Fixed and Red Rocks merged back with a zero-size canvas guard; Narji still to confirm in real Chrome. See [docs/investigations/2026-11-14-chrome-freeze/README.md](docs/investigations/2026-11-14-chrome-freeze/README.md).
- **Next action:** play Red Rocks Romp by hand and tune the jump and obstacle spacing (PLAN Phase 7), then Phase 6d/6e (hub touch polish, iPad) and a real-device pass of the 3D hub.

Details per phase, what is unchecked, and decisions: [docs/STATUS.md](docs/STATUS.md). Add new entries there; keep only the phase and next action here.

## Working method

- Start each session by reading "Current status", then the matching phase in [docs/PLAN.md](docs/PLAN.md).
- Tick the plan checkboxes as tasks finish. End each session by updating "Current status" and docs/STATUS.md.
- Work on a feature branch, never on `main`. Nothing is committed until Narjit reviews it, and it merges to `main` through a PR only when he says so.
- Ask before creating the GitHub repo or Vercel project, and before touching the portfolio project.

## Stack

Vite + React + TypeScript, React Three Fiber + drei, Zustand, Framer Motion (`motion`), Howler, canvas-confetti, Vitest. Rapier only from Phase 4. Hosted on Vercel at base path `/unicorn/`.

## Commands

- `npm run dev`, then open http://localhost:5173/unicorn/
- `npx vitest run` (from PowerShell: under Git Bash every suite fails with "reading 'config'")
- `npm run build`
