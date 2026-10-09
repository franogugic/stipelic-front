import { Copy, CreditCard, ExternalLink, EyeOff, Gauge, Info, Landmark, Layers, Rocket, TriangleAlert } from 'lucide-react'
import { useId } from 'react'
import { Badge, Button, ConfirmDialog, InputAddon, InputGroup, Meter, Modal, useToast } from '../../../../shared/ui/ledger'
import { SECTION_KINDS, SINGLE_TYPES, variantsOf } from '../../model/section-library'
import type { LandingPageType, SectionTemplate, SectionType } from '../../model/types'
import { Wireframe } from '../Wireframe'

/** "Add a section": every type with its layouts. Types a page has only once are disabled when present. */
export function SectionPickerModal({
  open,
  onClose,
  templates,
  presentTypes,
  onPick,
}: {
  open: boolean
  onClose: () => void
  templates: SectionTemplate[]
  presentTypes: SectionType[]
  onPick: (template: SectionTemplate) => void
}) {
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Add a section"
      description="Pick a type and a starting layout. You can change the words, images and colours after adding it."
      icon={Layers}
      tone="accent"
      size="xl"
      actions={
        <Button variant="secondary" onClick={onClose}>
          Cancel
        </Button>
      }
    >
      <div className="picker">
        {SECTION_KINDS.map((kind) => {
          const onPage = SINGLE_TYPES.includes(kind.type) && presentTypes.includes(kind.type)
          const Icon = kind.icon
          const headingId = `picker-${kind.slug}`
          return (
            <section className={`picker__type ${onPage ? 'is-disabled' : ''}`} aria-labelledby={headingId} key={kind.type}>
              <div className="picker__head">
                <span className="picker__icon">
                  <Icon />
                </span>
                <div className="picker__text">
                  <h3 className="picker__name" id={headingId}>
                    {kind.name}
                  </h3>
                  <p className="picker__desc">{kind.description}</p>
                </div>
                {onPage && <Badge tone="outline">On page</Badge>}
              </div>
              <div className="picker__variants">
                {variantsOf(templates, kind.type).map((template) => (
                  <button
                    className="picker__variant"
                    type="button"
                    disabled={onPage}
                    aria-label={`Add ${kind.name}, ${template.name} layout`}
                    key={template.variant}
                    onClick={() => onPick(template)}
                  >
                    <Wireframe slug={kind.slug} variant={template.variant} />
                    <span className="picker__variant-name">{template.name}</span>
                  </button>
                ))}
              </div>
            </section>
          )
        })}
      </div>
    </Modal>
  )
}

/** Why publishing was refused, from the API's 409 code. */
export type PublishBlock =
  | { code: 'SUBSCRIPTION_INACTIVE' }
  | { code: 'PAYOUTS_NOT_READY' }
  | { code: 'PLAN_LIMIT_REACHED'; used: number; limit: number }

export function PublishBlockedModal({
  block,
  slug,
  planName,
  onClose,
}: {
  block: PublishBlock | null
  slug: string
  planName: string | null
  onClose: () => void
}) {
  const plan = planName ? `the ${planName} plan` : 'your plan'
  const content = (() => {
    switch (block?.code) {
      case 'SUBSCRIPTION_INACTIVE':
        return {
          title: 'Publishing is paused',
          description: `Your workspace is waiting for payment for ${plan}. Your changes are saved — pay to put this page live.`,
          icon: CreditCard,
          body: null,
          actions: (
            <>
              <Button variant="secondary" onClick={onClose}>
                Not now
              </Button>
              <Button variant="primary" to={`/app/${slug}/settings?tab=billing`}>
                Complete payment
              </Button>
            </>
          ),
        }
      case 'PAYOUTS_NOT_READY':
        return {
          title: 'Set up payouts first',
          description:
            'This is a sales page, so it takes real payments. Tell us where to send your money before it goes live — it takes about five minutes.',
          icon: Landmark,
          body: <p className="text-sm text-secondary">Lead capture pages can be published without payouts.</p>,
          actions: (
            <>
              <Button variant="secondary" onClick={onClose}>
                Not now
              </Button>
              <Button variant="primary" to={`/app/${slug}/payouts`}>
                Set up payouts
              </Button>
            </>
          ),
        }
      case 'PLAN_LIMIT_REACHED':
        return {
          title: 'You’ve reached your page limit',
          description: `${planName ? `The ${planName} plan` : 'Your plan'} includes ${block.limit} ${block.limit === 1 ? 'page' : 'pages'} and you have ${block.used}. Drafts count too — archived pages don’t.`,
          icon: Gauge,
          body: (
            <div className="stack">
              <Meter label="Pages" used={block.used} limit={block.limit} />
              <p className="text-sm text-secondary">Archive a page you no longer need, or upgrade your plan for more pages.</p>
            </div>
          ),
          actions: (
            <>
              <Button variant="secondary" to={`/app/${slug}/landing-pages`}>
                Manage pages
              </Button>
              <Button variant="accent" to={`/app/${slug}/settings?tab=billing`}>
                Upgrade plan
              </Button>
            </>
          ),
        }
      default:
        return null
    }
  })()

  return (
    <Modal
      open={block !== null}
      onClose={onClose}
      title={content?.title ?? ''}
      description={content?.description}
      icon={content?.icon}
      tone="warning"
      size="sm"
      actions={content?.actions}
    >
      {content?.body}
    </Modal>
  )
}

