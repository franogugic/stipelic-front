import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { LoadingPage } from './LoadingPage'

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
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
