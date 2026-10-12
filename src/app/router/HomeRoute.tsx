import { HomePage } from '../../features/auth/pages/HomePage'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { LumaHomePage } from '../../features/home/pages/LumaHomePage'
import { LoadingPage } from '../../shared/ui/LoadingPage'

/**
 * `/`: the marketing homepage for a logged-out visitor, today's redirect (check inbox, workspace or welcome) for a
 * logged-in user. Nothing renders until the session is known, so neither side ever sees the other's page flash.
 */
export function HomeRoute() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  if (sessionStatus === 'checking') {
    return <LoadingPage />
  }

  if (sessionStatus === 'authenticated' && currentUser) {
    return <HomePage />
  }

  return <LumaHomePage />
}
