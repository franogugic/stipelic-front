import { ArrowLeft, ArrowRight, Loader2, MailCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthField } from '../components/AuthField'
import { AuthLayout } from '../components/AuthLayout'
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
    <AuthLayout>
      <div className="rounded-xl border border-border bg-card p-8">
        {isSuccess ? (
          <div className="text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-emerald-500/10 text-emerald-400">
              <MailCheck size={28} strokeWidth={1.8} />
            </div>
            <h1 className="mt-6 text-xl font-semibold tracking-tight text-foreground">
              Check your email
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-muted-foreground">
              {requestPasswordResetMessage ??
                "If an account exists for that email, we've sent a password reset link."}
            </p>
            <button
              className="mx-auto mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-85"
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
              <h1 className="text-xl font-semibold tracking-tight text-foreground">
                Forgot your password?
              </h1>
              <p className="mt-1.5 text-sm text-muted-foreground">
                Enter your email and we'll send you a link to reset it.
              </p>
            </div>

            <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
              <AuthField
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
                className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
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
              className="mx-auto mt-6 flex items-center gap-1.5 text-sm font-medium text-muted-foreground transition hover:text-foreground"
              onClick={() => navigate('/login')}
            >
              <ArrowLeft size={14} />
              Back to sign in
            </button>
          </>
        )}
      </div>
    </AuthLayout>
  )
}
