import { hrefTarget, parseSectionContent, sectionHref, serializeSectionContent } from './section-content'
import type { SectionContentMap } from './section-content'
import { kindOf } from './section-library'
import type { LandingPageSection, LandingPageWithSections, SaveEditorRequest, SectionTemplate, SectionType } from './types'

// The editor's working copy of a page: its sections in order, each with parsed content. Sections not saved yet
// carry a temporary key; the save response gives them their public ids (same order as sent).

export type DraftSection = {
  [T in SectionType]: {
    /** Public id once saved; `new-…` before. Also the preview anchor (`s-{key}`) and navbar link target. */
    key: string
    publicId: string | null
    type: T
    variant: string
    background: string | null
    /** The JSON as loaded, so keys this editor doesn't know survive a save. */
    originalJson: string
    content: SectionContentMap[T]
  }
}[SectionType]

export type Draft = {
  sections: DraftSection[]
  selectedKey: string | null
  /** Changed since the last load or save. */
  dirty: boolean
  /** Bumped by every change, so a save can tell whether edits arrived while it was in flight. */
  revision: number
}

export type DraftAction =
  | { type: 'load'; page: LandingPageWithSections }
  | { type: 'select'; key: string }
  | { type: 'content'; key: string; content: DraftSection['content'] }
  /** For async results (an upload finishing): the change is applied to the section as it is then. */
  | { type: 'edit'; key: string; edit: (section: DraftSection) => DraftSection }
  | { type: 'variant'; key: string; variant: string }
  | { type: 'background'; key: string; background: string | null }
  | { type: 'move'; key: string; toIndex: number }
  | { type: 'add'; template: SectionTemplate }
  | { type: 'delete'; key: string }
  | { type: 'saved'; page: LandingPageWithSections; keys: string[]; revision: number }

let temporaryKeys = 0
const newKey = () => `new-${Date.now().toString(36)}-${(temporaryKeys += 1)}`

function fromSection(section: LandingPageSection): DraftSection {
  return {
    key: section.publicId,
    publicId: section.publicId,
    type: section.type,
    variant: section.variant,
    background: section.backgroundColor,
    originalJson: section.contentJson,
    content: parseSectionContent(section.type, section.contentJson),
  } as DraftSection
}

/** Navbar first, footer last, the rest in between: the backend's rule, kept by every move and add. */
export const isMovable = (section: DraftSection) => kindOf(section.type).locked === null

const firstSelectable = (sections: DraftSection[]) =>
  (sections.find((section) => section.type === 'Hero') ?? sections[0])?.key ?? null

const changed = (draft: Draft, next: Pick<Draft, 'sections'> & Partial<Draft>): Draft => ({
  ...draft,
  ...next,
  dirty: true,
  revision: draft.revision + 1,
})

const update = (draft: Draft, key: string, change: (section: DraftSection) => DraftSection): Draft =>
  changed(draft, {
      sections: draft.sections.map((section) => (section.key === key ? change(section) : section)),
  })

