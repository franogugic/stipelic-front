import {
  ArrowRight,
  CheckCircle2,
  Globe2,
  Loader2,
  LogOut,
  MailCheck,
  Plus,
  RefreshCw,
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
  const logoutError = useAuthStore((state) => state.logoutError)
  const currentCreator = useCreatorStore((state) => state.currentCreator)
  const currentCreatorStatus = useCreatorStore((state) => state.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((state) => state.loadCurrentCreator)
  const [now, setNow] = useState(() => Date.now())

  const isPendingVerification = accountStatus === 'pendingVerification'
  const isResending = resendStatus === 'submitting'
  const isLoggingOut = logoutStatus === 'submitting'
  const isCreatorLoading = currentCreatorStatus === 'loading' || currentCreatorStatus === 'idle'
  const hasCreator = currentCreator !== null
  const resendCooldownSeconds = resendAvailableAt
    ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000))
    : 0
  const isResendCoolingDown = resendCooldownSeconds > 0
  const displayName = user?.firstName ? `, ${user.firstName}` : ''

  useEffect(() => {
    if (!resendAvailableAt) {
      return
    }

    const intervalId = window.setInterval(() => {
      setNow(Date.now())
    }, 1000)

    return () => {
      window.clearInterval(intervalId)
    }
  }, [resendAvailableAt])

  useEffect(() => {
    if (!isPendingVerification && currentCreatorStatus === 'idle') {
      void loadCurrentCreator()
    }
  }, [currentCreatorStatus, isPendingVerification, loadCurrentCreator])

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="border-b border-neutral-200/80 bg-white/80 backdrop-blur-xl">
        <header className="mx-auto flex min-h-16 w-full max-w-7xl items-center justify-between gap-4 px-5 py-4 lg:px-8">
          <div>
            <p className="text-sm font-semibold text-neutral-950">Creator Platform</p>
            <p className="mt-1 text-xs font-medium text-neutral-500">Home</p>
          </div>

          <button
            className="inline-flex h-10 items-center justify-center gap-2 rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
            type="button"
            disabled={isLoggingOut}
            onClick={() => {
              void logout()
            }}
          >
            {isLoggingOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
            Logout
          </button>
        </header>
      </div>

      <section className="mx-auto w-full max-w-7xl px-5 py-8 lg:px-8 lg:py-10">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-sm font-semibold text-neutral-500">Dashboard</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-normal sm:text-4xl">
              Welcome home{displayName}.
            </h1>
          </div>
        </div>

        {logoutError ? (
          <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
            {logoutError}
          </div>
        ) : null}

        {isPendingVerification && user ? (
          <div className="mt-8 rounded-3xl border border-amber-200 bg-white p-6 shadow-[0_16px_48px_rgba(15,23,42,0.07)] sm:p-8">
            <div className="grid gap-8 lg:grid-cols-[0.65fr_1.35fr] lg:items-center">
              <div className="grid size-20 place-items-center rounded-3xl bg-amber-50 text-amber-700">
                <MailCheck size={38} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-sm font-semibold text-amber-700">Email verification required</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal text-neutral-950">
                  Verify your account before using the platform.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-600">
                  We sent a verification link to{' '}
                  <span className="font-semibold text-neutral-950">{user.email}</span>. Open that
                  email and verify your account before creating landing pages or viewing stats.
                </p>

                <div className="mt-6 flex flex-col gap-3 sm:flex-row">
                  <button
                    className="inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                    type="button"
                    disabled={isResending || isResendCoolingDown}
                    onClick={resendVerificationEmail}
                  >
                    {isResending ? (
                      <>
                        <Loader2 className="animate-spin" size={18} />
                        Sending email
                      </>
                    ) : (
                      <>
                        <RefreshCw size={18} />
                        Resend verification
                      </>
                    )}
                  </button>
                </div>

                {isResendCoolingDown ? (
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    You can request another verification email in {resendCooldownSeconds} seconds.
                  </p>
                ) : (
                  <p className="mt-3 text-sm font-medium text-neutral-500">
                    If the email did not arrive, you can request a new verification link now.
                  </p>
                )}

                {resendMessage ? (
                  <div className="mt-5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-800">
                    {resendMessage}
                  </div>
                ) : null}

                {resendError ? (
                  <div className="mt-5 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
                    {resendError}
                  </div>
                ) : null}
              </div>
            </div>
          </div>
        ) : (
          <div className="mt-8 grid gap-6 xl:grid-cols-[1.45fr_0.55fr]">
            <div className="grid gap-4">
              <div className="flex items-start gap-4 rounded-3xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
                <CheckCircle2 className="mt-0.5 shrink-0" size={24} />
                <div>
                  <h2 className="text-xl font-semibold tracking-normal">Account is ready.</h2>
                  <p className="mt-2 text-sm leading-6 text-emerald-800">
                    Your creator workspace is ready. Landing pages and stats will live here.
                  </p>
                </div>
              </div>

              <div className="grid gap-4">
                {hasCreator ? (
                  <button
                    className="group w-full rounded-3xl border border-neutral-200 bg-white p-6 text-left shadow-[0_16px_40px_rgba(15,23,42,0.06)] transition hover:-translate-y-0.5 hover:border-neutral-300 hover:shadow-[0_22px_55px_rgba(15,23,42,0.10)] sm:p-7"
                    type="button"
                    onClick={() => navigate(`/app/${currentCreator.slug}`)}
                  >
                    <span className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
                      <span className="flex items-start gap-4">
                        <span className="grid size-14 shrink-0 place-items-center rounded-2xl bg-neutral-950 text-white">
                          <Globe2 size={24} />
                        </span>
                        <span>
                          <span className="block text-2xl font-semibold tracking-normal text-neutral-950">
                            {currentCreator.name}
                          </span>
                          <span className="mt-2 block text-sm font-medium text-neutral-500">
                            /{currentCreator.slug}
                          </span>
                        </span>
                      </span>

                      <span className="inline-flex size-10 items-center justify-center rounded-full bg-neutral-100 text-neutral-500 transition group-hover:bg-neutral-950 group-hover:text-white">
                        <ArrowRight size={18} />
                      </span>
                    </span>

                    <span className="mt-6 grid gap-3 sm:grid-cols-3">
                      <CreatorMeta label="Status" value={currentCreator.status} />
                      <CreatorMeta label="Currency" value={currentCreator.defaultCurrency} />
                      <CreatorMeta label="Plan" value={currentCreator.planCode || 'Free'} />
                    </span>
                  </button>
                ) : currentCreatorStatus === 'error' ? (
                  <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
                    <p className="text-sm font-semibold text-amber-900">
                      Could not check creator status
                    </p>
                    <p className="mt-1 text-sm leading-6 text-amber-800">
                      Try again before creating a new workspace.
                    </p>
                  </div>
                ) : null}

                {!hasCreator ? (
                  <div className="rounded-3xl border border-neutral-200 bg-white p-6 shadow-[0_16px_40px_rgba(15,23,42,0.06)]">
                    <p className="text-lg font-semibold tracking-normal text-neutral-950">
                      Create your creator workspace
                    </p>
                    <p className="mt-2 max-w-xl text-sm leading-6 text-neutral-500">
                      Set up the workspace that will own landing pages, stats, products, and
                      offers.
                    </p>
                    <button
                      className="mt-5 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
                      type="button"
                      disabled={isCreatorLoading || currentCreatorStatus === 'error'}
                      onClick={() => navigate('/creators/new')}
                    >
                      {isCreatorLoading ? (
                        <Loader2 className="animate-spin" size={18} />
                      ) : (
                        <Plus size={18} />
                      )}
                      Create creator
                    </button>
                  </div>
                ) : null}
              </div>
            </div>

            <aside className="rounded-3xl border border-neutral-200 bg-white p-5 shadow-[0_16px_40px_rgba(15,23,42,0.05)]">
              <p className="text-sm font-semibold text-neutral-950">Account</p>
              <div className="mt-4 grid gap-3 text-sm">
                <div>
                  <p className="font-medium text-neutral-500">Email</p>
                  <p className="mt-1 font-semibold text-neutral-950">{user?.email}</p>
                </div>
                <div>
                  <p className="font-medium text-neutral-500">Status</p>
                  <p className="mt-1 font-semibold text-neutral-950">{accountStatus}</p>
                </div>
              </div>
            </aside>
          </div>
        )}
      </section>
    </main>
  )
}

function CreatorMeta({ label, value }: { label: string; value: string }) {
  return (
    <span className="rounded-2xl border border-neutral-200 bg-neutral-50 px-4 py-3">
      <span className="block text-xs font-semibold uppercase text-neutral-400">{label}</span>
      <span className="mt-1 block text-sm font-semibold text-neutral-950">{value}</span>
    </span>
  )
}
