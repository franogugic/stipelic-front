import { CircleAlert, Check, Mail, PartyPopper } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { Link, useParams, useSearchParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { money } from '../../../shared/lib/format'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { CreatorResultPage } from '../../../shared/ui/CreatorResultPage'
import { BuyerFile } from '../../delivery/components/BuyerFile'
import { useDownload } from '../../delivery/model/use-download'
import { getOrderReceipt } from '../../orders/api/public-orders-api'
import type { OrderReceipt } from '../../orders/api/public-orders-api'
import { PublicPageNotFound } from '../components/PublicPageNotFound'

const POLL_INTERVAL_MS = 2000
const MAX_POLLS = 10

type State =
  | { status: 'loading' }
  | { status: 'notfound' }
  | { status: 'error' }
  | { status: 'ready'; receipt: OrderReceipt; pollsLeft: number }

/**
 * Stripe's success URL: the buyer's thank-you page in the creator's brand. The receipt is read by the Checkout session;
 * while the payment webhook has not arrived (status Pending) it is polled every 2 s, up to 10 times.
 */
export function OrderSuccessPage() {
  const { creatorSlug = '', pageSlug = '' } = useParams<{ creatorSlug: string; pageSlug: string }>()
  const [searchParams] = useSearchParams()
  const sessionId = searchParams.get('session_id')?.trim() ?? ''
  const [state, setState] = useState<State>(sessionId ? { status: 'loading' } : { status: 'notfound' })

  useDocumentTitle('Thank you · Luma')

  // The paid receipt carries the personal link's token: the file downloads at once, and the button repeats it.
  const readyReceipt = state.status === 'ready' ? state.receipt : null
  const accessToken = readyReceipt?.status === 'Paid' ? (readyReceipt.accessToken ?? '') : ''
  const { busy: downloading, problem: downloadProblem, download } = useDownload(accessToken)
  const autoStarted = useRef('')
  useEffect(() => {
    if (!accessToken || autoStarted.current === accessToken) return
    autoStarted.current = accessToken
    void download()
  }, [accessToken, download])

  useEffect(() => {
    if (!sessionId) return
    let active = true
    let timer: ReturnType<typeof setTimeout> | undefined

    const load = async (poll: number) => {
      try {
        const receipt = await getOrderReceipt(sessionId)
        if (!active) return
        setState({ status: 'ready', receipt, pollsLeft: MAX_POLLS - poll })
        if (receipt.status === 'Pending' && poll < MAX_POLLS) {
          timer = setTimeout(() => void load(poll + 1), POLL_INTERVAL_MS)
        }
      } catch (error) {
        if (!active) return
        setState({ status: error instanceof ApiError && error.status === 404 ? 'notfound' : 'error' })
      }
    }
    void load(0)

    return () => {
      active = false
      clearTimeout(timer)
    }
  }, [sessionId])

  if (state.status === 'notfound') return <PublicPageNotFound />

  if (state.status === 'loading' || state.status === 'error') {
    return (
      <CreatorResultPage busy={state.status === 'loading'}>
        <div className="state__art">
          <PartyPopper />
        </div>
        <p className="lp__sub" role="status">
          {state.status === 'loading'
            ? 'We’re confirming your payment…'
            : 'We couldn’t load your order right now. If you paid, the download link arrives by email shortly.'}
        </p>
      </CreatorResultPage>
    )
  }

  const { receipt, pollsLeft } = state
  const pending = receipt.status === 'Pending'
  const inactive = receipt.status === 'Refunded' || receipt.status === 'Failed'
  const brand = { name: receipt.creator.name, color: receipt.creator.brandColor, logoUrl: receipt.creator.logoUrl }

  if (pending) {
    return (
      <CreatorResultPage brand={brand} busy={pollsLeft > 0}>
        <div className="state__art">
          <PartyPopper />
        </div>
        <h1 className="lp__title lp-done__title">
          Thank you{receipt.buyerFirstName ? ', ' : ''}
          <em>{receipt.buyerFirstName ? `${receipt.buyerFirstName}!` : '!'}</em>
        </h1>
        <p className="lp__sub" role="status">
          {pollsLeft > 0
            ? 'We’re confirming your payment…'
            : 'Your payment is being confirmed. The download link arrives by email as soon as it’s done.'}
        </p>
        <Link className="lp__cta" to={`/p/${creatorSlug}/${pageSlug}`}>
          Back to {receipt.creator.name}
        </Link>
      </CreatorResultPage>
    )
  }

  return (
    <CreatorResultPage brand={brand}>
      <div className="state__art">
        <PartyPopper />
        {!inactive && (
          <span className="state__badge">
            <Check />
          </span>
        )}
      </div>
      <h1 className="lp__title lp-done__title">
        Thank you{receipt.buyerFirstName ? ', ' : ''}
        <em>{receipt.buyerFirstName ? `${receipt.buyerFirstName}!` : '!'}</em>
      </h1>
      {inactive ? (
        <p className="lp__sub">
          This order isn’t active anymore.
          {receipt.creator.supportEmail && ` Questions? Write to ${receipt.creator.supportEmail}.`}
        </p>
      ) : (
        <p className="lp__sub">
          Your order of <strong>{receipt.productName}</strong> is confirmed
          {accessToken ? ', and your download has started.' : '. The download link is on its way to your email.'}
        </p>
      )}
      {!inactive && accessToken && receipt.fileName && receipt.fileSizeBytes ? (
        <BuyerFile
          fileName={receipt.fileName}
          fileSizeBytes={receipt.fileSizeBytes}
          label="Download again"
          busy={downloading}
          onDownload={() => void download()}
        />
      ) : null}
      {downloadProblem && (
        <p className="lp-done__note lp-done__note--alert" role="alert">
          <CircleAlert />
          <span>
            {downloadProblem === 'rate-limited'
              ? 'That’s a lot of downloads in a short time. Wait a few minutes, then try again.'
              : 'We couldn’t start the download. Use the link we emailed you.'}
          </span>
        </p>
      )}
      {!inactive && (
        <p className="lp-done__note">
          <Mail />
          <span>
            We’ve also emailed a personal download link to <strong>{receipt.buyerEmail ?? 'your email'}</strong>. Keep it — it works any time you need the
            file again.
          </span>
        </p>
      )}
      {!inactive && (
        <dl className="lp-receipt">
          <dt>Order</dt>
          <dd>#{receipt.orderNumber}</dd>
          <dt>Paid</dt>
          <dd>{money(receipt.amountCents, receipt.currency)}</dd>
          {receipt.creator.supportEmail && (
            <>
              <dt>Questions?</dt>
              <dd>{receipt.creator.supportEmail}</dd>
            </>
          )}
        </dl>
      )}
      <Link className="lp__cta" to={`/p/${creatorSlug}/${pageSlug}`}>
        Back to {receipt.creator.name}
      </Link>
    </CreatorResultPage>
  )
}
