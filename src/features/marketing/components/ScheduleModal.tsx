import { CalendarCheck, CalendarClock, CircleAlert, Globe } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { date, dateShort, dateTime, plural } from '../../../shared/lib/format'
import { Alert, Button, Field, Input, InputAddon, InputGroup, Modal } from '../../../shared/ui/ledger'
import {
  MIN_SCHEDULE_BUFFER_MINUTES,
  nextReset,
  parseLocalDateTime,
  quickPicks,
  scheduleWindow,
  toDateInput,
  toTimeInput,
  userTimezone,
} from '../model/schedule'

const FORM_ID = 'schedule-form'

/**
 * Picks the time a campaign goes out, in the viewer's own browser timezone. `afterReset` opens it on the 1st of next
 * month at 09:00 (over the monthly limit). Mount with a new `key` per opening.
 */
export function ScheduleModal({
  open,
  afterReset,
  subject,
  recipientCount,
  busy,
  error,
  onClose,
  onSchedule,
}: {
  open: boolean
  afterReset: boolean
  subject: string
  recipientCount: number | null
  busy: boolean
  /** The API's message when scheduling failed. */
  error: string | null
  onClose: () => void
  onSchedule: (at: Date) => void
}) {
  // Fixed per opening: the window and the quick picks are measured from when the modal opened.
  const [openedAt] = useState(() => Date.now())
  const reset = nextReset(openedAt)
  const picks = afterReset ? [{ label: `After the reset · ${dateShort(reset)}, 09:00`, at: reset }] : quickPicks(openedAt)
  const initial = afterReset ? reset : picks[0]?.at ?? new Date(openedAt + 24 * 3_600_000)
  const [dateValue, setDateValue] = useState(toDateInput(initial))
  const [timeValue, setTimeValue] = useState(toTimeInput(initial))
  const { earliest, latest } = scheduleWindow(openedAt)
  const { zone, offset } = userTimezone(new Date(openedAt))

  const chosen = parseLocalDateTime(dateValue, timeValue)
  const timeError =
    chosen === null
      ? null
      : chosen < earliest
        ? `That time has already passed. Pick a time after ${dateTime(earliest)}.`
        : chosen > latest
          ? `That’s too far ahead. Pick a time before ${date(latest)}.`
          : null

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (busy || !chosen) return
    // The window moves while the modal is open; the API is the authority, this keeps the obvious mistake local.
    if (chosen.getTime() < Date.now() + MIN_SCHEDULE_BUFFER_MINUTES * 60_000) return
    onSchedule(chosen)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!busy}
      title="Schedule campaign"
      description={`“${subject}” to ${recipientCount === null ? 'your audience' : plural(recipientCount, 'subscriber')}.`}
      icon={CalendarClock}
      tone="accent"
      actions={
        <>
          <Button variant="secondary" disabled={busy} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} icon={CalendarCheck} loading={busy} disabled={!chosen || timeError !== null}>
            Schedule
          </Button>
        </>
      }
    >
      <form className="form" id={FORM_ID} noValidate onSubmit={submit}>
        {error && (
          <Alert tone="danger" icon={CircleAlert} live>
            {error}
          </Alert>
        )}
        <div className="form-row">
          <Field label="Date" error={timeError ?? undefined}>
            {(control) => (
              <Input
                {...control}
                type="date"
                value={dateValue}
                min={toDateInput(earliest)}
                max={toDateInput(latest)}
                onChange={(event) => setDateValue(event.target.value)}
              />
            )}
          </Field>
          <Field label="Time" hint={`Your time · ${zone}`}>
            {(control) => (
              <InputGroup>
                <Input {...control} type="time" value={timeValue} onChange={(event) => setTimeValue(event.target.value)} />
                {offset && <InputAddon>{offset}</InputAddon>}
              </InputGroup>
            )}
          </Field>
        </div>
        <div className="stack stack--xs">
          <span className="field__label">Quick picks</span>
          <div className="cluster cluster--sm">
            {picks.map((pick) => (
              <button
                className="chip"
                type="button"
                key={pick.label}
                aria-pressed={dateValue === toDateInput(pick.at) && timeValue === toTimeInput(pick.at)}
                onClick={() => {
                  setDateValue(toDateInput(pick.at))
                  setTimeValue(toTimeInput(pick.at))
                }}
              >
                {pick.label}
              </button>
            ))}
          </div>
        </div>
        {afterReset && (
          <Alert tone="info" icon={CalendarClock}>
            Your sends reset on {date(reset)}. The limit is checked again when the campaign goes out.
          </Alert>
        )}
        <div className="alert">
          <Globe />
          <div className="alert__body">
            <p className="alert__title">
              Times are in your timezone: {zone}
              {offset ? ` (${offset})` : ''}
            </p>
            <p>Taken from this browser. Subscribers get the email at that moment, wherever they are.</p>
          </div>
        </div>
        <p className="field__hint">
          Pick a time at least {MIN_SCHEDULE_BUFFER_MINUTES} minutes from now and no more than a year ahead (until{' '}
          {date(latest)}).
        </p>
      </form>
    </Modal>
  )
}

