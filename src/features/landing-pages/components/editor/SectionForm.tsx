import { Image, Info, Lock, MousePointerClick, Package, Plus } from 'lucide-react'
import { useId, useRef } from 'react'
import type { CSSProperties } from 'react'
import { Link } from 'react-router-dom'
import { useImageUpload } from '../../../../shared/lib/use-image-upload'
import { money } from '../../../../shared/lib/format'
import { Badge, Card, CardBody, EmptyState, Field, Menu, Select, Uploader } from '../../../../shared/ui/ledger'
import type { DraftAction, DraftSection } from '../../model/editor-draft'
import { isMovable } from '../../model/editor-draft'
import { sectionMenuItems } from './section-menu'
import { CONTENT_LIMITS, hrefTarget, sectionHref } from '../../model/section-content'
import type {
  CtaContent,
  FaqContent,
  FeaturesContent,
  FooterContent,
  HeroContent,
  NavbarContent,
  ProductDetailsContent,
  TestimonialsContent,
} from '../../model/section-content'
import { SECTION_BACKGROUNDS, kindOf, variantsOf } from '../../model/section-library'
import type { LandingPageType, SectionTemplate } from '../../model/types'
import { Wireframe } from '../Wireframe'
import { AltTextField, FormGroup, NoteAlert, Repeater, TextField } from './fields'
import { GalleryField } from './GalleryField'

/** What the forms need to know about the page around the section. */
export type EditorPageContext = {
  slug: string
  pageType: LandingPageType
  product: { publicId: string | null; name: string; priceCents: number; currency: string } | null
  hasLogo: boolean
  sections: DraftSection[]
  templates: SectionTemplate[]
}

function VariantPicker({ section, templates, onChange }: { section: DraftSection; templates: SectionTemplate[]; onChange: (variant: string) => void }) {
  const name = useId()
  const kind = kindOf(section.type)
  return (
    <FormGroup legend="Layout">
      <div className="variant-picker">
        {variantsOf(templates, section.type).map((template) => (
          <label className="variant-picker__option" key={template.variant}>
            <input
              type="radio"
              name={name}
              value={template.variant}
              checked={template.variant === section.variant}
              onChange={() => onChange(template.variant)}
            />
            <span className="variant-picker__card">
              <Wireframe slug={kind.slug} variant={template.variant} />
              <span className="variant-picker__name">{template.name}</span>
            </span>
          </label>
        ))}
      </div>
    </FormGroup>
  )
}

function BackgroundPicker({ value, onChange }: { value: string | null; onChange: (background: string | null) => void }) {
  const name = useId()
  const colorRef = useRef<HTMLInputElement>(null)
  const current = value ?? ''
  const custom = current !== '' && !SECTION_BACKGROUNDS.some((option) => option.value.toLowerCase() === current.toLowerCase())
  const openPicker = () => {
    const input = colorRef.current
    if (!input) return
    if (typeof input.showPicker === 'function') input.showPicker()
    else input.click()
  }
  return (
    <FormGroup legend="Background" hint="Text colour adjusts automatically so it stays readable.">
      <div className="swatches" role="radiogroup" aria-label="Section background">
        {SECTION_BACKGROUNDS.map((option) => (
          <label className="swatches__option" data-tooltip={option.label} key={option.value || 'none'}>
            <input
              type="radio"
              name={name}
              value={option.value}
              aria-label={option.label}
              checked={option.value.toLowerCase() === current.toLowerCase()}
              onChange={() => onChange(option.value || null)}
            />
            <span
              className={`swatches__chip ${option.value ? '' : 'swatches__chip--none'}`}
              style={option.value ? ({ '--swatch': option.value } as CSSProperties) : undefined}
            />
          </label>
        ))}
        <label className="swatches__option" data-tooltip="Custom colour">
          <input type="radio" name={name} value="custom" aria-label="Custom colour" checked={custom} onChange={openPicker} onClick={custom ? openPicker : undefined} />
          <span className="swatches__chip swatches__chip--custom" style={custom ? ({ '--swatch': current } as CSSProperties) : undefined}>
            {!custom && <Plus />}
          </span>
        </label>
        <input
          ref={colorRef}
          className="sr-only"
          type="color"
          tabIndex={-1}
          aria-hidden="true"
          value={custom ? current : '#F3ECE2'}
          onChange={(event) => onChange(event.target.value.toUpperCase())}
        />
      </div>
    </FormGroup>
  )
}

