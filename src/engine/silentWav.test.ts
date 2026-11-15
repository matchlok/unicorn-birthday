import { describe, expect, it } from 'vitest'
import { silentWavBytes } from './silentWav'

describe('silentWavBytes', () => {
  it('has a non-empty data chunk, so a looping clip has a duration', () => {
    const bytes = silentWavBytes()
    const view = new DataView(bytes.buffer)
    expect(String.fromCharCode(...bytes.slice(36, 40))).toBe('data')
    const dataLength = view.getUint32(40, true)
    expect(dataLength).toBeGreaterThan(0)
    expect(bytes.length).toBe(44 + dataLength)
    expect(view.getUint32(4, true)).toBe(bytes.length - 8)
  })

  it('is silence (8-bit PCM midpoint)', () => {
    expect([...silentWavBytes().slice(44)].every((b) => b === 0x80)).toBe(true)
  })
})
