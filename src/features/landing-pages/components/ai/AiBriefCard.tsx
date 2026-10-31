import { ArrowLeft, ArrowRight, CircleAlert, Gauge, Gift, Info, MailPlus, Plus, Sparkles, WandSparkles } from 'lucide-react'
import type { ReactNode } from 'react'
import { number, date } from '../../../../shared/lib/format'
import { Alert, Button, Field, Input, Segmented, Textarea } from '../../../../shared/ui/ledger'
import { fileMeta } from '../../../products/model/product-file'
import type { Product } from '../../../products/model/types'
import { AI_LANGUAGES, AI_MAX, AI_STEPS, AI_TONES, usageLine } from '../../model/ai-draft'
import type { AiBrief, AiFailure, AiGoal, AiUsage, BriefErrors } from '../../model/ai-draft'

const GOALS: Array<{ value: AiGoal; icon: typeof MailPlus; title: string; text: string }> = [
  { value: 'capture', icon: MailPlus, title: 'Collect emails', text: 'People sign up for your newsletter or updates.' },
  { value: 'free_product', icon: Gift, title: 'Give away a free document', text: 'People leave their email and get one of your free products.' },
]

const BENEFIT_EXAMPLES = ['e.g. A five-step grading routine', 'e.g. Natural skin tones in strong sun', 'e.g. Before-and-after examples']

/** Above the form: why the last try did not give a draft, or why one cannot start. Nothing here ever says "used". */
function AiAlert({
  usage,
  failure,
  showMissing,
  paymentsOn,
  onRetry,
  settingsPath,
}: {
  usage: AiUsage | null
  failure: AiFailure | null
  showMissing: boolean
  paymentsOn: boolean
  onRetry: () => void
  settingsPath: string
}) {
  if (usage && usage.used >= usage.limit) {
    return (
      <Alert tone="warning" icon={Sparkles} live className="ai-card__alert" title={`You’ve used all ${number(usage.limit)} generations this month`}>
        {usage.resetsAt ? `They reset on ${date(usage.resetsAt)}. ` : ''}Until then, build the page from scratch — your answers stay here.
        {paymentsOn && (
          <div className="cluster">
            <Button variant="ghost" icon={Gauge} to={`${settingsPath}?tab=billing`}>
              Upgrade plan
            </Button>
          </div>
        )}
      </Alert>
    )
  }
  if (failure?.kind === 'limit') {
    return (
      <Alert tone="warning" icon={Sparkles} live className="ai-card__alert" title="You’ve used all your generations this month">
        {failure.resetsAt ? `They reset on ${date(failure.resetsAt)}. ` : ''}Nothing was used by this try. Until then, build the page from scratch.
        {paymentsOn && (
          <div className="cluster">
            <Button variant="ghost" icon={Gauge} to={`${settingsPath}?tab=billing`}>
              Upgrade plan
            </Button>
          </div>
        )}
      </Alert>
    )
  }
  if (failure?.kind === 'page-limit') {
    return (
      <Alert tone="warning" icon={Gauge} live className="ai-card__alert" title="You’ve used all the landing pages on your plan">
        Archive a page you no longer need to make room for this one. Nothing was used.
        {paymentsOn && (
          <div className="cluster">
            <Button variant="ghost" icon={Gauge} to={`${settingsPath}?tab=billing`}>
              Upgrade plan
            </Button>
          </div>
        )}
      </Alert>
    )
  }
  if (failure?.kind === 'refused') {
    return (
      <Alert tone="danger" icon={CircleAlert} live className="ai-card__alert" title="Luma can’t write this page">
        {failure.explanation} Your generation wasn’t used.
      </Alert>
    )
  }
  if (failure?.kind === 'failed') {
    return (
      <Alert
        tone="danger"
        icon={CircleAlert}
        live
        className="ai-card__alert"
        title="We couldn’t finish this draft"
        action={
          <div className="cluster">
            <Button variant="primary" onClick={onRetry}>
              Try again
            </Button>
          </div>
        }
      >
        Something went wrong while it was being written, so nothing was saved and your generation wasn’t used. Your answers are all still here.
      </Alert>
    )
  }
  if (failure?.kind === 'rate-limited') {
    return (
      <Alert tone="warning" icon={CircleAlert} live className="ai-card__alert" title="Too many tries in a minute">
        Wait a minute, then try again. Nothing was used.
      </Alert>
    )
  }
  if (failure?.kind === 'other') {
    return (
      <Alert tone="danger" icon={CircleAlert} live className="ai-card__alert" title="We couldn’t write the page">
        {failure.message} Nothing was used.
      </Alert>
    )
  }
  if (showMissing) {
    return (
      <Alert tone="danger" icon={CircleAlert} live className="ai-card__alert" title="A few answers are missing">
        Fill in the fields marked below to continue.
      </Alert>
    )
  }
  return null
}

