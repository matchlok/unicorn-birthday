import { describe, expect, it } from 'vitest'
import { cleanName, finalName, NAME_MAX } from './name'

describe('cleanName', () => {
  it('drops characters that are not letters, numbers, spaces, apostrophes or hyphens', () => {
    expect(cleanName('Spa<rk>le!?')).toBe('Sparkle')
    expect(cleanName("Mary-Jo O'Neil 2")).toBe("Mary-Jo O'Neil 2")
  })

  it('keeps accented letters', () => {
    expect(cleanName('Zoë')).toBe('Zoë')
  })

  it('caps the length', () => {
    expect(cleanName('a'.repeat(40))).toHaveLength(NAME_MAX)
  })
})

describe('finalName', () => {
  it('trims and collapses spaces', () => {
    expect(finalName('  Star   dust ')).toBe('Star dust')
  })

  it('is empty for only junk', () => {
    expect(finalName(' !! ')).toBe('')
  })
})
