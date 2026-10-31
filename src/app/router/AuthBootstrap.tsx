import { useEffect } from 'react'
import { Outlet } from 'react-router-dom'
import { useAuthStore } from '../../features/auth/model/auth-store'
import { useFeaturesStore } from '../../shared/model/features-store'

export function AuthBootstrap() {
  const loadCurrentUser = useAuthStore((state) => state.loadCurrentUser)
  const loadFeatures = useFeaturesStore((state) => state.load)

  useEffect(() => {
    void loadFeatures()
    void loadCurrentUser()
  }, [loadCurrentUser, loadFeatures])

  return <Outlet />
}
