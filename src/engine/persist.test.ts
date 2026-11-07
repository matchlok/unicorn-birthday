import { afterEach, describe, expect, it, vi } from 'vitest'
import { readJson, writeJson } from './persist'

afterEach(() => {
  vi.restoreAllMocks()
  localStorage.clear()
})

describe('persist', () => {
  it('round-trips values under the ubb: prefix', () => {
    writeJson('name', 'Sparkle')
    expect(localStorage.getItem('ubb:name')).toBe('"Sparkle"')
    expect(readJson('name', null)).toBe('Sparkle')
  })

  it('returns the fallback when nothing is stored', () => {
    expect(readJson('missing', 7)).toBe(7)
  })

  it('returns the fallback for corrupt JSON', () => {
    localStorage.setItem('ubb:bad', '{nope')
    expect(readJson('bad', 'ok')).toBe('ok')
  })

  it('does not throw when localStorage throws', () => {
    vi.spyOn(Storage.prototype, 'getItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    vi.spyOn(Storage.prototype, 'setItem').mockImplementation(() => {
      throw new Error('blocked')
    })
    expect(readJson('x', 'fallback')).toBe('fallback')
    expect(() => writeJson('x', 1)).not.toThrow()
  })
})
