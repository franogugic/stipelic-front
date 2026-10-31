import { ApiError } from '../../../shared/api/http-client'

// The AI page builder's brief (F7-B contract: POST …/ai-draft). Length limits follow the designer's prototype.

export type AiGoal = 'capture' | 'free_product'
export type AiTone = 'friendly' | 'professional' | 'bold' | 'calm'
export type AiLanguage = 'en' | 'hr'

export type AiBrief = {
  goal: AiGoal
  /** The page title; the draft page is created with it before the AI is asked. */
  title: string
  audience: string
  /** Capture: what subscribers get (text). */
  offer: string
  /** Free product: the document people get. */
  productId: string | null
  brand: string
  tone: AiTone
  benefits: [string, string, string]
  cta: string
  language: AiLanguage
}

export type AiUsage = { used: number; limit: number; resetsAt: string | null }

/** "4 of 50 generations this month" — next to the button that uses one. */
export const usageLine = (usage: AiUsage) => `${usage.used.toLocaleString('en')} of ${usage.limit.toLocaleString('en')} generations this month`

export const AI_MAX = { title: 80, audience: 200, offer: 300, brand: 160, benefit: 120, cta: 40 } as const
export const AI_STEPS = ['The goal', 'Audience and offer', 'Voice and button'] as const
export const AI_TONES: Array<{ value: AiTone; label: string }> = [
  { value: 'friendly', label: 'Friendly' },
  { value: 'professional', label: 'Professional' },
  { value: 'bold', label: 'Bold' },
  { value: 'calm', label: 'Calm' },
]
export const AI_LANGUAGES: Array<{ value: AiLanguage; label: string }> = [
  { value: 'en', label: 'English' },
  { value: 'hr', label: 'Hrvatski' },
]

export const emptyBrief = (brand: string): AiBrief => ({
  goal: 'free_product',
  title: '',
  audience: '',
  offer: '',
  productId: null,
  brand,
  tone: 'friendly',
  benefits: ['', '', ''],
  cta: '',
  language: 'en',
})

export type BriefErrors = Partial<Record<'title' | 'audience' | 'offer' | 'productId' | 'brand' | 'cta' | 'benefit0' | 'benefit1' | 'benefit2', string>>

/** What's still missing on a step, as messages per field (the prototype's wording). */
export function briefErrors(brief: AiBrief, step: number): BriefErrors {
  const errors: BriefErrors = {}
  if (step === 1 && !brief.title.trim()) errors.title = 'Give the page a title — you can change it in the editor.'
  if (step === 2) {
    if (!brief.audience.trim()) errors.audience = 'Say who it’s for, so the page speaks to them.'
    if (brief.goal === 'capture' && !brief.offer.trim()) errors.offer = 'Say what subscribers get — one sentence is enough.'
    if (brief.goal === 'free_product' && !brief.productId) errors.productId = 'Pick the free document people get.'
  }
  if (step === 3) {
    if (!brief.brand.trim()) errors.brand = 'Name your brand, so the page sounds like you.'
    brief.benefits.forEach((benefit, index) => {
      if (!benefit.trim()) errors[`benefit${index}` as 'benefit0'] = 'Add this benefit — the page uses all three.'
    })
    if (!brief.cta.trim()) errors.cta = 'Write the button text, like “Send me the guide”.'
  }
  return errors
}

/** Why a generation did not give a draft, in the words the screen shows. `nothingUsed` is true for everything but a success. */
export type AiFailure =
  | { kind: 'refused'; explanation: string }
  | { kind: 'failed' }
  | { kind: 'limit'; resetsAt: string | null }
  | { kind: 'rate-limited' }
  | { kind: 'page-limit' }
  | { kind: 'other'; message: string }

/** Maps the API's answer to what the screen tells; null for an error this flow does not know. */
export function failureOf(error: unknown): AiFailure {
  if (!(error instanceof ApiError)) return { kind: 'other', message: 'We couldn’t reach Luma. Check your connection and try again.' }
  if (error.code === 'AI_REFUSED') return { kind: 'refused', explanation: error.message }
  if (error.code === 'AI_TRUNCATED' || error.code === 'AI_INVALID') return { kind: 'failed' }
  if (error.code === 'USAGE_LIMIT') {
    const resetsAt = (error.payload?.resetsAt as string | undefined) ?? ((error.details as { resetsAt?: string } | undefined)?.resetsAt ?? null)
    return { kind: 'limit', resetsAt }
  }
  if (error.code === 'PLAN_LIMIT_REACHED') return { kind: 'page-limit' }
  if (error.status === 429) return { kind: 'rate-limited' }
  return { kind: 'other', message: error.message }
}
