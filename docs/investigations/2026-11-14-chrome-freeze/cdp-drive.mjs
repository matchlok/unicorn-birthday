// Drives headless Chrome through the name screen and samples memory, for the Chrome-freeze investigation.
//
//   node cdp-drive.mjs <url> [--audio] [--gpu] [--rock] [--seconds=30]
//
//   --audio    let the AudioContext start without a gesture, so the music really runs (real browsers do after a click)
//   --gpu      ask for hardware WebGL instead of software (headless default)
//   --rock     after the hub, open Red Rocks (dev server only: it imports /src/engine/store.ts; branch rock-climb only)
//
// Chrome is always closed with the DevTools Browser.close command. Killing only the launcher leaves
// sandboxed tab processes behind that Windows refuses to kill.

import { spawn } from 'node:child_process'
import { mkdtempSync } from 'node:fs'
import { join } from 'node:path'
import { tmpdir } from 'node:os'

const args = process.argv.slice(2)
const url = args.find((a) => !a.startsWith('--')) ?? 'http://localhost:5173/unicorn/'
const flag = (f) => args.includes(f)
const seconds = Number(args.find((a) => a.startsWith('--seconds='))?.split('=')[1] ?? 30)

const chrome = 'C:/Program Files/Google/Chrome/Application/chrome.exe'
const profile = mkdtempSync(join(tmpdir(), 'ubb-cdp-'))
const port = 9300 + Math.floor(Math.random() * 600)
const chromeArgs = ['--headless=new', `--remote-debugging-port=${port}`, `--user-data-dir=${profile}`, '--window-size=1366,768', '--enable-precise-memory-info']
if (flag('--audio')) chromeArgs.push('--autoplay-policy=no-user-gesture-required')
if (flag('--gpu')) chromeArgs.push('--enable-gpu', '--use-angle=d3d11', '--ignore-gpu-blocklist')
const proc = spawn(chrome, [...chromeArgs, 'about:blank'])

const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
const withTimeout = (p, ms, what) => Promise.race([p, sleep(ms).then(() => { throw new Error(`timeout: ${what}`) })])

let page, browser
let nextId = 0
const pending = new Map()
const log = (...a) => console.log(new Date().toISOString().slice(11, 19), ...a)

async function connect() {
  for (let i = 0; i < 60; i++) {
    try {
      const list = await (await fetch(`http://127.0.0.1:${port}/json`)).json()
      const ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json()
      const target = list.find((t) => t.type === 'page')
      if (target) {
        page = new WebSocket(target.webSocketDebuggerUrl)
        browser = new WebSocket(ver.webSocketDebuggerUrl)
        await Promise.all([page, browser].map((w) => new Promise((r, j) => { w.addEventListener('open', r); w.addEventListener('error', j) })))
        return
      }
    } catch {}
    await sleep(250)
  }
  throw new Error('could not connect to Chrome')
}

function send(method, params = {}) {
  const id = ++nextId
  const p = new Promise((r) => pending.set(id, r))
  page.send(JSON.stringify({ id, method, params }))
  return withTimeout(p, 8000, `${method} (page main thread busy?)`)
}

const evalJs = async (expression) => (await send('Runtime.evaluate', { expression, awaitPromise: true, returnByValue: true })).result?.result?.value

async function metrics() {
  const m = (await send('Performance.getMetrics')).result.metrics
  const get = (n) => m.find((x) => x.name === n)?.value ?? 0
  return `heap ${(get('JSHeapUsedSize') / 1048576).toFixed(1)} MB  nodes ${get('Nodes')}  listeners ${get('JSEventListeners')}`
}

async function sample(label) {
  log(label)
  const steps = Math.max(1, Math.round(seconds / 5))
  for (let k = 0; k <= steps; k++) {
    try { log(`  t+${k * 5}s  ${await metrics()}`) } catch (e) { log(`  t+${k * 5}s  ${e.message}`) }
    if (k < steps) await sleep(5000)
  }
}

try {
  await connect()
  page.addEventListener('message', (ev) => {
    const m = JSON.parse(ev.data)
    if (m.id && pending.has(m.id)) { pending.get(m.id)(m); pending.delete(m.id) }
    if (m.method === 'Runtime.exceptionThrown') log('EXCEPTION', m.params.exceptionDetails.exception?.description ?? m.params.exceptionDetails.text)
    if (m.method === 'Runtime.consoleAPICalled' && ['error', 'warning'].includes(m.params.type)) log(`console.${m.params.type}`, m.params.args.map((a) => a.value ?? a.description).join(' '))
    if (m.method === 'Network.responseReceived' && m.params.response.status >= 400) log('HTTP', m.params.response.status, m.params.response.url)
  })
  await send('Runtime.enable'); await send('Performance.enable'); await send('Network.enable'); await send('Page.enable')
  log('open', url, flag('--audio') ? '(audio on)' : '(audio blocked)', flag('--gpu') ? '(gpu)' : '(software gl)')
  await send('Page.navigate', { url })
  await sleep(3000)

  const onNameScreen = await evalJs(`!!document.querySelector('input')`)
  if (onNameScreen) {
    await sample('NAME SCREEN')
    await evalJs(`(() => {
      const i = document.querySelector('input')
      Object.getOwnPropertyDescriptor(HTMLInputElement.prototype, 'value').set.call(i, 'Sparkle')
      i.dispatchEvent(new Event('input', { bubbles: true }))
      ;[...document.querySelectorAll('button')].find((b) => /party/i.test(b.innerText))?.click()
    })()`)
    await sleep(1500)
  }
  log('page text:', JSON.stringify(await evalJs(`document.body.innerText.slice(0, 80)`)))
  await sample('HUB')

  if (flag('--rock')) {
    log('goTo rock-climb:', await evalJs(`import('/unicorn/src/engine/store.ts').then((m) => { m.useStore.getState().goTo({ kind: 'game', id: 'rock-climb' }); return 'ok' }).catch((e) => 'ERR ' + e)`))
    await sleep(1500)
    await evalJs(`window.dispatchEvent(new KeyboardEvent('keydown', { code: 'ArrowRight' }))`)
    await sample('RED ROCKS (holding right)')
  }
} catch (e) {
  log('FAILED:', e.message)
} finally {
  try { browser?.send(JSON.stringify({ id: 1, method: 'Browser.close' })) } catch {}
  await sleep(1500)
  proc.kill()
  process.exit(0)
}
