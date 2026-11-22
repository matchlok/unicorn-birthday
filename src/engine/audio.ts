// All sound is synthesized with the Web Audio API: no audio files, no network, no licences.

import { silentWavUrl } from './silentWav'

export type SfxName =
  | 'click'
  | 'flip'
  | 'match'
  | 'nomatch'
  | 'win'
  | 'padEnter'
  | 'step'
  | 'locked'
  | 'shuffle'
  | 'peek'
  | 'pop'
  | 'honk'
  | 'bump'
  | 'coin'
  | 'jump'
  | 'gem'
  | 'power'
  | 'heart'
  | 'smash'
  | 'whistle'
  | 'chug'
  | 'clack'

type Wave = OscillatorType

const SFX_LEVEL = 0.35
const MUSIC_LEVEL = 0.14

let ctx: AudioContext | null = null
let sfxBus: GainNode | null = null
let musicBus: GainNode | null = null
let muted = false
let unlocked = false

const midi = (n: number) => 440 * 2 ** ((n - 69) / 12)

function setup(): AudioContext | null {
  if (ctx) return ctx
  try {
    // Older iOS Safari only has the prefixed constructor.
    const Ctor = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext
    if (!Ctor) return null
    ctx = new Ctor()
  } catch {
    return null
  }
  sfxBus = ctx.createGain()
  sfxBus.gain.value = SFX_LEVEL
  sfxBus.connect(ctx.destination)

  musicBus = ctx.createGain()
  musicBus.gain.value = muted ? 0 : MUSIC_LEVEL
  musicBus.connect(ctx.destination)

  // A soft echo on the music only, so it sounds like a music box in a quiet room.
  const echo = ctx.createDelay(1)
  echo.delayTime.value = 0.34
  const feedback = ctx.createGain()
  feedback.gain.value = 0.32
  const tone = ctx.createBiquadFilter()
  tone.type = 'lowpass'
  tone.frequency.value = 2200
  musicBus.connect(echo)
  echo.connect(tone)
  tone.connect(feedback)
  feedback.connect(echo)
  tone.connect(ctx.destination)
  return ctx
}

type Note = { freq: number; at: number; dur: number; wave?: Wave; gain?: number; slideTo?: number }

function note(bus: GainNode, { freq, at, dur, wave = 'sine', gain = 1, slideTo }: Note): void {
  if (!ctx) return
  const osc = ctx.createOscillator()
  const env = ctx.createGain()
  osc.type = wave
  osc.frequency.setValueAtTime(freq, at)
  if (slideTo) osc.frequency.exponentialRampToValueAtTime(slideTo, at + dur)
  env.gain.setValueAtTime(0.0001, at)
  env.gain.exponentialRampToValueAtTime(gain, at + 0.012)
  env.gain.exponentialRampToValueAtTime(0.0001, at + dur)
  osc.connect(env)
  env.connect(bus)
  osc.start(at)
  osc.stop(at + dur + 0.05)
}

// Chime: a sine plus a quiet octave above, like a little bell.
function chime(bus: GainNode, freq: number, at: number, dur = 0.5, gain = 1): void {
  note(bus, { freq, at, dur, gain })
  note(bus, { freq: freq * 2, at, dur: dur * 0.5, gain: gain * 0.25 })
}

