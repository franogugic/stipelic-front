import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { NotFoundPage } from '../../shared/ui/NotFoundPage'
import { LoadingPage } from './LoadingPage'

/** Platform-admin pages. Everyone else gets the not-found page, so the area's existence isn't advertised. */
export function AdminRoute() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)
  const location = useLocation()

  if (sessionStatus === 'checking') {
    return <LoadingPage />
  }

  if (sessionStatus !== 'authenticated' || !currentUser) {
    return <Navigate to="/login" replace state={{ from: location }} />
  }

  if (!currentUser.roles?.includes('platform_admin')) {
    return <NotFoundPage />
  }

  return <Outlet />
}
