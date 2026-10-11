import { Info, Pencil, Rocket, Wallet } from 'lucide-react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { Alert, Card, HBars, Money, Sparkline, StatusBadge, ThemeSwitch } from '../../../../shared/ui/ledger'
import { PALETTES } from '../../../../shared/lib/palette'
import { DEFAULT_PALETTE } from '../../../../shared/lib/palette'
import { usePaletteStore } from '../../../../shared/model/palette-store'

const PREVIEW_ROWS = [
  { label: 'Brand Identity Masterclass', value: 2533 },
  { label: 'Adriatic Summer Presets', value: 725 },
  { label: '1:1 Portfolio Review', value: 720 },
  { label: 'Photography Basics', value: 395 },
  { label: 'Freelance OS for Notion', value: 312 },
].map((row) => ({ ...row, display: `€${row.value.toLocaleString('en-US')}` }))

/** A stand-in dashboard that wears the current palette, so a pick is visible straight away. */
function PalettePreview() {
  return (
    <div className="palette-preview" aria-hidden="true">
      <article className="card card--feature palette-preview__hero">
        <div className="card__body stack stack--sm">
          <span className="metric__label">
            <Wallet />
            Total revenue
          </span>
          <span className="metric__value">
            <Money amountCents={468500} />
          </span>
          <Sparkline values={[320, 410, 380, 520, 470, 544, 610, 580, 690]} />
        </div>
      </article>
      <HBars rows={PREVIEW_ROWS} />
      <div className="cluster cluster--sm">
        <StatusBadge kind="order" value="paid" />
        <StatusBadge kind="order" value="pending" />
        <StatusBadge kind="order" value="failed" />
        <StatusBadge kind="campaign" value="scheduled" />
        <span className="badge badge--solid-accent">Pro</span>
      </div>
      <div className="cluster cluster--sm">
        <span className="btn btn--primary">
          <Pencil />
          <span>Edit page</span>
        </span>
        <span className="btn btn--accent">
          <Rocket />
          <span>Publish</span>
        </span>
      </div>
    </div>
  )
}

/** Settings → Appearance: the theme and the colour palette of the signed-in app (stored in this browser). */
export function AppearanceTab({ slug }: { slug: string }) {
  const palette = usePaletteStore((state) => state.palette)
  const setPalette = usePaletteStore((state) => state.setPalette)

  return (
    <div className="settings-grid settings-grid--appearance">
      <Card title="Appearance" subtitle="How Luma looks when you’re signed in">
        <div className="form">
          <fieldset className="form-group">
            <legend className="field__label">Theme</legend>
            <ThemeSwitch />
            <p className="field__hint">Also in the sidebar.</p>
          </fieldset>
          <fieldset className="form-group">
            <legend className="field__label">Colour palette</legend>
            <div className="palette-picker" role="radiogroup" aria-label="Colour palette">
              {PALETTES.map((option) => (
                <label className="palette-option" key={option.id}>
                  <input
                    className="palette-option__input"
                    type="radio"
                    name="palette"
                    value={option.id}
                    checked={option.id === palette.id}
                    onChange={() => setPalette(option)}
                  />
                  <span className="palette-option__swatch" style={{ '--ink': option.ink, '--accent': option.accent } as CSSProperties}>
                    <span className="palette-option__spark" />
                    <span className="palette-option__hues">
                      {[option.success, ...option.charts.slice(0, 4)].map((hue) => (
                        <i key={hue} style={{ '--hue': hue } as CSSProperties} />
                      ))}
                    </span>
                  </span>
                  <span className="palette-option__name">
                    {option.label}
                    {option.id === DEFAULT_PALETTE.id && <span className="text-muted"> · default</span>}
                  </span>
                  <span className="palette-option__mood">{option.mood}</span>
                </label>
              ))}
            </div>
            <p className="field__hint">
              Each palette sets the accent, the revenue card, chart and product colours, the colour for Paid and the tone of
              the background — in both themes. Text stays readable in all of them.
            </p>
          </fieldset>
          <Alert tone="info" icon={Info}>
            <p>
              Only you see this. Your landing pages and emails keep your brand colour — that’s under{' '}
              <Link className="link" to={`/app/${slug}/settings?tab=brand`}>
                Brand
              </Link>
              .
            </p>
          </Alert>
        </div>
      </Card>
      <Card title="Preview" subtitle="Changes as you pick">
        <PalettePreview />
      </Card>
    </div>
  )
}
