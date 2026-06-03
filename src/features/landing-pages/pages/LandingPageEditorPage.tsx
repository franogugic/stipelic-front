import {
  BookOpen, ChevronLeft, Loader2, Package, Plus, Settings, Trash2, X, Zap, Globe,
} from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useLandingPageStore } from '../model/landing-page-store'
import type {
  CtaContent, FeaturesContent, HeroContent,
  LandingPageSection, LandingPageType,
  ProductDetailsContent, SaveEditorRequest, SaveEditorSectionRequest,
  SectionTemplate, SectionType,
} from '../model/types'

// Draft section — extends real section with optional temp marker for newly added ones
type DraftSection = LandingPageSection & { isNew?: boolean }

const SECTION_LABELS: Record<SectionType, string> = {
  Hero: 'Hero',
  Features: 'Features',
  ProductDetails: 'Product details',
  Cta: 'Call to action',
}

export function LandingPageEditorPage() {
  const navigate = useNavigate()
  const { slug, pageId } = useParams<{ slug: string; pageId: string }>()

  const currentPage = useLandingPageStore((s) => s.currentPage)
  const pageStatus = useLandingPageStore((s) => s.pageStatus)
  const mutateStatus = useLandingPageStore((s) => s.mutateStatus)
  const mutateError = useLandingPageStore((s) => s.mutateError)
  const templates = useLandingPageStore((s) => s.templates)
  const loadPage = useLandingPageStore((s) => s.loadPage)
  const loadTemplates = useLandingPageStore((s) => s.loadTemplates)
  const publishPage = useLandingPageStore((s) => s.publishPage)
  const unpublishPage = useLandingPageStore((s) => s.unpublishPage)
  const saveEditorFn = useLandingPageStore((s) => s.saveEditor)
  const resetMutateFeedback = useLandingPageStore((s) => s.resetMutateFeedback)

  // Draft state
  const [draftTitle, setDraftTitle] = useState('')
  const [draftSlug, setDraftSlug] = useState('')
  const [draftType, setDraftType] = useState<LandingPageType>('LeadGen')
  const [draftSections, setDraftSections] = useState<DraftSection[]>([])
  const [isDirty, setIsDirty] = useState(false)

  // UI state
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null)
  const [sidebarMode, setSidebarMode] = useState<'page' | 'section'>('page')
  const [addBelowIndex, setAddBelowIndex] = useState<number | null>(null)

  const isLoading = pageStatus === 'idle' || pageStatus === 'loading'
  const isSaving = mutateStatus === 'submitting'

  // Load page
  useEffect(() => {
    if (slug && pageId) {
      void loadPage(slug, pageId)
      void loadTemplates(slug)
    }
  }, [slug, pageId, loadPage, loadTemplates])

  // Initialise draft from server state
  useEffect(() => {
    if (currentPage) {
      setDraftTitle(currentPage.title)
      setDraftSlug(currentPage.slug)
      setDraftType(currentPage.type)
      setDraftSections(currentPage.sections.map((s) => ({ ...s })))
      setIsDirty(false)
    }
  }, [currentPage])

  const selectedSection = draftSections.find((s) => s.publicId === selectedSectionId) ?? null

  const markDirty = () => setIsDirty(true)

  // Section content update
  const updateSectionContent = (sectionId: string, contentJson: string) => {
    setDraftSections((prev) => prev.map((s) => s.publicId === sectionId ? { ...s, contentJson } : s))
    markDirty()
  }

  const updateSectionColor = (sectionId: string, color: string) => {
    setDraftSections((prev) => prev.map((s) => s.publicId === sectionId ? { ...s, backgroundColor: color } : s))
    markDirty()
  }

  // Add section
  const handleAddSection = (type: SectionType, template: SectionTemplate, insertAfterIndex: number) => {
    const tempId = `new-${crypto.randomUUID()}`
    const newSection: DraftSection = {
      publicId: tempId,
      type,
      sortOrder: insertAfterIndex + 1,
      backgroundColor: template.defaultBackgroundColor,
      contentJson: template.contentJson,
      isLocked: false,
      isNew: true,
    }
    setDraftSections((prev) => {
      const next = [...prev]
      next.splice(insertAfterIndex + 1, 0, newSection)
      return next.map((s, i) => ({ ...s, sortOrder: i }))
    })
    setAddBelowIndex(null)
    setSelectedSectionId(tempId)
    setSidebarMode('section')
    markDirty()
  }

  // Delete section
  const handleDeleteSection = (sectionId: string) => {
    setDraftSections((prev) => prev.filter((s) => s.publicId !== sectionId).map((s, i) => ({ ...s, sortOrder: i })))
    if (selectedSectionId === sectionId) { setSelectedSectionId(null); setSidebarMode('page') }
    markDirty()
  }

  // Save
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

  return (
    <div className="flex h-screen flex-col overflow-hidden bg-neutral-100 text-neutral-950">
      {/* Top bar */}
      <header className="flex h-14 shrink-0 items-center justify-between border-b border-neutral-200 bg-white px-5">
        <div className="flex items-center gap-3">
          <button type="button" className="inline-flex h-9 items-center gap-1.5 rounded-lg border border-neutral-200 px-3 text-sm font-medium text-neutral-600 transition hover:bg-neutral-50" onClick={() => navigate(`/app/${slug ?? ''}/landing-pages`)}>
            <ChevronLeft size={15} />
            Back
          </button>
          <span className="text-sm font-medium text-neutral-950 truncate max-w-[200px]">{draftTitle || '…'}</span>
          {isDirty ? <span className="rounded-full bg-amber-100 px-2 py-0.5 text-xs font-medium text-amber-700">Unsaved</span> : null}
        </div>
        <div className="flex items-center gap-2">
          {mutateError ? <p className="text-xs text-red-600">{mutateError}</p> : null}
          <button
            type="button"
            disabled={isSaving || !currentPage}
            className={`inline-flex h-9 items-center gap-2 rounded-xl px-4 text-sm font-medium transition disabled:opacity-40 ${currentPage?.status === 'Published' ? 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50' : 'border border-neutral-200 bg-white text-neutral-700 hover:bg-neutral-50'}`}
            onClick={() => void handlePublishToggle()}
          >
            {currentPage?.status === 'Published' ? 'Unpublish' : 'Publish'}
          </button>
          <button
            type="button"
            disabled={isSaving || !isDirty}
            className="inline-flex h-9 items-center gap-2 rounded-xl bg-neutral-950 px-4 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:opacity-40"
            onClick={() => void handleSave()}
          >
            {isSaving ? <Loader2 className="animate-spin" size={15} /> : null}
            Save
          </button>
        </div>
      </header>

      {isLoading ? (
        <div className="flex flex-1 items-center justify-center gap-3 text-sm text-neutral-400">
          <Loader2 className="animate-spin" size={17} />
          Loading editor…
        </div>
      ) : (
        <div className="flex flex-1 overflow-hidden">
          {/* Preview */}
          <div className="flex flex-1 flex-col overflow-y-auto">
            <div className="mx-auto w-full max-w-3xl py-8 px-6">
              {draftSections.map((section, idx) => {
                const isSelected = selectedSectionId === section.publicId
                const isMiddle = !section.isLocked
                const canAddBelow = idx < draftSections.length - 1 // can't add after last (CTA)

                return (
                  <div key={section.publicId}>
                    {/* Section preview */}
                    <div
                      className={`relative cursor-pointer rounded-2xl transition-all ${isSelected ? 'ring-2 ring-neutral-950' : 'ring-1 ring-transparent hover:ring-neutral-300'}`}
                      style={{ backgroundColor: section.backgroundColor }}
                      onClick={() => { setSelectedSectionId(section.publicId); setSidebarMode('section') }}
                    >
                      {/* Section type label */}
                      <div className="absolute left-3 top-3 flex items-center gap-1.5 rounded-lg bg-white/80 px-2.5 py-1 text-xs font-semibold text-neutral-600 backdrop-blur-sm shadow-sm">
                        <SectionIcon type={section.type as SectionType} size={12} />
                        {SECTION_LABELS[section.type as SectionType]}
                        {section.isLocked ? <span className="text-neutral-400">· Locked</span> : null}
                      </div>

                      {/* Delete button */}
                      {isMiddle && isSelected ? (
                        <button
                          type="button"
                          className="absolute right-3 top-3 grid size-7 place-items-center rounded-lg bg-white/80 text-neutral-500 backdrop-blur-sm shadow-sm transition hover:bg-red-50 hover:text-red-600"
                          onClick={(e) => { e.stopPropagation(); handleDeleteSection(section.publicId) }}
                        >
                          <Trash2 size={13} />
                        </button>
                      ) : null}

                      {/* Section content preview */}
                      <SectionPreview section={section} />
                    </div>

                    {/* Add section between */}
                    {canAddBelow ? (
                      <AddSectionDivider
                        isOpen={addBelowIndex === idx}
                        templates={templates}
                        onOpen={() => setAddBelowIndex(idx)}
                        onClose={() => setAddBelowIndex(null)}
                        onAdd={(type, template) => handleAddSection(type, template, idx)}
                      />
                    ) : null}
                  </div>
                )
              })}
            </div>
          </div>

          {/* Sidebar */}
          <aside className="flex w-80 shrink-0 flex-col border-l border-neutral-200 bg-white overflow-y-auto">
            {/* Sidebar tabs */}
            <div className="flex border-b border-neutral-200">
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition ${sidebarMode === 'page' ? 'border-b-2 border-neutral-950 text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
                onClick={() => setSidebarMode('page')}
              >
                <Settings size={14} />
                Page
              </button>
              <button
                type="button"
                className={`flex flex-1 items-center justify-center gap-2 py-3 text-sm font-medium transition ${sidebarMode === 'section' ? 'border-b-2 border-neutral-950 text-neutral-950' : 'text-neutral-500 hover:text-neutral-700'}`}
                onClick={() => { if (selectedSection) setSidebarMode('section') }}
              >
                <SectionIcon type={(selectedSection?.type as SectionType) ?? 'Hero'} size={14} />
                Section
              </button>
            </div>

            <div className="flex-1 p-5">
              {sidebarMode === 'page' ? (
                <PageSettingsSidebar
                  title={draftTitle}
                  slug={draftSlug}
                  type={draftType}
                  onTitleChange={(v) => { setDraftTitle(v); markDirty() }}
                  onSlugChange={(v) => { setDraftSlug(v); markDirty() }}
                  onTypeChange={(v) => { setDraftType(v); markDirty() }}
                />
              ) : selectedSection ? (
                <SectionSettingsSidebar
                  key={selectedSection.publicId}
                  section={selectedSection}
                  onContentChange={(json) => updateSectionContent(selectedSection.publicId, json)}
                  onColorChange={(color) => updateSectionColor(selectedSection.publicId, color)}
                />
              ) : (
                <p className="text-sm text-neutral-400">Click a section in the preview to edit it.</p>
              )}
            </div>
          </aside>
        </div>
      )}
    </div>
  )
}

