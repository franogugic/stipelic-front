import { useMemo } from 'react'
import { Money } from '../../shared/ui/ledger'
import { useThemeStore } from '../../shared/model/theme-store'

const SWATCH_GROUPS = [
  { title: 'Surfaces', tokens: ['bg', 'canvas', 'surface', 'surface-2', 'surface-3', 'surface-inverse'] },
  { title: 'Text & lines', tokens: ['text', 'text-secondary', 'text-muted', 'text-disabled', 'border', 'border-strong'] },
  { title: 'Brand', tokens: ['primary', 'accent', 'accent-strong', 'accent-soft', 'feature-bg', 'focus'] },
  { title: 'Semantic', tokens: ['success', 'success-soft', 'warning', 'warning-soft', 'danger', 'danger-soft', 'info', 'info-soft'] },
  { title: 'Data visualisation', tokens: ['chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5', 'chart-6', 'chart-muted'], raw: true },
]

const SPACING = ['1', '2', '3', '4', '6', '8', '12', '16']
const RADII = ['xs', 'sm', 'md', 'lg', 'xl', 'pill']
const SHADOWS = ['xs', 'sm', 'md', 'lg']

/** Resolves any CSS colour to "#RRGGBB" through a canvas (rgba values stay in their own notation). */
function toHex(value: string) {
  const probe = document.createElement('canvas').getContext('2d')
  if (!probe) return value
  probe.fillStyle = value
  return probe.fillStyle.toUpperCase()
}

const swatchChip = (name: string) => ({ '--swatch': `var(${name})` }) as React.CSSProperties

export function FoundationsSections() {
  // Swatch values are read from the live CSS variables, so they follow the theme.
  const theme = useThemeStore((state) => state.theme)
  const values = useMemo(() => {
    const style = getComputedStyle(document.documentElement)
    return (name: string) => {
      const value = style.getPropertyValue(name).trim()
      return value.startsWith('#') ? value : toHex(value)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [theme])

  return (
    <>
      <section className="section" id="principles" aria-labelledby="principles-title">
        <div className="section__header">
          <h2 className="section-title" id="principles-title">
            Principles
          </h2>
        </div>
        <div className="grid grid--3">
          {[
            ['01', 'Calm, then confident', 'Warm paper neutrals and hairline borders keep a daily-use tool quiet. Emphasis is rare, so when it appears it means something.'],
            ['02', 'Money is typography', 'Revenue is set in an editorial serif with receding decimals — numbers read like a statement, not a spreadsheet.'],
            ['03', 'Volt is earned', 'The lime accent is reserved for money, publishing and progress. Everyday actions use ink, so the accent never becomes noise.'],
          ].map(([index, title, text]) => (
            <article className="card sg-principle" key={index}>
              <div className="card__body stack stack--sm">
                <span className="sg-principle__index">{index}</span>
                <h3 className="sg-principle__title">{title}</h3>
                <p className="text-secondary">{text}</p>
              </div>
            </article>
          ))}
        </div>
      </section>

      <section className="section" id="colour" aria-labelledby="colour-title">
        <div className="section__header">
          <div className="stack stack--xs">
            <h2 className="section-title" id="colour-title">
              Colour
            </h2>
            <p>Values are read from the live CSS variables of the current theme. All text pairs meet WCAG AA in both themes.</p>
          </div>
        </div>
        <div className="stack stack--lg">
          {SWATCH_GROUPS.map((group) => (
            <div className="stack stack--md" key={group.title}>
              <h3 className="eyebrow">{group.title}</h3>
              <ul className="sg-swatches" role="list">
                {group.tokens.map((token) => {
                  const name = group.raw ? `--${token}` : `--color-${token}`
                  return (
                    <li className="sg-swatch" key={token}>
                      <span className="sg-swatch__chip" style={swatchChip(name)} />
                      <span className="sg-swatch__name mono">{name}</span>
                      <span className="sg-swatch__value mono">{values(name)}</span>
                    </li>
                  )
                })}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="section" id="type" aria-labelledby="type-title">
        <div className="section__header">
          <div className="stack stack--xs">
            <h2 className="section-title" id="type-title">
              Typography
            </h2>
            <p>Instrument Serif for statements and money, Geist for interface, Geist Mono for technical strings.</p>
          </div>
        </div>
        <div className="card">
          <div className="card__body--flush sg-type">
            <div className="sg-type__row">
              <span className="sg-type__meta">Display XL · 72 · Instrument Serif</span>
              <p className="display sg-type__display-xl">
                <Money amountCents={468500} />
              </p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Display MD · 40 · page titles</span>
              <p className="page-title">
                Good morning, <em>Marko</em>
              </p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Display SM · 28 · metrics, modal titles</span>
              <p className="display sg-type__display-sm">1,248 subscribers</p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Title · 18 / 600 · Geist</span>
              <p className="section-title">Revenue by product</p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Body · 14 / 400 · Geist</span>
              <p>Your page is live. Share the link anywhere — visitors can buy with a card in under a minute.</p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Small · 13 / 12</span>
              <p className="text-sm text-secondary">
                Last updated 14 Jul 2026, 09:30 · <span className="text-xs text-muted">Resets on 1 Oct 2026</span>
              </p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Eyebrow · 12 / 500 · caps</span>
              <p className="eyebrow">Audience</p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Mono · Geist Mono</span>
              <p className="mono">RS35 2600 0560 1001 6113 79 · TRX-20260901-4471</p>
            </div>
            <div className="sg-type__row">
              <span className="sg-type__meta">Highlight mark</span>
              <p className="section-title">
                Revenue is up <span className="mark">+18.4%</span> this month
              </p>
            </div>
          </div>
        </div>
      </section>

      <section className="section" id="shape" aria-labelledby="shape-title">
        <div className="section__header">
          <div className="stack stack--xs">
            <h2 className="section-title" id="shape-title">
              Space &amp; shape
            </h2>
            <p>A 4px grid. Radii grow with the size of the surface; elevation stays soft and warm.</p>
          </div>
        </div>
        <div className="grid grid--3 grid--gap-lg">
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Spacing</h3>
            </div>
            <div className="card__body">
              <ul className="sg-spacing" role="list">
                {SPACING.map((step) => (
                  <li className="sg-spacing__item" key={step}>
                    <span className="mono text-xs text-muted">space-{step}</span>
                    <span className="sg-spacing__bar" style={{ '--size': `var(--space-${step})` } as React.CSSProperties} />
                    <span className="mono text-xs">{Number(step) * 4}px</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Radius</h3>
            </div>
            <div className="card__body">
              <div className="sg-radii">
                {RADII.map((radius) => (
                  <div className="sg-radius" key={radius}>
                    <span className="sg-radius__box" style={{ '--radius': `var(--radius-${radius})` } as React.CSSProperties} />
                    <span className="mono text-xs text-muted">{radius}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="card">
            <div className="card__header">
              <h3 className="card__title">Elevation</h3>
            </div>
            <div className="card__body">
              <div className="sg-shadows">
                {SHADOWS.map((shadow) => (
                  <div className="sg-shadow" key={shadow} style={{ '--shadow': `var(--shadow-${shadow})` } as React.CSSProperties}>
                    <span className="mono text-xs text-muted">shadow-{shadow}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
