# Investigation: Chrome freezes after entering the unicorn's name

Opened 2026-11-14. Status: **open, not reproduced outside Narji's Chrome.**

## Symptom

In desktop Chrome on the local dev server (`npm run dev`, http://localhost:5173/unicorn/), the game shows the ⭐ loading placeholder and then the whole browser locks up. The address bar, refresh and DevTools all stop responding, and Chrome has to be shut down. Narji first saw it right after submitting the unicorn's name, then again when opening the Red Rocks game. A normal reload did not clear it.

Chrome processes on the machine grew to 1.5 to 3 GB each. One process from a freshly restarted Chrome grew **527 MB in 10 seconds** (18:50, measured with `Get-Process`).

## What makes this hard

Every automated attempt to reproduce it passed. Headless Chrome, driven over the DevTools protocol, entered a name, reached the hub and opened Red Rocks with no errors on:

- the dev server (ports 5173 and 5174),
- the production build (`vite preview`),
- the live Vercel site (https://unicorn-birthday-alpha.vercel.app/unicorn/),
- a fresh profile and a reused profile with a saved name and warm cache.

Headless Chrome differs from Narji's in two ways that matter:

1. **No sound.** Chrome logged "The AudioContext was not allowed to start" on every headless run, so the music scheduler in `src/engine/audio.ts` never ran. In a real browser the first click starts the music, and that first click is the name screen's "Let's party!" button.
2. **No real GPU.** Headless uses software WebGL. The hub is a React Three Fiber scene, so a GPU driver or WebGL issue would never show up headless.

## Timeline (2026-11-14, Mountain time)

| Time | Event |
|---|---|
| ~10:00 | Red Rocks Romp (Phase 7) committed and pushed straight to `main` (`38ba08a`). |
| evening | Narji: "star error again after entering unicorn name", then "star error when loading the red rocks game". |
| 18:30 to 18:41 | Claude ran several Vite servers (5174, 5175) and headless Chrome tests alongside Narji's server on 5173. All servers share `node_modules/.vite/deps`, which was rewritten at 18:32:11 when 5173 started. Several headless Chrome tab processes were orphaned when the test script killed only the parent, and kept growing. Windows denied killing them; Narji ended them in Task Manager. |
| ~18:45 | Narji's Chrome froze completely and was shut down. |
| ~18:50 | `main` reverted (`953716d`); Red Rocks kept on branch `rock-climb`. **Narji reports the memory problem persists with Red Rocks gone**, so the game is not the only cause, and maybe not a cause at all. |

## Facts

- `main` at `953716d` has the same files as `ccfef23` (before Red Rocks).
- Uncommitted on `main`: `src/hub/hubLogic.ts` moves two presents out wide. Origin unknown (not this session). Reviewed: it only changes numbers and has no unbounded loops (`pushOut` always makes two passes), so it is unlikely to matter.
- 64 GB RAM, about 30 GB free during the incident, so the machine was not out of memory. The freeze is inside Chrome.
- The Vercel URL in the docs (`unicorn-birthday-bash.vercel.app`) returns 404. The live site is `unicorn-birthday-alpha.vercel.app`.

## Suspects, most likely first

1. **Audio.** Music starts on the first click, which is the name submit, and it never ran in any headless test. Look at `startMusic` / `scheduleMusic` (a `setInterval` that creates oscillators against `ctx.currentTime`), the echo feedback loop (delay plus 0.32 feedback gain), and the looping silent `<audio>` keep-alive in `playMediaChannelClip`. Quick test: mute (top-right button) **before** entering the name. If the freeze goes away, this is it.
2. **The 3D hub on a real GPU.** It was built 2026-11-08 and only ever checked in headless Chromium with software GL (see docs/STATUS.md). It mounts right after the name screen. Check for per-frame allocations, geometry or material created in render, `<Sparkles>`, and `BirthdayBanner` projecting a point every frame.
3. **Dev-server state.** Two or more Vite servers sharing `node_modules/.vite/deps`, plus a browser cache of optimized deps that a normal reload does not refresh. Rule out with one server, `npm run dev -- --force`, and Ctrl+Shift+R, or compare against `npm run build && npx vite preview`.
4. **Red Rocks zero-size canvas** (only on branch `rock-climb`). If the canvas ever measures 0 wide or tall, `scale` is 0, the view size becomes Infinity or NaN, and the loops in `draw.ts` (`peaks`, `fins`, `trees`, `strata`) never end while pushing into arrays. That would explain runaway memory in the game, but not on `main`. Guard before merging the branch: skip the frame when `cssW < 1 || cssH < 1`, and bail out of the drawing loops when the view size is not finite.

## Plan

Work on a branch (`git switch -c investigate-chrome-freeze`), not `main`.

1. **Clean start.** No leftover Chrome processes in Windows Task Manager, exactly one Vite server, started with `npm run dev -- --force`.
2. **Watch it happen.** Fresh Chrome window, open DevTools (F12) **before** entering the name. Turn on the Performance monitor (Ctrl+Shift+P, "Show Performance monitor") for JS heap, DOM nodes and event listeners, and keep Chrome's Task Manager (Shift+Esc) open. Record which row grows (the tab, or the GPU process) and the last console messages before the freeze.
3. **Split the suspects**, one change at a time:
   - Mute first, then enter the name (tests suspect 1).
   - With a name already saved, the app starts on the hub without a click. Open the page and don't click anything (tests suspect 2 without audio).
   - Same steps against `vite preview` (tests suspect 3).
   - In Chrome, `chrome://settings/system`: turn off "Use graphics acceleration" and retry (tests the GPU half of suspect 2).
4. **Reproduce headless with sound and GPU**, using [cdp-drive.mjs](cdp-drive.mjs) with `--audio` (adds `--autoplay-policy=no-user-gesture-required`) and `--gpu`. It samples heap every 5 s and always closes Chrome with `Browser.close`, so it leaves no orphans.
5. **Bisect** if it is in old code: `git bisect` between `957d89f` (Memory Match, before the hub) and `ccfef23`. Mark a commit bad if the heap climbs steadily for 30 s after entering a name.
6. Fix it, add a regression check where the logic is pure, and update docs/STATUS.md.

## Rules learned the hard way

- Run vitest from PowerShell. Under Git Bash every suite fails with "Cannot read properties of undefined (reading 'config')".
- Don't run extra Vite servers next to Narji's. They share the dependency cache.
- Close headless Chrome with the DevTools `Browser.close` command. Killing the launcher leaves sandboxed tab processes that Windows won't let you kill.
- Branch first; merge to `main` only when Narji asks.
