import {
  AlertTriangle, BookOpen, ChevronLeft, ChevronRight, Globe, Loader2, Lock,
  Package, PanelLeftClose, PanelLeftOpen, Trash2, Type, Wrench, Zap,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLandingPageStore } from '../model/landing-page-store'
import type {
  CtaContent, FeaturesContent, FooterContent, HeroContent,
  LandingPageSection, LandingPageType, LandingPageWithSections,
  NavbarContent, ProductDetailsContent,
  SaveEditorRequest, SaveEditorSectionRequest,
  SectionTemplate, SectionType,
} from '../model/types'

type DraftSection = LandingPageSection & { isNew?: boolean }

const SECTION_LABELS: Record<SectionType, string> = {
  Navbar: 'Navbar',
  Hero: 'Hero',
  Features: 'Features',
  ProductDetails: 'Product details',
  Cta: 'Call to action',
  Footer: 'Footer',
}

const LOCKED_TYPES: SectionType[] = ['Navbar', 'Footer']
const REQUIRED_TYPES: SectionType[] = ['Hero', 'Cta']

export function LandingPageEditorPage() {
  const navigate = useNavigate()
  const { slug, pageId } = useParams<{ slug: string; pageId: string }>()

  const currentPage = useLandingPageStore((s) => s.currentPage)
  const pageStatus = useLandingPageStore((s) => s.pageStatus)
  const pageError = useLandingPageStore((s) => s.pageError)
  const mutateStatus = useLandingPageStore((s) => s.mutateStatus)
  const mutateError = useLandingPageStore((s) => s.mutateError)
  const mutateErrorStatus = useLandingPageStore((s) => s.mutateErrorStatus)
  const templates = useLandingPageStore((s) => s.templates)
  const loadPage = useLandingPageStore((s) => s.loadPage)
  const loadTemplates = useLandingPageStore((s) => s.loadTemplates)
  const publishPage = useLandingPageStore((s) => s.publishPage)
  const unpublishPage = useLandingPageStore((s) => s.unpublishPage)
  const archivePage = useLandingPageStore((s) => s.archivePage)
  const saveEditorFn = useLandingPageStore((s) => s.saveEditor)
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback)

  const [draftTitle, setDraftTitle] = useState('')
  const [draftSlug, setDraftSlug] = useState('')
  const [draftType, setDraftType] = useState<LandingPageType>('LeadGen')
  const [draftSections, setDraftSections] = useState<DraftSection[]>([])
  const [isDirty, setIsDirty] = useState(false)
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [sidebarMode, setSidebarMode] = useState<'page' | 'section'>('page')
  const [syncedPage, setSyncedPage] = useState<LandingPageWithSections | null>(null)

  // Re-seed the drafts whenever the store hands us a new page object (initial load, save —
  // which swaps temp section ids for server-issued ones — publish/unpublish). Guarded setState
  // during render instead of an effect, per react.dev "storing information from previous renders".
  if (currentPage !== syncedPage) {
    setSyncedPage(currentPage)
    if (currentPage) {
      setDraftTitle(currentPage.title)
      setDraftSlug(currentPage.slug)
      setDraftType(currentPage.type)
      setDraftSections(currentPage.sections.map((s) => ({ ...s })))
      setIsDirty(false)
    }
  }

  const isLoading = pageStatus === 'idle' || pageStatus === 'loading'
  const isSaving = mutateStatus === 'submitting'

  const missingRequired = REQUIRED_TYPES.filter(
    (t) => !draftSections.some((s) => s.type === t)
  )

  useEffect(() => {
    if (slug && pageId) {
      void loadPage(slug, pageId)
      void loadTemplates(slug)
    }
  }, [slug, pageId, loadPage, loadTemplates])

  const selectedSection = draftSections.find((s) => s.publicId === selectedSectionId) ?? null
  const markDirty = () => setIsDirty(true)

  const updateSectionContent = (id: string, contentJson: string) => {
    setDraftSections((prev) => prev.map((s) => s.publicId === id ? { ...s, contentJson } : s))
    markDirty()
  }

  const updateSectionColor = (id: string, color: string) => {
    setDraftSections((prev) => prev.map((s) => s.publicId === id ? { ...s, backgroundColor: color } : s))
    markDirty()
  }

  const handleAddSection = (template: SectionTemplate) => {
    const tempId = `new-${crypto.randomUUID()}`
    const type = template.type as SectionType
    const newSection: DraftSection = {
      publicId: tempId,
      type,
      sortOrder: 0,
      backgroundColor: template.defaultBackgroundColor,
      contentJson: template.contentJson,
      isLocked: LOCKED_TYPES.includes(type),
      isNew: true,
    }

    setDraftSections((prev) => {
      const next = [...prev]

      let insertIndex: number
      if (type === 'Hero') {
        // After Navbar
        const navbarIdx = next.findIndex((s) => s.type === 'Navbar')
        insertIndex = navbarIdx >= 0 ? navbarIdx + 1 : 1
      } else if (type === 'Cta') {
        // Before Footer
        const footerIdx = next.findIndex((s) => s.type === 'Footer')
        insertIndex = footerIdx >= 0 ? footerIdx : next.length - 1
      } else {
        // Before CTA if exists, else before Footer
        const ctaIdx = next.findIndex((s) => s.type === 'Cta')
        const footerIdx = next.findIndex((s) => s.type === 'Footer')
        insertIndex = ctaIdx >= 0 ? ctaIdx : footerIdx >= 0 ? footerIdx : next.length - 1
      }

      next.splice(insertIndex, 0, newSection)
      return next.map((s, i) => ({ ...s, sortOrder: i }))
    })

    setSelectedSectionId(tempId)
    setSidebarMode('section')
    markDirty()
  }

  const handleDeleteSection = (id: string) => {
    setDraftSections((prev) =>
      prev.filter((s) => s.publicId !== id).map((s, i) => ({ ...s, sortOrder: i }))
    )
    if (selectedSectionId === id) { setSelectedSectionId(null); setSidebarMode('page') }
    markDirty()
  }

  const handleSave = async () => {
    if (!slug || !pageId) return
    const request: SaveEditorRequest = {
      title: draftTitle,
      slug: draftSlug,
      type: draftType,
      sections: draftSections.map((s, i): SaveEditorSectionRequest => ({
        publicId: s.isNew ? null : s.publicId,
        type: s.type,
        sortOrder: i,
        backgroundColor: s.backgroundColor,
        contentJson: s.contentJson,
      })),
    }
    const result = await saveEditorFn(slug, pageId, request)
    if (result) { setIsDirty(false); resetMutateFeedback() }
  }

  const handlePublishToggle = async () => {
    if (!slug || !pageId || !currentPage) return
    if (currentPage.status === 'Published') await unpublishPage(slug, pageId)
    else await publishPage(slug, pageId)
  }

  const handleArchive = async () => {
    if (!slug || !pageId) return
    const ok = await archivePage(slug, pageId)
    if (ok) navigate(`/app/${slug}/landing-pages`)
  }

  const [isPanelOpen, setIsPanelOpen] = useState(true)

  // Templates to show in left panel — exclude locked, show missing required prominently
  const addableTemplates = templates.filter(
    (t) => !LOCKED_TYPES.includes(t.type as SectionType)
  )

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-950 text-white light:bg-neutral-100 light:text-neutral-950">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-white/10 bg-neutral-950 px-5 z-10 light:border-neutral-200 light:bg-white">
        <div className="flex items-center gap-3">
          <button
            type="button"
            className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-white/10 px-3 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:text-neutral-600 light:hover:bg-neutral-50"
            onClick={() => navigate(`/app/${slug ?? ''}/landing-pages`)}
          >
            <ChevronLeft size={15} />
            Back
          </button>
          <span className="text-sm font-medium text-white truncate max-w-[180px] light:text-neutral-950">{draftTitle || '…'}</span>
          {isDirty ? <span className="rounded-full bg-amber-500/15 px-2 py-0.5 text-xs font-medium text-amber-300 light:bg-amber-100 light:text-amber-700">Unsaved</span> : null}
          {missingRequired.length > 0 ? (
            <span className="rounded-full bg-red-500/15 px-2 py-0.5 text-xs font-medium text-red-300 light:bg-red-100 light:text-red-700">
              Missing: {missingRequired.join(', ')}
            </span>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          {mutateError && mutateErrorStatus !== 409 ? (
            <p className="text-xs text-red-400 light:text-red-600">{mutateError}</p>
          ) : null}
          {currentPage?.status === 'Published' ? (
            <a
              href={`/p/${slug}/${currentPage.slug}`}
              target="_blank"
              rel="noopener noreferrer"
              title="View live"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/60 transition hover:bg-white/10 hover:text-white light:border-neutral-200 light:bg-white light:text-neutral-500 light:hover:bg-neutral-50 light:hover:text-neutral-800"
            >
              <Globe size={15} />
            </a>
          ) : (
            <span
              title="Publish the page to view it live"
              className="inline-flex size-9 items-center justify-center rounded-xl border border-white/10 bg-white/5 text-white/25 cursor-not-allowed light:border-neutral-200 light:bg-white light:text-neutral-300"
            >
              <Globe size={15} />
            </span>
          )}
          <button
            type="button"
            disabled={isSaving || !currentPage}
            className="inline-flex h-9 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-medium text-white/70 transition hover:bg-white/10 light:border-neutral-200 light:bg-white light:text-neutral-700 light:hover:bg-neutral-50 disabled:opacity-40"
            onClick={() => void handlePublishToggle()}
          >
            {currentPage?.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            disabled={isSaving || !isDirty || missingRequired.length > 0}
            title={missingRequired.length > 0 ? `Add missing sections: ${missingRequired.join(', ')}` : undefined}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-accent px-4 text-sm font-semibold text-white light:text-neutral-950 transition hover:bg-accent-strong disabled:opacity-40"
            onClick={() => void handleSave()}
          >
            {isSaving ? <Loader2 className="animate-spin" size={15} /> : null}
            Save
          </button>
        </div>
      </header>

      {mutateErrorStatus === 409 && mutateError ? (
        <div className="flex items-center gap-3 border-b border-amber-500/25 bg-amber-500/10 px-5 py-3 light:border-amber-200 light:bg-amber-50">
          <AlertTriangle size={16} className="shrink-0 text-amber-400 light:text-amber-600" />
          <p className="flex-1 text-sm text-amber-200 light:text-amber-800">{mutateError}</p>
          <button
            type="button"
            className="shrink-0 text-sm font-semibold text-amber-300 underline transition hover:text-amber-100 light:text-amber-700 light:hover:text-amber-900"
            onClick={() => navigate(`/app/${slug ?? ''}/settings`)}
          >
            Complete payout setup
          </button>
        </div>
      ) : null}

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-sm text-white/40 light:text-neutral-400">
          <Loader2 className="animate-spin" size={17} />
          Loading editor…
        </div>
      ) : pageError ? (
        <div className="m-8 rounded-2xl border border-red-500/25 bg-red-500/10 p-6 light:border-red-200 light:bg-red-50">
          <p className="text-sm text-red-300 light:text-red-700">{pageError}</p>
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">

          {/* Left: Templates panel */}
          <SectionsPanel
            isOpen={isPanelOpen}
            templates={addableTemplates}
            missingRequired={missingRequired}
            draftSections={draftSections}
            onToggle={() => setIsPanelOpen((v) => !v)}
            onAdd={handleAddSection}
          />

          {/* Center: Preview */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl py-6 px-4">
              {draftSections.map((section) => {
                const isSelected = selectedSectionId === section.publicId
                const isLocked = LOCKED_TYPES.includes(section.type as SectionType)

                return (
                  <div
                    key={section.publicId}
                    className={`relative cursor-pointer rounded-xl transition-all mb-1 ${
                      isSelected ? 'ring-2 ring-accent' : 'ring-1 ring-transparent hover:ring-white/30 light:hover:ring-neutral-300'
                    }`}
                    style={{ backgroundColor: section.backgroundColor }}
                    onClick={() => { setSelectedSectionId(section.publicId); setSidebarMode('section') }}
                  >
                    {/* Section label */}
                    <div className={`absolute left-2 top-2 flex items-center gap-1 rounded-md px-2 py-0.5 text-xs font-medium shadow-sm ${isLocked ? 'bg-neutral-900/80 text-white' : 'bg-white/80 text-neutral-600 backdrop-blur-sm'}`}>
                      {isLocked ? <Lock size={10} /> : null}
                      <SectionIcon type={section.type as SectionType} size={11} />
                      {SECTION_LABELS[section.type as SectionType]}
                    </div>

                    {/* Delete button — only non-locked sections */}
                    {!isLocked && isSelected ? (
                      <button
                        type="button"
                        className="absolute right-2 top-2 grid size-7 place-items-center rounded-lg bg-white/80 text-neutral-500 backdrop-blur-sm shadow-sm transition hover:bg-red-50 hover:text-red-600"
                        onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.publicId) }}
                      >
                        <Trash2 size={12} />
                      </button>
                    ) : null}

                    <SectionPreview section={section} pageType={draftType} />
                  </div>
                )
              })}
            </div>
          </div>

          {/* Right: Settings sidebar */}
          <aside className="flex w-72 shrink-0 flex-col border-l border-white/10 bg-neutral-950 overflow-y-auto light:border-neutral-200 light:bg-white">
            <div className="flex border-b border-white/10 light:border-neutral-200">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition ${sidebarMode === 'page' ? 'border-b-2 border-accent text-white light:border-neutral-950 light:text-neutral-950' : 'text-white/40 hover:text-white/70 light:text-neutral-400 light:hover:text-neutral-600'}`}
                onClick={() => setSidebarMode('page')}
              >
                Page
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-xs font-semibold uppercase tracking-wide transition ${sidebarMode === 'section' ? 'border-b-2 border-accent text-white light:border-neutral-950 light:text-neutral-950' : 'text-white/40 hover:text-white/70 light:text-neutral-400 light:hover:text-neutral-600'}`}
                onClick={() => { if (selectedSection) setSidebarMode('section') }}
              >
                Section
              </button>
            </div>

            <div className="flex-1 p-5">
              {sidebarMode === 'page' ? (
                <PageSettingsSidebar
                  title={draftTitle}
                  slug={draftSlug}
                  type={draftType}
                  isArchiving={isSaving}
                  onTitleChange={(v) => { setDraftTitle(v); markDirty() }}
                  onSlugChange={(v) => { setDraftSlug(v); markDirty() }}
                  onTypeChange={(v) => { setDraftType(v); markDirty() }}
                  onArchive={() => void handleArchive()}
                />
              ) : selectedSection ? (
                <SectionSettingsSidebar
                  key={selectedSection.publicId}
                  section={selectedSection}
                  onContentChange={(json) => updateSectionContent(selectedSection.publicId, json)}
                  onColorChange={(color) => updateSectionColor(selectedSection.publicId, color)}
                />
              ) : (
                <p className="text-sm text-white/40 light:text-neutral-400">Click a section to edit it.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

/* ─── SectionsPanel ───────────────────────────────────────────── */

const ADDABLE_TYPES: SectionType[] = ['Hero', 'Features', 'ProductDetails', 'Cta']

function SectionsPanel({
  isOpen, templates, missingRequired, draftSections, onToggle, onAdd,
}: {
  isOpen: boolean
  templates: SectionTemplate[]
  missingRequired: SectionType[]
  draftSections: DraftSection[]
  onToggle: () => void
  onAdd: (template: SectionTemplate) => void
}) {
  const [expandedType, setExpandedType] = useState<SectionType | null>('Hero')
  const [hoverTemplate, setHoverTemplate] = useState<SectionTemplate | null>(null)
  const [hoverPos, setHoverPos] = useState<{ top: number }>({ top: 0 })

  return (
    <aside
      className={`relative flex shrink-0 flex-col border-r border-white/10 bg-neutral-950 transition-all duration-200 light:border-neutral-200 light:bg-white ${isOpen ? 'w-72' : 'w-10'}`}
    >
      {/* Toggle button */}
      <button
        type="button"
        title={isOpen ? 'Hide panel' : 'Show sections'}
        className="absolute -right-3.5 top-4 z-20 grid size-7 place-items-center rounded-full border border-white/10 bg-neutral-900 text-white/60 shadow-sm transition hover:bg-neutral-800 hover:text-white light:border-neutral-200 light:bg-white light:text-neutral-500 light:hover:bg-neutral-50 light:hover:text-neutral-800"
        onClick={onToggle}
      >
        {isOpen ? <PanelLeftClose size={13} /> : <PanelLeftOpen size={13} />}
      </button>

      {isOpen ? (
        <>
          <div className="border-b border-white/10 px-4 py-3 light:border-neutral-100">
            <p className="text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">Add section</p>
          </div>

          <div className="flex-1 overflow-y-auto">
            {ADDABLE_TYPES.map((type) => {
              const typeTemplates = templates.filter((t) => t.type === type)
              if (typeTemplates.length === 0) return null

              const isMissing = REQUIRED_TYPES.includes(type) && missingRequired.includes(type)
              const alreadyExists = REQUIRED_TYPES.includes(type) && draftSections.some((s) => s.type === type)
              const isExpanded = expandedType === type

              return (
                <div key={type} className="border-b border-white/10 last:border-0 light:border-neutral-100">
                  {/* Accordion header */}
                  <button
                    type="button"
                    className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-white/5 light:hover:bg-neutral-50"
                    onClick={() => setExpandedType(isExpanded ? null : type)}
                  >
                    <span className={`grid size-8 shrink-0 place-items-center rounded-lg ${isMissing ? 'bg-red-500/15 text-red-400 light:bg-red-50 light:text-red-500' : alreadyExists ? 'bg-emerald-500/15 text-emerald-400 light:bg-emerald-50 light:text-emerald-600' : 'bg-white/10 text-white/60 light:bg-neutral-100 light:text-neutral-500'}`}>
                      <SectionIcon type={type} size={15} />
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-semibold ${isMissing ? 'text-red-400 light:text-red-600' : 'text-white light:text-neutral-950'}`}>
                        {SECTION_LABELS[type]}
                      </p>
                      <p className="text-xs text-white/40 light:text-neutral-400">
                        {isMissing ? 'Required — add one' : alreadyExists ? 'Already added' : `${typeTemplates.length} template${typeTemplates.length !== 1 ? 's' : ''}`}
                      </p>
                    </div>
                    <ChevronRight size={14} className={`shrink-0 text-white/40 transition-transform light:text-neutral-400 ${isExpanded ? 'rotate-90' : ''}`} />
                  </button>

                  {/* Template list */}
                  {isExpanded ? (
                    <div className="px-3 pb-3 grid gap-1.5">
                      {typeTemplates.map((template) => (
                        <div
                          key={template.key}
                          className="relative"
                          onMouseEnter={(e) => {
                            setHoverTemplate(template)
                            const rect = (e.currentTarget as HTMLElement).getBoundingClientRect()
                            setHoverPos({ top: rect.top })
                          }}
                          onMouseLeave={() => setHoverTemplate(null)}
                        >
                          <button
                            type="button"
                            disabled={alreadyExists && REQUIRED_TYPES.includes(type)}
                            onClick={() => onAdd(template)}
                            className="flex w-full items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-left transition hover:border-white/25 hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-40 light:border-neutral-200 light:bg-white light:hover:border-neutral-400 light:hover:bg-neutral-50"
                          >
                            <span className="size-4 shrink-0 rounded border border-white/15 light:border-neutral-200" style={{ backgroundColor: template.defaultBackgroundColor }} />
                            <span className="flex-1 text-sm font-medium text-white/80 light:text-neutral-800">{template.name}</span>
                            <span className="text-xs font-semibold text-white/40 light:text-neutral-400">+</span>
                          </button>
                        </div>
                      ))}
                    </div>
                  ) : null}
                </div>
              )
            })}
          </div>

          {/* Hover preview — floats to the right of the panel */}
          {hoverTemplate ? (
            <div
              className="fixed z-50 w-72 overflow-hidden rounded-2xl border border-white/10 bg-neutral-950 shadow-2xl pointer-events-none light:border-neutral-200 light:bg-white"
              style={{ left: 288, top: Math.min(hoverPos.top, window.innerHeight - 300) }}
            >
              <div className="border-b border-white/10 px-4 py-2.5 light:border-neutral-100">
                <p className="text-xs font-semibold text-white/60 light:text-neutral-500">{SECTION_LABELS[hoverTemplate.type as SectionType]} — {hoverTemplate.name}</p>
              </div>
              <div
                className="overflow-hidden"
                style={{ backgroundColor: hoverTemplate.defaultBackgroundColor, transform: 'scale(0.6)', transformOrigin: 'top left', width: '166.67%', height: 'auto' }}
              >
                <MiniSectionPreview template={hoverTemplate} />
              </div>
            </div>
          ) : null}
        </>
      ) : null}
    </aside>
  )
}

/* ─── MiniSectionPreview ──────────────────────────────────────── */

function MiniSectionPreview({ template }: { template: SectionTemplate }) {
  const content = parseJson(template.contentJson)

  switch (template.type as SectionType) {
    case 'Navbar': {
      const c = content as Partial<NavbarContent>
      return (
        <div className="flex items-center justify-between px-6 py-5" style={{ backgroundColor: template.defaultBackgroundColor }}>
          <p className="text-base font-bold text-neutral-950">{c.brandName || 'My Brand'}</p>
        </div>
      )
    }
    case 'Hero': {
      const c = content as Partial<HeroContent>
      return (
        <div className="px-8 py-10 text-center" style={{ backgroundColor: template.defaultBackgroundColor }}>
          <p className={`text-2xl font-bold ${template.defaultBackgroundColor === '#111827' ? 'text-white' : 'text-neutral-950'}`}>{c.heading}</p>
          {c.subheading ? <p className={`mt-2 text-sm ${template.defaultBackgroundColor === '#111827' ? 'text-white/60' : 'text-neutral-500'}`}>{c.subheading}</p> : null}
          <div className="mt-4 inline-block rounded-lg bg-neutral-950 px-5 py-2 text-sm font-semibold text-white">{c.ctaText || 'Get started'}</div>
        </div>
      )
    }
    case 'Features': {
      const c = content as Partial<FeaturesContent>
      const items = (c.items ?? []).slice(0, 3)
      return (
        <div className="px-6 py-8" style={{ backgroundColor: template.defaultBackgroundColor }}>
          {c.heading ? <p className="mb-4 text-center text-lg font-bold text-neutral-950">{c.heading}</p> : null}
          <div className="grid grid-cols-3 gap-3">
            {items.map((item, i) => (
              <div key={i} className="rounded-lg border border-neutral-200 bg-white p-3">
                <p className="text-xs font-semibold text-neutral-950">{item.title}</p>
                <p className="mt-0.5 text-xs text-neutral-400 line-clamp-2">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'ProductDetails': {
      const c = content as Partial<ProductDetailsContent>
      return (
        <div className="px-6 py-8" style={{ backgroundColor: template.defaultBackgroundColor }}>
          {c.heading ? <p className="text-lg font-bold text-neutral-950">{c.heading}</p> : null}
          {c.description ? <p className="mt-2 text-sm text-neutral-500 line-clamp-2">{c.description}</p> : null}
          {c.showPrice ? <p className="mt-3 text-xl font-bold text-neutral-950">€ —</p> : null}
        </div>
      )
    }
    case 'Cta': {
      const c = content as Partial<CtaContent>
      return (
        <div className="px-6 py-10 text-center" style={{ backgroundColor: template.defaultBackgroundColor }}>
          <p className={`text-xl font-bold ${template.defaultBackgroundColor === '#111827' ? 'text-white' : 'text-neutral-950'}`}>{c.heading}</p>
          {c.subheading ? <p className={`mt-1 text-sm ${template.defaultBackgroundColor === '#111827' ? 'text-white/60' : 'text-neutral-500'}`}>{c.subheading}</p> : null}
          <div className="mt-4 inline-block rounded-lg bg-neutral-950 px-5 py-2 text-sm font-semibold text-white">{c.buttonText || 'Get started'}</div>
        </div>
      )
    }
    case 'Footer': {
      const c = content as Partial<FooterContent>
      return (
        <div className="px-6 py-5 text-center" style={{ backgroundColor: template.defaultBackgroundColor }}>
          <p className="text-xs text-neutral-400">{c.copyright}</p>
        </div>
      )
    }
  }
}

/* ─── SectionPreview ──────────────────────────────────────────── */

function SectionPreview({ section, pageType }: { section: DraftSection; pageType: LandingPageType }) {
  const content = parseJson(section.contentJson)

  switch (section.type as SectionType) {
    case 'Navbar': {
      const c = content as Partial<NavbarContent>
      return (
        <div className="flex items-center justify-between px-8 py-4">
          <p className="font-bold text-neutral-950">{c.brandName || 'My Brand'}</p>
          {c.links && c.links.length > 0 ? (
            <nav className="flex gap-5">
              {c.links.map((link, i) => (
                <span key={i} className="text-sm text-neutral-500">{link.label}</span>
              ))}
            </nav>
          ) : null}
        </div>
      )
    }
    case 'Hero': {
      const c = content as Partial<HeroContent>
      return (
        <div className="px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-neutral-950">{c.heading || 'Heading'}</h1>
          {c.subheading ? <p className="mt-3 text-lg text-neutral-600">{c.subheading}</p> : null}
          <div className="mt-6 flex flex-col items-center gap-3">
            {pageType === 'Sales' ? (
              <div className="flex w-full max-w-sm flex-col items-center gap-2">
                <input type="email" placeholder="Your email address" readOnly className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-400 bg-white" />
                <button type="button" disabled className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white opacity-40">
                  Buy now
                </button>
                <p className="text-xs text-neutral-400">This is the email address that will receive your product.</p>
              </div>
            ) : (
              <div className="flex max-w-sm w-full gap-2">
                <input type="email" placeholder="Your email" readOnly className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-400 bg-white" />
                <button type="button" className="inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white">
                  {c.ctaText || 'Get started'}
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'Features': {
      const c = content as Partial<FeaturesContent>
      const items = c.items ?? []
      return (
        <div className="px-8 py-12">
          {c.heading ? <h2 className="mb-8 text-center text-2xl font-bold text-neutral-950">{c.heading}</h2> : null}
          <div className={`grid gap-4 ${items.length <= 3 ? 'grid-cols-3' : 'grid-cols-3'}`}>
            {items.map((item, i) => (
              <div key={i} className="rounded-xl border border-neutral-200 bg-white/60 p-4">
                <p className="font-semibold text-neutral-950">{item.title}</p>
                <p className="mt-1 text-sm text-neutral-500">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      )
    }
    case 'ProductDetails': {
      const c = content as Partial<ProductDetailsContent>
      return (
        <div className="px-8 py-12">
          {c.heading ? <h2 className="text-2xl font-bold text-neutral-950">{c.heading}</h2> : null}
          {c.description ? <p className="mt-3 text-neutral-600">{c.description}</p> : null}
          {c.showPrice ? <p className="mt-4 text-2xl font-bold text-neutral-950">€ —</p> : null}
          {c.bullets && c.bullets.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {c.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="size-1.5 rounded-full bg-neutral-950" />{b}
                </li>
              ))}
            </ul>
          ) : null}
        </div>
      )
    }
    case 'Cta': {
      const c = content as Partial<CtaContent>
      return (
        <div className="px-8 py-14 text-center">
          <h2 className="text-2xl font-bold text-neutral-950">{c.heading || 'Ready?'}</h2>
          {c.subheading ? <p className="mt-2 text-neutral-600">{c.subheading}</p> : null}
          <div className="mt-6 flex flex-col items-center gap-3">
            {pageType === 'Sales' ? (
              <div className="flex w-full max-w-sm flex-col items-center gap-2">
                <input type="email" placeholder="Your email address" readOnly className="w-full rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-400 bg-white" />
                <button type="button" disabled className="inline-flex h-10 w-full items-center justify-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white opacity-40">
                  Buy now
                </button>
                <p className="text-xs text-neutral-400">This is the email address that will receive your product.</p>
              </div>
            ) : (
              <div className="flex max-w-sm w-full gap-2">
                <input type="email" placeholder="Your email" readOnly className="flex-1 rounded-xl border border-neutral-200 px-4 py-2.5 text-sm text-neutral-400 bg-white" />
                <button type="button" className="inline-flex h-10 items-center rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white">
                  {c.buttonText || 'Get started'}
                </button>
              </div>
            )}
          </div>
        </div>
      )
    }
    case 'Footer': {
      const c = content as Partial<FooterContent>
      return (
        <div className="px-8 py-6 text-center">
          <p className="text-sm text-neutral-400">{c.copyright || '© 2025 My Brand'}</p>
        </div>
      )
    }
  }
}

/* ─── PageSettingsSidebar ─────────────────────────────────────── */

function PageSettingsSidebar({
  title, slug, type, isArchiving,
  onTitleChange, onSlugChange, onTypeChange, onArchive,
}: {
  title: string; slug: string; type: LandingPageType; isArchiving: boolean
  onTitleChange: (v: string) => void
  onSlugChange: (v: string) => void
  onTypeChange: (v: LandingPageType) => void
  onArchive: () => void
}) {
  return (
    <div className="grid gap-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">Page settings</p>
      <SidebarField label="Title" value={title} onChange={onTitleChange} />
      <SidebarField label="URL slug" value={slug} onChange={onSlugChange} />
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">Type</label>
        <select value={type} onChange={(e) => onTypeChange(e.target.value as LandingPageType)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/25 light:border-neutral-200 light:bg-white light:text-neutral-950 light:focus:border-neutral-400">
          <option value="LeadGen">Lead Gen — collect emails</option>
          <option value="Sales">Sales — sell a product</option>
        </select>
      </div>
      <div className="pt-4 border-t border-white/10 light:border-neutral-100">
        <p className="text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400 mb-3">Danger zone</p>
        <button type="button" disabled={isArchiving} className="inline-flex h-9 w-full items-center justify-center gap-2 rounded-xl border border-red-500/25 bg-red-500/10 text-sm font-semibold text-red-300 transition hover:bg-red-500/20 disabled:opacity-40 light:border-red-200 light:bg-red-50 light:text-red-700 light:hover:bg-red-100" onClick={onArchive}>
          Archive page
        </button>
      </div>
    </div>
  )
}

/* ─── SectionSettingsSidebar ──────────────────────────────────── */

function SectionSettingsSidebar({ section, onContentChange, onColorChange }: {
  section: DraftSection
  onContentChange: (json: string) => void
  onColorChange: (color: string) => void
}) {
  const [content, setContent] = useState<Record<string, unknown>>(parseJson(section.contentJson))
  const [bgColor, setBgColor] = useState(section.backgroundColor)
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const updateContent = (patch: Record<string, unknown>) => {
    const next = { ...content, ...patch }
    setContent(next)
    if (timerRef.current) clearTimeout(timerRef.current)
    timerRef.current = setTimeout(() => onContentChange(JSON.stringify(next)), 300)
  }

  const handleColorChange = (color: string) => {
    setBgColor(color)
    onColorChange(color)
  }

  const updateItem = (index: number, key: string, value: string) => {
    const items = [...((content.items as { title: string; description: string }[]) ?? [])]
    items[index] = { ...items[index], [key]: value }
    updateContent({ items })
  }

  const updateBullet = (index: number, value: string) => {
    const bullets = [...((content.bullets as string[]) ?? [])]
    bullets[index] = value
    updateContent({ bullets })
  }

  return (
    <div className="grid gap-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">
        {SECTION_LABELS[section.type as SectionType]}
      </p>
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">Background</label>
        <div className="flex items-center gap-2">
          <input type="color" value={bgColor} onChange={(e) => handleColorChange(e.target.value)} className="size-9 cursor-pointer rounded-lg border border-white/10 bg-transparent light:border-neutral-200" />
          <input type="text" value={bgColor} onChange={(e) => handleColorChange(e.target.value)} maxLength={7} className="flex-1 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-sm font-mono text-white outline-none transition focus:border-white/25 light:border-neutral-200 light:bg-white light:text-neutral-950 light:focus:border-neutral-400" />
        </div>
      </div>

      {section.type === 'Navbar' ? (
        <SidebarField label="Brand name" value={String(content.brandName ?? '')} onChange={(v) => updateContent({ brandName: v })} />
      ) : section.type === 'Hero' ? (
        <>
          <SidebarField label="Heading" value={String(content.heading ?? '')} onChange={(v) => updateContent({ heading: v })} />
          <SidebarField label="Subheading" value={String(content.subheading ?? '')} onChange={(v) => updateContent({ subheading: v })} />
          <SidebarField label="Button text" value={String(content.ctaText ?? '')} onChange={(v) => updateContent({ ctaText: v })} />
        </>
      ) : section.type === 'Features' ? (
        <>
          <SidebarField label="Heading" value={String(content.heading ?? '')} onChange={(v) => updateContent({ heading: v })} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">Items</p>
            <div className="grid gap-3">
              {((content.items as { title: string; description: string }[]) ?? []).map((item, i) => (
                <div key={i} className="rounded-xl border border-white/10 p-3 grid gap-2 light:border-neutral-100">
                  <SidebarField label={`Title ${i + 1}`} value={item.title} onChange={(v) => updateItem(i, 'title', v)} />
                  <SidebarField label="Description" value={item.description} onChange={(v) => updateItem(i, 'description', v)} />
                </div>
              ))}
            </div>
          </div>
        </>
      ) : section.type === 'ProductDetails' ? (
        <>
          <SidebarField label="Heading" value={String(content.heading ?? '')} onChange={(v) => updateContent({ heading: v })} />
          <SidebarField label="Description" value={String(content.description ?? '')} onChange={(v) => updateContent({ description: v })} textarea />
          <div className="flex items-center gap-3">
            <input type="checkbox" id="showPrice" checked={Boolean(content.showPrice)} onChange={(e) => updateContent({ showPrice: e.target.checked })} className="size-4 rounded accent-accent" />
            <label htmlFor="showPrice" className="text-sm text-white/70 light:text-neutral-700">Show price</label>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">Bullets</p>
            {((content.bullets as string[]) ?? []).map((b, i) => (
              <div key={i} className="mb-2">
                <SidebarField label={`Bullet ${i + 1}`} value={b} onChange={(v) => updateBullet(i, v)} />
              </div>
            ))}
          </div>
        </>
      ) : section.type === 'Cta' ? (
        <>
          <SidebarField label="Heading" value={String(content.heading ?? '')} onChange={(v) => updateContent({ heading: v })} />
          <SidebarField label="Subheading" value={String(content.subheading ?? '')} onChange={(v) => updateContent({ subheading: v })} />
          <SidebarField label="Button text" value={String(content.buttonText ?? '')} onChange={(v) => updateContent({ buttonText: v })} />
        </>
      ) : section.type === 'Footer' ? (
        <SidebarField label="Copyright text" value={String(content.copyright ?? '')} onChange={(v) => updateContent({ copyright: v })} />
      ) : null}
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function SidebarField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-white/40 light:text-neutral-400">{label}</label>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="w-full resize-none rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:border-neutral-200 light:bg-white light:text-neutral-950 light:focus:border-neutral-400 light:focus:ring-neutral-100" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2.5 text-sm text-white outline-none transition focus:border-white/25 focus:ring-2 focus:ring-white/10 light:border-neutral-200 light:bg-white light:text-neutral-950 light:focus:border-neutral-400 light:focus:ring-neutral-100" />
      )}
    </div>
  )
}

function SectionIcon({ type, size = 14 }: { type: SectionType; size?: number }) {
  switch (type) {
    case 'Navbar': return <Globe size={size} />
    case 'Hero': return <Zap size={size} />
    case 'Features': return <Package size={size} />
    case 'ProductDetails': return <BookOpen size={size} />
    case 'Cta': return <Wrench size={size} />
    case 'Footer': return <Type size={size} />
  }
}

function parseJson(json: string): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown> } catch { return {} }
}
