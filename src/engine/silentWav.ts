// A silent 8-bit mono WAV as a data URL, used to keep iOS on the media channel.
// The data chunk must have real length: a zero-length clip set to loop makes Chrome restart
// playback in a tight loop and stalls the page (see docs/investigations/2026-11-14-chrome-freeze).
export function silentWavBytes(seconds = 0.5, sampleRate = 8000): Uint8Array {
  const samples = Math.max(1, Math.round(seconds * sampleRate))
  const bytes = new Uint8Array(44 + samples)
  const view = new DataView(bytes.buffer)
  const tag = (offset: number, text: string) => [...text].forEach((ch, i) => (bytes[offset + i] = ch.charCodeAt(0)))
  tag(0, 'RIFF')
  view.setUint32(4, 36 + samples, true)
  tag(8, 'WAVE')
  tag(12, 'fmt ')
  view.setUint32(16, 16, true) // fmt chunk size
  view.setUint16(20, 1, true) // PCM
  view.setUint16(22, 1, true) // mono
  view.setUint32(24, sampleRate, true)
  view.setUint32(28, sampleRate, true) // byte rate (1 byte per sample)
  view.setUint16(32, 1, true) // block align
  view.setUint16(34, 8, true) // bits per sample
  tag(36, 'data')
  view.setUint32(40, samples, true)
  bytes.fill(0x80, 44) // 8-bit PCM silence is 128
  return bytes
}

export function silentWavUrl(): string {
  let binary = ''
  silentWavBytes().forEach((b) => (binary += String.fromCharCode(b)))
  return `data:audio/wav;base64,${btoa(binary)}`
}
