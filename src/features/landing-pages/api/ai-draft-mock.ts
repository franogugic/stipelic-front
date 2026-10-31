import { ApiError } from '../../../shared/api/http-client'
import type { AiBrief, AiUsage } from '../model/ai-draft'
import type { SaveEditorSectionRequest, LandingPageWithSections, SectionType } from '../model/types'
import { getLandingPage, getSectionTemplates, saveEditor } from './landing-pages-api'

// Dev-only stand-in for POST …/ai-draft (F7-B). `VITE_MOCK_AI` picks the answer: ok | refused | failed | rate | limit;
// `VITE_MOCK_AI_SECONDS` the time it takes (default 12). It writes a real draft through the editor endpoint, so the
// result opens in the real editor. Nothing here ships: the import is behind `import.meta.env.DEV`.

const USED_KEY = 'cp.mockAi.used'
const LIMIT = 20

const wait = (ms: number, signal: AbortSignal) =>
  new Promise<void>((resolve, reject) => {
    const timer = window.setTimeout(resolve, ms)
    signal.addEventListener('abort', () => {
      window.clearTimeout(timer)
      reject(new DOMException('Aborted', 'AbortError'))
    })
  })

export function mockUsage(): AiUsage {
  let used = 0
  try {
    used = Number(window.localStorage.getItem(USED_KEY)) || 0
  } catch {
    // Starts from zero.
  }
  const now = new Date()
  return { used, limit: LIMIT, resetsAt: new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + 1, 1)).toISOString() }
}

const countOne = () => {
  try {
    window.localStorage.setItem(USED_KEY, String(mockUsage().used + 1))
  } catch {
    // The line just doesn't move.
  }
}

export async function mockGenerateAiDraft(slug: string, pageId: string, brief: AiBrief, signal: AbortSignal): Promise<LandingPageWithSections> {
  const mode = String(import.meta.env.VITE_MOCK_AI)
  await wait((Number(import.meta.env.VITE_MOCK_AI_SECONDS) || 12) * 1000, signal)
  if (mode === 'refused') {
    throw new ApiError(422, { code: 'AI_REFUSED', message: 'The third benefit promises an income — Luma doesn’t write earnings claims. Change it and try again.' })
  }
  if (mode === 'failed') throw new ApiError(502, { code: 'AI_INVALID', message: 'The draft could not be completed.' })
  if (mode === 'rate') throw new ApiError(429, { code: 'RATE_LIMITED', message: 'Too many requests.' })
  if (mode === 'limit') throw new ApiError(429, { code: 'USAGE_LIMIT', message: 'No generations left.', resetsAt: mockUsage().resetsAt })

  const page = await getLandingPage(slug, pageId)
  const templates = await getSectionTemplates(slug)
  const first = (type: SectionType) => templates.find((template) => template.type === type)
  const content: Partial<Record<SectionType, object>> = {
    Hero: { heading: brief.title, subheading: brief.offer || `For ${brief.audience}`, ctaText: brief.cta },
    Features: { heading: 'What you get', items: brief.benefits.map((title) => ({ title, description: `${title} — written for ${brief.audience}.` })) },
    Cta: { heading: brief.title, subheading: `From ${brief.brand}.`, buttonText: brief.cta },
    Faq: { heading: 'Questions', items: [{ question: 'Is it free?', answer: 'Yes.' }, { question: 'Can I unsubscribe?', answer: 'Any time, from every email.' }] },
    Testimonials: {
      heading: 'Kind words',
      items: [
        { quote: 'Replace this with a real quote from someone you know.', author: 'Customer name', role: 'Role or place', placeholder: true },
        { quote: 'A second placeholder, until you have a real one.', author: 'Customer name', role: 'Role or place', placeholder: true },
      ],
    },
  }
  const existing: SaveEditorSectionRequest[] = page.sections.map((section) => ({
    publicId: section.publicId,
    type: section.type,
    variant: section.variant,
    sortOrder: section.sortOrder,
    backgroundColor: section.backgroundColor,
    contentJson: content[section.type] ? JSON.stringify({ ...JSON.parse(section.contentJson || '{}'), ...content[section.type] }) : section.contentJson,
  }))
  const added: SaveEditorSectionRequest[] = (['Features', 'Testimonials', 'Faq'] as SectionType[])
    .filter((type) => !existing.some((section) => section.type === type) && first(type))
    .map((type) => ({
      publicId: null,
      type,
      variant: first(type)!.variant,
      sortOrder: 0,
      backgroundColor: first(type)!.defaultBackgroundColor,
      contentJson: JSON.stringify({ ...JSON.parse(first(type)!.contentJson || '{}'), ...content[type] }),
    }))
  // New sections go before the call to action; Footer stays last.
  const ordered = [...existing.filter((s) => s.type !== 'Cta' && s.type !== 'Footer'), ...added, ...existing.filter((s) => s.type === 'Cta'), ...existing.filter((s) => s.type === 'Footer')]
  const saved = await saveEditor(slug, pageId, {
    title: page.title,
    slug: page.slug,
    type: page.type,
    ...(brief.goal === 'free_product' && brief.productId ? { productId: brief.productId } : {}),
    sections: ordered.map((section, index) => ({ ...section, sortOrder: index })),
  })
  countOne()
  return saved
}
