import { Check, Mail, RotateCw } from 'lucide-react'
import type { MouseEvent } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Button, useToast } from '../../../shared/ui/ledger'
import { useAuthStore } from '../model/auth-store'
import { useResendCooldown } from '../model/use-resend-cooldown'

/**
 * "Check your inbox" after registering. Registering creates no session, so the page works both without
 * one (email from `pendingVerificationEmail`) and for a signed-in user who has not verified yet.
 */
export function CheckInboxPage() {
  const navigate = useNavigate()
  const toast = useToast()

  const currentUser = useAuthStore((s) => s.currentUser)
  const sessionStatus = useAuthStore((s) => s.sessionStatus)
  const pendingVerificationEmail = useAuthStore((s) => s.pendingVerificationEmail)
  const resendStatus = useAuthStore((s) => s.resendStatus)
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail)
  const logout = useAuthStore((s) => s.logout)
  const { label: cooldownLabel, isCoolingDown } = useResendCooldown()

  useDocumentTitle('Check your inbox · Luma')

  // Wait for the session check, so a verified user is not shown this page for a moment.
  if (sessionStatus === 'checking') return null

  const hasSession = sessionStatus === 'authenticated' && currentUser !== null
  if (hasSession && currentUser.isEmailVerified !== false) return <Navigate to="/" replace />

  const email = hasSession ? currentUser.email : pendingVerificationEmail
  if (!email) return <Navigate to="/login" replace />

  const isSending = resendStatus === 'submitting'

  const handleResend = async () => {
    if (isSending || isCoolingDown) return
    await resendVerificationEmail(email)
    const { resendStatus: status, resendError } = useAuthStore.getState()
    if (status === 'success') {
      toast({ tone: 'success', title: 'Verification email sent' })
    } else if (status === 'error') {
      toast({ tone: 'danger', title: resendError ?? 'We could not send another verification email. Please try again.' })
    }
  }

  // With a session, /login and /register would bounce straight back here, so sign out first.
  const leaveTo = (path: string) => async (event: MouseEvent) => {
    if (!hasSession) return
    event.preventDefault()
    await logout()
    navigate(path, { replace: true })
  }

  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={Mail} badge={Check} />
      <h1 className="solo__title">Check your <em>inbox</em></h1>
      <p className="solo__text">
        We sent a verification link to <strong>{email}</strong>. Click it to activate your account.
      </p>
      <div className="cluster cluster--center">
        <Button
          variant="secondary"
          icon={RotateCw}
          loading={isSending}
          aria-disabled={isCoolingDown || undefined}
          onClick={() => void handleResend()}
        >
          {isCoolingDown ? `Resend in ${cooldownLabel}` : 'Resend verification email'}
        </Button>
        <Button variant="ghost" to="/login" onClick={(event) => void leaveTo('/login')(event)}>
          Back to log in
        </Button>
      </div>
      <p className="text-xs text-muted">
        Wrong address?{' '}
        <Link className="link" to="/register" onClick={(event) => void leaveTo('/register')(event)}>
          Sign up again
        </Link>
      </p>
    </SoloLayout>
  )
}
