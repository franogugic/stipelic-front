import { ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { TextField } from '../../../shared/ui/TextField'
import { useAuthStore } from '../model/auth-store'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const requestPasswordResetStatus = useAuthStore((s) => s.requestPasswordResetStatus)
  const requestPasswordResetMessage = useAuthStore((s) => s.requestPasswordResetMessage)
  const requestPasswordResetForEmail = useAuthStore((s) => s.requestPasswordResetForEmail)

  const isSubmitting = requestPasswordResetStatus === 'submitting'
  const isSuccess = requestPasswordResetStatus === 'success'
  const trimmedEmail = email.trim()
  const isEmailValid = emailPattern.test(trimmedEmail)
  const emailError = touched && !isEmailValid ? 'Enter a valid email address.' : undefined

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched(true)
    if (!isEmailValid || isSubmitting) return
    await requestPasswordResetForEmail(trimmedEmail)
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
            <span className="text-xs font-black text-white">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          {isSuccess ? (
            <div className="text-center">
              <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-50 text-emerald-600">
                <MailCheck size={28} strokeWidth={1.8} />
              </div>
              <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
                Check your email
              </h1>
              <p className="mt-2.5 text-sm leading-6 text-neutral-500">
                {requestPasswordResetMessage ??
                  "If an account exists for that email, we've sent a password reset link."}
              </p>
              <button
                className="mx-auto mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
                type="button"
                onClick={() => navigate('/login')}
              >
                Back to sign in
                <ArrowRight size={16} />
              </button>
            </div>
          ) : (
            <>
              <div className="mb-6">
                <h1 className="text-xl font-semibold tracking-tight text-neutral-950">
                  Forgot your password?
                </h1>
                <p className="mt-1.5 text-sm text-neutral-500">
                  Enter your email and we'll send you a link to reset it.
                </p>
              </div>

              <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
                <TextField
                  label="Email address"
                  name="email"
                  type="email"
                  autoComplete="email"
                  inputMode="email"
                  placeholder="you@example.com"
                  value={email}
                  error={emailError}
                  onBlur={() => setTouched(true)}
                  onChange={(e) => setEmail(e.target.value)}
                />

                <button
                  className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
                  type="submit"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="animate-spin" size={16} />
                      Sending link…
                    </>
                  ) : (
                    <>
                      Send reset link
                      <ArrowRight size={16} />
                    </>
                  )}
                </button>
              </form>

              <button
                type="button"
                className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-medium text-neutral-500 transition hover:text-neutral-950"
                onClick={() => navigate('/login')}
              >
                <ArrowLeft size={14} />
                Back to sign in
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  )
}
