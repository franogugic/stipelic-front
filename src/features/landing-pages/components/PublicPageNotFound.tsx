import { Compass, House, Link as LinkIcon, X } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { Button, UrlPill } from '../../../shared/ui/ledger'

/** A public creator page that is missing or unpublished — the prototype's `SCREENS['workspace-not-found']`. */
export function PublicPageNotFound() {
  useDocumentTitle('Page not found · Luma')

  return (
    <SoloLayout>
      <StateArt icon={Compass} badge={X} tone="state--error" />
      <h1 className="solo__title">
        This page <em>doesn’t exist.</em>
      </h1>
      <UrlPill icon={LinkIcon} className="solo__url">
        {`${window.location.host}${window.location.pathname}`}
      </UrlPill>
      <p className="solo__text">
        The creator may have changed their link or unpublished this page. Check the address, or ask them for the new
        one.
      </p>
      <div className="cluster cluster--center">
        <Button variant="primary" icon={House} to="/">
          Go to Luma
        </Button>
      </div>
      <p className="text-xs text-muted">
        Are you the creator?{' '}
        <Link className="link" to="/login">
          Log in
        </Link>{' '}
        to check your pages.
      </p>
    </SoloLayout>
  )
}
