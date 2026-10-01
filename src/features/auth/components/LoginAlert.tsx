import { CircleAlert, CircleCheck, MailWarning } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Alert, useToast } from '../../../shared/ui/ledger'
import { useAuthStore } from '../model/auth-store'

/**
 * At most one alert between the login heading and the form: the unverified-email warning (with a resend
 * control), any other login error, or the message handed over by another page (e.g. after a password reset).
 */
export function LoginAlert({ successMessage }: { successMessage?: string }) {
  const loginError = useAuthStore((s) => s.loginError)
  const loginErrorCode = useAuthStore((s) => s.loginErrorCode)
  const unverifiedEmail = useAuthStore((s) => s.unverifiedEmail)

  if (loginErrorCode === 'EMAIL_NOT_VERIFIED' && unverifiedEmail) {
    return (
      <Alert
        tone="warning"
        icon={MailWarning}
        title="Please verify your email"
        action={<ResendVerificationButton email={unverifiedEmail} />}
      >
        We sent a link to {unverifiedEmail}.
      </Alert>
    )
  }

  if (loginError) {
    return (
      <Alert tone="danger" icon={CircleAlert}>
        <p>{loginError}</p>
      </Alert>
    )
  }

  if (successMessage) {
    return (
      <Alert tone="success" icon={CircleCheck}>
        <p>{successMessage}</p>
      </Alert>
    )
  }

  return null
}

function ResendVerificationButton({ email }: { email: string }) {
  const toast = useToast()
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail)
  const resendStatus = useAuthStore((s) => s.resendStatus)
  const resendAvailableAt = useAuthStore((s) => s.resendAvailableAt)
  const [now, setNow] = useState(() => Date.now())

  const secondsLeft = resendAvailableAt ? Math.max(0, Math.ceil((resendAvailableAt - now) / 1000)) : 0
  const isSending = resendStatus === 'submitting'
  const isCoolingDown = secondsLeft > 0

  // Tick once a second while the cooldown runs, so the label counts down.
  useEffect(() => {
    if (!resendAvailableAt || resendAvailableAt <= Date.now()) return
    const timer = window.setInterval(() => {
      const current = Date.now()
      setNow(current)
      if (current >= resendAvailableAt) window.clearInterval(timer)
    }, 1000)
    return () => window.clearInterval(timer)
  }, [resendAvailableAt])

  const handleClick = async () => {
    if (isSending || isCoolingDown) return
    await resendVerificationEmail(email)
    const { resendStatus: status, resendError } = useAuthStore.getState()
    setNow(Date.now())
    if (status === 'success') {
      toast({ tone: 'success', title: 'Verification email sent' })
    } else if (status === 'error') {
      toast({ tone: 'danger', title: resendError ?? 'We could not send another verification email. Please try again.' })
    }
  }

  return (
    <button
      type="button"
      className="link"
      aria-busy={isSending || undefined}
      aria-disabled={isCoolingDown || undefined}
      onClick={() => void handleClick()}
    >
      {isCoolingDown ? `Resend in ${formatCountdown(secondsLeft)}` : 'Resend verification email'}
    </button>
  )
}

function formatCountdown(totalSeconds: number) {
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}
