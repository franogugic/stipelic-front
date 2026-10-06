import { ArrowDown, Check, Menu, Plus } from 'lucide-react'
import { useState } from 'react'
import type { CSSProperties, ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { brandStyle } from '../../../shared/lib/brand-color'
import { money } from '../../../shared/lib/format'
import { rich } from '../lib/rich-text'
import { hrefTarget, sectionAnchor } from '../model/section-content'
import type {
  CtaContent,
  FaqContent,
  FeaturesContent,
  FooterContent,
  GalleryContent,
  HeroContent,
  NavbarContent,
  ProductDetailsContent,
  SectionContentMap,
  TestimonialsContent,
} from '../model/section-content'
import { kindOf } from '../model/section-library'
import type { LandingPageType, ProductType, SectionType } from '../model/types'

// The creator's landing page as the prototype draws it (`renderSection` / SECTION_RENDERERS): used by the public
// page and, inside a frame, by the editor's live preview. Buttons and forms come from the caller (`renderAction`)
// so the public page can wire checkout and sign-up while the preview stays inert.

export type LandingProduct = {
  name: string
  priceCents: number
  currency: string
  type: ProductType | null
}

export type LandingBrand = {
  name: string
  color: string
  logoUrl: string | null
}

export type ActionOptions = {
  /** The hero's action: the one that shows the page's request state (submitting, result, redirecting). */
  primary?: boolean
  /** On the brand-coloured CTA banner. */
  inverted?: boolean
}

export type LandingContext = {
  pageType: LandingPageType
  product: LandingProduct | null
  brand: LandingBrand
  /** The buy button (sales) or the email form (lead capture) with this label. */
  renderAction: (label: string, options?: ActionOptions) => ReactNode
  /** Editor preview only: the selected section's key, outlined. */
  selectedKey?: string | null
}

export type RenderedSection = {
  [T in SectionType]: {
    /** The section's public id, or a temporary id for one not saved yet. Its anchor is `s-{key}`. */
    key: string
    type: T
    variant: string
    background: string | null
    content: SectionContentMap[T]
  }
}[SectionType]

const PRODUCT_TYPE_LABELS: Record<ProductType, string> = {
  Digital: 'Digital download',
  Course: 'Online course',
  Service: 'Service',
}

const wholePrice = (product: LandingProduct) => money(product.priceCents, product.currency, { decimals: false })

/** Text colour on a section with its own background (`.lp-sec--on-light` / `--on-dark`). */
function sectionTone(background: string | null) {
  if (!background) return ''
  const [r, g, b] = [1, 3, 5].map((index) => {
    const value = parseInt(background.slice(index, index + 2), 16) / 255
    return value <= 0.03928 ? value / 12.92 : ((value + 0.055) / 1.055) ** 2.4
  })
  return 0.2126 * r + 0.7152 * g + 0.0722 * b > 0.4 ? 'lp-sec--on-light' : 'lp-sec--on-dark'
}

/** Stand-in when a product has no image: the brand colour carries the product name. */
function FallbackVisual({ product, shape = 'tall' }: { product: LandingProduct | null; shape?: 'tall' | 'square' }) {
  if (!product) return null
  return (
    <div className={`lp__visual lp__visual--fallback lp__visual--${shape}`} role="img" aria-label={product.name}>
      <span className="lp-fallback__type">{product.type ? PRODUCT_TYPE_LABELS[product.type] : 'Digital download'}</span>
      <span className="lp-fallback__name">{product.name}</span>
      <span className="lp-fallback__price">{wholePrice(product)}</span>
    </div>
  )
}

function NavbarSection({ variant, content, ctx }: { variant: string; content: NavbarContent; ctx: LandingContext }) {
  const [open, setOpen] = useState(false)
  const links = content.links.filter((link) => link.label.trim() && hrefTarget(link.href))
  const brandName = content.brandName || ctx.brand.name
  return (
    <nav className={`lp-nav lp-nav--${variant} ${open ? 'is-open' : ''}`} aria-label={brandName}>
      <a className="lp-nav__brand" href="#">
        {ctx.brand.logoUrl && <img className="lp-logo-img" src={ctx.brand.logoUrl} alt="" />}
        <span className="lp__logo">{brandName}</span>
      </a>
      {links.length > 0 && (
        <>
          <ul className="lp-nav__links" role="list">
            {links.map((link, index) => (
              <li key={index}>
                <a href={link.href} onClick={() => setOpen(false)}>
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <button
            className="lp-nav__menu"
            type="button"
            aria-label={open ? 'Close menu' : 'Open menu'}
            aria-expanded={open}
            onClick={() => setOpen((value) => !value)}
          >
            <Menu aria-hidden="true" />
          </button>
        </>
      )}
    </nav>
  )
}

function HeroSection({ variant, content, ctx }: { variant: string; content: HeroContent; ctx: LandingContext }) {
  const split = variant === 'split'
  const sales = ctx.pageType === 'Sales'
  const eyebrow = sales && ctx.product ? `${ctx.product.name} · ${wholePrice(ctx.product)}` : 'Free guide · straight to your inbox'
  let visual: ReactNode = null
  if (split && !content.imageUrl) visual = <FallbackVisual product={ctx.product} />
  else if (split && content.imageUrl) {
    visual = (
      <div className="lp__visual">
        <img src={content.imageUrl} alt={content.imageAlt} />
        {sales && ctx.product && (
          <div className="lp__price-tag">
            <span className="lp-price-tag__label">Instant download</span>
            <span className="lp__logo">{wholePrice(ctx.product)}</span>
          </div>
        )}
      </div>
    )
  }
  return (
    <div className={`lp-hero lp-hero--${variant}`}>
      <div className="lp-hero__text">
        <p className="lp-eyebrow">{eyebrow}</p>
        <h1 className="lp__title">{rich(content.heading)}</h1>
        <p className="lp__sub">{content.subheading}</p>
        {ctx.renderAction(content.ctaText, { primary: true })}
      </div>
      {visual}
    </div>
  )
}

function FeaturesSection({ variant, content }: { variant: string; content: FeaturesContent }) {
  const numbered = variant === 'numbered'
  return (
    <div className="lp-wrap">
      <h2 className="lp__h2">{rich(content.heading)}</h2>
      <ul className={`lp-features lp-features--${variant}`} role="list">
        {content.items.map((item, index) => (
          <li className="lp-feature" key={index}>
            {numbered ? (
              <span className="lp-feature__num">{String(index + 1).padStart(2, '0')}</span>
            ) : (
              <span className="lp-feature__check">
                <Check aria-hidden="true" />
              </span>
            )}
            <div className="lp-feature__body">
              <h3 className="lp-feature__title">{item.title}</h3>
              <p className="lp-feature__text">{item.description}</p>
            </div>
          </li>
        ))}
      </ul>
    </div>
  )
}

function ProductSection({ variant, content, ctx }: { variant: string; content: ProductDetailsContent; ctx: LandingContext }) {
  const product = ctx.product
  const price =
    content.showPrice && product ? (
      <p className="lp-price">
        <span className="lp-price__amount">{money(product.priceCents, product.currency)}</span>
        <span className="lp-price__note">One-time payment · instant access</span>
      </p>
    ) : null
  const bullets = (
    <ul className="lp-bullets" role="list">
      {content.bullets.map((bullet, index) => (
        <li key={index}>
          <Check aria-hidden="true" />
          <span>{bullet}</span>
        </li>
      ))}
    </ul>
  )
  const label = ctx.pageType === 'Sales' && product ? `Buy now — ${wholePrice(product)}` : 'Get it free'
  const action = ctx.renderAction(label)
  const image = content.imageUrl

  if (variant === 'card') {
    return (
      <div className="lp-wrap lp-product lp-product--card">
        <div className="lp-product__text">
          <h2 className="lp__h2">{rich(content.heading)}</h2>
          <p className="lp__sub">{content.description}</p>
          {bullets}
        </div>
        <aside className="lp-price-card" aria-label="Price">
          {image && <img className="lp-price-card__img" src={image} alt={content.imageAlt} />}
          {product && <p className="lp-price-card__name">{product.name}</p>}
          {price}
          {action}
        </aside>
      </div>
    )
  }
  return (
    <div className="lp-wrap lp-product lp-product--image-left">
      {image ? <img className="lp-product__img" src={image} alt={content.imageAlt} /> : <FallbackVisual product={product} shape="square" />}
      <div className="lp-product__text">
        <h2 className="lp__h2">{rich(content.heading)}</h2>
        <p className="lp__sub">{content.description}</p>
        {bullets}
        {price}
        {action}
      </div>
    </div>
  )
}

function TestimonialsSection({ variant, content }: { variant: string; content: TestimonialsContent }) {
  if (variant === 'single') {
    const [quote] = content.items
    if (!quote) return null
    return (
      <figure className="lp-wrap lp-quote-single">
        <span className="lp-quote-single__mark" aria-hidden="true">
          “
        </span>
        <blockquote>{quote.quote}</blockquote>
        <figcaption>
          <strong>{quote.author}</strong>
          {quote.role && ` · ${quote.role}`}
        </figcaption>
      </figure>
    )
  }
  return (
    <div className="lp-wrap">
      {content.heading && <h2 className="lp__h2">{rich(content.heading)}</h2>}
      <div className="lp-quotes">
        {content.items.map((quote, index) => (
          <figure className="lp-quote" key={index}>
            <blockquote className="lp__logo">“{quote.quote}”</blockquote>
            <figcaption>
              {quote.author}
              {quote.role && ` · ${quote.role}`}
            </figcaption>
          </figure>
        ))}
      </div>
    </div>
  )
}

function FaqSection({ variant, content }: { variant: string; content: FaqContent }) {
  return (
    <div className={`lp-wrap ${variant === 'columns' ? 'lp-faq-columns' : ''}`}>
      <h2 className="lp__h2">{rich(content.heading)}</h2>
      <div className="lp-faq">
        {content.items.map((item, index) => (
          <details key={index} open={index === 0}>
            <summary>
              {item.question}
              <Plus aria-hidden="true" />
            </summary>
            <p>{item.answer}</p>
          </details>
        ))}
      </div>
    </div>
  )
}

function GallerySection({ variant, content }: { variant: string; content: GalleryContent }) {
  return (
    <div className="lp-wrap">
      <h2 className="lp__h2">{rich(content.heading)}</h2>
      <ul className={`lp-gallery lp-gallery--${variant}`} role="list">
        {content.imageUrls.map((url, index) => (
          <li key={`${url}-${index}`}>
            <img src={url} alt={content.imageAlts[index] ?? ''} loading="lazy" />
          </li>
        ))}
      </ul>
    </div>
  )
}

function CtaSection({ variant, content, ctx }: { variant: string; content: CtaContent; ctx: LandingContext }) {
  return (
    <div className={`lp-wrap lp-cta lp-cta--${variant}`}>
      <h2 className="lp__h2">{rich(content.heading)}</h2>
      {content.subheading && <p className="lp__sub">{content.subheading}</p>}
      {ctx.renderAction(content.buttonText, { inverted: variant === 'banner' })}
    </div>
  )
}

function FooterSection({ variant, content }: { variant: string; content: FooterContent }) {
  return (
    <div className={`lp-footer lp-footer--${variant}`}>
      <span>{content.copyright}</span>
      <Link className="lp-footer__credit" to="/">
        Made with Luma
      </Link>
    </div>
  )
}

function SectionBody({ section, ctx }: { section: RenderedSection; ctx: LandingContext }) {
  switch (section.type) {
    case 'Navbar':
      return <NavbarSection variant={section.variant} content={section.content} ctx={ctx} />
    case 'Hero':
      return <HeroSection variant={section.variant} content={section.content} ctx={ctx} />
    case 'Features':
      return <FeaturesSection variant={section.variant} content={section.content} />
    case 'ProductDetails':
      return <ProductSection variant={section.variant} content={section.content} ctx={ctx} />
    case 'Testimonials':
      return <TestimonialsSection variant={section.variant} content={section.content} />
    case 'Faq':
      return <FaqSection variant={section.variant} content={section.content} />
    case 'Gallery':
      return <GallerySection variant={section.variant} content={section.content} />
    case 'Cta':
      return <CtaSection variant={section.variant} content={section.content} ctx={ctx} />
    case 'Footer':
      return <FooterSection variant={section.variant} content={section.content} />
  }
}

export function LandingSection({ section, ctx, editor }: { section: RenderedSection; ctx: LandingContext; editor?: boolean }) {
  const kind = kindOf(section.type)
  const Tag = section.type === 'Navbar' ? 'header' : section.type === 'Footer' ? 'footer' : 'section'
  const classes = [
    'lp-sec',
    `lp-sec--${kind.slug}`,
    `lp-sec--${kind.slug}-${section.variant}`,
    sectionTone(section.background),
    ctx.selectedKey === section.key && 'is-selected',
  ]
  return (
    <Tag
      className={classes.filter(Boolean).join(' ')}
      id={sectionAnchor(section.key)}
      data-section-label={editor ? kind.name : undefined}
      style={section.background ? ({ '--sec-bg': section.background } as CSSProperties) : undefined}
    >
      <SectionBody section={section} ctx={ctx} />
    </Tag>
  )
}

/** The page shell: `.lp.lp--adaptive` with the creator's brand colours. */
export function LandingShell({
  brandColor,
  editor,
  inert,
  children,
}: {
  brandColor: string
  editor?: boolean
  /** The editor preview: shown, never clicked or focused. */
  inert?: boolean
  children: ReactNode
}) {
  return (
    <div className={`lp lp--adaptive ${editor ? 'lp--editor' : ''}`} style={brandStyle(brandColor)} inert={inert}>
      {children}
    </div>
  )
}

/** The drop marker shown in the preview while a section is being dragged in the list. */
export function LandingDropMarker({ label }: { label: string }) {
  return (
    <div className="lp-drop" aria-hidden="true">
      <ArrowDown />
      <span>{label}</span>
    </div>
  )
}
