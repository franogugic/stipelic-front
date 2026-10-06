import { CircleAlert, Hourglass, Mail, MailCheck, Pencil, RotateCw, Check } from 'lucide-react'
import { useCallback, useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { ApiError } from '../../../../shared/api/http-client'
import { dateTime, initials } from '../../../../shared/lib/format'
import {
  Alert,
  Avatar,
  Button,
  Card,
  Field,
  Input,
  Modal,
  StatusBadge,
  useToast,
} from '../../../../shared/ui/ledger'
import {
  cancelEmailChange,
  getPendingEmailChange,
  requestEmailChange,
  resendEmailChange,
  updateProfile,
} from '../../../auth/api/auth-api'
import { useAuthStore } from '../../../auth/model/auth-store'
import type { PendingEmailChange } from '../../../auth/model/types'

const NAME_MIN = 2
const NAME_MAX = 50
// What the API accepts in a name: letters, spaces, hyphens and apostrophes.
const NAME_CHARACTERS = /^[\p{L} '-]+$/u
const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const PENDING_TOOLTIP = 'Finish or cancel the pending change first'

function nameError(label: string, value: string) {
  const length = value.trim().length
  if (length < NAME_MIN) return `${label} needs at least ${NAME_MIN} characters.`
  if (length > NAME_MAX) return `${label} can be up to ${NAME_MAX} characters.`
  if (!NAME_CHARACTERS.test(value.trim())) return `${label} can only contain letters, spaces, hyphens and apostrophes.`
  return undefined
}

/** Settings → Profile: the name, and the email address with its pending-change flow. */
export function ProfileTab() {
  const user = useAuthStore((s) => s.currentUser)
  if (!user) return null
  return (
    <div className="settings-grid">
      <ProfileCard firstName={user.firstName} lastName={user.lastName} />
      <EmailCard email={user.email} verified={user.isEmailVerified !== false} />
    </div>
  )
}

function ProfileCard({ firstName: savedFirst, lastName: savedLast }: { firstName: string; lastName: string }) {
  const toast = useToast()
  const applyCurrentUser = useAuthStore((s) => s.applyCurrentUser)
  const [firstName, setFirstName] = useState(savedFirst)
  const [lastName, setLastName] = useState(savedLast)
  const [submitted, setSubmitted] = useState(false)
  const [saving, setSaving] = useState(false)
  const [requestError, setRequestError] = useState<string | null>(null)

  const errors = { firstName: nameError('First name', firstName), lastName: nameError('Last name', lastName) }
  const dirty = firstName.trim() !== savedFirst || lastName.trim() !== savedLast

  const save = async (event: FormEvent) => {
    event.preventDefault()
    setSubmitted(true)
    if (saving || !dirty || errors.firstName || errors.lastName) return
    setSaving(true)
    setRequestError(null)
    try {
      const user = await updateProfile({ firstName, lastName })
      applyCurrentUser(user)
      setFirstName(user.firstName)
      setLastName(user.lastName)
      setSubmitted(false)
      toast({ tone: 'success', title: 'Profile saved' })
    } catch (error) {
      setRequestError(error instanceof ApiError ? error.message : 'We couldn’t save your profile. Please try again.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <Card title="Profile">
      <form className="form" noValidate onSubmit={(event) => void save(event)}>
        <div className="cluster cluster--lg">
          <Avatar size="xl">{initials(`${savedFirst} ${savedLast}`)}</Avatar>
          <div className="stack stack--xs">
            <strong>
              {savedFirst} {savedLast}
            </strong>
            <span className="text-sm text-muted">Your avatar uses your initials.</span>
          </div>
        </div>
        {requestError && (
          <Alert tone="danger" icon={CircleAlert} live>
            {requestError}
          </Alert>
        )}
        <div className="form-row">
          <Field label="First name" error={submitted ? errors.firstName : undefined}>
            {(control) => (
              <Input
                {...control}
                value={firstName}
                autoComplete="given-name"
                maxLength={NAME_MAX + 10}
                onChange={(event) => setFirstName(event.target.value)}
              />
            )}
          </Field>
          <Field label="Last name" error={submitted ? errors.lastName : undefined}>
            {(control) => (
              <Input
                {...control}
                value={lastName}
                autoComplete="family-name"
                maxLength={NAME_MAX + 10}
                onChange={(event) => setLastName(event.target.value)}
              />
            )}
          </Field>
        </div>
        <div className="cluster cluster--end">
          <Button
            variant="primary"
            icon={Check}
            type="submit"
            loading={saving}
            disabledReason={dirty ? undefined : 'No changes to save.'}
          >
            Save profile
          </Button>
        </div>
      </form>
    </Card>
  )
}

function EmailCard({ email, verified }: { email: string; verified: boolean }) {
  const toast = useToast()
  const [pending, setPending] = useState<PendingEmailChange | null>(null)
  const [pendingLoaded, setPendingLoaded] = useState(false)
  const [busy, setBusy] = useState<'resend' | 'cancel' | null>(null)
  const [changeOpen, setChangeOpen] = useState(false)
  const [changeKey, setChangeKey] = useState(0)
  const [sentTo, setSentTo] = useState<string | null>(null)

  const loadPending = useCallback(async () => {
    try {
      setPending(await getPendingEmailChange())
    } catch {
      setPending(null)
    } finally {
      setPendingLoaded(true)
    }
  }, [])

  useEffect(() => {
    let active = true
    getPendingEmailChange()
      .then((change) => active && setPending(change))
      .catch(() => active && setPending(null))
      .finally(() => active && setPendingLoaded(true))
    return () => {
      active = false
    }
  }, [])

  const resend = async () => {
    if (!pending || busy) return
    setBusy('resend')
    try {
      await resendEmailChange()
      toast({ tone: 'success', title: 'Link sent again', message: `Check ${pending.newEmail}.` })
      await loadPending()
    } catch (error) {
      toast({
        tone: 'danger',
        title: error instanceof ApiError ? error.message : 'We couldn’t send the link again. Please try again.',
      })
      await loadPending()
    } finally {
      setBusy(null)
    }
  }

  const cancel = async () => {
    if (busy) return
    setBusy('cancel')
    try {
      await cancelEmailChange()
      setPending(null)
      toast({ tone: 'success', title: 'Email change cancelled' })
    } catch (error) {
      toast({
        tone: 'danger',
        title: error instanceof ApiError ? error.message : 'We couldn’t cancel the change. Please try again.',
      })
    } finally {
      setBusy(null)
    }
  }

  const openChange = () => {
    setChangeKey((key) => key + 1)
    setChangeOpen(true)
  }

  return (
    <>
      <Card title="Email address" subtitle="Changing it needs your password and a link sent to the new address.">
        <div className="stack">
          <div className="email-row">
            <span className="email-row__icon">
              <Mail />
            </span>
            <div className="stack stack--xs email-row__text">
              <strong>{email}</strong>
              <span className="text-xs text-muted">For logging in and account emails</span>
            </div>
            {verified && <StatusBadge kind="subscriber" value="active" label="Verified" />}
          </div>
          {pending && (
            <Alert tone="warning" icon={Hourglass} title="Waiting for confirmation" live>
              We sent a link to <strong>{pending.newEmail}</strong>. Your email stays {email} until you click it. The
              link expires on {dateTime(pending.expiresAt)}.
              <div className="cluster cluster--sm">
                <Button variant="secondary" icon={RotateCw} loading={busy === 'resend'} onClick={() => void resend()}>
                  Resend link
                </Button>
                <Button variant="ghost" loading={busy === 'cancel'} onClick={() => void cancel()}>
                  Cancel change
                </Button>
              </div>
            </Alert>
          )}
          <div>
            <Button
              variant="secondary"
              icon={Pencil}
              disabledReason={pending || !pendingLoaded ? (pending ? PENDING_TOOLTIP : undefined) : undefined}
              disabled={!pendingLoaded}
              onClick={openChange}
            >
              Change email
            </Button>
          </div>
        </div>
      </Card>

      {changeKey > 0 && (
        <ChangeEmailModal
          key={changeKey}
          open={changeOpen}
          currentEmail={email}
          onClose={() => setChangeOpen(false)}
          onSent={(newEmail) => {
            setChangeOpen(false)
            setSentTo(newEmail)
            void loadPending()
          }}
        />
      )}

      <Modal
        open={sentTo !== null}
        onClose={() => setSentTo(null)}
        title="Check your new inbox"
        description={`We sent a confirmation link to ${sentTo ?? ''}.`}
        icon={MailCheck}
        tone="accent"
        size="sm"
        actions={
          <Button variant="primary" onClick={() => setSentTo(null)}>
            Done
          </Button>
        }
      >
        <p className="text-secondary">
          Click it within 24 hours to finish. Until then you keep logging in with {email} — and we’ll let that address
          know about the change.
        </p>
      </Modal>
    </>
  )
}

const FORM_ID = 'change-email-form'

function ChangeEmailModal({
  open,
  currentEmail,
  onClose,
  onSent,
}: {
  open: boolean
  currentEmail: string
  onClose: () => void
  onSent: (newEmail: string) => void
}) {
  const [newEmail, setNewEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState<{ email?: string; password?: string }>({})
  const [requestError, setRequestError] = useState<string | null>(null)
  const [submitting, setSubmitting] = useState(false)

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (submitting) return
    const trimmed = newEmail.trim()
    const found: { email?: string; password?: string } = {}
    if (!EMAIL_PATTERN.test(trimmed)) found.email = 'Enter a valid email address.'
    else if (trimmed.toLowerCase() === currentEmail.toLowerCase()) found.email = 'This is already your email address.'
    if (!password) found.password = 'Enter your current password.'
    setErrors(found)
    setRequestError(null)
    if (found.email || found.password) return

    setSubmitting(true)
    try {
      await requestEmailChange({ newEmail: trimmed, currentPassword: password })
      onSent(trimmed.toLowerCase())
    } catch (error) {
      if (error instanceof ApiError && error.status === 400) {
        // The API answers 400 for a wrong password and for an unusable address; tell them apart by the message.
        if (/password/i.test(error.message)) setErrors({ password: 'That password isn’t right. Try again.' })
        else setErrors({ email: error.message })
      } else {
        setRequestError(error instanceof ApiError ? error.message : 'We couldn’t send the link. Please try again.')
      }
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <Modal
      open={open}
      onClose={onClose}
      dismissible={!submitting}
      title="Change email"
      description="We’ll send a confirmation link to the new address. Nothing changes until you click it."
      icon={Mail}
      size="sm"
      actions={
        <>
          <Button variant="secondary" disabled={submitting} onClick={onClose}>
            Cancel
          </Button>
          <Button variant="primary" type="submit" form={FORM_ID} loading={submitting}>
            Send confirmation link
          </Button>
        </>
      }
    >
      <form className="form" id={FORM_ID} noValidate onSubmit={(event) => void submit(event)}>
        {requestError && (
          <Alert tone="danger" icon={CircleAlert} live>
            {requestError}
          </Alert>
        )}
        <Field label="New email" error={errors.email}>
          {(control) => (
            <Input
              {...control}
              type="email"
              autoComplete="email"
              inputMode="email"
              value={newEmail}
              onChange={(event) => setNewEmail(event.target.value)}
            />
          )}
        </Field>
        <Field label="Current password" error={errors.password} hint={errors.password ? undefined : 'To confirm it’s really you.'}>
          {(control) => (
            <Input
              {...control}
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
            />
          )}
        </Field>
      </form>
    </Modal>
  )
}
