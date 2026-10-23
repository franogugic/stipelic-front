import type { CampaignDetail, NonOpenerResend, ResendHistoryItem, ResendReason } from './types'

/** The opens are estimates: some mail apps mark every email as opened. */
export const ESTIMATED_OPENS =
  'Opens are estimates: some mail apps mark every email as opened, so the real number of people who didn’t open can be higher than shown here.'

/** The reason codes whose card is not shown at all. */
const HIDDEN_REASONS: ReadonlyArray<ResendReason | null> = ['NOT_SENT', 'IS_RESEND']

/** The resend state of a campaign, or null when the card does not apply (not sent yet, or itself a resend). */
export function resendStateOf(campaign: CampaignDetail): NonOpenerResend | null {
  const state = campaign.nonOpenerResend
  if (!state || campaign.sourceCampaignPublicId) return null
  return HIDDEN_REASONS.includes(state.reason) ? null : state
}

/** Resends that still hold one of the five places (a cancelled one frees its place). */
export const countedResends = (resends: ResendHistoryItem[]) => resends.filter((resend) => resend.status !== 'Cancelled')

/** The subject the wizard suggests for the nth resend; editable. */
const RESEND_SUBJECT_PREFIXES = ['In case you missed it: ', 'Still time to read: ', 'Last chance: ', 'One more look: ', 'Final reminder: ']
export const suggestedResendSubject = (round: number, originalSubject: string) =>
  `${RESEND_SUBJECT_PREFIXES[Math.min(Math.max(round, 1), RESEND_SUBJECT_PREFIXES.length) - 1]}${originalSubject}`

/** The resend a creator is about to make: its number, from what the server reports. */
export const nextResendRound = (state: NonOpenerResend) => state.used + 1
