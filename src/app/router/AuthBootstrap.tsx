import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'

export function AuthBootstrap() {
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser)

  useEffect(() => {
    void loadCurrentUser()
  }, [loadCurrentUser])

  return <Outlet />
}
