import { brandStyle } from '../lib/brand-color'
import { monogram } from '../lib/format'
import { Avatar } from './ledger'

/**
 * A campaign email as the recipient sees it, in the creator's brand colour — the prototype's `emailPreview()`.
 * `button` shows the call-to-action; `body` is split into paragraphs at blank lines.
 */
export function EmailPreview({
  brandName,
  supportEmail,
  brandColor,
  subject,
  body,
  button,
  device = 'desktop',
}: {
  brandName: string
  supportEmail: string
  brandColor: string
  subject: string
  body: string
  button?: { label: string }
  device?: 'desktop' | 'mobile'
}) {
  const paragraphs = body.split(/\n{2,}/)
  return (
    <div className={`email-preview email-preview--${device}`} style={brandStyle(brandColor)}>
      <div className="email-preview__meta">
        <Avatar size="sm" className="email-preview__from-mark">
          {monogram(brandName)}
        </Avatar>
        <div className="email-preview__from">
          <strong>{brandName}</strong>
          {supportEmail && <span className="text-muted"> &lt;{supportEmail}&gt;</span>}
          <span className="email-preview__subject">{subject || 'No subject yet'}</span>
        </div>
      </div>
      <div className="email-preview__paper">
        <p className="email-preview__brand">{brandName}</p>
        <div className="email-preview__body">
          {paragraphs.map((paragraph, index) => (
            <p key={index}>{paragraph}</p>
          ))}
        </div>
        <p className="email-preview__button-row" hidden={!button}>
          <span className="email-preview__button">{button?.label}</span>
        </p>
        <p className="email-preview__footer">
          You’re receiving this because you joined {brandName}. <u>Unsubscribe</u>
          <br />
          Sent with Luma
        </p>
      </div>
    </div>
  )
}
