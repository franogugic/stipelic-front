import type { CampaignAudienceType } from './types'

/** The audiences a creator picks in the wizard, as they appear in the URL (`?audience=buyers:<page public id>`). */
const URL_KEY_OF: Record<string, CampaignAudienceType> = {
  landing_page: 'LandingPage',
  product: 'Product',
  buyers: 'LandingPageBuyers',
}

/** `?audience=` → the wizard's selection ("All" or "<Type>:<public id>"); null when it isn't a known audience. */
export function selectionFromUrl(value: string | null): string | null {
  if (!value || value === 'all') return value === 'all' ? 'all' : null
  const [key, id] = value.split(':')
  const type = URL_KEY_OF[key]
  return type && id ? `${type}:${id}` : null
}

/** The wizard's selection → what goes into `?audience=` (null for All, which is the default). */
export function urlFromSelection(selection: string): string | null {
  if (selection === 'all') return null
  const [type, id] = selection.split(':')
  const key = Object.entries(URL_KEY_OF).find(([, candidate]) => candidate === type)?.[0]
  return key ? `${key}:${id}` : null
}

/** Buyers are people who paid, not people who subscribed: the counts and the footer say so. */
export const isBuyersAudience = (type: CampaignAudienceType) => type === 'LandingPageBuyers'

/** "Group · name", the same everywhere a campaign's audience is named. */
export function audienceLabel(type: CampaignAudienceType, name: string): string {
  switch (type) {
    case 'All':
      return 'All subscribers'
    case 'LandingPage':
    case 'Product':
      return `Sign-ups · ${name}`
    case 'LandingPageBuyers':
      return `Buyers · ${name}`
    case 'CampaignNonOpeners':
      return `Didn’t open: ${name}`
  }
}

/** Why the email footer says the person gets it: buyers "bought from", everyone else "joined". */
export type FooterReason = 'joined' | 'bought'
export const footerReasonOf = (type: CampaignAudienceType): FooterReason => (isBuyersAudience(type) ? 'bought' : 'joined')
