import { useAuthStore } from './auth-store'

/** True when the browser holds a signed-in session. */
export function useHasSession() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const sessionStatus = useAuthStore((s) => s.sessionStatus)
  return sessionStatus === 'authenticated' && currentUser !== null
}
