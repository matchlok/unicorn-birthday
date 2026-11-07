export const NAME_MAX = 16

// Letters, numbers, spaces, apostrophes and hyphens only, at most NAME_MAX characters.
export function cleanName(raw: string): string {
  return raw.replace(/[^\p{L}\p{N} '-]/gu, '').slice(0, NAME_MAX)
}

export function finalName(raw: string): string {
  return cleanName(raw).trim().replace(/\s+/g, ' ')
}
