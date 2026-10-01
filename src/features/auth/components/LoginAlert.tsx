import { CircleAlert, CircleCheck, MailWarning } from 'lucide-react'
import { Alert, useToast } from '../../../shared/ui/ledger'
import { useAuthStore } from '../model/auth-store'
import { useResendCooldown } from '../model/use-resend-cooldown'

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
        live
        title="Please verify your email"
        action={<ResendVerificationButton email={unverifiedEmail} />}
      >
        We sent a link to {unverifiedEmail}.
      </Alert>
    )
  }

  if (loginError) {
    return (
      <Alert tone="danger" icon={CircleAlert} live>
        <p>{loginError}</p>
      </Alert>
    )
  }

  if (successMessage) {
    return (
      <Alert tone="success" icon={CircleCheck} live>
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
  const { label: cooldownLabel, isCoolingDown } = useResendCooldown()
  const isSending = resendStatus === 'submitting'

  const handleClick = async () => {
    if (isSending || isCoolingDown) return
    await resendVerificationEmail(email)
    const { resendStatus: status, resendError } = useAuthStore.getState()
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
      {isCoolingDown ? `Resend in ${cooldownLabel}` : 'Resend verification email'}
    </button>
  )
}