export function draftReducer(draft: Draft, action: DraftAction): Draft {
  switch (action.type) {
    case 'load': {
      const sections = [...action.page.sections].sort((a, b) => a.sortOrder - b.sortOrder).map(fromSection)
      return { sections, selectedKey: firstSelectable(sections), dirty: false, revision: draft.revision + 1 }
    }
    case 'select':
      return { ...draft, selectedKey: action.key }
    case 'content':
      return update(draft, action.key, (section) => ({ ...section, content: action.content }) as DraftSection)
    case 'edit':
      return update(draft, action.key, action.edit)
    case 'variant':
      return update(draft, action.key, (section) => ({ ...section, variant: action.variant }))
    case 'background':
      return update(draft, action.key, (section) => ({ ...section, background: action.background }))
    case 'move': {
      const from = draft.sections.findIndex((section) => section.key === action.key)
      const moving = draft.sections[from]
      if (!moving || !isMovable(moving)) return draft
      // Only between the navbar and the footer.
      const first = draft.sections.findIndex(isMovable)
      const last = draft.sections.length - 1 - [...draft.sections].reverse().findIndex(isMovable)
      const to = Math.min(Math.max(action.toIndex, first), last)
      if (to === from) return draft
      const sections = [...draft.sections]
      sections.splice(from, 1)
      sections.splice(to, 0, moving)
      return changed(draft, { sections })
    }
    case 'add': {
      const { template } = action
      const section = {
        key: newKey(),
        publicId: null,
        type: template.type,
        variant: template.variant,
        background: template.defaultBackgroundColor,
        originalJson: template.contentJson,
        content: parseSectionContent(template.type, template.contentJson),
      } as DraftSection
      // Below the selected section, never after the footer or before the navbar.
      const selected = draft.sections.findIndex((candidate) => candidate.key === draft.selectedKey)
      const footer = draft.sections.findIndex((candidate) => candidate.type === 'Footer')
      const end = footer === -1 ? draft.sections.length : footer
      const at = selected === -1 ? end : Math.min(Math.max(selected + 1, 1), end)
      const sections = [...draft.sections]
      sections.splice(at, 0, section)
      return changed(draft, { sections, selectedKey: section.key })
    }
    case 'delete': {
      const index = draft.sections.findIndex((section) => section.key === action.key)
      if (index === -1 || !isMovable(draft.sections[index])) return draft
      const sections = draft.sections
        .filter((section) => section.key !== action.key)
        // Navbar links to the deleted section go with it.
        .map((section) =>
          section.type === 'Navbar'
            ? { ...section, content: { ...section.content, links: section.content.links.filter((link) => hrefTarget(link.href) !== action.key) } }
            : section,
        )
      const selectedKey =
        draft.selectedKey === action.key ? (sections[Math.min(index, sections.length - 1)]?.key ?? null) : draft.selectedKey
      return changed(draft, { sections, selectedKey })
    }
    case 'saved': {
      // The response lists the sections in the order they were sent: give new ones their public ids and point
      // navbar links at them.
      const saved = [...action.page.sections].sort((a, b) => a.sortOrder - b.sortOrder)
      const idByKey = new Map(action.keys.map((key, index) => [key, saved[index]?.publicId ?? key]))
      const remap = (key: string) => idByKey.get(key) ?? key
      const sections = draft.sections.map((section) => {
        const publicId = remap(section.key)
        const next = { ...section, key: publicId, publicId }
        if (next.type !== 'Navbar') return next as DraftSection
        return {
          ...next,
          content: {
            ...next.content,
            links: next.content.links.map((link) => {
              const target = hrefTarget(link.href)
              return target ? { ...link, href: sectionHref(remap(target)) } : link
            }),
          },
        } as DraftSection
      })
      // Edits made while the save was in flight keep the draft dirty.
      return {
        ...draft,
        sections,
        selectedKey: draft.selectedKey ? remap(draft.selectedKey) : null,
        dirty: draft.revision !== action.revision,
      }
    }
  }
}

export const emptyDraft: Draft = { sections: [], selectedKey: null, dirty: false, revision: 0 }

/** The editor PUT for the draft, plus the keys in the order sent (to match the response). */
export function toSaveRequest(page: LandingPageWithSections, sections: DraftSection[]): { request: SaveEditorRequest; keys: string[] } {
  return {
    keys: sections.map((section) => section.key),
    request: {
      title: page.title,
      slug: page.slug,
      type: page.type,
      sections: sections.map((section, index) => ({
        publicId: section.publicId,
        type: section.type,
        variant: section.variant,
        sortOrder: index,
        backgroundColor: section.background,
        contentJson: serializeSectionContent(section.originalJson, section.content),
      })),
    },
  }
}

/** Navbar links still pointing at a section that has no public id (only possible before its first save). */
export const hasUnsavedLinkTargets = (sections: DraftSection[]) =>
  sections.some(
    (section) => section.type === 'Navbar' && section.content.links.some((link) => hrefTarget(link.href).startsWith('new-')),
  )
