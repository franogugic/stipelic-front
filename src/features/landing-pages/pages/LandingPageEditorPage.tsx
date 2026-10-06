import {
  ArrowLeft,
  ArrowRight,
  Check,
  ExternalLink,
  Eye,
  EyeOff,
  Layers,
  LoaderCircle,
  Lock,
  Monitor,
  Pencil,
  Rocket,
  Save,
  Smartphone,
  X,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { useCallback, useEffect, useId, useLayoutEffect, useReducer, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { AppShell } from '../../../shared/ui/AppShell'
import { time } from '../../../shared/lib/format'
import { Button, ErrorState, PageHeader, SkeletonBlock, UrlPill, useToast } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { listProducts } from '../../products/api/products-api'
import { getLandingPage, getSectionTemplates, publishLandingPage, saveEditor, unpublishLandingPage } from '../api/landing-pages-api'
import { LandingDropMarker, LandingSection, LandingShell } from '../components/LandingSections'
import type { LandingContext, RenderedSection } from '../components/LandingSections'
import {
  DeleteSectionDialog,
  LeaveModal,
  PublishBlockedModal,
  PublishedModal,
  SectionPickerModal,
  UnpublishDialog,
} from '../components/editor/EditorDialogs'
import type { PublishBlock } from '../components/editor/EditorDialogs'
import { NothingSelected, SectionForm } from '../components/editor/SectionForm'
import type { EditorPageContext } from '../components/editor/SectionForm'
import { SectionsCard } from '../components/editor/SectionsCard'
import { useLeaveGuard } from '../lib/use-leave-guard'
import { draftReducer, emptyDraft, hasUnsavedLinkTargets, toSaveRequest } from '../model/editor-draft'
import type { Draft, DraftSection } from '../model/editor-draft'
import { useLandingPageStore } from '../model/landing-page-store'
import { DEFAULT_BRAND_COLOR, kindOf } from '../model/section-library'
import type { LandingPageWithSections, ProductType, SectionTemplate } from '../model/types'

type Load =
  | { status: 'loading' }
  | { status: 'error'; notFound: boolean }
  | { status: 'ready'; page: LandingPageWithSections; templates: SectionTemplate[] }

type Device = 'desktop' | 'mobile'
type Panel = 'sections' | 'edit' | 'preview'

/** A radio group of icon + label options (the prototype's `.segmented` with icons). */
function IconSegmented<T extends string>({
  label,
  name,
  className,
  options,
  value,
  onChange,
}: {
  label: string
  name: string
  className: string
  options: Array<{ value: T; label: string; icon: LucideIcon }>
  value: T
  onChange: (value: T) => void
}) {
  return (
    <div className={`segmented ${className}`} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const Icon = option.icon
        return (
          <label className="segmented__option" key={option.value}>
            <input type="radio" name={name} value={option.value} checked={option.value === value} onChange={() => onChange(option.value)} />
            <span className="segmented__label">
              <Icon />
              {option.label}
            </span>
          </label>
        )
      })}
    </div>
  )
}

function SaveStatus({ saving, dirty, savedAt }: { saving: boolean; dirty: boolean; savedAt: string | null }) {
  if (saving) {
    return (
      <span className="save-status save-status--saving" role="status">
        <LoaderCircle />
        Saving…
      </span>
    )
  }
  if (dirty) {
    return (
      <span className="save-status save-status--unsaved" role="status">
        <span className="save-status__dot" />
        Unsaved changes
      </span>
    )
  }
  return (
    <span className="save-status save-status--saved" role="status">
      <Check />
      {savedAt ? `Saved at ${time(savedAt)}` : 'Saved'}
    </span>
  )
}

const publishBlockOf = (error: unknown): PublishBlock | null => {
  if (!(error instanceof ApiError) || error.status !== 409) return null
  if (error.code === 'SUBSCRIPTION_INACTIVE' || error.code === 'PAYOUTS_NOT_READY') return { code: error.code }
  if (error.code === 'PLAN_LIMIT_REACHED') {
    const details = (error.details ?? {}) as { used?: number; limit?: number }
    return { code: 'PLAN_LIMIT_REACHED', used: details.used ?? 0, limit: details.limit ?? 0 }
  }
  return null
}

