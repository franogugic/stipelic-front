import { Check, Link2Off, Mail, MailCheck, Settings, X } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Button } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { confirmEmailChange } from '../api/auth-api'
import { SoloChecking, SoloRequestFailed } from '../components/SoloStates'
import { useAuthStore } from '../model/auth-store'
import { requestFailedTextFor } from '../model/request-failed-text'
import { useHasSession } from '../model/use-has-session'

type Outcome =
  | { status: 'checking' }
  | { status: 'changed'; email: string }
  /** 400: unknown, used or expired link. */
  | { status: 'expired' }
  /** 409 EMAIL_IN_USE: someone took the address after the link was sent. */
  | { status: 'in-use'; message: string }
  | { status: 'failed'; text: string }

/** Opened from the confirmation email sent to the new address: the change is made by clicking it. */
export function ConfirmEmailChangePage() {
  const [searchParams] = useSearchParams()
  const token = searchParams.get('token')?.trim() ?? ''
  const hasSession = useHasSession()
  const currentEmail = useAuthStore((s) => s.currentUser?.email)
  const loadCurrentUser = useAuthStore((s) => s.loadCurrentUser)
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  const [outcome, setOutcome] = useState<Outcome>(token ? { status: 'checking' } : { status: 'expired' })
  const confirmedToken = useRef<string | null>(null)

  useDocumentTitle('Confirm email change · Luma')

  const confirm = async () => {
    setOutcome({ status: 'checking' })
    try {
      const result = await confirmEmailChange(token)
      setOutcome({ status: 'changed', email: result.email })
      // Signed in as the same user, the session stays: show the new address everywhere.
      void loadCurrentUser()
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) setOutcome({ status: 'expired' })
      else if (error instanceof ApiError && error.status === 409) setOutcome({ status: 'in-use', message: error.message })
      else setOutcome({ status: 'failed', text: requestFailedTextFor(error) })
    }
  }

  // The link works once: confirm it once per token (the ref also keeps StrictMode's double effect from using it twice).
  useEffect(() => {
    if (!token || confirmedToken.current === token) return
    confirmedToken.current = token
    void confirm()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  // "Go to settings" needs the workspace address.
  useEffect(() => {
    if (hasSession && currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [hasSession, currentCreatorStatus, loadCurrentCreator])

  const settingsAction =
    hasSession && currentCreator ? (
      <Button variant="primary" icon={Settings} to={`/app/${currentCreator.slug}/settings?tab=profile`}>
        Go to settings
      </Button>
    ) : (
      <Button variant="primary" to={hasSession ? '/' : '/login'}>
        {hasSession ? 'Go to dashboard' : 'Log in'}
      </Button>
    )

  if (outcome.status === 'checking') return <SoloChecking icon={Mail} label="Confirming your new email…" />

  if (outcome.status === 'failed') {
    return (
      <SoloRequestFailed
        text={outcome.text}
        retrying={false}
        onRetry={() => void confirm()}
        secondaryAction={<Button variant="ghost" to="/">Go to dashboard</Button>}
      />
    )
  }

  if (outcome.status === 'changed') {
    return (
      <SoloLayout user={hasSession}>
        <StateArt icon={MailCheck} badge={Check} />
        <h1 className="solo__title">
          Email <em>changed.</em>
        </h1>
        <p className="solo__text">
          From now on, log in with <strong>{outcome.email}</strong>. We’ve let your old address know about the change.
        </p>
        <div className="cluster cluster--center">
          {settingsAction}
          {hasSession && (
            <Button variant="ghost" to="/">
              Go to dashboard
            </Button>
          )}
        </div>
      </SoloLayout>
    )
  }

  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={Link2Off} badge={X} tone="state--error" />
      <h1 className="solo__title">
        This link has <em>expired</em>
      </h1>
      <p className="solo__text">
        {outcome.status === 'in-use' ? (
          <>{outcome.message} Your email hasn’t changed — start the change again from Settings with another address.</>
        ) : (
          <>
            Email change links are valid for 24 hours.{' '}
            {currentEmail ? (
              <>
                Your email is still <strong>{currentEmail}</strong> —
              </>
            ) : (
              'Your email hasn’t changed —'
            )}{' '}
            start the change again from Settings.
          </>
        )}
      </p>
      <div className="cluster cluster--center">{settingsAction}</div>
    </SoloLayout>
  )
}
