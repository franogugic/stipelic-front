import { FilePlus, LayoutTemplate } from 'lucide-react'
import { useState } from 'react'
import type { FormEvent } from 'react'
import { Alert, Button, Field, Input, Modal, SkeletonBlock } from '../../../shared/ui/ledger'
import { TEMPLATE_NAME_MAX_LENGTH } from '../model/mail-content-rules'
import type { EmailTemplateStarter } from '../model/types'

const FORM_ID = 'new-template-form'
const BLANK = 'blank'

/** The little email on a starter card: its subject, the first lines of the message and the button. */
function StarterPreview({ starter }: { starter: EmailTemplateStarter }) {
  const lines = starter.bodyText.split('\n').filter((line) => line.trim()).slice(0, 3)
  return (
    <span className="starter__preview" aria-hidden="true">
      <span className="starter__subject">{starter.subject}</span>
      {lines.map((line, index) => (
        <span className="starter__line" key={index}>
          {line}
        </span>
      ))}
      {starter.ctaLabel && <span className="starter__button">{starter.ctaLabel}</span>}
    </span>
  )
}

/** "New template": a name and a starting point (blank or a starter). Mount with a new `key` per opening. */
export function NewTemplateModal({
  open,
  starters,
  startersStatus,
  onClose,
  onCreate,
}: {
  open: boolean
  starters: EmailTemplateStarter[]
  startersStatus: 'idle' | 'loading' | 'success' | 'error'
  onClose: () => void
  /** `starter` is the starter's key, or null for a blank template. */
  onCreate: (name: string, starter: string | null) => void
}) {
  const [name, setName] = useState('')
  const [picked, setPicked] = useState<string | null>(null)
  const [nameError, setNameError] = useState<string | null>(null)
  // Until the user picks, the first starter is selected (the blank card when there are none).
  const selected = picked ?? starters[0]?.key ?? BLANK

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (!name.trim()) {
      setNameError('Name your template.')
      return
    }
    onCreate(name.trim(), selected === BLANK ? null : selected)
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      size="lg"
      title="New template"
      description="Reusable starting points for your campaigns. You can change everything after creating it."
      icon={LayoutTemplate}
      tone="accent"
      actions={
        <>
          <Button variant="secondary" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID}>
            Create template
          </Button>
        </>
      }
    >
      <form className="form" id={FORM_ID} noValidate onSubmit={submit}>
        <Field label="Template name" error={nameError ?? undefined}>
          {(control) => (
            <Input
              {...control}
              placeholder="e.g. Product launch"
              maxLength={TEMPLATE_NAME_MAX_LENGTH}
              value={name}
              onChange={(event) => {
                setName(event.target.value)
                setNameError(null)
              }}
            />
          )}
        </Field>
        <fieldset className="form-group">
          <legend className="field__label">Start from</legend>
          {startersStatus === 'error' && (
            <Alert tone="warning" icon={LayoutTemplate}>
              Couldn’t load the starter templates. You can still start from a blank one.
            </Alert>
          )}
          {startersStatus === 'loading' || startersStatus === 'idle' ? (
            <SkeletonBlock />
          ) : (
            <div className="starters">
              {starters.map((starter) => (
                <label className="choice starter" key={starter.key}>
                  <input
                    className="choice__input"
                    type="radio"
                    name="starter"
                    value={starter.key}
                    checked={selected === starter.key}
                    onChange={() => setPicked(starter.key)}
                  />
                  <StarterPreview starter={starter} />
                  <span className="choice__title">{starter.name}</span>
                </label>
              ))}
              <label className="choice starter">
                <input
                  className="choice__input"
                  type="radio"
                  name="starter"
                  value={BLANK}
                  checked={selected === BLANK}
                  onChange={() => setPicked(BLANK)}
                />
                <span className="starter__preview starter__preview--blank" aria-hidden="true">
                  <FilePlus />
                </span>
                <span className="choice__title">Blank</span>
                <span className="choice__text">Start with an empty template.</span>
              </label>
            </div>
          )}
        </fieldset>
      </form>
    </Modal>
  )
}