const titleWithEmphasis = (title: string) => {
  const words = title.trim().split(/\s+/)
  if (words.length < 2) return <em>{title}</em>
  return (
    <>
      {words.slice(0, -1).join(' ')} <em>{words[words.length - 1]}</em>
    </>
  )
}

export function LandingPageEditorPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  return (
    <AppShell slug={slug} activeSection="landing-pages" documentTitle="Editor · Luma">
      <EditorContent />
    </AppShell>
  )
}

function EditorContent() {
  const { slug = '', pageId = '' } = useParams<{ slug: string; pageId: string }>()
  const navigate = useNavigate()
  const toast = useToast()
  const deviceName = useId()

  const currentCreator = useCreatorStore((s) => s.currentCreator)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  const creatorSettings = useCreatorStore((s) => s.creatorSettings)
  const loadCreatorSettings = useCreatorStore((s) => s.loadCreatorSettings)
  const creator = currentCreator?.slug === slug ? currentCreator : null
  const settings = creatorSettings?.slug === slug ? creatorSettings : null

  const [load, setLoad] = useState<Load>({ status: 'loading' })
  const [productType, setProductType] = useState<ProductType | null>(null)
  const [draft, dispatch] = useReducer(draftReducer, emptyDraft)
  const draftRef = useRef<Draft>(draft)
  useEffect(() => {
    draftRef.current = draft
  })

  const [device, setDevice] = useState<Device>('desktop')
  const [panel, setPanel] = useState<Panel>('edit')
  const [saving, setSaving] = useState(false)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [publishing, setPublishing] = useState(false)
  const [unpublishing, setUnpublishing] = useState(false)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [deleteTarget, setDeleteTarget] = useState<DraftSection | null>(null)
  const [unpublishOpen, setUnpublishOpen] = useState(false)
  const [publishBlock, setPublishBlock] = useState<PublishBlock | null>(null)
  const [published, setPublished] = useState<{ wasLive: boolean } | null>(null)
  const [leaveTo, setLeaveTo] = useState<string | null>(null)
  const [dragTarget, setDragTarget] = useState<{ draggedKey: string; afterKey: string } | null>(null)

  const page = load.status === 'ready' ? load.page : null
  const templates = load.status === 'ready' ? load.templates : []

  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])

  useEffect(() => {
    if (slug) void loadCreatorSettings(slug)
  }, [slug, loadCreatorSettings])

  const loadPage = useCallback(async () => {
    setLoad({ status: 'loading' })
    try {
      const [loaded, loadedTemplates] = await Promise.all([getLandingPage(slug, pageId), getSectionTemplates(slug)])
      dispatch({ type: 'load', page: loaded })
      setSavedAt(loaded.updatedAt)
      setLoad({ status: 'ready', page: loaded, templates: loadedTemplates })
    } catch (error) {
      setLoad({ status: 'error', notFound: error instanceof ApiError && error.status === 404 })
    }
  }, [slug, pageId])

  useEffect(() => {
    // Reset and load whenever the address changes; the state updates happen after the request.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void loadPage()
  }, [loadPage])

  // The product's type labels the "no image" stand-in (Digital download / Online course / Service).
  const productPublicId = page?.productPublicId ?? null
  useEffect(() => {
    if (!productPublicId) return
    let cancelled = false
    listProducts(slug, true)
      .then((products) => {
        if (!cancelled) setProductType((products.find((product) => product.publicId === productPublicId)?.type as ProductType | undefined) ?? null)
      })
      .catch(() => {
        // Only the stand-in's label depends on it.
      })
    return () => {
      cancelled = true
    }
  }, [slug, productPublicId])

  const listUrl = `/app/${slug}/landing-pages`
  const leaveGuardActive = draft.dirty && !saving
  useLeaveGuard(leaveGuardActive, (path) => setLeaveTo(path))

  // Keep the landing pages list in step with what the editor changed.
  const patchListedPage = (patch: Partial<Pick<LandingPageWithSections, 'title' | 'status'>>) =>
    useLandingPageStore.setState((state) => ({
      pages: state.pages.map((listed) => (listed.publicId === pageId ? { ...listed, ...patch } : listed)),
    }))

  /** Saves the draft; resolves false when it failed (a toast says why). */
  const save = async (): Promise<boolean> => {
    if (!page) return false
    setSaving(true)
    try {
      let current = draftRef.current
      // Twice at most: a navbar link to a section added in this save points at it by the id the save gives it.
      for (let round = 0; round < 2; round += 1) {
        const { request, keys } = toSaveRequest(page, current.sections)
        const response = await saveEditor(slug, pageId, request)
        const saved = { type: 'saved' as const, page: response, keys, revision: current.revision }
        const linksNeededIds = hasUnsavedLinkTargets(current.sections)
        current = draftReducer(draftRef.current, saved)
        dispatch(saved)
        setSavedAt(response.updatedAt)
        setLoad((state) => (state.status === 'ready' ? { ...state, page: response } : state))
        if (!linksNeededIds) break
      }
      return true
    } catch (error) {
      toast({
        tone: 'danger',
        title: 'Changes not saved',
        message: error instanceof ApiError ? error.message : 'Check your connection and try again.',
      })
      return false
    } finally {
      setSaving(false)
    }
  }

  const onSave = async () => {
    if (await save()) toast({ title: 'Changes saved' })
  }

  const onPublish = async () => {
    if (!page) return
    if (draftRef.current.dirty && !(await save())) return
    const wasLive = page.status === 'Published'
    setPublishing(true)
    try {
      await publishLandingPage(slug, pageId)
      setLoad((state) => (state.status === 'ready' ? { ...state, page: { ...state.page, status: 'Published' } } : state))
      patchListedPage({ status: 'Published' })
      setPublished({ wasLive })
    } catch (error) {
      const block = publishBlockOf(error)
      if (block) setPublishBlock(block)
      else
        toast({
          tone: 'danger',
          title: 'Page not published',
          message: error instanceof ApiError ? error.message : 'Check your connection and try again.',
        })
    } finally {
      setPublishing(false)
    }
  }

  const onUnpublish = async () => {
    setUnpublishing(true)
    try {
      await unpublishLandingPage(slug, pageId)
      setLoad((state) => (state.status === 'ready' ? { ...state, page: { ...state.page, status: 'Draft' } } : state))
      patchListedPage({ status: 'Draft' })
      setUnpublishOpen(false)
      toast({ title: 'Page unpublished' })
    } catch (error) {
      toast({
        tone: 'danger',
        title: 'Page not unpublished',
        message: error instanceof ApiError ? error.message : 'Check your connection and try again.',
      })
    } finally {
      setUnpublishing(false)
    }
  }

  const requestLeave = () => {
    if (draft.dirty) setLeaveTo(listUrl)
    else navigate(listUrl)
  }

  const addSection = (template: SectionTemplate) => {
    setPickerOpen(false)
    dispatch({ type: 'add', template })
    setPanel('edit')
    toast({ title: `${kindOf(template.type).name} added`, message: `${template.name} layout, below the selected section.` })
  }

  const confirmDelete = () => {
    if (!deleteTarget) return
    dispatch({ type: 'delete', key: deleteTarget.key })
    setDeleteTarget(null)
    toast({ title: 'Section deleted', message: 'Save to make it permanent.' })
  }

  // Bring the selected section into view inside the preview frame.
  const frameRef = useRef<HTMLDivElement>(null)
  useLayoutEffect(() => {
    const frame = frameRef.current
    const selected = frame?.querySelector<HTMLElement>('.lp-sec.is-selected')
    if (!frame || !selected) return
    frame.scrollTop += selected.getBoundingClientRect().top - frame.getBoundingClientRect().top - 12
  }, [draft.selectedKey, device])

  const onDragTarget = useCallback((target: { draggedKey: string; afterKey: string } | null) => setDragTarget(target), [])

  if (load.status === 'loading') {
    return (
      <div className="stack stack--lg">
        <SkeletonBlock />
      </div>
    )
  }
  if (load.status === 'error' || !page) {
    return load.status === 'error' && load.notFound ? (
      <ErrorState
        title="Page not found"
        text="This landing page doesn’t exist or isn’t part of your workspace."
        action={{ label: 'Back to landing pages', icon: ArrowLeft, to: listUrl }}
      />
    ) : (
      <ErrorState onRetry={() => void loadPage()} />
    )
  }

  const publicPath = `/p/${slug}/${page.slug}`
  const publicUrl = `${window.location.host}${publicPath}`
  const live = page.status === 'Published'
  const currency = creator?.defaultCurrency ?? 'EUR'
  const product =
    page.productName !== null
      ? { publicId: page.productPublicId, name: page.productName, priceCents: page.productPriceCents ?? 0, currency }
      : null
  const brandName = settings?.brandName || creator?.name || ''
  const brandColor = settings?.primaryColor || DEFAULT_BRAND_COLOR

  const selected = draft.sections.find((section) => section.key === draft.selectedKey) ?? null
  const formContext: EditorPageContext = {
    slug,
    pageType: page.type,
    product,
    hasLogo: Boolean(settings?.logoUrl),
    sections: draft.sections,
    templates,
  }

  const previewContext: LandingContext = {
    pageType: page.type,
    product: product ? { name: product.name, priceCents: product.priceCents, currency, type: productType } : null,
    brand: { name: brandName, color: brandColor, logoUrl: settings?.logoUrl || null },
    selectedKey: draft.selectedKey,
    renderAction: (label, options) =>
      page.type === 'Sales' ? <PreviewBuyButton label={label} inverted={options?.inverted} /> : <PreviewLeadForm label={label} inverted={options?.inverted} />,
  }

  const draggedName = dragTarget ? kindOf(draft.sections.find((section) => section.key === dragTarget.draggedKey)?.type ?? 'Hero').name : ''
  const preview = (
    <LandingShell brandColor={brandColor} editor inert>
      {draft.sections.map((section) => (
        <LandingSectionWithDrop
          key={section.key}
          section={section as RenderedSection}
          ctx={previewContext}
          dropLabel={dragTarget?.afterKey === section.key ? `${draggedName} will move here` : null}
        />
      ))}
    </LandingShell>
  )

  return (
    <>
      <PageHeader
        eyebrow={`${page.type === 'Sales' ? 'Sales page' : 'Lead capture page'} · ${publicUrl}`}
        title={titleWithEmphasis(page.title)}
        actions={
          <>
            <Button variant="ghost" size="sm" iconOnly icon={X} aria-label="Close editor" data-tooltip="Close editor" onClick={requestLeave} />
            <SaveStatus saving={saving} dirty={draft.dirty} savedAt={savedAt} />
            <IconSegmented
              label="Preview size"
              name={deviceName}
              className="editor__device"
              value={device}
              onChange={setDevice}
              options={[
                { value: 'desktop', label: 'Desktop', icon: Monitor },
                { value: 'mobile', label: 'Mobile', icon: Smartphone },
              ]}
            />
            <Button
              variant="secondary"
              icon={ExternalLink}
              className="editor__hide-sm"
              href={publicPath}
              target="_blank"
              rel="noopener"
              disabledReason={live ? undefined : 'Your page isn’t live yet — the preview below shows how it will look.'}
            >
              Preview
            </Button>
            <Button variant="secondary" icon={Save} loading={saving} onClick={() => void onSave()}>
              Save
            </Button>
            {live && (
              <Button variant="ghost" icon={EyeOff} onClick={() => setUnpublishOpen(true)}>
                Unpublish
              </Button>
            )}
            <Button variant="accent" icon={Rocket} loading={publishing} onClick={() => void onPublish()}>
              {live ? 'Publish changes' : 'Publish'}
            </Button>
          </>
        }
      />
      <div className="editor-shell">
        <IconSegmented
          label="Editor panel"
          name="editor-panel"
          className="editor-tabs"
          value={panel}
          onChange={setPanel}
          options={[
            { value: 'sections', label: 'Sections', icon: Layers },
            { value: 'edit', label: 'Edit', icon: Pencil },
            { value: 'preview', label: 'Preview', icon: Eye },
          ]}
        />
        <div className="editor">
          <div className="editor__panel editor__panel--sections">
            <SectionsCard
              sections={draft.sections}
              selectedKey={draft.selectedKey}
              templates={templates}
              dispatch={(action) => {
                dispatch(action)
                if (action.type === 'select') setPanel('edit')
              }}
              onAdd={() => setPickerOpen(true)}
              onDelete={setDeleteTarget}
              onDragTarget={onDragTarget}
            />
          </div>
          <div className="editor__panel editor__panel--edit">
            {selected ? <SectionForm section={selected} ctx={formContext} dispatch={dispatch} onDelete={setDeleteTarget} /> : <NothingSelected />}
          </div>
          <div className="editor__panel editor__panel--preview">
            <div className="editor__stage">
              <div className="editor__stagebar">
                <span className="editor__stagelabel">
                  {device === 'mobile' ? <Smartphone /> : <Monitor />}
                  {device === 'mobile' ? 'Mobile preview · 390 px' : 'Desktop preview'}
                </span>
                <UrlPill>{publicUrl}</UrlPill>
              </div>
              {device === 'mobile' ? (
                <div className="device">
                  <span className="device__notch" aria-hidden="true" />
                  <div className="device__screen" ref={frameRef}>
                    {preview}
                  </div>
                </div>
              ) : (
                <div className="editor__frame" ref={frameRef}>
                  {preview}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <SectionPickerModal
        open={pickerOpen}
        onClose={() => setPickerOpen(false)}
        templates={templates}
        presentTypes={draft.sections.map((section) => section.type)}
        onPick={addSection}
      />
      <DeleteSectionDialog
        sectionName={deleteTarget ? kindOf(deleteTarget.type).name : null}
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTarget(null)}
      />
      <UnpublishDialog open={unpublishOpen} busy={unpublishing} onConfirm={() => void onUnpublish()} onCancel={() => setUnpublishOpen(false)} />
      <PublishBlockedModal block={publishBlock} slug={slug} planName={creator?.planName ?? null} onClose={() => setPublishBlock(null)} />
      <PublishedModal
        open={published !== null}
        wasLive={published?.wasLive ?? false}
        pageType={page.type}
        url={`${window.location.origin}${publicPath}`}
        onClose={() => setPublished(null)}
      />
      <LeaveModal
        open={leaveTo !== null}
        title={page.title}
        saving={saving}
        onKeepEditing={() => setLeaveTo(null)}
        onDiscard={() => {
          const to = leaveTo ?? listUrl
          // Leave without the guard: the changes are being thrown away.
          dispatch({ type: 'load', page })
          setLeaveTo(null)
          navigate(to)
        }}
        onSaveAndLeave={async () => {
          const to = leaveTo ?? listUrl
          if (await save()) {
            setLeaveTo(null)
            navigate(to)
          }
        }}
      />
    </>
  )
}

