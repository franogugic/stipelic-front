import { CircleAlert, FileDown, Link2Off, Lock, Mail } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { date } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { CreatorResultPage } from '../../../shared/ui/CreatorResultPage'
import { downloadPageUrl, getAccess } from '../api/access-api'
import type { AccessInfo } from '../api/access-api'
import { BuyerFile } from '../components/BuyerFile'
import { useDownload } from '../model/use-download'

type State =
  | { status: 'loading' }
  | { status: 'ready'; access: AccessInfo }
  | { status: 'invalid' }
  | { status: 'revoked' }
  | { status: 'rate-limited' }
  | { status: 'error' }

/**
 * `/d/:token` — the page a personal link opens (from the order email, or from the email a lead-page sign-up gets). It
 * works while an order is paid; a refund turns it off. No download count limit, only a rate limit.
 */
export function DownloadPage() {
  const { token = '' } = useParams<{ token: string }>()
  const [state, setState] = useState<State>({ status: 'loading' })
  const { busy, problem, download } = useDownload(token)

  useDocumentTitle('Your download · Luma')

  useEffect(() => {
    let active = true
    getAccess(token)
      .then((access) => active && setState({ status: 'ready', access }))
      .catch((error: unknown) => {
        if (!active) return
        if (error instanceof ApiError && error.status === 404) setState({ status: 'invalid' })
        else if (error instanceof ApiError && error.status === 410) setState({ status: 'revoked' })
        else if (error instanceof ApiError && error.status === 429) setState({ status: 'rate-limited' })
        else setState({ status: 'error' })
      })
    return () => {
      active = false
    }
  }, [token])

  if (state.status === 'loading') {
    return (
      <CreatorResultPage busy>
        <div className="state__art">
          <FileDown />
        </div>
        <p className="lp__sub" role="status">
          Getting your download…
        </p>
      </CreatorResultPage>
    )
  }

  if (state.status === 'invalid') {
    return (
      <CreatorResultPage>
        <div className="state state--error lp-done__art">
          <div className="state__art">
            <Link2Off />
          </div>
        </div>
        <h1 className="lp__title lp-done__title">
          This link <em>doesn’t work</em>
        </h1>
        <p className="lp__sub">
          It may be incomplete — check that you copied the whole link from your email. Still stuck? Write to the person who sent it and they’ll send a new
          one.
        </p>
      </CreatorResultPage>
    )
  }

  if (state.status === 'revoked') {
    return (
      <CreatorResultPage>
        <div className="state__art">
          <Link2Off />
        </div>
        <h1 className="lp__title lp-done__title">
          This link is <em>turned off</em>
        </h1>
        <p className="lp__sub">The order behind it was refunded, so its download link no longer works.</p>
        <p className="lp-done__note">
          <Mail />
          <span>Bought it again? Use the link from your newest order email. Think this is a mistake? Write to the person you bought it from.</span>
        </p>
      </CreatorResultPage>
    )
  }

  if (state.status === 'rate-limited' || state.status === 'error') {
    return (
      <CreatorResultPage>
        <div className="state__art">
          <FileDown />
        </div>
        <p className="lp-done__note lp-done__note--alert" role="alert">
          <CircleAlert />
          <span>
            {state.status === 'rate-limited'
              ? 'That’s a lot of downloads in a short time. Wait a few minutes, then try again.'
              : 'We couldn’t load your download. Check your connection and try again in a moment.'}
          </span>
        </p>
      </CreatorResultPage>
    )
  }

  const { access } = state
  const lead = access.source === 'capture'
  const brand = { name: access.brand.name, color: access.brand.color, logoUrl: access.brand.logoUrl }
  return (
    <CreatorResultPage brand={brand}>
      <div className="state__art">
        <FileDown />
      </div>
      <h1 className="lp__title lp-done__title">
        Your <em>{lead ? 'free download' : 'download'}</em>
      </h1>
      <p className="lp__sub">
        <strong>{access.productName}</strong> from {access.brand.name}
        {lead ? ', sent to you after you signed up' : access.paidAt ? (
          <>
            , bought on <span className="lp__date">{date(access.paidAt)}</span>
          </>
        ) : null}
        .
      </p>
      <BuyerFile fileName={access.fileName} fileSizeBytes={access.fileSizeBytes} busy={busy} onDownload={() => void download()} />
      {problem && (
        <p className="lp-done__note lp-done__note--alert" role="alert">
          <CircleAlert />
          <span>
            {problem === 'rate-limited'
              ? 'That’s a lot of downloads in a short time. Wait a few minutes, then try again.'
              : problem === 'revoked'
                ? 'This link was turned off, so the file can’t be downloaded.'
                : 'We couldn’t start the download. Please try again.'}
          </span>
        </p>
      )}
      <p className="lp-done__note">
        <Lock />
        <span>This link is yours — it works any time, on any device. Please don’t share it.</span>
      </p>
      <dl className="lp-receipt">
        {!lead && access.orderNumber && (
          <>
            <dt>Order</dt>
            <dd>#{access.orderNumber}</dd>
          </>
        )}
        <dt>Link</dt>
        <dd className="mono">{downloadPageUrl(token)}</dd>
      </dl>
    </CreatorResultPage>
  )
}
