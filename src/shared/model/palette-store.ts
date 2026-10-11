import { create } from 'zustand'
import { readStoredPalette, storePalette } from '../lib/palette'
import type { Palette } from '../lib/palette'

type PaletteState = {
  palette: Palette
  setPalette: (palette: Palette) => void
}

export const usePaletteStore = create<PaletteState>()((set) => {
  const initial = readStoredPalette()
  // The inline script in index.html applied the stored CSS before the first paint; storing it again rewrites that CSS
  // from the current derivation, so a palette tweak in a new release never leaves a stale copy behind.
  storePalette(initial)
  return {
    palette: initial,
    setPalette: (palette) => {
      storePalette(palette)
      set({ palette })
    },
  }
})
