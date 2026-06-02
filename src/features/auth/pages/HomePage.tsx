import { Loader2, LogOut, MailCheck, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Navigate } from 'react-router-dom'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useAuthStore } from '../model/auth-store'

export function HomePage() {
  const user = useAuthStore((s) => s.currentUser)
  const accountStatus = useAuthStore((s) => s.accountStatus)
  const resendStatus = useAuthStore((s) => s.resendStatus)
  const resendMessage = useAuthStore((s) => s.resendMessage)
  const resendError = useAuthStore((s) => s.resendError)
  const resendAvailableAt = useAuthStore((s) => s.resendAvailableAt)
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail)
  const logout = useAuthStore((s) => s.logout)
  const logoutStatus = useAuthStore((s) => s.logoutStatus)
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const [now, setNow] = useState(() => Date.now())

  const isPendingVerification = accountStatus === 'pendingVerification'
  const isResending = resendStatus === 'submitting'
  const isLoggingOut = logoutStatus === 'submitting'
  const isCreatorLoading = currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading'

  const resendCooldownSeconds = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0
  const isResendCoolingDown = resendCooldownSeconds > 0

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  useEffect(() => {
    if (!resendAvailableAt) return
    const id = window.setInterval(() => setNow(Date.now()), 1000)
    return () => window.clearInterval(id)
  }, [resendAvailableAt])

  useEffect(() => {
    if (!isPendingVerification && currentCreatorStatus === 'idle') {
      void loadCurrentCreator()
    }
  }, [currentCreatorStatus, isPendingVerification, loadCurrentCreator])

  // Redirect once we know the creator state
  if (!isPendingVerification && !isCreatorLoading) {
    if (currentCreator) {
      return <Navigate to={`/app/${currentCreator.slug}`} replace />
    }
    return <Navigate to="/creators/new" replace />
  }

  // Show spinner while loading creator (only when not pending verification)
  if (!isPendingVerification && isCreatorLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50">
        <Loader2 className="animate-spin text-neutral-400" size={22} />
      </div>
    )
  }

  // Pending email verification screen
  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      <header className="border-b border-neutral-200 bg-white">
        <div className="mx-auto flex h-14 w-full max-w-5xl items-center justify-between gap-4 px-5 lg:px-8">
          <div className="flex items-center gap-2.5">
            <span className="grid size-7 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <div className="flex items-center gap-3">
            {user ? (
              <div className="grid size-8 place-items-center rounded-full bg-neutral-100 text-xs font-semibold text-neutral-700">
                {userInitials}
              </div>
            ) : null}
            <button
              className="inline-flex h-9 items-center gap-2 rounded-lg border border-neutral-200 bg-white px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-50"
              type="button"
              disabled={isLoggingOut}
              onClick={() => void logout()}
            >
              {isLoggingOut ? <Loader2 className="animate-spin" size={15} /> : <LogOut size={15} />}
              Sign out
            </button>
          </div>
        </div>
      </header>

      <main className="mx-auto w-full max-w-lg px-5 py-16 lg:px-8">
        <div className="rounded-2xl border border-amber-200 bg-white p-6 shadow-sm">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start">
            <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-amber-50 text-amber-600">
              <MailCheck size={24} />
            </div>

            <div className="flex-1">
              <p className="text-xs font-semibold uppercase tracking-wide text-amber-600">
                Action required
              </p>
              <h2 className="mt-1.5 text-lg font-semibold text-neutral-950">
                Verify your email to continue
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-500">
                We sent a verification link to{' '}
                <span className="font-semibold text-neutral-950">{user?.email}</span>. Check your
                inbox and click the link to activate your account.
              </p>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row sm:items-center">
                <button
                  className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                  type="button"
                  disabled={isResending || isResendCoolingDown}
                  onClick={resendVerificationEmail}
                >
                  {isResending ? (
                    <Loader2 className="animate-spin" size={16} />
                  ) : (
                    <RefreshCw size={16} />
                  )}
                  {isResending ? 'Sending…' : 'Resend email'}
                </button>

                {isResendCoolingDown ? (
                  <p className="text-sm text-neutral-400">
                    Resend available in {resendCooldownSeconds}s
                  </p>
                ) : null}
              </div>

              {resendMessage ? (
                <p className="mt-4 text-sm font-medium text-emerald-700">{resendMessage}</p>
              ) : null}
              {resendError ? (
                <p className="mt-4 text-sm font-medium text-red-600">{resendError}</p>
              ) : null}
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}
