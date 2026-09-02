import { ArrowRight, CheckCircle2, Loader2, MailWarning, XCircle } from 'lucide-react'
import { useEffect, useMemo, useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
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
    <AuthLayout>
      <div className="rounded-xl border border-border bg-card p-8 text-center">
        <div
          className={`mx-auto grid size-16 place-items-center rounded-2xl ${
            isSuccess
              ? 'bg-emerald-500/10 text-emerald-400'
              : isError
                ? 'bg-red-500/10 text-red-400'
                : 'bg-muted text-muted-foreground'
          }`}
        >
          {isLoading ? <Loader2 className="animate-spin" size={28} strokeWidth={1.8} /> : null}
          {isSuccess ? <CheckCircle2 size={28} strokeWidth={1.8} /> : null}
          {isError && normalizedToken ? <XCircle size={28} strokeWidth={1.8} /> : null}
          {isError && !normalizedToken ? <MailWarning size={28} strokeWidth={1.8} /> : null}
        </div>

        <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
          {isLoading
            ? 'Verifying your email'
            : isSuccess
              ? 'Email verified'
              : 'Verification failed'}
        </h1>

        <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
          {isLoading
            ? 'Confirming your verification link, please wait.'
            : isSuccess
              ? (verifyEmailMessage ?? 'Your email is verified. You can now sign in to your account.')
              : (verifyEmailError ?? 'This link is invalid or has expired. Request a new one from the sign-in page.')}
        </p>

        <button
          className="mx-auto mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
          type="button"
          disabled={isLoading}
          onClick={() => navigate('/', { replace: true })}
        >
          {isSuccess ? 'Continue to workspace' : 'Back to sign in'}
          <ArrowRight size={16} />
        </button>
      </div>
    </AuthLayout>
  )
}
