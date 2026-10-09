import { Archive, ArchiveRestore, ArrowLeft, Check, CircleAlert, FilePlus, LoaderCircle } from 'lucide-react'
import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { time } from '../../../shared/lib/format'
import { EmailPreview } from '../../../shared/ui/EmailPreview'
import {
  Alert,
  Button,
  Card,
  ConfirmDialog,
  Field,
  Input,
  PageHeader,
  Segmented,
  Textarea,
  useToast,
} from '../../../shared/ui/ledger'
import { useLeaveGuard } from '../../landing-pages/lib/use-leave-guard'
import { LeaveModal } from '../../landing-pages/components/editor/EditorDialogs'
import type { CreatorSettings } from '../../creators/model/types'
import {
  BODY_MAX_LENGTH,
  CTA_LABEL_MAX_LENGTH,
  CTA_URL_MAX_LENGTH,
  SUBJECT_MAX_LENGTH,
  TEMPLATE_NAME_MAX_LENGTH,
} from '../model/mail-content-rules'
import { useTemplateStore } from '../model/template-store'
import { sameDraft } from '../model/template-draft'
import type { TemplateDraft } from '../model/template-draft'
import type { EmailTemplate } from '../model/types'

function SaveStatus({ kind, savedAt }: { kind: 'new' | 'unsaved' | 'saving' | 'saved'; savedAt: string | null }) {
  if (kind === 'saving') {
    return (
      <span className="save-status save-status--saving" role="status">
        <LoaderCircle />
        Saving…
      </span>
    )
  }
  if (kind === 'unsaved') {
    return (
      <span className="save-status save-status--unsaved" role="status">
        <span className="save-status__dot" />
        Unsaved changes
      </span>
    )
  }
  if (kind === 'new') {
    return (
      <span className="save-status" role="status">
        <FilePlus />
        New template · not saved yet
      </span>
    )
  }
  return (
    <span className="save-status save-status--saved" role="status">
      <Check />
      {savedAt ? `Saved at ${time(savedAt)}` : 'Saved'}
    </span>
  )
}

const isWebUrl = (value: string) => /^https?:\/\/\S+$/i.test(value.trim())

/**
 * The editor for one template: a saved one (`template`), or a new one pre-filled from a starter or blank.
 * Mount with a new `key` per template, so the draft starts from what was loaded.
 */