const SFX: Record<SfxName, (bus: GainNode, t: number) => void> = {
  // Tiny soft tick for buttons.
  click: (bus, t) => note(bus, { freq: 900, slideTo: 650, at: t, dur: 0.07, wave: 'triangle', gain: 0.6 }),
  // Quick rising "pop" as the card turns over.
  flip: (bus, t) => {
    note(bus, { freq: 420, slideTo: 760, at: t, dur: 0.11, wave: 'triangle', gain: 0.7 })
    note(bus, { freq: 1200, slideTo: 1800, at: t + 0.04, dur: 0.05, gain: 0.2 })
  },
  // Happy bell arpeggio: C E G.
  match: (bus, t) => [72, 76, 79].forEach((n, i) => chime(bus, midi(n), t + i * 0.09, 0.55)),
  // Gentle two-note sigh going down. Soft, never harsh.
  nomatch: (bus, t) => {
    note(bus, { freq: midi(62), at: t, dur: 0.22, wave: 'triangle', gain: 0.5 })
    note(bus, { freq: midi(57), at: t + 0.16, dur: 0.34, wave: 'triangle', gain: 0.45 })
  },
  win: (bus, t) => [72, 76, 79, 84, 88].forEach((n, i) => chime(bus, midi(n), t + i * 0.13, 0.9)),
  padEnter: (bus, t) => [74, 81].forEach((n, i) => chime(bus, midi(n), t + i * 0.08, 0.4)),
  step: (bus, t) => note(bus, { freq: 300, slideTo: 220, at: t, dur: 0.05, wave: 'triangle', gain: 0.4 }),
  // Quick swooshing run up and down for the shuffle.
  shuffle: (bus, t) =>
    [60, 67, 72, 79, 72, 67, 62, 69].forEach((n, i) => note(bus, { freq: midi(n), at: t + i * 0.055, dur: 0.14, wave: 'triangle', gain: 0.5 })),
  // Twinkly high sparkle for a peek or a wand.
  peek: (bus, t) => [88, 91, 95, 100].forEach((n, i) => chime(bus, midi(n), t + i * 0.07, 0.4, 0.6)),
  // Bright bubbly pop for a balloon.
  pop: (bus, t) => {
    note(bus, { freq: 500, slideTo: 1100, at: t, dur: 0.09, wave: 'triangle', gain: 0.7 })
    chime(bus, midi(88), t + 0.05, 0.35, 0.5)
  },
  // Friendly two-note toot.
  honk: (bus, t) => {
    note(bus, { freq: midi(65), at: t, dur: 0.16, wave: 'triangle', gain: 0.7 })
    note(bus, { freq: midi(69), at: t + 0.14, dur: 0.24, wave: 'triangle', gain: 0.7 })
  },
  // Soft thud when the kart brushes a fence.
  bump: (bus, t) => note(bus, { freq: 160, slideTo: 90, at: t, dur: 0.14, wave: 'sine', gain: 0.7 }),
  locked: (bus, t) => note(bus, { freq: 180, slideTo: 140, at: t, dur: 0.18, wave: 'triangle', gain: 0.5 }),
  // Classic two-note coin "bling".
  coin: (bus, t) => {
    note(bus, { freq: midi(83), at: t, dur: 0.08, wave: 'square', gain: 0.18 })
    note(bus, { freq: midi(88), at: t + 0.07, dur: 0.22, wave: 'square', gain: 0.18 })
  },
  // Springy "boing" upward.
  jump: (bus, t) => note(bus, { freq: 300, slideTo: 720, at: t, dur: 0.16, wave: 'triangle', gain: 0.45 }),
  // Sparkly run for a gem.
  gem: (bus, t) => [84, 88, 91, 96].forEach((n, i) => chime(bus, midi(n), t + i * 0.06, 0.5, 0.7)),
  // Rising power-up fanfare.
  power: (bus, t) =>
    [60, 64, 67, 72, 76, 79, 84].forEach((n, i) => note(bus, { freq: midi(n), at: t + i * 0.05, dur: 0.18, wave: 'triangle', gain: 0.5 })),
  // Warm heart: two soft bells, like a heartbeat.
  heart: (bus, t) => {
    chime(bus, midi(76), t, 0.4, 0.8)
    chime(bus, midi(81), t + 0.16, 0.6, 0.8)
  },
  // Crunchy smash with a happy bell on top.
  smash: (bus, t) => {
    note(bus, { freq: 220, slideTo: 60, at: t, dur: 0.18, wave: 'sawtooth', gain: 0.25 })
    chime(bus, midi(91), t + 0.05, 0.3, 0.5)
  },
  // Toy steam whistle: a rising "too" then a held "ooot", with a quiet fifth above.
  whistle: (bus, t) => {
    note(bus, { freq: midi(79), slideTo: midi(83), at: t, dur: 0.22, wave: 'triangle', gain: 0.6 })
    note(bus, { freq: midi(83), at: t + 0.2, dur: 0.5, wave: 'triangle', gain: 0.6 })
    note(bus, { freq: midi(90), at: t + 0.2, dur: 0.5, wave: 'sine', gain: 0.15 })
  },
  // One soft engine beat. startChug() repeats it; there is no looping buffer.
  chug: (bus, t) => {
    note(bus, { freq: 130, slideTo: 70, at: t, dur: 0.1, wave: 'triangle', gain: 0.55 })
    note(bus, { freq: 900, slideTo: 500, at: t, dur: 0.05, wave: 'sine', gain: 0.08 })
  },
  // Wooden "clack" of a switch lever.
  clack: (bus, t) => {
    note(bus, { freq: 240, slideTo: 110, at: t, dur: 0.06, wave: 'square', gain: 0.22 })
    note(bus, { freq: 1300, slideTo: 800, at: t + 0.03, dur: 0.04, wave: 'triangle', gain: 0.3 })
  },
}

export function play(name: SfxName): void {
  if (muted) return
  try {
    const c = setup()
    if (!c || !sfxBus) return
    void c.resume()
    SFX[name](sfxBus, c.currentTime + 0.005)
  } catch {
    // no sound is better than a crash
  }
}

// The train's chugging: one short synthesized beat on a timer. Always pair startChug with
// stopChug (the train game does it on unmount). Never a looping zero-length buffer: that froze Chrome.
export const CHUG_MS = 260
let chugTimer: ReturnType<typeof setInterval> | null = null