function AiField({
  label,
  value,
  onChange,
  max,
  error,
  hint,
  placeholder,
  rows,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  max: number
  error?: string
  hint?: ReactNode
  placeholder?: string
  rows?: number
}) {
  return (
    <Field label={label} error={error} hint={error ? undefined : hint}>
      {(control) =>
        rows ? (
          <Textarea {...control} rows={rows} value={value} maxLength={max} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        ) : (
          <Input {...control} value={value} maxLength={max} placeholder={placeholder} onChange={(event) => onChange(event.target.value)} />
        )
      }
    </Field>
  )
}

function StepOne({ brief, errors, onChange }: { brief: AiBrief; errors: BriefErrors; onChange: (change: Partial<AiBrief>) => void }) {
  return (
    <>
      <fieldset className="ai-step">
        <legend className="ai-step__title">What should the page do?</legend>
        <div className="ai-types" role="radiogroup" aria-label="Goal">
          {GOALS.map(({ value, icon: Icon, title, text }) => (
            <label className="choice" key={value}>
              <input className="choice__input" type="radio" name="ai-goal" value={value} checked={brief.goal === value} onChange={() => onChange({ goal: value, productId: null })} />
              <span className="cluster cluster--nowrap">
                <Icon className="choice__icon" />
                <span className="stack stack--xs">
                  <span className="choice__title">{title}</span>
                  <span className="text-xs text-muted">{text}</span>
                </span>
              </span>
            </label>
          ))}
        </div>
        <p className="quiet-note">
          <Info />
          <span>The AI writes pages that collect emails. For a page that sells a product, start from scratch.</span>
        </p>
      </fieldset>
      <AiField
        label="Page title"
        value={brief.title}
        onChange={(title) => onChange({ title })}
        max={AI_MAX.title}
        error={errors.title}
        placeholder={brief.goal === 'capture' ? 'e.g. Studio notes' : 'e.g. Free colour grading guide'}
        hint="Shown in the browser tab and when the link is shared. You can change it later."
      />
    </>
  )
}

