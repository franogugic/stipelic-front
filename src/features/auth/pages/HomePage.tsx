import { CheckCircle2, Loader2, LogOut, MailCheck, RefreshCw } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useAuthStore } from '../model/auth-store'

export function HomePage() {
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
  const [now, setNow] = useState(() => Date.now())

  const isPendingVerification = accountStatus === 'pendingVerification'
  const isResending = resendStatus === 'submitting'
  const isLoggingOut = logoutStatus === 'submitting'
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

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-5xl items-center px-5 py-8 lg:px-8">
        <section className="w-full rounded-[30px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8 lg:p-10">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
            <div>
              <p className="text-sm font-semibold text-neutral-500">Creator Platform</p>
              <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
                Home
              </h1>
            </div>

            <button
              className="inline-flex h-10 items-center justify-center gap-2 self-start rounded-xl border border-neutral-200 bg-white px-4 text-sm font-semibold text-neutral-700 transition hover:border-neutral-300 hover:bg-neutral-50 disabled:cursor-not-allowed disabled:opacity-60"
              type="button"
              disabled={isLoggingOut}
              onClick={() => {
                void logout()
              }}
            >
              {isLoggingOut ? <Loader2 className="animate-spin" size={16} /> : <LogOut size={16} />}
              Logout
            </button>
          </div>

          {logoutError ? (
            <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
              {logoutError}
            </div>
          ) : null}

          {isPendingVerification && user ? (
            <div className="mt-10 grid gap-8 lg:grid-cols-[0.9fr_1.1fr] lg:items-center">
              <div className="grid size-20 place-items-center rounded-3xl bg-amber-100 text-amber-700">
                <MailCheck size={38} strokeWidth={1.8} />
              </div>

              <div>
                <p className="text-sm font-semibold text-amber-700">Email verification required</p>
                <h2 className="mt-3 text-2xl font-semibold tracking-normal text-neutral-950">
                  Verify your account before using the platform.
                </h2>
                <p className="mt-4 max-w-xl text-sm leading-6 text-neutral-600">
                  We sent a verification link to <span className="font-semibold text-neutral-950">{user.email}</span>.
                  Open that email and verify your account before creating landing pages or viewing stats.
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
          ) : (
            <div className="mt-10 flex items-start gap-4 rounded-2xl border border-emerald-200 bg-emerald-50 p-5 text-emerald-900">
              <CheckCircle2 className="mt-0.5 shrink-0" size={24} />
              <div>
                <h2 className="text-xl font-semibold tracking-normal">
                  Welcome home{displayName}.
                </h2>
                <p className="mt-2 text-sm leading-6 text-emerald-800">
                  Your creator workspace is ready. Landing pages and stats will live here.
                </p>
              </div>
            </div>
          )}
        </section>
      </div>
    </main>
  )
}
