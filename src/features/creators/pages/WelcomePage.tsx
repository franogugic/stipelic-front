import { ArrowRight, AtSign, Gauge, Palette } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useEffect } from 'react'
import { Navigate } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { Button } from '../../../shared/ui/ledger'
import { useAuthStore } from '../../auth/model/auth-store'
import { useCreatorStore } from '../model/creator-store'

const steps: { number: string; title: string; text: string; icon: LucideIcon }[] = [
  { number: '01', title: 'Name & link', text: 'Pick a name and your public address, like luma.app/p/mh-studio.', icon: AtSign },
  { number: '02', title: 'Choose a plan', text: 'Start free, or pick a plan with lower fees.', icon: Gauge },
  { number: '03', title: 'Make it yours', text: 'Logo, colour and support email — optional.', icon: Palette },
]

/** First stop for a verified account without a workspace: what creating one involves. */
export function WelcomePage() {
  const currentUser = useAuthStore((s) => s.currentUser)
  const accountStatus = useAuthStore((s) => s.accountStatus)
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  const isPendingVerification = accountStatus === 'pendingVerification'

  useDocumentTitle('Welcome · Luma')

  useEffect(() => {
    if (!isPendingVerification && currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [isPendingVerification, currentCreatorStatus, loadCurrentCreator])

  if (isPendingVerification) return <Navigate to="/check-inbox" replace />
  // Nothing until we know whether a workspace exists, so its owner never sees this page flash.
  if (currentCreatorStatus === 'idle' || currentCreatorStatus === 'loading') return null
  if (currentCreator) return <Navigate to={`/app/${currentCreator.slug}`} replace />

  return (
    <SoloLayout wide user>
      <p className="eyebrow">Welcome to Luma</p>
      <h1 className="solo__title solo__title--xl">
        Hi {currentUser?.firstName} — let’s set up your <em>workspace.</em>
      </h1>
      <p className="solo__text">
        Your workspace is where your pages, products, orders and subscribers live. It takes about three minutes.
      </p>
      <ol className="welcome-steps" role="list">
        {steps.map(({ number, title, text, icon: Icon }) => (
          <li key={number} className="welcome-step">
            <span className="welcome-step__icon">
              <Icon />
            </span>
            <span className="welcome-step__num">{number}</span>
            <strong>{title}</strong>
            <span className="text-sm text-secondary">{text}</span>
          </li>
        ))}
      </ol>
      <div className="cluster cluster--center">
        <Button variant="accent" icon={ArrowRight} to="/creators/new">
          Create your workspace
        </Button>
      </div>
      <p className="text-xs text-muted">One account can have one creator workspace.</p>
    </SoloLayout>
  )
}