/** An image upload for the hero / product image (plus its alt text). */
function ImageGroup({
  slug,
  label,
  aspect,
  purpose,
  url,
  alt,
  onChange,
}: {
  slug: string
  label: string
  aspect: 'wide' | 'square'
  purpose: 'LandingPageHero' | 'LandingPageProductImage'
  url: string | null
  alt: string
  onChange: (image: { url: string | null; alt: string }) => void
}) {
  const upload = useImageUpload({ slug, purpose, onUploaded: (uploaded) => onChange({ url: uploaded, alt }) })
  return (
    <FormGroup legend="Image">
      <Uploader
        label={label}
        aspect={aspect}
        value={url}
        fileName={upload.fileName}
        uploading={upload.uploading}
        progress={upload.progress}
        error={upload.error}
        onSelect={(file) => void upload.upload(file)}
        onRemove={() => {
          upload.clearError()
          onChange({ url: null, alt: '' })
        }}
      />
      <AltTextField value={alt} onChange={(next) => onChange({ url, alt: next })} />
    </FormGroup>
  )
}

function NavbarForm({ content, onChange, ctx }: { content: NavbarContent; onChange: (content: NavbarContent) => void; ctx: EditorPageContext }) {
  const targets = ctx.sections.filter(isMovable)
  return (
    <>
      <TextField
        label="Brand name"
        value={content.brandName}
        maxLength={60}
        hint="Shown next to your logo, or on its own if you have no logo."
        onChange={(brandName) => onChange({ ...content, brandName })}
      />
      <NoteAlert icon={Image} title={ctx.hasLogo ? 'Your logo is used automatically' : 'No logo yet — your brand name is shown'}>
        <p>
          Logo and brand colour come from{' '}
          <Link className="link" to={`/app/${ctx.slug}/settings?tab=brand`}>
            Settings → Brand
          </Link>{' '}
          and apply to all your pages.
        </p>
      </NoteAlert>
      <FormGroup legend="Links" hint="Links scroll to a section on this page.">
        <Repeater
          noun="link"
          items={content.links}
          max={CONTENT_LIMITS.navLinks}
          summary={(link) => link.label}
          createItem={() => ({ label: '', href: targets[0] ? sectionHref(targets[0].key) : '' })}
          onChange={(links) => onChange({ ...content, links })}
          renderFields={(link, update) => (
            <>
              <TextField label="Label" value={link.label} maxLength={40} onChange={(label) => update({ ...link, label })} />
              <Field label="Goes to">
                {(control) => (
                  <Select {...control} value={hrefTarget(link.href)} onChange={(event) => update({ ...link, href: sectionHref(event.target.value) })}>
                    {!targets.some((target) => target.key === hrefTarget(link.href)) && <option value="">Choose a section</option>}
                    {targets.map((target) => (
                      <option value={target.key} key={target.key}>
                        {kindOf(target.type).name} section
                      </option>
                    ))}
                  </Select>
                )}
              </Field>
            </>
          )}
        />
      </FormGroup>
    </>
  )
}

function HeroForm({ section, content, onChange, ctx }: { section: DraftSection; content: HeroContent; onChange: (content: HeroContent) => void; ctx: EditorPageContext }) {
  return (
    <>
      <TextField
        label="Headline"
        value={content.heading}
        maxLength={140}
        hint="Wrap words in *asterisks* to set them in your brand colour."
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <TextField label="Subheadline" rows={3} value={content.subheading} maxLength={400} onChange={(subheading) => onChange({ ...content, subheading })} />
      <TextField
        label="Button text"
        value={content.ctaText}
        maxLength={40}
        hint={ctx.pageType === 'Sales' ? `Opens checkout for ${ctx.product?.name ?? 'your product'}.` : 'Submits the email form.'}
        onChange={(ctaText) => onChange({ ...content, ctaText })}
      />
      {section.variant === 'split' ? (
        <ImageGroup
          slug={ctx.slug}
          label="Hero image"
          aspect="wide"
          purpose="LandingPageHero"
          url={content.imageUrl}
          alt={content.imageAlt}
          onChange={({ url, alt }) => onChange({ ...content, imageUrl: url, imageAlt: alt })}
        />
      ) : (
        <NoteAlert icon={Info}>The Centered layout has no image. Switch to “Split with image” to add one.</NoteAlert>
      )}
    </>
  )
}

