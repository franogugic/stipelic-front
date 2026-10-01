import { ArrowLeft, CircleAlert, MailCheck } from 'lucide-react'
import type { FormEvent } from 'react'
import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { Alert, Button, Field, Input } from '../../../shared/ui/ledger'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { useAuthStore } from '../model/auth-store'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [touched, setTouched] = useState(false)

  const requestPasswordResetStatus = useAuthStore((s) => s.requestPasswordResetStatus)
  const requestPasswordResetError = useAuthStore((s) => s.requestPasswordResetError)
  const requestPasswordResetForEmail = useAuthStore((s) => s.requestPasswordResetForEmail)
  const resetRequestPasswordResetFeedback = useAuthStore((s) => s.resetRequestPasswordResetFeedback)

  useDocumentTitle('Forgot password · Luma')

  // The store outlives the page: start every visit on the form, not on a previous visit's result.
  useEffect(() => {
    resetRequestPasswordResetFeedback()
  }, [resetRequestPasswordResetFeedback])

  const isSubmitting = requestPasswordResetStatus === 'submitting'
  const trimmedEmail = email.trim()
  const isEmailValid = emailPattern.test(trimmedEmail)
  const emailError = touched && !isEmailValid ? 'Enter a valid email address.' : undefined

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched(true)
    if (!isEmailValid || isSubmitting) return
    await requestPasswordResetForEmail(trimmedEmail)
  }

  if (requestPasswordResetStatus === 'success') {
    return (
      <AuthSplitLayout>
        <div className="stack stack--sm">
          <h1 className="page-title">Check your <em>inbox</em></h1>
        </div>
        <Alert tone="success" icon={MailCheck} live title="Link sent">
          If an account exists for <strong>{trimmedEmail}</strong>, we’ve sent a link to reset your password. It expires
          in 1 hour.
        </Alert>
        <div className="cluster">
          <Button variant="secondary" icon={ArrowLeft} to="/login">
            Back to log in
          </Button>
          {/* An action, not navigation: back to the form with the email kept. */}
          <button type="button" className="link text-sm" onClick={resetRequestPasswordResetFeedback}>
            Didn’t get it? Try again
          </button>
        </div>
      </AuthSplitLayout>
    )
  }

  return (
    <AuthSplitLayout>
      <div className="stack stack--sm">
        <h1 className="page-title">Forgot your <em>password?</em></h1>
        <p className="text-secondary">Enter the email you signed up with and we’ll send you a reset link.</p>
      </div>

      {requestPasswordResetError ? (
        <Alert tone="danger" icon={CircleAlert} live>
          <p>{requestPasswordResetError}</p>
        </Alert>
      ) : null}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field label="Email" error={emailError}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={email}
              onBlur={() => setTouched(true)}
              onChange={(e) => {
                resetRequestPasswordResetFeedback()
                setEmail(e.target.value)
              }}
            />
          )}
        </Field>
        <Button variant="primary" size="lg" block type="submit" loading={isSubmitting}>
          Send reset link
        </Button>
      </form>

      <p className="text-sm text-secondary">
        Remembered it? <Link className="link" to="/login">Back to log in</Link>
      </p>
    </AuthSplitLayout>
  )
}