export function startChug(): void {
  if (chugTimer) return
  play('chug')
  chugTimer = setInterval(() => play('chug'), CHUG_MS)
}

export function stopChug(): void {
  if (chugTimer) clearInterval(chugTimer)
  chugTimer = null
}

// Calm music box lullaby: C - Am - F - G, a gently rocking arpeggio with a sparse
// pentatonic melody on top. Pentatonic notes can't clash, so random picks always sound fine.
const BEAT = 0.75
const CHORDS = [
  [60, 64, 67, 72], // C
  [57, 60, 64, 69], // Am
  [53, 57, 60, 65], // F
  [55, 59, 62, 67], // G
]
const MELODY = [72, 74, 76, 79, 81, 84]
const LOOKAHEAD = 1.2

let musicTimer: ReturnType<typeof setInterval> | null = null
let nextBeat = 0
let beatIndex = 0

function scheduleMusic(): void {
  if (!ctx || !musicBus) return
  while (nextBeat < ctx.currentTime + LOOKAHEAD) {
    const chord = CHORDS[Math.floor(beatIndex / 4) % CHORDS.length]
    const step = beatIndex % 4
    const t = Math.max(nextBeat, ctx.currentTime)
    // Two eighth-note arpeggio notes per beat, with a low root on the first beat of each bar.
    note(musicBus, { freq: midi(chord[step]), at: t, dur: 1.4, gain: 0.8 })
    note(musicBus, { freq: midi(chord[(step + 2) % 4]), at: t + BEAT / 2, dur: 1.2, gain: 0.5 })
    if (step === 0) note(musicBus, { freq: midi(chord[0] - 12), at: t, dur: 2.4, gain: 0.7 })
    if (Math.random() < 0.4) {
      const m = MELODY[Math.floor(Math.random() * MELODY.length)]
      note(musicBus, { freq: midi(m), at: t + BEAT / 4, dur: 1.6, gain: 0.55 })
    }
    nextBeat += BEAT
    beatIndex++
  }
}

function startMusic(): void {
  if (musicTimer || muted) return
  const c = setup()
  if (!c) return
  void c.resume()
  nextBeat = c.currentTime + 0.3
  scheduleMusic()
  musicTimer = setInterval(scheduleMusic, 250)
}

function stopMusic(): void {
  if (musicTimer) clearInterval(musicTimer)
  musicTimer = null
}

export function setMuted(value: boolean): void {
  muted = value
  if (!ctx || !musicBus) {
    if (!value && unlocked) startMusic()
    return
  }
  musicBus.gain.setTargetAtTime(value ? 0 : MUSIC_LEVEL, ctx.currentTime, 0.05)
  if (value) stopMusic()
  else if (unlocked) startMusic()
}

// iOS plays Web Audio on the "ambient" channel, which the ring/silent switch mutes. Asking for
// "playback" makes it sound like a game instead (Safari 17+; harmless where unsupported).
function requestMediaChannel(): void {
  try {
    const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
    if (session) session.type = 'playback'
  } catch {
    // ignore
  }
}

// One silent sample played inside the gesture is what finally unlocks iOS Safari.
function playSilence(c: AudioContext): void {
  const src = c.createBufferSource()
  src.buffer = c.createBuffer(1, 1, 22050)
  src.connect(c.destination)
  src.start(0)
}

// iOS mutes Web Audio when the ring/silent switch is on, but not a playing <audio> element.
// Looping a silent clip moves the page onto the media channel (works on iOS older than 17 too).
let keepAlive: HTMLAudioElement | null = null
function playMediaChannelClip(): void {
  if (keepAlive) {
    if (keepAlive.paused) void keepAlive.play().catch(() => {})
    return
  }
  keepAlive = new Audio(silentWavUrl())
  keepAlive.loop = true
  keepAlive.volume = 0.01
  void keepAlive.play().catch(() => {})
}

// True once the context is actually producing sound; callers keep listening until then.
export function isAudioRunning(): boolean {
  return ctx?.state === 'running'
}

// Browsers block audio until a user gesture; the first one starts the music. Call it from
// touchend/click/keydown (iOS Safari does NOT count pointerdown or touchstart). Safe to call
// on every gesture: it also re-wakes a context iOS suspended or "interrupted" (a call, Siri).
export function unlockAudio(): void {
  try {
    unlocked = true
    requestMediaChannel()
    playMediaChannelClip()
    const c = setup()
    if (!c) return
    void c.resume()
    playSilence(c)
    startMusic()
  } catch {
    // ignore
  }
}

// Pause everything while the tab is in the background.
if (typeof document !== 'undefined') {
  document.addEventListener('visibilitychange', () => {
    if (!ctx || !unlocked) return
    if (document.hidden) void ctx.suspend()
    else void ctx.resume()
  })
}