/* ─── AddSectionDivider ───────────────────────────────────────── */

function AddSectionDivider({
  isOpen, templates, onOpen, onClose, onAdd,
}: {
  isOpen: boolean
  templates: SectionTemplate[]
  onOpen: () => void
  onClose: () => void
  onAdd: (type: SectionType, template: SectionTemplate) => void
}) {
  const addableTypes: SectionType[] = ['Features', 'ProductDetails']

  return (
    <div className="group relative my-1 flex items-center justify-center">
      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-px bg-neutral-200 group-hover:bg-neutral-300 transition" />
      <button
        type="button"
        className="relative z-10 flex items-center gap-1 rounded-full border border-neutral-200 bg-white px-3 py-1 text-xs font-medium text-neutral-500 shadow-sm transition hover:border-neutral-950 hover:text-neutral-950 group-hover:opacity-100 opacity-0 group-hover:opacity-100"
        onClick={onOpen}
      >
        <Plus size={12} />
        Add section
      </button>

      {isOpen ? (
        <div className="absolute top-8 z-20 left-1/2 -translate-x-1/2 w-72 rounded-2xl border border-neutral-200 bg-white p-4 shadow-xl">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Choose section</p>
            <button type="button" className="grid size-6 place-items-center rounded-lg text-neutral-400 hover:bg-neutral-100" onClick={onClose}><X size={13} /></button>
          </div>
          <div className="grid gap-2">
            {addableTypes.map((type) => {
              const typeTemplates = templates.filter((t) => t.type === type)
              return typeTemplates.map((template) => (
                <button
                  key={template.key}
                  type="button"
                  className="flex items-center gap-3 rounded-xl border border-neutral-200 px-3 py-2.5 text-left text-sm transition hover:border-neutral-950 hover:bg-neutral-50"
                  onClick={() => onAdd(type, template)}
                >
                  <div className="grid size-8 shrink-0 place-items-center rounded-lg bg-neutral-100 text-neutral-600">
                    <SectionIcon type={type} size={15} />
                  </div>
                  <div>
                    <p className="font-medium text-neutral-950">{SECTION_LABELS[type]}</p>
                    <p className="text-xs text-neutral-400">{template.name}</p>
                  </div>
                  <span className="ml-auto size-4 rounded border border-neutral-200 shrink-0" style={{ backgroundColor: template.defaultBackgroundColor }} />
                </button>
              ))
            })}
          </div>
        </div>
      ) : null}
    </div>
  )
}

