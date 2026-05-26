import { Navigate, Outlet } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { LoadingPage } from './LoadingPage'

export function PublicOnlyRoute() {
  const currentUser = useAuthStore((state) => state.currentUser)
  const sessionStatus = useAuthStore((state) => state.sessionStatus)

  if (sessionStatus === 'checking') {
    return <LoadingPage />
  }

  if (sessionStatus === 'authenticated' && currentUser) {
    return <Navigate to="/" replace />
  }

  return <Outlet />
}
