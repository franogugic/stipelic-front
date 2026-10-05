import { money } from '../../../../shared/lib/format'
import { brandStyle } from '../../../../shared/lib/brand-color'
import { Card } from '../../../../shared/ui/ledger'
import { EmailPreview } from '../../../../shared/ui/EmailPreview'

/** "How visitors see it": a page header and an email with the brand being edited (the prototype's brandPreview()). */
export function BrandPreview({
  brandName,
  supportEmail,
  color,
  currency,
}: {
  brandName: string
  supportEmail: string
  color: string
  currency: string
}) {
  return (
    <Card title="How visitors see it" subtitle="Your page header and an email, with your current brand">
      <div className="brand-preview">
        <div className="lp lp--adaptive brand-preview__page" style={brandStyle(color)}>
          <div className="lp-nav lp-nav--simple">
            <span className="lp-nav__brand">
              <span className="lp__logo">{brandName}</span>
            </span>
            <span className="brand-preview__links">Presets · Gallery · FAQ</span>
          </div>
          <div className="brand-preview__hero">
            <p className="lp__title">
              Golden hour, <em>all summer</em> long.
            </p>
            <span className="lp__cta">Buy now — {money(2900, currency, { decimals: false })}</span>
          </div>
        </div>
        <EmailPreview
          brandName={brandName}
          supportEmail={supportEmail}
          brandColor={color}
          subject="September studio notes"
          body={'Hi,\n\nThree things from the studio this month.'}
          button={{ label: 'Read the notes' }}
        />
      </div>
    </Card>
  )
}
