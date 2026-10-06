import { Loader2 } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useAuthStore } from '../model/auth-store'

export function HomePage() {
  const accountStatus = useAuthStore((s) => s.accountStatus)
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  const isPendingVerification = accountStatus === 'pendingVerification'
  const isCreatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  useEffect(() => {
    if (!isPendingVerification && currentCreatorStatus === 'idle') {
      void loadCurrentCreator()
    }
  }, [currentCreatorStatus, isPendingVerification, loadCurrentCreator])

  // An unverified account can only wait for its verification email.
  if (isPendingVerification) return <Navigate to="/check-inbox" replace />

  // Redirect once creator state is known
  if (!isCreatorLoading) {
    if (currentCreator) return <Navigate to={`/app/${currentCreator.slug}`} replace />
    return <Navigate to="/welcome" replace />
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950">
      <Loader2 className="animate-spin text-white/20" size={22} />
    </div>
  )
}
