import type { EmailTemplate } from './types'

export type TemplateDraft = { name: string; subject: string; bodyText: string; withButton: boolean; ctaLabel: string; ctaUrl: string }

export const sameDraft = (a: TemplateDraft, b: TemplateDraft) =>
  a.name === b.name &&
  a.subject === b.subject &&
  a.bodyText === b.bodyText &&
  a.withButton === b.withButton &&
  (!a.withButton || (a.ctaLabel === b.ctaLabel && a.ctaUrl === b.ctaUrl))

export const draftOf = (template: EmailTemplate): TemplateDraft => ({
  name: template.name,
  subject: template.subject,
  bodyText: template.bodyText,
  withButton: Boolean(template.ctaLabel || template.ctaUrl),
  ctaLabel: template.ctaLabel ?? '',
  ctaUrl: template.ctaUrl ?? '',
})