/* ─── SectionPreview ──────────────────────────────────────────── */

function SectionPreview({ section }: { section: DraftSection }) {
  const content = parseJson(section.contentJson)

  switch (section.type as SectionType) {
    case 'Hero': {
      const c = content as Partial<HeroContent>
      return (
        <div className="px-8 py-16 text-center">
          <h1 className="text-3xl font-bold text-neutral-950">{c.heading || 'Heading'}</h1>
          {c.subheading ? <p className="mt-3 text-lg text-neutral-600">{c.subheading}</p> : null}
          <button type="button" className="mt-6 inline-flex h-11 items-center rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white">
            {c.ctaText || 'Get started'}
          </button>
        </div>
      )
    }
    case 'Features': {
      const c = content as Partial<FeaturesContent>
      const items = c.items ?? []
      return (
        <div className="px-8 py-12">
          {c.heading ? <h2 className="mb-8 text-center text-2xl font-bold text-neutral-950">{c.heading}</h2> : null}
          <div className={`grid gap-6 ${items.length <= 3 ? 'grid-cols-3' : 'grid-cols-3'}`}>
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
          {c.showPrice ? <p className="mt-4 text-2xl font-bold text-neutral-950">€--</p> : null}
          {c.bullets && c.bullets.length > 0 ? (
            <ul className="mt-4 space-y-2">
              {c.bullets.map((b, i) => (
                <li key={i} className="flex items-center gap-2 text-sm text-neutral-700">
                  <span className="size-1.5 rounded-full bg-neutral-950" />
                  {b}
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
          <button type="button" className="mt-6 inline-flex h-11 items-center rounded-xl bg-neutral-950 px-6 text-sm font-semibold text-white">
            {c.buttonText || 'Get started'}
          </button>
        </div>
      )
    }
  }
}

/* ─── PageSettingsSidebar ─────────────────────────────────────── */

function PageSettingsSidebar({
  title, slug, type, onTitleChange, onSlugChange, onTypeChange,
}: {
  title: string; slug: string; type: LandingPageType
  onTitleChange: (v: string) => void
  onSlugChange: (v: string) => void
  onTypeChange: (v: LandingPageType) => void
}) {
  return (
    <div className="grid gap-5">
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">Page settings</p>
      <SidebarField label="Title" value={title} onChange={onTitleChange} />
      <SidebarField label="URL slug" value={slug} onChange={onSlugChange} />
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Type</label>
        <select
          value={type}
          onChange={(e) => onTypeChange(e.target.value as LandingPageType)}
          className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400"
        >
          <option value="LeadGen">Lead Gen</option>
          <option value="Sales">Sales</option>
        </select>
      </div>
    </div>
  )
}

/* ─── SectionSettingsSidebar ──────────────────────────────────── */

function SectionSettingsSidebar({
  section, onContentChange, onColorChange,
}: {
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
      <p className="text-xs font-semibold uppercase tracking-wide text-neutral-400">
        {SECTION_LABELS[section.type as SectionType]}
      </p>

      {/* Background color */}
      <div>
        <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">Background</label>
        <div className="flex items-center gap-2">
          <input type="color" value={bgColor} onChange={(e) => handleColorChange(e.target.value)} className="size-9 cursor-pointer rounded-lg border border-neutral-200" />
          <input type="text" value={bgColor} onChange={(e) => handleColorChange(e.target.value)} maxLength={7} className="flex-1 rounded-xl border border-neutral-200 px-3 py-2 text-sm font-mono outline-none transition focus:border-neutral-400" />
        </div>
      </div>

      {/* Type-specific fields */}
      {section.type === 'Hero' ? (
        <>
          <SidebarField label="Heading" value={String(content.heading ?? '')} onChange={(v) => updateContent({ heading: v })} />
          <SidebarField label="Subheading" value={String(content.subheading ?? '')} onChange={(v) => updateContent({ subheading: v })} />
          <SidebarField label="Button text" value={String(content.ctaText ?? '')} onChange={(v) => updateContent({ ctaText: v })} />
        </>
      ) : section.type === 'Features' ? (
        <>
          <SidebarField label="Heading" value={String(content.heading ?? '')} onChange={(v) => updateContent({ heading: v })} />
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Items</p>
            <div className="grid gap-3">
              {((content.items as { title: string; description: string }[]) ?? []).map((item, i) => (
                <div key={i} className="rounded-xl border border-neutral-200 p-3 grid gap-2">
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
            <input type="checkbox" id="showPrice" checked={Boolean(content.showPrice)} onChange={(e) => updateContent({ showPrice: e.target.checked })} className="size-4 rounded" />
            <label htmlFor="showPrice" className="text-sm text-neutral-700">Show price</label>
          </div>
          <div>
            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-neutral-400">Bullets</p>
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
      ) : null}
    </div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────────── */

function SidebarField({ label, value, onChange, textarea }: { label: string; value: string; onChange: (v: string) => void; textarea?: boolean }) {
  return (
    <div>
      <label className="mb-1.5 block text-xs font-semibold uppercase tracking-wide text-neutral-400">{label}</label>
      {textarea ? (
        <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} className="w-full resize-none rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100" />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)} className="w-full rounded-xl border border-neutral-200 px-3 py-2.5 text-sm text-neutral-950 outline-none transition focus:border-neutral-400 focus:ring-2 focus:ring-neutral-100" />
      )}
    </div>
  )
}

function SectionIcon({ type, size = 18 }: { type: SectionType; size?: number }) {
  switch (type) {
    case 'Hero': return <Zap size={size} />
    case 'Features': return <Package size={size} />
    case 'ProductDetails': return <BookOpen size={size} />
    case 'Cta': return <Globe size={size} />
  }
}

function parseJson(json: string): Record<string, unknown> {
  try { return JSON.parse(json) as Record<string, unknown> } catch { return {} }
}