function FeaturesForm({ content, onChange }: { content: FeaturesContent; onChange: (content: FeaturesContent) => void }) {
  return (
    <>
      <TextField label="Heading" value={content.heading} maxLength={140} onChange={(heading) => onChange({ ...content, heading })} />
      <FormGroup legend="Features">
        <Repeater
          noun="feature"
          items={content.items}
          max={CONTENT_LIMITS.features}
          summary={(item) => item.title}
          createItem={() => ({ title: '', description: '' })}
          onChange={(items) => onChange({ ...content, items })}
          renderFields={(item, update) => (
            <>
              <TextField label="Title" value={item.title} maxLength={80} onChange={(title) => update({ ...item, title })} />
              <TextField label="Description" rows={2} value={item.description} maxLength={300} onChange={(description) => update({ ...item, description })} />
            </>
          )}
        />
      </FormGroup>
    </>
  )
}

function ProductForm({ content, onChange, ctx }: { content: ProductDetailsContent; onChange: (content: ProductDetailsContent) => void; ctx: EditorPageContext }) {
  const price = ctx.product ? money(ctx.product.priceCents, ctx.product.currency) : null
  return (
    <>
      {ctx.product && (
        <NoteAlert icon={Package} title={`${ctx.product.name} · ${price}`}>
          <p>
            The product linked to this page. Name and price come from{' '}
            {ctx.product.publicId ? (
              <Link className="link" to={`/app/${ctx.slug}/products/${ctx.product.publicId}/edit`}>
                the product
              </Link>
            ) : (
              'the product'
            )}
            .
          </p>
        </NoteAlert>
      )}
      <TextField label="Heading" value={content.heading} maxLength={140} onChange={(heading) => onChange({ ...content, heading })} />
      <TextField label="Description" rows={3} value={content.description} maxLength={600} onChange={(description) => onChange({ ...content, description })} />
      <label className="switch-row">
        <span className="switch-row__text">
          <span className="switch-row__label">Show price</span>
          <span className="switch-row__hint">{price ? `Shows ${price} with a buy button.` : 'Shows the price with a buy button.'}</span>
        </span>
        <input className="switch" type="checkbox" role="switch" checked={content.showPrice} onChange={(event) => onChange({ ...content, showPrice: event.target.checked })} />
      </label>
      <FormGroup legend="Benefits">
        <Repeater
          noun="benefit"
          items={content.bullets}
          max={CONTENT_LIMITS.bullets}
          defaultOpen={-1}
          summary={(bullet) => bullet}
          createItem={() => ''}
          onChange={(bullets) => onChange({ ...content, bullets })}
          renderFields={(bullet, update) => <TextField label="Benefit" value={bullet} maxLength={120} onChange={update} />}
        />
      </FormGroup>
      <ImageGroup
        slug={ctx.slug}
        label="Product image"
        aspect="square"
        purpose="LandingPageProductImage"
        url={content.imageUrl}
        alt={content.imageAlt}
        onChange={({ url, alt }) => onChange({ ...content, imageUrl: url, imageAlt: alt })}
      />
    </>
  )
}

function TestimonialsForm({ content, onChange }: { content: TestimonialsContent; onChange: (content: TestimonialsContent) => void }) {
  return (
    <>
      <TextField label="Heading" optional value={content.heading} maxLength={140} onChange={(heading) => onChange({ ...content, heading })} />
      <FormGroup legend="Quotes">
        <Repeater
          noun="quote"
          items={content.items}
          max={CONTENT_LIMITS.quotes}
          summary={(item) => (item.author || item.quote ? `${item.author} — “${item.quote}”` : '')}
          createItem={() => ({ quote: '', author: '', role: '' })}
          onChange={(items) => onChange({ ...content, items })}
          renderFields={(item, update) => (
            <>
              <TextField label="Quote" rows={3} value={item.quote} maxLength={400} onChange={(quote) => update({ ...item, quote })} />
              <div className="form-row">
                <TextField label="Author" value={item.author} maxLength={60} onChange={(author) => update({ ...item, author })} />
                <TextField label="Role" optional value={item.role} maxLength={60} onChange={(role) => update({ ...item, role })} />
              </div>
            </>
          )}
        />
      </FormGroup>
    </>
  )
}

function FaqForm({ content, onChange }: { content: FaqContent; onChange: (content: FaqContent) => void }) {
  return (
    <>
      <TextField label="Heading" value={content.heading} maxLength={140} onChange={(heading) => onChange({ ...content, heading })} />
      <FormGroup legend="Questions">
        <Repeater
          noun="question"
          items={content.items}
          max={CONTENT_LIMITS.questions}
          summary={(item) => item.question}
          createItem={() => ({ question: '', answer: '' })}
          onChange={(items) => onChange({ ...content, items })}
          renderFields={(item, update) => (
            <>
              <TextField label="Question" value={item.question} maxLength={160} onChange={(question) => update({ ...item, question })} />
              <TextField label="Answer" rows={3} value={item.answer} maxLength={800} onChange={(answer) => update({ ...item, answer })} />
            </>
          )}
        />
      </FormGroup>
    </>
  )
}

