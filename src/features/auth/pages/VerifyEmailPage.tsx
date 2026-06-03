import { ArrowRight, CheckCircle2, Loader2, MailWarning, XCircle } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useAuthStore } from '../model/auth-store'

export function VerifyEmailPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const verifiedTokenRef = useRef<string | null>(null)
  const verifyEmailStatus = useAuthStore((s) => s.verifyEmailStatus)
  const verifyEmailMessage = useAuthStore((s) => s.verifyEmailMessage)
  const verifyEmailError = useAuthStore((s) => s.verifyEmailError)
  const verifyEmailToken = useAuthStore((s) => s.verifyEmailToken)
  const resetVerifyEmailFeedback = useAuthStore((s) => s.resetVerifyEmailFeedback)

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
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
            <span className="text-xs font-black text-white">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
          {/* Icon */}
          <div
            className={`mx-auto grid size-16 place-items-center rounded-2xl ${
              isSuccess
                ? 'bg-emerald-50 text-emerald-600'
                : isError
                  ? 'bg-red-50 text-red-600'
                  : 'bg-neutral-100 text-neutral-500'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={28} strokeWidth={1.8} /> : null}
            {isSuccess ? <CheckCircle2 size={28} strokeWidth={1.8} /> : null}
            {isError && normalizedToken ? <XCircle size={28} strokeWidth={1.8} /> : null}
            {isError && !normalizedToken ? <MailWarning size={28} strokeWidth={1.8} /> : null}
          </div>

          {/* Title */}
          <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
            {isLoading
              ? 'Verifying your email'
              : isSuccess
                ? 'Email verified'
                : 'Verification failed'}
          </h1>

          {/* Description */}
          <p className="mt-2.5 text-sm leading-6 text-neutral-500">
            {isLoading
              ? 'Confirming your verification link, please wait.'
              : isSuccess
                ? (verifyEmailMessage ?? 'Your email is verified. You can now sign in to your account.')
                : (verifyEmailError ?? 'This link is invalid or has expired. Request a new one from the sign-in page.')}
          </p>

          {/* CTA */}
          <button
            className="mx-auto mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
            type="button"
            disabled={isLoading}
            onClick={() => navigate('/', { replace: true })}
          >
            {isSuccess ? 'Continue to workspace' : 'Back to sign in'}
            <ArrowRight size={16} />
          </button>
        </div>
      </div>
    </div>
  )
}
