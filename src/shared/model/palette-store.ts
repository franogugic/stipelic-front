import { create } from 'zustand'
import { applyPalette, readStoredPalette, storePalette } from '../lib/palette'
import type { Palette } from '../lib/palette'

type PaletteState = {
  palette: Palette
  setPalette: (palette: Palette) => void
}

export const usePaletteStore = create<PaletteState>()((set) => {
  const initial = readStoredPalette()
  // The inline script in index.html applied the stored CSS before the first paint; this keeps it in step with the
  // derivation in code (a palette tweak in a new release replaces the cached CSS on the first load).
  applyPalette(initial)
  return {
    palette: initial,
    setPalette: (palette) => {
      storePalette(palette)
      set({ palette })
    },
  }
})
