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
    if (verifiedTokenRef.current === normalizedToken) {
      return
    }

    verifiedTokenRef.current = normalizedToken
    resetVerifyEmailFeedback()
    void verifyEmailToken(normalizedToken)
  }, [normalizedToken, resetVerifyEmailFeedback, verifyEmailToken])

  const isLoading = verifyEmailStatus === 'submitting' || verifyEmailStatus === 'idle'
  const isSuccess = verifyEmailStatus === 'success'
  const isError = verifyEmailStatus === 'error'

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-5 py-8">
        <section className="w-full rounded-[30px] border border-white/70 bg-white/85 p-6 text-center shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-10">
          <div
            className={`mx-auto grid size-20 place-items-center rounded-3xl ${
              isSuccess
                ? 'bg-emerald-100 text-emerald-700'
                : isError
                  ? 'bg-red-100 text-red-700'
                  : 'bg-neutral-100 text-neutral-700'
            }`}
          >
            {isLoading ? <Loader2 className="animate-spin" size={38} strokeWidth={1.8} /> : null}
            {isSuccess ? <CheckCircle2 size={40} strokeWidth={1.8} /> : null}
            {isError && normalizedToken ? <XCircle size={40} strokeWidth={1.8} /> : null}
            {isError && !normalizedToken ? <MailWarning size={40} strokeWidth={1.8} /> : null}
          </div>

          <p className="mt-7 text-sm font-semibold text-neutral-500">Creator Platform</p>
          <h1 className="mt-3 text-3xl font-semibold tracking-normal sm:text-4xl">
            {isSuccess ? 'Email verified' : isError ? 'Verification failed' : 'Verifying email'}
          </h1>

          <p className="mx-auto mt-4 max-w-lg text-sm leading-6 text-neutral-600">
            {isSuccess
              ? (verifyEmailMessage ?? 'Your email has been verified successfully.')
              : isError
                ? (verifyEmailError ?? 'This verification link is invalid or expired.')
                : 'Please wait while we confirm your verification link.'}
          </p>

          <button
            className="mx-auto mt-8 inline-flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
            type="button"
            disabled={isLoading}
            onClick={() => navigate('/', { replace: true })}
          >
            Continue
            <ArrowRight size={18} />
          </button>
        </section>
      </div>
    </main>
  )
}