function CtaForm({ content, onChange }: { content: CtaContent; onChange: (content: CtaContent) => void }) {
  return (
    <>
      <TextField
        label="Heading"
        value={content.heading}
        maxLength={140}
        hint="Wrap words in *asterisks* to highlight them."
        onChange={(heading) => onChange({ ...content, heading })}
      />
      <TextField label="Subheading" optional value={content.subheading} maxLength={200} onChange={(subheading) => onChange({ ...content, subheading })} />
      <TextField label="Button text" value={content.buttonText} maxLength={40} onChange={(buttonText) => onChange({ ...content, buttonText })} />
    </>
  )
}

function FooterForm({ content, onChange }: { content: FooterContent; onChange: (content: FooterContent) => void }) {
  return (
    <TextField
      label="Copyright"
      value={content.copyright}
      maxLength={120}
      hint="“Made with Luma” is shown next to it."
      onChange={(copyright) => onChange({ copyright })}
    />
  )
}

function ContentForm({ section, ctx, dispatch }: { section: DraftSection; ctx: EditorPageContext; dispatch: (action: DraftAction) => void }) {
  const set = (content: DraftSection['content']) => dispatch({ type: 'content', key: section.key, content })
  switch (section.type) {
    case 'Navbar':
      return <NavbarForm content={section.content} onChange={set} ctx={ctx} />
    case 'Hero':
      return <HeroForm section={section} content={section.content} onChange={set} ctx={ctx} />
    case 'Features':
      return <FeaturesForm content={section.content} onChange={set} />
    case 'ProductDetails':
      return <ProductForm content={section.content} onChange={set} ctx={ctx} />
    case 'Testimonials':
      return <TestimonialsForm content={section.content} onChange={set} />
    case 'Faq':
      return <FaqForm content={section.content} onChange={set} />
    case 'Gallery':
      return (
        <>
          <TextField label="Heading" value={section.content.heading} maxLength={140} onChange={(heading) => set({ ...section.content, heading })} />
          <GalleryField
            slug={ctx.slug}
            content={section.content}
            onChange={set}
            onImageUploaded={(url) =>
              dispatch({
                type: 'edit',
                key: section.key,
                edit: (current) =>
                  current.type === 'Gallery'
                    ? { ...current, content: { ...current.content, imageUrls: [...current.content.imageUrls, url], imageAlts: [...current.content.imageAlts, ''] } }
                    : current,
              })
            }
          />
        </>
      )
    case 'Cta':
      return <CtaForm content={section.content} onChange={set} />
    case 'Footer':
      return <FooterForm content={section.content} onChange={set} />
  }
}

/** The "Editing" card for the selected section: layout, its content and its background. */
export function SectionForm({
  section,
  ctx,
  dispatch,
  onDelete,
}: {
  section: DraftSection
  ctx: EditorPageContext
  dispatch: (action: DraftAction) => void
  onDelete: (section: DraftSection) => void
}) {
  const kind = kindOf(section.type)
  const titleId = useId()
  const Icon = kind.icon
  return (
    <section className="card editor__form" aria-labelledby={titleId}>
      <div className="card__header">
        <div className="card__heading">
          <p className="eyebrow">Editing</p>
          <h2 className="card__title editor__form-title" id={titleId}>
            <Icon />
            {kind.name}
          </h2>
        </div>
        {kind.locked ? (
          <Badge tone="outline" icon={Lock}>
            Locked to the {kind.locked}
          </Badge>
        ) : (
          <Menu label={`Actions for ${kind.name}`} items={sectionMenuItems(section, ctx.sections, dispatch, onDelete)} />
        )}
      </div>
      <div className="card__body form">
        <VariantPicker section={section} templates={ctx.templates} onChange={(variant) => dispatch({ type: 'variant', key: section.key, variant })} />
        {/* Remount per section so repeaters and uploads start fresh. */}
        <ContentForm key={section.key} section={section} ctx={ctx} dispatch={dispatch} />
        <BackgroundPicker value={section.background} onChange={(background) => dispatch({ type: 'background', key: section.key, background })} />
      </div>
    </section>
  )
}

/** Shown when nothing is selected. */
export function NothingSelected() {
  return (
    <Card>
      <CardBody>
        <EmptyState
          compact
          icon={MousePointerClick}
          title="Nothing selected"
          text="Add a section, then select it to edit its content and colours."
        />
      </CardBody>
    </Card>
  )
}
