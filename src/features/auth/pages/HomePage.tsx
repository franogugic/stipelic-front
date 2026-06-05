import { ArrowRight, Inbox, Loader2, LogOut, RefreshCw } from 'lucide-react'
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

  // Redirect once creator state is known
  if (!isPendingVerification && !isCreatorLoading) {
    if (currentCreator) return <Navigate to={`/app/${currentCreator.slug}`} replace />
    return <Navigate to="/creators/new" replace />
  }

  // Spinner while loading (non-verification path)
  if (!isPendingVerification && isCreatorLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950">
        <Loader2 className="animate-spin text-white/20" size={22} />
      </div>
    )
  }

  // ── Email verification required ──────────────────────────────────
  return (
    <div className="relative flex min-h-screen overflow-hidden bg-neutral-950">
      {/* Subtle grid pattern */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04]"
        style={{
          backgroundImage:
            'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
          backgroundSize: '48px 48px',
        }}
      />

      {/* Top bar */}
      <div className="absolute inset-x-0 top-0 flex h-14 items-center justify-between px-8">
        <div className="flex items-center gap-2.5">
          <span className="grid size-7 place-items-center rounded-lg bg-white">
            <span className="text-[11px] font-black text-neutral-950">CP</span>
          </span>
          <span className="text-sm font-semibold text-white">Creator Platform</span>
        </div>

        <div className="flex items-center gap-3">
          <div className="grid size-8 place-items-center rounded-full bg-white/10 text-xs font-bold text-white">
            {userInitials}
          </div>
          <button
            type="button"
            disabled={isLoggingOut}
            onClick={() => void logout()}
            className="inline-flex h-8 items-center gap-1.5 rounded-lg border border-white/10 bg-white/5 px-3 text-sm text-white/60 transition hover:bg-white/10 hover:text-white disabled:opacity-40"
          >
            {isLoggingOut ? <Loader2 className="animate-spin" size={13} /> : <LogOut size={13} />}
            Sign out
          </button>
        </div>
      </div>

      {/* Centered content */}
      <div className="flex w-full items-center justify-center px-6 py-20">
        <div className="w-full max-w-4xl">

          {/* Main grid */}
          <div className="grid gap-4 lg:grid-cols-[1fr_320px]">

            {/* Left — headline + inbox icon */}
            <div className="flex flex-col justify-between rounded-3xl border border-white/10 bg-white/5 p-8 backdrop-blur-sm lg:min-h-72">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/15 bg-white/10">
                <Inbox className="text-white" size={26} strokeWidth={1.5} />
              </div>

              <div>
                <h1 className="text-3xl font-semibold leading-tight tracking-tight text-white lg:text-4xl">
                  Check your
                  <br />
                  inbox.
                </h1>
                <p className="mt-3 max-w-sm text-sm leading-6 text-white/50">
                  We sent a verification link to{' '}
                  <span className="font-semibold text-white/80">{user?.email}</span>.
                  Click it to activate your account and access your workspace.
                </p>
              </div>
            </div>

            {/* Right column — two stacked cards */}
            <div className="grid gap-4">

              {/* Resend card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                  Didn't get it?
                </p>
                <p className="mt-2 text-sm text-white/60">
                  Check your spam folder first. If it's not there, request a new link.
                </p>

                <button
                  type="button"
                  disabled={isResending || isResendCoolingDown}
                  onClick={resendVerificationEmail}
                  className="mt-4 inline-flex h-10 w-full items-center justify-center gap-2 rounded-xl bg-white text-sm font-semibold text-neutral-950 transition hover:bg-neutral-100 disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {isResending ? (
                    <Loader2 className="animate-spin" size={15} />
                  ) : (
                    <RefreshCw size={15} />
                  )}
                  {isResending
                    ? 'Sending…'
                    : isResendCoolingDown
                      ? `Resend in ${resendCooldownSeconds}s`
                      : 'Resend verification email'}
                </button>

                {resendMessage ? (
                  <p className="mt-3 text-center text-xs font-medium text-emerald-400">
                    {resendMessage}
                  </p>
                ) : null}
                {resendError ? (
                  <p className="mt-3 text-center text-xs font-medium text-red-400">
                    {resendError}
                  </p>
                ) : null}
              </div>

              {/* What's next card */}
              <div className="rounded-3xl border border-white/10 bg-white/5 p-6 backdrop-blur-sm">
                <p className="text-xs font-semibold uppercase tracking-widest text-white/30">
                  What's next
                </p>
                <ul className="mt-3 grid gap-2">
                  {[
                    'Verify your email',
                    'Create your workspace',
                    'Publish a landing page',
                  ].map((item, i) => (
                    <li key={item} className="flex items-center gap-3 text-sm text-white/60">
                      <span
                        className={`grid size-5 shrink-0 place-items-center rounded-full text-[10px] font-bold ${
                          i === 0
                            ? 'bg-white text-neutral-950'
                            : 'border border-white/15 text-white/30'
                        }`}
                      >
                        {i === 0 ? <ArrowRight size={10} /> : i + 1}
                      </span>
                      <span className={i === 0 ? 'font-semibold text-white' : ''}>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
