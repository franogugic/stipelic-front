import { create } from 'zustand'
import { getFeatures } from '../api/features-api'
import type { Features } from '../api/features-api'

/** What an API without the endpoint (an older build, a mock) means: everything on, as in Development. */
const OPEN: Features = { paymentsEnabled: true, openRegistration: true }
/** The closed beta as production runs it. */
const BETA: Features = { paymentsEnabled: false, openRegistration: false }

type FeaturesState = {
  features: Features
  /** False until the API (or the local mock) has answered once: gates wait for it instead of flashing the wrong UI. */
  ready: boolean
  load: () => Promise<void>
  /** From the same object inside `/auth/me`, so a signed-in tab never lags the bootstrap call. */
  apply: (features: Features | null | undefined) => void
}

let pending: Promise<void> | null = null

export const useFeaturesStore = create<FeaturesState>()((set) => ({
  features: OPEN,
  ready: false,
  apply: (features) => {
    if (!features) return
    set({ features: { paymentsEnabled: features.paymentsEnabled === true, openRegistration: features.openRegistration === true }, ready: true })
  },
  load: () => {
    // Local mock until the backend has the endpoint: VITE_MOCK_FEATURES=beta in .env.development.local (dev server only).
    if (import.meta.env.DEV && import.meta.env.VITE_MOCK_FEATURES === 'beta') {
      set({ features: BETA, ready: true })
      return Promise.resolve()
    }
    pending ??= getFeatures()
      .then((features) => set({ features, ready: true }))
      // Unknown means the open defaults: a failed read must not lock people out or hide the whole product.
      .catch(() => set({ features: OPEN, ready: true }))
      .finally(() => {
        pending = null
      })
    return pending
  },
}))

/** The flags for a component: `paymentsOn` / `registrationOpen` are false until the answer is known, so nothing that
 * sells or signs people up appears before the deployment has said it may. */
export function useFeatures() {
  const { features, ready } = useFeaturesStore()
  return {
    ready,
    paymentsEnabled: features.paymentsEnabled,
    openRegistration: features.openRegistration,
    paymentsOn: ready && features.paymentsEnabled,
    registrationOpen: ready && features.openRegistration,
  }
}
