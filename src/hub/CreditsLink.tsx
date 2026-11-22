import { useState } from 'react'
import { play } from '../engine/audio'
import credits from '../assets/CREDITS.md?raw'

// A small link for grown-ups, tucked in the bottom-left corner. The child never needs it:
// it is tiny, low contrast, and opens a plain text panel with the credits file.
export function CreditsLink() {
  const [open, setOpen] = useState(false)

  const toggle = (next: boolean) => {
    play('click')
    setOpen(next)
  }

  return (
    <>
      <button type="button" className="credits-link" onClick={() => toggle(true)}>
        credits
      </button>
      {open && (
        <div className="credits-panel" role="dialog" aria-label="Credits">
          <pre className="credits-panel__text">{credits}</pre>
          <button type="button" className="credits-panel__close" aria-label="Close credits" onClick={() => toggle(false)}>
            <svg viewBox="0 0 24 24" aria-hidden fill="none" stroke="var(--grape)" strokeWidth="3.5" strokeLinecap="round">
              <path d="M6 6l12 12M18 6L6 18" />
            </svg>
          </button>
        </div>
      )}
    </>
  )
}
