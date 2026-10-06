import { House, LayoutDashboard } from 'lucide-react'
import { useEffect } from 'react'
import { Link } from 'react-router-dom'
import { useHasSession } from '../../features/auth/model/use-has-session'
import { useCreatorStore } from '../../features/creators/model/creator-store'
import { useDocumentTitle } from '../lib/use-document-title'
import { Button } from './ledger'
import { SoloLayout } from './SoloLayout'

/** The catch-all route — the prototype's `SCREENS['not-found']`. */
export function NotFoundPage() {
  const hasSession = useHasSession()
  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)

  useDocumentTitle('404 · Luma')

  // The popular-pages links need the workspace address, so a signed-in visitor's workspace is loaded here.
  useEffect(() => {
    if (hasSession && currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [hasSession, currentCreatorStatus, loadCurrentCreator])

  const base = hasSession && currentCreator ? `/app/${currentCreator.slug}` : null

  return (
    <SoloLayout user={hasSession}>
      <p className="giant-404" aria-hidden="true">
        4<span className="giant-404__zero" />4
      </p>
      <h1 className="solo__title">
        We couldn’t find <em>that page.</em>
      </h1>
      <p className="solo__text">The link may be broken, or the page may have moved. Here are a few places to start:</p>
      <div className="cluster cluster--center">
        <Button variant="primary" icon={LayoutDashboard} to="/">
          Back to dashboard
        </Button>
        <Button variant="secondary" icon={House} to="/">
          Go to homepage
        </Button>
      </div>
      {base && (
        <nav className="cluster cluster--center text-sm" aria-label="Popular pages">
          <Link className="link" to={`${base}/landing-pages`}>
            Landing pages
          </Link>
          <Link className="link" to={`${base}/products`}>
            Products
          </Link>
          <Link className="link" to={`${base}/orders`}>
            Orders
          </Link>
          <Link className="link" to={`${base}/settings`}>
            Settings
          </Link>
        </nav>
      )}
    </SoloLayout>
  )
}