export function TemplateEditor({
  slug,
  template,
  initial,
  eyebrow,
  creatorSettings,
  brandFallback,
  onChanged,
}: {
  slug: string
  template: EmailTemplate | null
  initial: TemplateDraft
  eyebrow: string
  creatorSettings: CreatorSettings | null
  brandFallback: string
  /** Called after archiving or restoring, so the page reloads the template. */
  onChanged: () => void
}) {
  const toast = useToast()
  const navigate = useNavigate()
  const saveTemplate = useTemplateStore((s) => s.saveTemplate)
  const saveStatus = useTemplateStore((s) => s.saveTemplateStatus)
  const saveError = useTemplateStore((s) => s.saveTemplateError)
  const resetSaveFeedback = useTemplateStore((s) => s.resetSaveTemplateFeedback)
  const archiveTemplateForSlug = useTemplateStore((s) => s.archiveTemplateForSlug)
  const archiveStatus = useTemplateStore((s) => s.archiveTemplateStatus)
  const archiveError = useTemplateStore((s) => s.archiveTemplateError)
  const resetArchiveFeedback = useTemplateStore((s) => s.resetArchiveTemplateFeedback)
  const restoreTemplateForSlug = useTemplateStore((s) => s.restoreTemplateForSlug)
  const restoreStatus = useTemplateStore((s) => s.restoreTemplateStatus)

  const [baseline, setBaseline] = useState(initial)
  const [draft, setDraft] = useState(initial)
  const [savedAt, setSavedAt] = useState<string | null>(null)
  const [attempted, setAttempted] = useState(false)
  const [device, setDevice] = useState<'desktop' | 'mobile'>('desktop')
  const [confirmArchive, setConfirmArchive] = useState(false)
  const [leaveTo, setLeaveTo] = useState<string | null>(null)

  const archived = template?.status === 'Archived'
  const saving = saveStatus === 'submitting'
  const dirty = !sameDraft(draft, baseline)
  useLeaveGuard(dirty && !archived, (path) => setLeaveTo(path))

  const change = (patch: Partial<TemplateDraft>) => {
    setDraft((current) => ({ ...current, ...patch }))
    if (saveError) resetSaveFeedback()
  }

  const errors = {
    name: draft.name.trim() ? null : 'Name your template.',
    subject: draft.subject.trim() ? null : 'Add a subject.',
    bodyText: draft.bodyText.trim() ? null : 'Write a message.',
    ctaLabel: draft.withButton && !draft.ctaLabel.trim() ? 'Add the button text.' : null,
    ctaUrl: !draft.withButton
      ? null
      : !draft.ctaUrl.trim()
        ? 'Add the button link.'
        : isWebUrl(draft.ctaUrl)
          ? null
          : 'Use a link that starts with http:// or https://.',
  }
  const valid = Object.values(errors).every((error) => error === null)
  const shown = (error: string | null) => (attempted ? (error ?? undefined) : undefined)

  /** Saves; `thenGoTo` is where the user was headed when they chose "Save and leave". */
  const save = async (thenGoTo?: string): Promise<boolean> => {
    setAttempted(true)
    if (!valid || saving || archived) return false
    const saved = await saveTemplate(slug, template?.publicId ?? null, {
      name: draft.name.trim(),
      subject: draft.subject.trim(),
      bodyText: draft.bodyText,
      ctaLabel: draft.withButton ? draft.ctaLabel.trim() : null,
      ctaUrl: draft.withButton ? draft.ctaUrl.trim() : null,
    })
    if (!saved) return false
    setBaseline(draft)
    setSavedAt(saved.updatedAt)
    toast({ tone: 'success', title: template ? 'Template saved' : 'Template created' })
    // The draft now matches what was saved, so the guard is already off when we leave.
    if (thenGoTo) navigate(thenGoTo)
    else if (!template) navigate(`/app/${slug}/emails/templates/${saved.publicId}`, { replace: true })
    return true
  }

  const archive = async () => {
    if (!template) return
    if (!(await archiveTemplateForSlug(slug, template.publicId))) return
    setConfirmArchive(false)
    toast({ tone: 'success', title: 'Template archived' })
    onChanged()
  }

  const restore = async () => {
    if (!template) return
    if (await restoreTemplateForSlug(slug, template.publicId)) {
      toast({ tone: 'success', title: 'Template restored' })
      onChanged()
    } else {
      toast({ tone: 'danger', title: useTemplateStore.getState().restoreTemplateError ?? 'We could not restore this template.' })
    }
  }

  const status = saving ? 'saving' : !template && !dirty ? 'new' : dirty ? 'unsaved' : template ? 'saved' : 'new'
  const brandName = creatorSettings?.brandName || brandFallback
  const showButton = draft.withButton && draft.ctaLabel.trim().length > 0

  return (
    <>
      <PageHeader
        eyebrow={eyebrow}
        title={draft.name.trim() || 'Untitled template'}
        actions={
          <>
            <Button variant="ghost" icon={ArrowLeft} to={`/app/${slug}/emails/templates`}>
              Back
            </Button>
            {!archived && <SaveStatus kind={status} savedAt={savedAt} />}
            {template && !archived && (
              <Button
                variant="danger-ghost"
                icon={Archive}
                onClick={() => {
                  resetArchiveFeedback()
                  setConfirmArchive(true)
                }}
              >
                Archive
              </Button>
            )}
            {archived && (
              <Button variant="secondary" icon={ArchiveRestore} loading={restoreStatus === 'submitting'} onClick={() => void restore()}>
                Restore
              </Button>
            )}
            <Button
              variant="primary"
              icon={Check}
              loading={saving}
              disabledReason={archived ? 'Restore the template to edit it' : undefined}
              onClick={() => void save()}
            >
              {template ? 'Save template' : 'Create template'}
            </Button>
          </>
        }
      />
      {archived && (
        <div className="alert alert--warning editor__notice">
          <Archive />
          <div className="alert__body">
            <p className="alert__title">This template is archived</p>
            <p>It isn’t offered in new campaigns. Restore it to edit and use it again.</p>
          </div>
        </div>
      )}
      {saveError && (
        <Alert tone="danger" icon={CircleAlert} live>
          {saveError}
        </Alert>
      )}
      <div className="grid grid--2 grid--gap-lg">
        <Card title="Content">
          <div className="form">
            <Field label="Template name" hint="Only you see this." error={shown(errors.name)}>
              {(control) => (
                <Input
                  {...control}
                  disabled={archived}
                  maxLength={TEMPLATE_NAME_MAX_LENGTH}
                  value={draft.name}
                  onChange={(event) => change({ name: event.target.value })}
                />
              )}
            </Field>
            <Field label="Subject" error={shown(errors.subject)}>
              {(control) => (
                <Input
                  {...control}
                  disabled={archived}
                  maxLength={SUBJECT_MAX_LENGTH}
                  value={draft.subject}
                  onChange={(event) => change({ subject: event.target.value })}
                />
              )}
            </Field>
            <Field
              label="Message"
              hint="Text in {curly braces} is a reminder to replace before sending — it isn’t filled in automatically."
              error={shown(errors.bodyText)}
            >
              {(control) => (
                <Textarea
                  {...control}
                  rows={9}
                  disabled={archived}
                  maxLength={BODY_MAX_LENGTH}
                  value={draft.bodyText}
                  onChange={(event) => change({ bodyText: event.target.value })}
                />
              )}
            </Field>
            <label className="switch-row">
              <span className="switch-row__text">
                <span className="switch-row__label">Add a button</span>
                <span className="switch-row__hint">One clear link under your message.</span>
              </span>
              <input
                className="switch"
                type="checkbox"
                role="switch"
                disabled={archived}
                checked={draft.withButton}
                onChange={(event) => change({ withButton: event.target.checked })}
              />
            </label>
            {draft.withButton && (
              <div className="form-row">
                <Field label="Button text" error={shown(errors.ctaLabel)}>
                  {(control) => (
                    <Input
                      {...control}
                      disabled={archived}
                      maxLength={CTA_LABEL_MAX_LENGTH}
                      value={draft.ctaLabel}
                      onChange={(event) => change({ ctaLabel: event.target.value })}
                    />
                  )}
                </Field>
                <Field label="Button link" error={shown(errors.ctaUrl)}>
                  {(control) => (
                    <Input
                      {...control}
                      type="url"
                      placeholder="https://"
                      disabled={archived}
                      maxLength={CTA_URL_MAX_LENGTH}
                      value={draft.ctaUrl}
                      onChange={(event) => change({ ctaUrl: event.target.value })}
                    />
                  )}
                </Field>
              </div>
            )}
          </div>
        </Card>
        <Card
          title="Live preview"
          subtitle="Updates as you type"
          action={
            <Segmented
              label="Preview size"
              options={[
                { value: 'desktop', label: 'Desktop' },
                { value: 'mobile', label: 'Mobile' },
              ]}
              value={device}
              onChange={(value) => setDevice(value as 'desktop' | 'mobile')}
            />
          }
        >
          <EmailPreview
            brandName={brandName}
            supportEmail={creatorSettings?.supportEmail ?? ''}
            brandColor={creatorSettings?.primaryColor || '#CDF24B'}
            subject={draft.subject}
            body={draft.bodyText}
            button={showButton ? { label: draft.ctaLabel.trim() } : undefined}
            device={device}
          />
        </Card>
      </div>

      <ConfirmDialog
        open={confirmArchive}
        title={`Archive “${template?.name ?? ''}”?`}
        text="It disappears from the template list in new campaigns. Campaigns that already used it aren’t affected. You can restore it any time."
        confirmLabel="Archive template"
        tone="warning"
        icon={Archive}
        busy={archiveStatus === 'submitting'}
        onCancel={() => setConfirmArchive(false)}
        onConfirm={() => void archive()}
      >
        {archiveError && <p className="field__error">{archiveError}</p>}
      </ConfirmDialog>
      <LeaveModal
        open={leaveTo !== null}
        title={draft.name.trim() || 'Untitled template'}
        saving={saving}
        onKeepEditing={() => setLeaveTo(null)}
        onDiscard={() => {
          const to = leaveTo
          // Leave without the guard: the changes are being thrown away.
          setDraft(baseline)
          setLeaveTo(null)
          if (to) navigate(to)
        }}
        onSaveAndLeave={async () => {
          const to = leaveTo
          // A failed save keeps the dialog's changes in place: close it and let the error show on the page.
          await save(to ?? undefined)
          setLeaveTo(null)
        }}
      />
    </>
  )
}
