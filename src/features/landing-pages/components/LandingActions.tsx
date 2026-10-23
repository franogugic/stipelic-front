import { ArrowRight, CircleAlert, Lock, MailCheck, Pause } from 'lucide-react'
import { useEffect, useId, useState } from 'react'
import type { FormEvent } from 'react'

// The page's one call to action: the buy button (sales pages) or the email form (lead capture). Without handlers
// they are the editor preview's still pictures.

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/

export function BuyButton({
  label,
  inverted,
  onBuy,
}: {
  label: string
  inverted?: boolean
  /** Starts checkout; resolves an error message to show under this button, or null once it is redirecting. */
  onBuy?: () => Promise<string | null>
}) {
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const buy = async () => {
    if (!onBuy || busy) return
    setBusy(true)
    setError(null)
    const failure = await onBuy()
    if (failure) {
      setBusy(false)
      setError(failure)
    }
  }
  // Back from Stripe (the page restored from the browser cache): the button is usable again.
  useEffect(() => {
    const onPageShow = (event: PageTransitionEvent) => {
      if (event.persisted) setBusy(false)
    }
    window.addEventListener('pageshow', onPageShow)
    return () => window.removeEventListener('pageshow', onPageShow)
  }, [])
  const className = `lp__cta ${inverted ? 'lp__cta--inverted' : ''}`
  const content = (
    <>
      <span>{busy ? 'Opening checkout…' : label}</span>
      {!busy && <ArrowRight />}
    </>
  )
  return (
    <div className="lp-buy">
      {onBuy ? (
        <button className={className} type="button" aria-busy={busy || undefined} onClick={() => void buy()}>
          {content}
        </button>
      ) : (
        <span className={className}>{content}</span>
      )}
      {error ? (
        <span className="lp-form__error" role="alert">
          <CircleAlert />
          <span>{error}</span>
        </span>
      ) : (
        <span className="lp-buy__note">
          <Lock />
          Secure card checkout · Instant download
        </span>
      )}
    </div>
  )
}

type LeadState =
  | { kind: 'idle' }
  | { kind: 'invalid' }
  | { kind: 'submitting' }
  | { kind: 'success'; email: string }
  | { kind: 'closed' }
  | { kind: 'failed' }

export function LeadForm({
  label,
  inverted,
  brandName,
  productName,
  onSubmit,
}: {
  label: string
  inverted?: boolean
  brandName: string
  /** The document the page gives away; null for a plain newsletter sign-up (no email is sent). */
  productName?: string | null
  /** Resolves 'closed' when sign-ups are paused; rejects on any other failure. */
  onSubmit?: (email: string) => Promise<'success' | 'closed'>
}) {
  const id = useId()
  const [email, setEmail] = useState('')
  const [state, setState] = useState<LeadState>({ kind: 'idle' })

  if (state.kind === 'success' || state.kind === 'closed') {
    const success = state.kind === 'success'
    return (
      <div className={`lp-result lp-result--${success ? 'success' : 'closed'} ${inverted ? 'lp-result--inverted' : ''}`} role="status">
        <span className="lp-result__icon">{success ? <MailCheck /> : <Pause />}</span>
        <div>
          <p className="lp-result__title">{success ? (productName ? 'Check your inbox' : 'You’re on the list') : 'Sign-ups are paused'}</p>
          <p className="lp-result__text">
            {success ? (
              // The same calm message for a new and a repeat sign-up: the page never reveals who is on the list.
              productName ? (
                <>
                  Your download link for <strong>{productName}</strong> is on its way to <strong>{state.email}</strong>. Not there in a few minutes?
                  Check your spam folder.
                </>
              ) : (
                <>
                  Thanks — you’ll get {brandName}’s emails at <strong>{state.email}</strong>.
                </>
              )
            ) : (
              `${brandName} isn’t taking new sign-ups right now. Please check back soon.`
            )}
          </p>
        </div>
      </div>
    )
  }

  const submit = async (event: FormEvent) => {
    event.preventDefault()
    if (!onSubmit || state.kind === 'submitting') return
    const value = email.trim()
    if (!EMAIL_PATTERN.test(value)) {
      setState({ kind: 'invalid' })
      return
    }
    setState({ kind: 'submitting' })
    try {
      const result = await onSubmit(value)
      setState(result === 'closed' ? { kind: 'closed' } : { kind: 'success', email: value })
    } catch {
      setState({ kind: 'failed' })
    }
  }

  const busy = state.kind === 'submitting'
  const error =
    state.kind === 'invalid'
      ? 'Enter a full email address, like ana@example.com.'
      : state.kind === 'failed'
        ? 'Something went wrong. Please try again.'
        : null

  return (
    <form className={`lp-form ${inverted ? 'lp-form--inverted' : ''} ${error ? 'has-error' : ''}`} noValidate onSubmit={(event) => void submit(event)}>
      <label className="sr-only" htmlFor={id}>
        Email address
      </label>
      <div className="lp-form__row">
        <input
          className="lp-form__input"
          id={id}
          type="email"
          autoComplete="email"
          placeholder="you@example.com"
          value={email}
          readOnly={!onSubmit}
          tabIndex={onSubmit ? undefined : -1}
          disabled={busy}
          aria-invalid={error ? true : undefined}
          aria-describedby={error ? `${id}-error` : `${id}-hint`}
          onChange={(event) => {
            setEmail(event.target.value)
            if (state.kind === 'invalid' || state.kind === 'failed') setState({ kind: 'idle' })
          }}
        />
        <button className="lp__cta" type="submit" aria-busy={busy || undefined} tabIndex={onSubmit ? undefined : -1}>
          <span>{busy ? 'Sending…' : label}</span>
        </button>
      </div>
      {error ? (
        <p className="lp-form__error" id={`${id}-error`}>
          <CircleAlert />
          <span>{error}</span>
        </p>
      ) : (
        <p className="lp-form__note" id={`${id}-hint`}>
          Free · No spam · Unsubscribe any time
        </p>
      )}
    </form>
  )
}