function LandingSectionWithDrop({ section, ctx, dropLabel }: { section: RenderedSection; ctx: LandingContext; dropLabel: string | null }) {
  return (
    <>
      <LandingSection section={section} ctx={ctx} editor />
      {dropLabel && <LandingDropMarker label={dropLabel} />}
    </>
  )
}

/** The buy button as visitors see it; in the editor preview it does nothing. */
function PreviewBuyButton({ label, inverted }: { label: string; inverted?: boolean }) {
  return (
    <div className="lp-buy">
      <span className={`lp__cta ${inverted ? 'lp__cta--inverted' : ''}`}>
        <span>{label}</span>
        <ArrowRight />
      </span>
      <span className="lp-buy__note">
        <Lock />
        Secure card checkout · Instant delivery by email
      </span>
    </div>
  )
}

/** The email form as visitors see it; in the editor preview it does nothing. */
function PreviewLeadForm({ label, inverted }: { label: string; inverted?: boolean }) {
  return (
    <div className={`lp-form ${inverted ? 'lp-form--inverted' : ''}`}>
      <div className="lp-form__row">
        <input className="lp-form__input" type="email" placeholder="you@example.com" aria-label="Email address" readOnly tabIndex={-1} />
        <span className="lp__cta">
          <span>{label}</span>
        </span>
      </div>
      <p className="lp-form__note">Free · No spam · Unsubscribe any time</p>
    </div>
  )
}
