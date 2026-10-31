import type { TestimonialItem } from './section-content'
import type { DraftSection } from './editor-draft'

// Placeholder testimonials (F7): the AI builder never invents reviews, so a testimonial comes back as a sample marked
// `placeholder`, and the API refuses to publish (409 PLACEHOLDER_TESTIMONIALS) while any is left. A placeholder counts
// as real only when BOTH the quote and the author were changed — a real name must not carry a made-up quote live.

export type PlaceholderNeeds = { quote: boolean; author: boolean }

const changedFrom = (edited: string | undefined, sample: string) => {
  const text = (edited ?? '').trim()
  return text !== '' && text !== sample.trim()
}

/** What a placeholder still needs before it is real. */
export function placeholderNeeds(item: TestimonialItem): PlaceholderNeeds {
  return { quote: !changedFrom(item.edited?.quote, item.quote), author: !changedFrom(item.edited?.author, item.author) }
}

/** The item after the creator typed into a placeholder: real (flag gone) once both are changed, else the half-done edit is remembered. */
export function editPlaceholder(item: TestimonialItem, edited: NonNullable<TestimonialItem['edited']>): TestimonialItem {
  const next: TestimonialItem = { ...item, edited }
  const needs = placeholderNeeds(next)
  if (needs.quote || needs.author) return next
  return { quote: edited.quote.trim(), author: edited.author.trim(), role: edited.role.trim() }
}

export const needsText = (needs: PlaceholderNeeds) =>
  [needs.quote && 'a real quote', needs.author && 'the author’s real name'].filter(Boolean).join(' and ')

export type PlaceholderIssue = { sectionKey: string; items: Array<{ index: number; item: TestimonialItem }> }

/** The testimonial sections that still hold placeholders, with the items in question. */
export function placeholderIssues(sections: DraftSection[]): PlaceholderIssue[] {
  const issues: PlaceholderIssue[] = []
  for (const section of sections) {
    if (section.type !== 'Testimonials') continue
    const items = section.content.items.flatMap((item, index) => (item.placeholder ? [{ index, item }] : []))
    if (items.length > 0) issues.push({ sectionKey: section.key, items })
  }
  return issues
}

export const placeholderCount = (issues: PlaceholderIssue[]) => issues.reduce((total, issue) => total + issue.items.length, 0)
