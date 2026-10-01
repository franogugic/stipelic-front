import type { LucideIcon } from 'lucide-react'
import { CloudOff, RotateCw, X } from 'lucide-react'
import type { MouseEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Button } from '../../../shared/ui/ledger'
import { useAuthStore } from '../model/auth-store'
import { useHasSession } from '../model/use-has-session'

/** Ghost "Back to log in". With a session it signs out first, or /login would bounce straight back. */
export function BackToLoginButton() {
  const navigate = useNavigate()
  const hasSession = useHasSession()
  const logout = useAuthStore((s) => s.logout)

  const handleClick = async (event: MouseEvent) => {
    if (!hasSession) return
    event.preventDefault()
    await logout()
    navigate('/login', { replace: true })
  }

  return (
    <Button variant="ghost" to="/login" onClick={(event) => void handleClick(event)}>
      Back to log in
    </Button>
  )
}

/** A link is being checked (not designed: the state illustration alone, announced to screen readers). */
export function SoloChecking({ icon, label }: { icon: LucideIcon; label: string }) {
  const hasSession = useHasSession()
  return (
    <SoloLayout user={hasSession}>
      <div aria-busy="true">
        <StateArt icon={icon} />
        <span className="sr-only" role="status">{label}</span>
      </div>
    </SoloLayout>
  )
}

/**
 * A link check that could not complete (rate limit, server or network). Not designed: built from the
 * prototype's error state in the solo layout.
 */
export function SoloRequestFailed({
  text,
  retrying,
  onRetry,
}: {
  text: string
  retrying: boolean
  onRetry: () => void
}) {
  const hasSession = useHasSession()
  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={CloudOff} badge={X} tone="state--error" />
      <h1 className="solo__title">Something went <em>wrong</em></h1>
      <p className="solo__text">{text}</p>
      <div className="cluster cluster--center">
        <Button variant="secondary" icon={RotateCw} loading={retrying} onClick={onRetry}>
          Try again
        </Button>
        <BackToLoginButton />
      </div>
    </SoloLayout>
  )
}