function StepTwo({
  brief,
  errors,
  products,
  productsStatus,
  newProductPath,
  onChange,
}: {
  brief: AiBrief
  errors: BriefErrors
  products: Product[]
  productsStatus: 'loading' | 'error' | 'success'
  newProductPath: string
  onChange: (change: Partial<AiBrief>) => void
}) {
  let offer: ReactNode
  if (brief.goal === 'capture') {
    offer = (
      <AiField
        label="What do subscribers get?"
        value={brief.offer}
        onChange={(offerText) => onChange({ offer: offerText })}
        max={AI_MAX.offer}
        rows={3}
        error={errors.offer}
        placeholder="e.g. Monthly studio notes: one technique, one story from a client project and one free preset."
        hint="What they sign up for, in a sentence or two."
      />
    )
  } else if (productsStatus === 'loading') {
    offer = <p className="text-sm text-muted">Loading your free products…</p>
  } else if (productsStatus === 'error') {
    offer = (
      <Alert tone="danger" icon={CircleAlert} live title="We couldn’t load your products">
        Reload the page to try again.
      </Alert>
    )
  } else if (products.length === 0) {
    offer = (
      <div className="field">
        <span className="field__label">Which free document do they get?</span>
        <Alert
          tone="warning"
          icon={Gift}
          live
          title="You have no free products yet"
          action={
            <div className="cluster">
              <Button variant="secondary" icon={Plus} to={newProductPath}>
                Add a free product
              </Button>
              <Button variant="ghost" icon={MailPlus} onClick={() => onChange({ goal: 'capture', productId: null })}>
                Collect emails instead
              </Button>
            </div>
          }
        >
          <p>Add a product with the price set to 0 and upload its file — then the AI can write a page that gives it away. Or collect emails without a document.</p>
        </Alert>
      </div>
    )
  } else {
    offer = (
      <div className={`field${errors.productId ? ' has-error' : ''}`}>
        <span className="field__label" id="ai-product-label">
          Which free document do they get?
        </span>
        <div className="option-list" role="radiogroup" aria-labelledby="ai-product-label" aria-describedby={errors.productId ? 'ai-product-error' : undefined}>
          <div className="option-list__group">
            {products.map((product) => (
              <label className="option-row" key={product.publicId}>
                <input className="option-row__input" type="radio" name="ai-product" value={product.publicId} checked={brief.productId === product.publicId} onChange={() => onChange({ productId: product.publicId })} />
                <span className="option-row__radio" aria-hidden="true" />
                <span className="option-row__text">
                  <span className="option-row__title">{product.name}</span>
                  <span className="option-row__meta">
                    {product.fileName && product.fileSizeBytes !== null ? fileMeta({ fileName: product.fileName, fileSizeBytes: product.fileSizeBytes }) : 'No file yet — upload it before you publish'}
                  </span>
                </span>
                <span className="option-row__count">{product.status === 'Draft' ? 'Draft' : 'Free'}</span>
              </label>
            ))}
          </div>
        </div>
        {errors.productId ? (
          <p className="field__error" id="ai-product-error">
            <CircleAlert />
            <span>{errors.productId}</span>
          </p>
        ) : (
          <p className="field__hint">The AI reads its name and description. Everyone who signs up gets a personal link to download it.</p>
        )}
      </div>
    )
  }
  return (
    <>
      <AiField
        label="Who is it for?"
        value={brief.audience}
        onChange={(audience) => onChange({ audience })}
        max={AI_MAX.audience}
        rows={2}
        error={errors.audience}
        placeholder="e.g. Hobby photographers who shoot on the coast while travelling"
        hint="The more specific, the better the page speaks to them."
      />
      {offer}
    </>
  )
}

function StepThree({ brief, errors, onChange }: { brief: AiBrief; errors: BriefErrors; onChange: (change: Partial<AiBrief>) => void }) {
  const setBenefit = (index: number, value: string) => {
    const benefits = [...brief.benefits] as AiBrief['benefits']
    benefits[index] = value
    onChange({ benefits })
  }
  return (
    <>
      <AiField
        label="Your brand"
        value={brief.brand}
        onChange={(brand) => onChange({ brand })}
        max={AI_MAX.brand}
        error={errors.brand}
        placeholder="e.g. MH Studio — photography and brand design from Split"
        hint="Your name and a line about you."
      />
      <div className="field">
        <span className="field__label" id="ai-tone-label">
          Tone
        </span>
        <div className="ai-tone">
          <Segmented label="Tone" name="ai-tone" options={AI_TONES} value={brief.tone} onChange={(tone) => onChange({ tone: tone as AiBrief['tone'] })} />
        </div>
      </div>
      <fieldset className="form-group ai-benefits">
        <legend className="field__label">
          Three benefits <span className="field__optional">what people get out of it</span>
        </legend>
        <ol className="ai-benefits__list" role="list">
          {brief.benefits.map((benefit, index) => {
            const error = errors[`benefit${index}` as 'benefit0']
            return (
              <li key={index}>
                <input
                  className="input"
                  id={`ai-benefit-${index}`}
                  value={benefit}
                  maxLength={AI_MAX.benefit}
                  aria-label={`Benefit ${index + 1}`}
                  placeholder={BENEFIT_EXAMPLES[index]}
                  aria-invalid={error ? true : undefined}
                  aria-describedby={error ? `ai-benefit-${index}-error` : undefined}
                  onChange={(event) => setBenefit(index, event.target.value)}
                />
                {error && (
                  <p className="field__error" id={`ai-benefit-${index}-error`}>
                    <CircleAlert />
                    <span>{error}</span>
                  </p>
                )}
              </li>
            )
          })}
        </ol>
      </fieldset>
      <div className="form-row">
        <AiField
          label="Button text"
          value={brief.cta}
          onChange={(cta) => onChange({ cta })}
          max={AI_MAX.cta}
          error={errors.cta}
          placeholder={brief.goal === 'capture' ? 'e.g. Get the notes' : 'e.g. Send me the guide'}
          hint="Up to 40 characters."
        />
        <div className="field">
          <span className="field__label">Page language</span>
          <Segmented label="Page language" name="ai-language" options={AI_LANGUAGES} value={brief.language} onChange={(language) => onChange({ language: language as AiBrief['language'] })} />
        </div>
      </div>
    </>
  )
}

