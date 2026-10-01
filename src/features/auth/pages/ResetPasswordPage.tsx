import { Check, CircleAlert, KeyRound, Link2Off, LogIn, Send, X } from 'lucide-react'
import type { FormEvent } from 'react'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Alert, Button, Field, Input } from '../../../shared/ui/ledger'
import { inspectResetToken } from '../api/auth-api'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { BackToLoginButton, SoloChecking, SoloRequestFailed } from '../components/SoloStates'
import { useAuthStore } from '../model/auth-store'
import { getPasswordChecks } from '../model/register-validation'
import { requestFailedTextFor } from '../model/request-failed-text'
import { useHasSession } from '../model/use-has-session'

type Inspection =
  | { status: 'checking' }
  | { status: 'valid'; email: string }
  | { status: 'expired' }
  | { status: 'failed'; text: string }

// A missing or unknown token (400) gets the same "request a new link" path as an expired one.
async function inspect(token: string): Promise<Inspection> {
  try {
    const result = await inspectResetToken(token)
    return result.status === 'Valid' ? { status: 'valid', email: result.email } : { status: 'expired' }
  } catch (error) {
    if (error instanceof ApiError && error.status === 400) return { status: 'expired' }
    return { status: 'failed', text: requestFailedTextFor(error) }
  }
}

/** Opened from the reset email: the link is checked first, then the new password is chosen. */
export function ResetPasswordPage() {
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])

  const [inspection, setInspection] = useState<Inspection>({ status: 'checking' })
  const [inspectedToken, setInspectedToken] = useState(token)
  const [retrying, setRetrying] = useState(false)

  const resetPasswordStatus = useAuthStore((s) => s.resetPasswordStatus)
  const resetResetPasswordFeedback = useAuthStore((s) => s.resetResetPasswordFeedback)

  useDocumentTitle('Set a new password · Luma')

  // A different link starts over.
  if (inspectedToken !== token) {
    setInspectedToken(token)
    setInspection({ status: 'checking' })
  }

  // The store outlives the page: never start on a previous visit's result.
  useEffect(() => {
    resetResetPasswordFeedback()
  }, [resetResetPasswordFeedback])

  useEffect(() => {
    if (!token) return
    let active = true
    void inspect(token).then((result) => {
      if (active) setInspection(result)
    })
    return () => {
      active = false
    }
  }, [token])

  const retry = useCallback(async () => {
    setRetrying(true)
    setInspection(await inspect(token))
    setRetrying(false)
  }, [token])

  if (resetPasswordStatus === 'success') return <ResetSucceeded />
  if (!token || inspection.status === 'expired') return <ResetLinkExpired />
  if (inspection.status === 'checking') return <SoloChecking icon={KeyRound} label="Checking your link…" />
  if (inspection.status === 'failed') {
    return <SoloRequestFailed text={inspection.text} retrying={retrying} onRetry={() => void retry()} />
  }

  return <ResetPasswordForm token={token} email={inspection.email} onExpired={() => setInspection({ status: 'expired' })} />
}

function ResetPasswordForm({ token, email, onExpired }: { token: string; email: string; onExpired: () => void }) {
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false })

  const resetPasswordStatus = useAuthStore((s) => s.resetPasswordStatus)
  const resetPasswordError = useAuthStore((s) => s.resetPasswordError)
  const resetPasswordWithToken = useAuthStore((s) => s.resetPasswordWithToken)
  const resetResetPasswordFeedback = useAuthStore((s) => s.resetResetPasswordFeedback)

  const passwordChecks = getPasswordChecks(newPassword)
  const isPasswordValid = passwordChecks.every((check) => check.isMet)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const passwordError =
    touched.newPassword && !isPasswordValid ? 'Password does not meet all requirements.' : undefined
  const confirmError = touched.confirmPassword && !passwordsMatch ? 'Passwords do not match.' : undefined
  const isSubmitting = resetPasswordStatus === 'submitting'

  // The button stays active (as in the prototype); an invalid submit only reveals the errors.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched({ newPassword: true, confirmPassword: true })
    if (!isPasswordValid || !passwordsMatch || isSubmitting) return

    const succeeded = await resetPasswordWithToken(token, newPassword)
    // A 400 here means the link was used or expired since it was checked.
    if (!succeeded && useAuthStore.getState().resetPasswordErrorStatus === 400) {
      resetResetPasswordFeedback()
      onExpired()
    }
  }

  const update = (setter: (value: string) => void) => (value: string) => {
    resetResetPasswordFeedback()
    setter(value)
  }

  return (
    <AuthSplitLayout>
      <div className="stack stack--sm">
        <h1 className="page-title">Choose a new <em>password</em></h1>
        <p className="text-secondary">For {email}</p>
      </div>

      {resetPasswordError ? (
        <Alert tone="danger" icon={CircleAlert} live>
          <p>{resetPasswordError}</p>
        </Alert>
      ) : null}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field label="New password" error={passwordError}>
          {(control) => (
            <>
              <Input
                {...control}
                type="password"
                name="newPassword"
                autoComplete="new-password"
                value={newPassword}
                onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                onChange={(e) => update(setNewPassword)(e.target.value)}
              />
              <PasswordChecklist checks={passwordChecks} />
            </>
          )}
        </Field>
        <Field label="Confirm password" error={confirmError}>
          {(control) => (
            <Input
              {...control}
              type="password"
              name="confirmPassword"
              autoComplete="new-password"
              value={confirmPassword}
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              onChange={(e) => update(setConfirmPassword)(e.target.value)}
            />
          )}
        </Field>
        <Button variant="primary" size="lg" block type="submit" loading={isSubmitting}>
          Update password
        </Button>
      </form>
    </AuthSplitLayout>
  )
}

function ResetLinkExpired() {
  const hasSession = useHasSession()
  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={Link2Off} badge={X} tone="state--error" />
      <h1 className="solo__title">This link has <em>expired</em></h1>
      <p className="solo__text">
        Reset links are valid for one hour and can only be used once. Request a new one and use it right away.
      </p>
      <div className="cluster cluster--center">
        <Button variant="primary" icon={Send} to="/forgot-password">
          Request a new link
        </Button>
        <BackToLoginButton />
      </div>
    </SoloLayout>
  )
}

function ResetSucceeded() {
  const hasSession = useHasSession()
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser)

  // Resetting signs out every session of that account; re-read ours once so the page (and /login) see it.
  const sessionReread = useRef(false)
  useEffect(() => {
    if (!hasSession || sessionReread.current) return
    sessionReread.current = true
    void loadCurrentUser()
  }, [hasSession, loadCurrentUser])

  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={KeyRound} badge={Check} />
      <h1 className="solo__title">Password <em>updated.</em></h1>
      <p className="solo__text">
        You can now log in with your new password. For your security, other devices were logged out.
      </p>
      <div className="cluster cluster--center">
        <Button variant="primary" icon={LogIn} to="/login">
          Log in
        </Button>
      </div>
    </SoloLayout>
  )
}