/** After a publish: the live link to copy and share. */
export function PublishedModal({
  open,
  wasLive,
  pageType,
  url,
  onClose,
}: {
  open: boolean
  /** The page was already live: its changes went live. */
  wasLive: boolean
  pageType: LandingPageType
  url: string
  onClose: () => void
}) {
  const inputId = useId()
  const toast = useToast()
  const copy = async () => {
    try {
      await navigator.clipboard.writeText(url)
      toast({ title: 'Link copied' })
    } catch {
      toast({ tone: 'danger', title: 'Couldn’t copy the link', message: 'Select it and copy it yourself.' })
    }
  }
  return (
    <Modal
      open={open}
      onClose={onClose}
      title={wasLive ? 'Your changes are live' : 'Your page is live'}
      description={`Share the link anywhere — visitors can ${pageType === 'Sales' ? 'buy' : 'sign up'} straight away.`}
      icon={Rocket}
      tone="accent"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Back to editor
          </Button>
          <Button variant="primary" icon={ExternalLink} href={url} target="_blank" rel="noopener">
            View live page
          </Button>
        </>
      }
    >
      <div className="stack">
        <div className="field">
          <label className="field__label" htmlFor={inputId}>
            Page link
          </label>
          <InputGroup>
            <input className="input mono" id={inputId} type="text" value={url} readOnly />
            <InputAddon plain>
              <Button variant="ghost" size="sm" icon={Copy} onClick={() => void copy()}>
                Copy
              </Button>
            </InputAddon>
          </InputGroup>
        </div>
        <p className="text-sm text-secondary">
          <Info className="inline-icon" /> Link previews (title, description and image) are taken from this page.
        </p>
      </div>
    </Modal>
  )
}

export function LeaveModal({
  open,
  title,
  saving,
  onDiscard,
  onKeepEditing,
  onSaveAndLeave,
}: {
  open: boolean
  title: string
  saving: boolean
  onDiscard: () => void
  onKeepEditing: () => void
  onSaveAndLeave: () => void
}) {
  return (
    <Modal
      open={open}
      onClose={onKeepEditing}
      dismissible={!saving}
      title="Leave without saving?"
      description={`You have unsaved changes to “${title}”. If you leave now, they’ll be lost.`}
      icon={TriangleAlert}
      tone="warning"
      size="sm"
      actions={
        <>
          <Button variant="danger-ghost" disabled={saving} onClick={onDiscard}>
            Discard changes
          </Button>
          <Button variant="secondary" disabled={saving} onClick={onKeepEditing}>
            Keep editing
          </Button>
          <Button variant="primary" loading={saving} onClick={onSaveAndLeave}>
            Save and leave
          </Button>
        </>
      }
    />
  )
}

export function DeleteSectionDialog({
  sectionName,
  onConfirm,
  onCancel,
}: {
  sectionName: string | null
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ConfirmDialog
      open={sectionName !== null}
      title={`Delete the ${sectionName ?? ''} section?`}
      text="The section and everything in it is removed from this page. You can’t undo this once you save."
      confirmLabel="Delete section"
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}

export function UnpublishDialog({
  open,
  busy,
  onConfirm,
  onCancel,
}: {
  open: boolean
  busy: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  return (
    <ConfirmDialog
      open={open}
      busy={busy}
      title="Unpublish this page?"
      text="Visitors will see a “page not found” message until you publish it again. Your content stays saved."
      confirmLabel="Unpublish"
      tone="warning"
      icon={EyeOff}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
