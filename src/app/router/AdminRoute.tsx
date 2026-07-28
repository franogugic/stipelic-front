import { ShieldAlert } from 'lucide-react'
import { Navigate, Outlet, useLocation, useNavigate } from 'react-router-dom'
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
    return <UnauthorizedScreen />
  }

  return <Outlet />
}

function UnauthorizedScreen() {
  const navigate = useNavigate()

  return (
    <div className="relative flex min-h-screen items-center justify-center bg-neutral-950 px-6 light:bg-neutral-100">
      <div className="bg-grid pointer-events-none fixed inset-0 opacity-[0.04]" />

      <div className="relative max-w-sm text-center">
        <div className="mx-auto grid size-14 place-items-center rounded-2xl bg-red-500/15 light:bg-red-50">
          <ShieldAlert className="text-red-400 light:text-red-600" size={26} strokeWidth={1.8} />
        </div>
        <h1 className="font-display mt-5 text-xl font-bold text-white light:text-neutral-950">
          You don't have access to this page
        </h1>
        <p className="mt-2 text-sm leading-6 text-white/50 light:text-neutral-500">
          This area is restricted to platform administrators. If you believe this is a mistake,
          contact whoever manages your Creator Platform account.
        </p>
        <button
          type="button"
          onClick={() => navigate('/')}
          className="mx-auto mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-accent px-5 text-sm font-semibold text-white transition hover:bg-accent-strong light:text-neutral-950"
        >
          Back to Overview
        </button>
      </div>
    </div>
  )
}
