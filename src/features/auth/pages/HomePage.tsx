import {
  ArrowRight,
  CheckCircle2,
  CreditCard,
  Loader2,
  LogOut,
  MailCheck,
  Plus,
  RefreshCw,
  Zap,
} from 'lucide-react'
import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCreatorStore } from '../../creators/model/creator-store'
import { useAuthStore } from '../model/auth-store'

export function HomePage() {
  const navigate = useNavigate()
  const user = useAuthStore((state) => state.currentUser)
  const accountStatus = useAuthStore((state) => state.accountStatus)
  const resendStatus = useAuthStore((state) => state.resendStatus)
  const resendMessage = useAuthStore((state) => state.resendMessage)
  const resendError = useAuthStore((state) => state.resendError)
  const resendAvailableAt = useAuthStore((state) => state.resendAvailableAt)
  const resendVerificationEmail = useAuthStore((state) => state.resendVerificationEmail)
  const logout = useAuthStore((state) => state.logout)
  const logoutStatus = useAuthStore((state) => state.logoutStatus)
  const currentCreator = useCreatorStore((state) => state.currentCreator)
  const currentCreatorStatus = useCreatorStore((state) => state.currentCreatorStatus)
  const checkoutStatus = useCreatorStore((state) => state.checkoutStatus)
  const checkoutError = useCreatorStore((state) => state.checkoutError)
  const loadCurrentCreator = useCreatorStore((state) => state.loadCurrentCreator)
  const startCreatorCheckout = useCreatorStore((state) => state.startCreatorCheckout)
  const [now, setNow] = useState(() => Date.now())

  const isPendingVerification = accountStatus === 'pendingVerification'
  const isResending = resendStatus === 'submitting'
  const isLoggingOut = logoutStatus === 'submitting'
  const isStartingCheckout = checkoutStatus === 'submitting'
  const isCreatorLoading = currentCreatorStatus === 'loading' || currentCreatorStatus === 'idle'
  const hasCreator = currentCreator !== null
  const requiresPayment = currentCreator?.status.toLowerCase() === 'pendingpayment'
  const isCreatorActive = currentCreator?.status.toLowerCase() === 'active'
  const resendCooldownSeconds = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0
  const isResendCoolingDown = resendCooldownSeconds > 0

  const userInitials = user
    ? `${user.firstName?.[0] ?? ''}${user.lastName?.[0] ?? ''}`.toUpperCase() || '?'
    : '?'

  const startCheckout = async () => {
    const checkout = await startCreatorCheckout()
    if (checkout?.checkoutUrl) {
      window.location.assign(checkout.checkoutUrl)
    }
  }

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

  return (
    <div className="min-h-screen bg-neutral-50 text-neutral-950">
      {/* Header */}
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
              {isLoggingOut ? (
                <Loader2 className="animate-spin" size={15} />
              ) : (
                <LogOut size={15} />
              )}
              Sign out
            </button>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="mx-auto w-full max-w-5xl px-5 py-10 lg:px-8">

        {/* Email verification banner */}
        {isPendingVerification && user ? (
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
                  <span className="font-semibold text-neutral-950">{user.email}</span>. Check your
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
        ) : (
          <div className="grid gap-6 lg:grid-cols-[1fr_280px]">
            {/* Left col */}
            <div className="grid gap-4">
              {/* Page title */}
              <div>
                <h1 className="text-2xl font-semibold tracking-tight">
                  {user?.firstName ? `Welcome back, ${user.firstName}.` : 'Welcome back.'}
                </h1>
                <p className="mt-1 text-sm text-neutral-500">Your creator dashboard.</p>
              </div>

              {/* Creator loading skeleton */}
              {isCreatorLoading ? (
                <div className="flex h-28 items-center gap-3 rounded-2xl border border-neutral-200 bg-white px-6 text-sm text-neutral-400 shadow-sm">
                  <Loader2 className="animate-spin" size={17} />
                  Loading workspace
                </div>
              ) : null}

              {/* Error */}
              {currentCreatorStatus === 'error' ? (
                <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                  <p className="text-sm font-semibold text-amber-800">
                    Could not load workspace status
                  </p>
                  <p className="mt-1 text-sm text-amber-600">
                    Refresh the page to try again.
                  </p>
                </div>
              ) : null}

              {/* Creator card */}
              {!isCreatorLoading && hasCreator ? (
                <button
                  className="group w-full rounded-2xl border border-neutral-200 bg-white p-6 text-left shadow-sm transition hover:border-neutral-300 hover:shadow"
                  type="button"
                  onClick={() => navigate(`/app/${currentCreator.slug}`)}
                >
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="grid size-12 shrink-0 place-items-center rounded-xl bg-neutral-950 text-white">
                        <span className="text-lg font-semibold">
                          {currentCreator.name[0]?.toUpperCase() ?? 'C'}
                        </span>
                      </div>
                      <div>
                        <p className="font-semibold text-neutral-950">{currentCreator.name}</p>
                        <p className="mt-0.5 text-sm text-neutral-400">/{currentCreator.slug}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <StatusBadge status={currentCreator.status} />
                      <span className="grid size-8 place-items-center rounded-full border border-neutral-200 text-neutral-400 transition group-hover:border-neutral-950 group-hover:bg-neutral-950 group-hover:text-white">
                        <ArrowRight size={15} />
                      </span>
                    </div>
                  </div>

                  <div className="mt-5 grid grid-cols-3 divide-x divide-neutral-100 rounded-xl border border-neutral-100 bg-neutral-50">
                    <Metric label="Currency" value={currentCreator.defaultCurrency} />
                    <Metric label="Plan" value={currentCreator.planCode || 'Free'} />
                    <Metric label="Status" value={currentCreator.status} />
                  </div>
                </button>
              ) : null}

              {/* Payment required banner */}
              {!isCreatorLoading && hasCreator && requiresPayment ? (
                <div className="rounded-2xl border border-amber-200 bg-white p-5 shadow-sm">
                  <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <p className="text-sm font-semibold text-neutral-950">Payment required</p>
                      <p className="mt-1 text-sm leading-6 text-neutral-500">
                        Your workspace is created but not active yet. Complete payment to continue.
                      </p>
                    </div>
                    <button
                      className="inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
                      type="button"
                      disabled={isStartingCheckout}
                      onClick={() => void startCheckout()}
                    >
                      {isStartingCheckout ? (
                        <Loader2 className="animate-spin" size={16} />
                      ) : (
                        <CreditCard size={16} />
                      )}
                      Complete payment
                    </button>
                  </div>
                  {checkoutError ? (
                    <p className="mt-3 text-sm font-medium text-red-600">{checkoutError}</p>
                  ) : null}
                </div>
              ) : null}

              {/* Active workspace quick actions */}
              {!isCreatorLoading && hasCreator && isCreatorActive ? (
                <div className="rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
                  <div className="flex items-center gap-3">
                    <CheckCircle2 size={18} className="text-emerald-600" />
                    <p className="text-sm font-semibold text-neutral-950">Workspace is active</p>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Landing pages, analytics, and products are ready to be configured.
                  </p>
                </div>
              ) : null}

              {/* Empty state */}
              {!isCreatorLoading && !hasCreator && currentCreatorStatus !== 'error' ? (
                <div className="rounded-2xl border border-dashed border-neutral-300 bg-white p-8 text-center shadow-sm">
                  <div className="mx-auto grid size-12 place-items-center rounded-xl bg-neutral-100 text-neutral-500">
                    <Zap size={22} />
                  </div>
                  <h2 className="mt-4 text-base font-semibold text-neutral-950">
                    No workspace yet
                  </h2>
                  <p className="mt-2 text-sm leading-6 text-neutral-500">
                    Create your creator workspace to get started with landing pages and analytics.
                  </p>
                  <button
                    className="mx-auto mt-6 inline-flex h-10 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800"
                    type="button"
                    onClick={() => navigate('/creators/new')}
                  >
                    <Plus size={16} />
                    Create workspace
                  </button>
                </div>
              ) : null}
            </div>

            {/* Right col — account */}
            <aside className="h-fit rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
              <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
                Account
              </p>
              <div className="mt-4 grid gap-4">
                <AccountRow label="Email" value={user?.email ?? '—'} />
                <AccountRow
                  label="Name"
                  value={
                    user?.firstName || user?.lastName
                      ? `${user.firstName ?? ''} ${user.lastName ?? ''}`.trim()
                      : '—'
                  }
                />
                <AccountRow
                  label="Status"
                  value={accountStatus === 'active' ? 'Verified' : 'Pending verification'}
                />
              </div>

              {!hasCreator && !isCreatorLoading && currentCreatorStatus !== 'error' ? (
                <button
                  className="mt-6 inline-flex w-full h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-neutral-50 px-4 text-sm font-semibold text-neutral-700 transition hover:bg-neutral-100"
                  type="button"
                  onClick={() => navigate('/creators/new')}
                >
                  <Plus size={15} />
                  New workspace
                </button>
              ) : null}
            </aside>
          </div>
        )}
      </main>
    </div>
  )
}

function StatusBadge({ status }: { status: string }) {
  const normalized = status.toLowerCase()

  if (normalized === 'active') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-emerald-50 px-2.5 text-xs font-semibold text-emerald-700">
        <span className="size-1.5 rounded-full bg-emerald-500" />
        Active
      </span>
    )
  }

  if (normalized === 'pendingpayment') {
    return (
      <span className="inline-flex h-6 items-center gap-1.5 rounded-full bg-amber-50 px-2.5 text-xs font-semibold text-amber-700">
        <span className="size-1.5 rounded-full bg-amber-500" />
        Pending payment
      </span>
    )
  }

  return (
    <span className="inline-flex h-6 items-center rounded-full bg-neutral-100 px-2.5 text-xs font-semibold text-neutral-600">
      {status}
    </span>
  )
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3">
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-0.5 text-sm font-semibold text-neutral-950">{value}</p>
    </div>
  )
}

function AccountRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <p className="text-xs text-neutral-400">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium text-neutral-950">{value}</p>
    </div>
  )
}
