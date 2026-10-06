import { dateShort } from '../../../shared/lib/format'

/** Backend window for a scheduled campaign: at least 2 minutes ahead, at most 365 days. */
export const MIN_SCHEDULE_BUFFER_MINUTES = 2
export const MAX_SCHEDULE_DAYS = 365

const WEEKDAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const MINUTE_MS = 60_000
const DAY_MS = 86_400_000

const pad = (value: number) => String(value).padStart(2, '0')

/** `yyyy-mm-dd` of a local date, as a date input wants it. */
export const toDateInput = (value: Date) => `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}`
export const toTimeInput = (value: Date) => `${pad(value.getHours())}:${pad(value.getMinutes())}`

/** A date input + a time input (both local) → the instant, or null while either is empty or invalid. */
export function parseLocalDateTime(dateValue: string, timeValue: string): Date | null {
  if (!dateValue || !timeValue) return null
  const parsed = new Date(`${dateValue}T${timeValue}`)
  return Number.isNaN(parsed.getTime()) ? null : parsed
}

/** The viewer's own timezone (scheduling uses the browser's), with its short offset, e.g. "Europe/Zagreb" / "GMT+2". */
export function userTimezone(at: Date) {
  const zone = Intl.DateTimeFormat().resolvedOptions().timeZone
  const part = new Intl.DateTimeFormat('en-GB', { timeZone: zone, timeZoneName: 'shortOffset' })
    .formatToParts(at)
    .find((item) => item.type === 'timeZoneName')
  return { zone, offset: part ? part.value : '' }
}

export function scheduleWindow(now: number) {
  return {
    earliest: new Date(now + MIN_SCHEDULE_BUFFER_MINUTES * MINUTE_MS),
    latest: new Date(now + MAX_SCHEDULE_DAYS * DAY_MS),
  }
}

/** The 1st of next month at 09:00 local: when the monthly allowance resets. */
export const nextReset = (now: number) => {
  const current = new Date(now)
  return new Date(current.getFullYear(), current.getMonth() + 1, 1, 9, 0)
}

export type QuickPick = { label: string; at: Date }

const atNine = (day: Date) => new Date(day.getFullYear(), day.getMonth(), day.getDate(), 9, 0)

/** Next occurrence of a weekday (0 = Sunday), strictly after today, at 09:00. */
function nextWeekday(now: Date, weekday: number) {
  const ahead = ((weekday - now.getDay() + 7) % 7) || 7
  return atNine(new Date(now.getFullYear(), now.getMonth(), now.getDate() + ahead))
}

/** "Tomorrow, 09:00" and the next Thursday and Monday at 09:00; anything outside the backend window is dropped. */
export function quickPicks(now: number): QuickPick[] {
  const today = new Date(now)
  const tomorrow = atNine(new Date(today.getFullYear(), today.getMonth(), today.getDate() + 1))
  const { earliest, latest } = scheduleWindow(now)
  const candidates: QuickPick[] = [{ label: 'Tomorrow, 09:00', at: tomorrow }]
  for (const weekday of [4, 1]) {
    const at = nextWeekday(today, weekday)
    if (at.getTime() === tomorrow.getTime()) continue
    candidates.push({ label: `${WEEKDAYS[at.getDay()]} ${dateShort(at)}, 09:00`, at })
  }
  return candidates
    .filter((pick) => pick.at >= earliest && pick.at <= latest)
    .sort((a, b) => a.at.getTime() - b.at.getTime())
}