/** "Generate with AI": the three guided steps (goal → audience and offer → voice and button). */
export function AiBriefCard({
  step,
  brief,
  errors,
  showMissing,
  usage,
  pageFullReason,
  failure,
  products,
  productsStatus,
  paymentsOn,
  settingsPath,
  newProductPath,
  onChange,
  onStep,
  onNext,
  onGenerate,
  onExample,
}: {
  step: number
  brief: AiBrief
  errors: BriefErrors
  showMissing: boolean
  usage: AiUsage | null
  /** Set when the plan's page limit is reached: the draft would need one more page. */
  pageFullReason: string | null
  failure: AiFailure | null
  products: Product[]
  productsStatus: 'loading' | 'error' | 'success'
  paymentsOn: boolean
  settingsPath: string
  newProductPath: string
  onChange: (change: Partial<AiBrief>) => void
  onStep: (step: number) => void
  onNext: () => void
  onGenerate: () => void
  onExample: () => void
}) {
  const outOfGenerations = usage !== null && usage.used >= usage.limit
  const blockedReason = pageFullReason ?? (outOfGenerations ? 'No generations left this month' : null)
  return (
    <section className="card ai-card" aria-labelledby="ai-card-title">
      <div className="card__header">
        <div className="card__heading">
          <h2 className="card__title ai-card__title" id="ai-card-title">
            <Sparkles />
            Generate with AI
          </h2>
          <p className="card__subtitle">
            Step {step} of {AI_STEPS.length} · {AI_STEPS[step - 1]}
          </p>
        </div>
        {step === 1 && import.meta.env.DEV && (
          <Button variant="ghost" size="sm" icon={WandSparkles} onClick={onExample}>
            Fill in an example
          </Button>
        )}
      </div>
      <div className="card__body stack stack--lg">
        <ol className="stepper ai-stepper" role="list" aria-label="Steps">
          {AI_STEPS.map((label, index) => (
            <li
              key={label}
              className={`stepper__step${index + 1 < step ? ' stepper__step--done' : index + 1 === step ? ' stepper__step--current' : ''}`}
              aria-current={index + 1 === step ? 'step' : undefined}
            >
              {index + 1 < step ? (
                <button className="ai-stepper__back" type="button" onClick={() => onStep(index + 1)}>
                  {index + 1} · {label}
                </button>
              ) : (
                <>
                  {index + 1} · {label}
                </>
              )}
            </li>
          ))}
        </ol>
        <AiAlert usage={usage} failure={failure} showMissing={showMissing} paymentsOn={paymentsOn} onRetry={onGenerate} settingsPath={settingsPath} />
        <form
          className="form ai-form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault()
            if (step < AI_STEPS.length) onNext()
            else onGenerate()
          }}
        >
          {step === 1 && <StepOne brief={brief} errors={errors} onChange={onChange} />}
          {step === 2 && <StepTwo brief={brief} errors={errors} products={products} productsStatus={productsStatus} newProductPath={newProductPath} onChange={onChange} />}
          {step === 3 && <StepThree brief={brief} errors={errors} onChange={onChange} />}
          {/* Enter in a text field submits the step. */}
          <button type="submit" hidden />
        </form>
      </div>
      <div className="card__footer ai-card__footer">
        {step > 1 && (
          <Button variant="ghost" icon={ArrowLeft} onClick={() => onStep(step - 1)}>
            Back
          </Button>
        )}
        {step < AI_STEPS.length ? (
          <Button variant="primary" onClick={onNext}>
            Continue
            <ArrowRight />
          </Button>
        ) : (
          <>
            <Button variant="primary" icon={Sparkles} disabledReason={blockedReason ?? undefined} onClick={onGenerate}>
              Generate page
            </Button>
            <span className={`usage-line${outOfGenerations ? ' is-out' : ''}`}>
              <Gauge />
              {usage ? `${usageLine(usage)} · ` : ''}takes 20–60 seconds
            </span>
          </>
        )}
      </div>
    </section>
  )
}
