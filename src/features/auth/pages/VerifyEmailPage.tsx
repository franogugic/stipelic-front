import { ArrowRight, Check, Link2Off, Mail, MailCheck, Send, X } from 'lucide-react'
import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Button, useToast } from '../../../shared/ui/ledger'
import { BackToLoginButton, SoloChecking, SoloRequestFailed } from '../components/SoloStates'
import { useAuthStore } from '../model/auth-store'
import { requestFailedText } from '../model/request-failed-text'
import { useHasSession } from '../model/use-has-session'

/** Opened from the verification email: verified, expired (with a new link) or invalid. */
export function VerifyEmailPage() {
  const navigate = useNavigate()
  const toast = useToast()
  const [searchParams] = useSearchParams()
  const verifiedTokenRef = useRef<string | null>(null)

  const sessionStatus = useAuthStore((s) => s.sessionStatus)
  const accountStatus = useAuthStore((s) => s.accountStatus)
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser)
  const verifyEmailStatus = useAuthStore((s) => s.verifyEmailStatus)
  const verifyEmailOutcome = useAuthStore((s) => s.verifyEmailOutcome)
  const verifyEmailCheckedToken = useAuthStore((s) => s.verifyEmailCheckedToken)
  const verifyEmailError = useAuthStore((s) => s.verifyEmailError)
  const verifyEmailErrorStatus = useAuthStore((s) => s.verifyEmailErrorStatus)
  const verifiedFirstName = useAuthStore((s) => s.verifiedFirstName)
  const expiredEmail = useAuthStore((s) => s.expiredEmail)
  const verifyEmailToken = useAuthStore((s) => s.verifyEmailToken)
  const resetVerifyEmailFeedback = useAuthStore((s) => s.resetVerifyEmailFeedback)
  const resendStatus = useAuthStore((s) => s.resendStatus)
  const resendVerificationEmail = useAuthStore((s) => s.resendVerificationEmail)

  const token = searchParams.get('token')
  const normalizedToken = useMemo(() => token?.trim() ?? '', [token])

  useDocumentTitle('Verify email · Luma')

  // Verify once per token (the ref also keeps StrictMode's double effect from verifying twice).
  useEffect(() => {
    if (verifiedTokenRef.current === normalizedToken) return
    verifiedTokenRef.current = normalizedToken
    resetVerifyEmailFeedback()
    void verifyEmailToken(normalizedToken)
  }, [normalizedToken, resetVerifyEmailFeedback, verifyEmailToken])

  // The session check runs alongside the verification; if it answered with the account as it was before
  // verifying, read it once more so "Set up your workspace" does not bounce back to check-inbox.
  const refreshedSession = useRef(false)
  useEffect(() => {
    if (refreshedSession.current) return
    if (verifyEmailOutcome !== 'verified' || sessionStatus !== 'authenticated' || accountStatus !== 'pendingVerification') return
    refreshedSession.current = true
    void loadCurrentUser()
  }, [verifyEmailOutcome, sessionStatus, accountStatus, loadCurrentUser])

  const hasSession = useHasSession()
  // An outcome left over from another link (or none yet) counts as still verifying.
  const isVerifying =
    verifyEmailCheckedToken !== normalizedToken || verifyEmailStatus === 'idle' || verifyEmailStatus === 'submitting'

  const sendNewLink = async () => {
    if (!expiredEmail || resendStatus === 'submitting') return
    await resendVerificationEmail(expiredEmail)
    const { resendStatus: status, resendError } = useAuthStore.getState()
    if (status === 'error') {
      toast({ tone: 'danger', title: resendError ?? 'We could not send another verification email. Please try again.' })
      return
    }
    navigate('/check-inbox', { replace: true })
  }

  const failedText = requestFailedText(verifyEmailErrorStatus, verifyEmailError)

  // While a retry runs the failed screen stays up (with a busy button) instead of the verifying screen.
  const [retryingText, setRetryingText] = useState<string | null>(null)
  const retry = async () => {
    setRetryingText(failedText)
    await verifyEmailToken(normalizedToken)
    setRetryingText(null)
  }

  if (retryingText !== null || (verifyEmailOutcome === 'failed' && verifyEmailCheckedToken === normalizedToken)) {
    return <SoloRequestFailed text={retryingText ?? failedText} retrying={retryingText !== null} onRetry={() => void retry()} />
  }

  if (isVerifying) {
    return <SoloChecking icon={Mail} label="Verifying your email…" />
  }

  if (verifyEmailOutcome === 'verified') {
    return (
      <SoloLayout user={hasSession}>
        <StateArt icon={MailCheck} badge={Check} />
        <h1 className="solo__title">Email <em>verified.</em></h1>
        <p className="solo__text">
          Thanks{verifiedFirstName ? `, ${verifiedFirstName}` : ''} — your account is ready. Next, set up the workspace
          your pages and products will live in.
        </p>
        <div className="cluster cluster--center">
          <Button variant="accent" icon={ArrowRight} to="/">
            Set up your workspace
          </Button>
        </div>
      </SoloLayout>
    )
  }

  if (verifyEmailOutcome === 'expired' && expiredEmail) {
    return (
      <SoloLayout user={hasSession}>
        <StateArt icon={Link2Off} badge={X} tone="state--error" />
        <h1 className="solo__title">This link has <em>expired</em></h1>
        <p className="solo__text">
          Verification links are valid for 24 hours. We can send a fresh one to <strong>{expiredEmail}</strong>.
        </p>
        <div className="cluster cluster--center">
          <Button variant="primary" icon={Send} loading={resendStatus === 'submitting'} onClick={() => void sendNewLink()}>
            Send a new link
          </Button>
          <BackToLoginButton />
        </div>
      </SoloLayout>
    )
  }

  // Not designed in the prototype: the expired layout without the resend action.
  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={Link2Off} badge={X} tone="state--error" />
      <h1 className="solo__title">This link isn't <em>valid</em></h1>
      <p className="solo__text">Open the newest verification email we sent you, or log in to request a new link.</p>
      <div className="cluster cluster--center"><BackToLoginButton /></div>
    </SoloLayout>
  )
}
