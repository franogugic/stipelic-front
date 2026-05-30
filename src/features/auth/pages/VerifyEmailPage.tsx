import { ArrowRight, CheckCircle2, Loader2, MailWarning, XCircle } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../model/auth-store'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verifiedTokenRef = useRef<string | null>(null)
  const verifyEmailStatus = useAuthStore((state) => state.verifyEmailStatus)
  const verifyEmailMessage = useAuthStore((state) => state.verifyEmailMessage)
  const verifyEmailError = useAuthStore((state) => state.verifyEmailError)
  const verifyEmailToken = useAuthStore((state) => state.verifyEmailToken)
  const resetVerifyEmailFeedback = useAuthStore((state) => state.resetVerifyEmailFeedback)

  const token = searchParams.get('token')
  const normalizedToken = useMemo(() => token?.trim() ?? '', [token])

  useEffect(() => {
    if (verifiedTokenRef.current === normalizedToken) return
    verifiedTokenRef.current = normalizedToken
    resetVerifyEmailFeedback()
    void verifyEmailToken(normalizedToken)
  }, [normalizedToken, resetVerifyEmailFeedback, verifyEmailToken])

  const isLoading = verifyEmailStatus === 'submitting' || verifyEmailStatus === 'idle'
  const isSuccess = verifyEmailStatus === 'success'
  const isError = verifyEmailStatus === 'error'

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-md flex-col items-center justify-center px-5 py-12">
        {/* Logo */}
        <div className="mb-10 flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950 text-white">
            <span className="text-xs font-bold">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="w-full rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          <div
            className={`mx-auto grid size-14 place-items-center rounded-2xl ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-600'
                : isError
                  ? 'bg-red-50 text-red-600'
                  : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={26} strokeWidth={1.8} /> : null}
            {isSuccess ? <CheckCircle2 size={26} strokeWidth={1.8} /> : null}
            {isError && normalizedToken ? <XCircle size={26} strokeWidth={1.8} /> : null}
            {isError && !normalizedToken ? <MailWarning size={26} strokeWidth={1.8} /> : null}
          </div>

          <h1 className="mt-6 text-xl font-semibold tracking-tight">
            {isSuccess
              ? 'Email verified'
              : isError
                ? 'Verification failed'
                : 'Verifying your email'}
          </h1>

          <p className="mt-3 text-sm leading-6 text-neutral-500">
            {isSuccess
              ? (verifyEmailMessage ?? 'Your email has been verified. You can now sign in.')
              : isError
                ? (verifyEmailError ?? 'This verification link is invalid or has expired.')
                : 'Confirming your verification link, please wait.'}
          </p>

          <button
            className="mx-auto mt-7 inline-flex h-11 items-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
            type="button"
            disabled={isLoading}
            onClick={() => navigate('/', { replace: true })}
          >
            Continue to dashboard
            <ArrowRight size={17} />
          </button>
        </div>
      </div>
    </main>
  )
}
