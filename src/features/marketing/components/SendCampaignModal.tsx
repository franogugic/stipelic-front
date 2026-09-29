import { useState } from 'react'
import { FieldInput, GhostBtn, Modal, PrimaryBtn } from '../../../shared/ui/figma'
import type { CampaignComposer } from '../model/use-campaign-composer'
import type { CampaignDetail } from '../model/types'

const MIN_SCHEDULE_BUFFER_MINUTES = 2
const MAX_SCHEDULE_DAYS = 365
const SCHEDULE_RANGE_HINT = `Between ${MIN_SCHEDULE_BUFFER_MINUTES} minutes and ${MAX_SCHEDULE_DAYS} days from now.`

/** Converts a `datetime-local` input value (no timezone) to an ISO string in the user's local timezone. */
function localInputToIso(value: string): string | null {
  if (!value) return null
  const date = new Date(value)
  return Number.isNaN(date.getTime()) ? null : date.toISOString()
}

function scheduleError(value: string): string | undefined {
  const iso = localInputToIso(value)
  if (!iso) return undefined
  const time = new Date(iso).getTime()
  if (time < Date.now() + MIN_SCHEDULE_BUFFER_MINUTES * 60_000) {
    return `Scheduled time must be at least ${MIN_SCHEDULE_BUFFER_MINUTES} minutes from now.`
  }
  if (time > Date.now() + MAX_SCHEDULE_DAYS * 86_400_000) {
    return `Scheduled time cannot be more than ${MAX_SCHEDULE_DAYS} days from now.`
  }
  return undefined
}

/**
 * Confirmation step for sending a composed campaign: send right away, or pick a time to schedule it.
 * Shared by every screen that uses `useCampaignComposer`.
 */
export function SendCampaignModal({
  open,
  composer,
  onClose,
  onSent,
}: {
  open: boolean
  composer: CampaignComposer
  onClose: () => void
  onSent: (campaign: CampaignDetail) => void
}) {
  const [mode, setMode] = useState<'choose' | 'schedule'>('choose')
  const [scheduledAtLocal, setScheduledAtLocal] = useState('')
  const { isSending, sendError, recipientCount } = composer

  const count = recipientCount ?? 0
  const scheduledAtIso = localInputToIso(scheduledAtLocal)
  const timeError = scheduleError(scheduledAtLocal)
  const canSchedule = scheduledAtIso !== null && timeError === undefined

  const close = () => {
    setMode('choose')
    setScheduledAtLocal('')
    onClose()
  }

  const submit = async (scheduledAt?: string) => {
    const campaign = await composer.send(scheduledAt)
    if (campaign) {
      setMode('choose')
      setScheduledAtLocal('')
      onSent(campaign)
    }
  }

  return (
    <Modal
      open={open}
      title={`Send to ${count.toLocaleString()} subscriber${count === 1 ? '' : 's'}?`}
      onClose={close}
      dismissable={!isSending}
    >
      {mode === 'choose' ? (
        <>
          <p className="text-sm text-muted-foreground mb-5">
            Send it now, or schedule it for later. A sent campaign cannot be undone.
          </p>
          {sendError && (
            <p className="text-xs mb-3" style={{ color: 'var(--color-chart-4)' }}>
              {sendError}
            </p>
          )}
          <div className="flex gap-2">
            <PrimaryBtn className="flex-1 justify-center" loading={isSending} onClick={() => void submit()}>
              Send now
            </PrimaryBtn>
            <GhostBtn
              className="px-5"
              disabled={isSending}
              onClick={() => {
                composer.resetSendFeedback()
                setMode('schedule')
              }}
            >
              Schedule for later
            </GhostBtn>
          </div>
        </>
      ) : (
        <>
          <FieldInput
            label="Send at"
            type="datetime-local"
            value={scheduledAtLocal}
            onChange={setScheduledAtLocal}
            error={timeError}
          />
          <p className="text-[11px] text-muted-foreground mt-1.5 mb-5">
            {SCHEDULE_RANGE_HINT} The audience is resolved again at send time, so the final count can differ.
          </p>
          {sendError && (
            <p className="text-xs mb-3" style={{ color: 'var(--color-chart-4)' }}>
              {sendError}
            </p>
          )}
          <div className="flex gap-2">
            <PrimaryBtn
              className="flex-1 justify-center"
              loading={isSending}
              disabled={!canSchedule}
              onClick={() => scheduledAtIso && void submit(scheduledAtIso)}
            >
              Schedule
            </PrimaryBtn>
            <GhostBtn
              className="px-5"
              disabled={isSending}
              onClick={() => {
                composer.resetSendFeedback()
                setMode('choose')
              }}
            >
              Back
            </GhostBtn>
          </div>
        </>
      )}
    </Modal>
  )
}
