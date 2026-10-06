import { CircleAlert, Link2Off, MailX, X } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { CreatorResultPage } from '../../../shared/ui/CreatorResultPage'
import { Alert } from '../../../shared/ui/ledger'
import { UNSUBSCRIBE_LINK_INVALID, confirmUnsubscribe, getUnsubscribePage } from '../api/unsubscribe-api'
import type { UnsubscribePage as UnsubscribeInfo } from '../api/unsubscribe-api'

type State =
  | { status: 'loading' }
  | { status: 'invalid' }
  | { status: 'error' }
  | { status: 'ready'; page: UnsubscribeInfo }

/**
 * The link at the bottom of a campaign email. Opening it only reads (so a link scanner can't unsubscribe anyone):
 * the person confirms with the button, which then shows "You’re unsubscribed".
 */
export function UnsubscribePage() {
  const { token = '' } = useParams<{ token: string }>()
  const [state, setState] = useState<State>({ status: 'loading' })
  const [done, setDone] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [confirmFailed, setConfirmFailed] = useState(false)

  useDocumentTitle('Unsubscribe · Luma')

  const load = useCallback(() => {
    let active = true
    getUnsubscribePage(token)
      .then((page) => active && setState({ status: 'ready', page }))
      .catch((error: unknown) => {
        if (!active) return
        const invalid = error instanceof ApiError && error.status === 404 && error.code === UNSUBSCRIBE_LINK_INVALID
        setState({ status: invalid ? 'invalid' : 'error' })
      })
    return () => {
      active = false
    }
  }, [token])

  useEffect(() => load(), [load])

  const confirm = async () => {
    setConfirming(true)
    setConfirmFailed(false)
    try {
      await confirmUnsubscribe(token)
      setDone(true)
    } catch (error) {
      if (error instanceof ApiError && error.status === 404 && error.code === UNSUBSCRIBE_LINK_INVALID) setState({ status: 'invalid' })
      else setConfirmFailed(true)
    } finally {
      setConfirming(false)
    }
  }

  if (state.status === 'loading') {
    return (
      <CreatorResultPage busy>
        <p className="lp__sub" role="status">
          Checking your link…
        </p>
      </CreatorResultPage>
    )
  }

  if (state.status === 'error') {
    return (
      <CreatorResultPage>
        <Alert tone="danger" icon={CircleAlert} live>
          We couldn’t load this page. Check your connection and try again.
        </Alert>
        <button
          className="lp__cta"
          type="button"
          onClick={() => {
            setState({ status: 'loading' })
            load()
          }}
        >
          Try again
        </button>
      </CreatorResultPage>
    )
  }

  if (state.status === 'invalid') {
    return (
      <CreatorResultPage>
        <div className="state state--error lp-done__art">
          <div className="state__art">
            <Link2Off />
            <span className="state__badge">
              <X />
            </span>
          </div>
        </div>
        <h1 className="lp__title lp-done__title">
          This link <em>doesn’t work</em>
        </h1>
        <p className="lp__sub">
          It may be incomplete or out of date. To unsubscribe, use the link at the bottom of the latest email from this
          sender.
        </p>
      </CreatorResultPage>
    )
  }

  const { creator, alreadyUnsubscribed } = state.page
  const brand = { name: creator.name, color: creator.brandColor, logoUrl: creator.logoUrl }

  if (alreadyUnsubscribed || done) {
    return (
      <CreatorResultPage brand={brand}>
        <div className="state lp-done__art">
          <div className="state__art">
            <MailX />
          </div>
        </div>
        <h1 className="lp__title lp-done__title">
          You’re <em>unsubscribed</em>
        </h1>
        <p className="lp__sub">
          You won’t receive emails from {creator.name} anymore. Changed your mind? Just sign up again on any of their
          pages.
        </p>
      </CreatorResultPage>
    )
  }

  return (
    <CreatorResultPage brand={brand}>
      <div className="state lp-done__art">
        <div className="state__art">
          <MailX />
        </div>
      </div>
      <h1 className="lp__title lp-done__title">
        Unsubscribe from <em>{creator.name}</em>?
      </h1>
      <p className="lp__sub">You’ll stop receiving their emails. You can sign up again on any of their pages.</p>
      {confirmFailed && (
        <Alert tone="danger" icon={CircleAlert} live>
          We couldn’t unsubscribe you right now. Please try again.
        </Alert>
      )}
      <button className="lp__cta" type="button" disabled={confirming} aria-busy={confirming || undefined} onClick={() => void confirm()}>
        Unsubscribe
      </button>
    </CreatorResultPage>
  )
}
