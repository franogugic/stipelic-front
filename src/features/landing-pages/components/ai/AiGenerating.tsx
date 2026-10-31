import { Check, Hourglass, Sparkles, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { Button } from '../../../../shared/ui/ledger'
import { AI_LANGUAGES, AI_TONES } from '../../model/ai-draft'
import type { AiBrief } from '../../model/ai-draft'

/** Seconds from the start after which each stage usually begins (the prototype's list). No percentages: the call reports nothing until it is done. */
const STAGES: Array<[label: string, from: number]> = [
  ['Reading your answers', 0],
  ['Planning the sections', 4],
  ['Writing the headline, benefits and questions', 10],
  ['Checking the draft fits the editor', 32],
]

/** After this long the screen says it is taking longer than usual. */
export const SLOW_AFTER_SECONDS = 60
/** After this long the request is given up and nothing is used. */
export const GIVE_UP_AFTER_SECONDS = 90

const clock = (seconds: number) => `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`

/** The 20–60 second wait: what usually happens, in order, next to the real time passed. */
export function AiGenerating({ brief, documentName, onCancel }: { brief: AiBrief; documentName: string | null; onCancel: () => void }) {
  const [seconds, setSeconds] = useState(0)
  useEffect(() => {
    const started = performance.now()
    const timer = window.setInterval(() => setSeconds(Math.floor((performance.now() - started) / 1000)), 500)
    return () => window.clearInterval(timer)
  }, [])

  const current = STAGES.reduce((at, [, from], index) => (seconds >= from ? index : at), 0)
  const tone = AI_TONES.find((option) => option.value === brief.tone)?.label ?? ''
  const language = AI_LANGUAGES.find((option) => option.value === brief.language)?.label ?? ''

  return (
    <section className="card ai-generating" aria-labelledby="ai-generating-title" aria-busy="true">
      <div className="card__body ai-generating__body">
        <div className="stack stack--lg">
          <span className="ai-generating__icon" aria-hidden="true">
            <Sparkles />
          </span>
          <div className="stack stack--sm">
            <h2 className="state__title" id="ai-generating-title">
              Writing your page…
            </h2>
            <p className="text-secondary">
              This usually takes 20 to 60 seconds. <strong>Keep this page open</strong> — the editor opens with your draft as soon as it’s ready. If you leave, it’s cancelled and nothing is used.
            </p>
          </div>
          <ol className="stage-list" role="list" aria-live="polite">
            {STAGES.map(([label], index) => (
              <li key={label} className={`stage-list__item${index < current ? ' is-done' : index === current ? ' is-current' : ''}`}>
                <span className="stage-list__mark" aria-hidden="true">
                  <Check />
                </span>
                <span>{label}</span>
              </li>
            ))}
          </ol>
          {seconds >= SLOW_AFTER_SECONDS && (
            <p className="ai-generating__slow">
              <Hourglass />
              <span>Taking longer than usual — still writing. If it isn’t done after {GIVE_UP_AFTER_SECONDS} seconds, it stops and nothing is used.</span>
            </p>
          )}
          <div className="cluster">
            <p className="ai-generating__elapsed" role="timer" aria-live="off">
              <span>{clock(seconds)}</span> elapsed
            </p>
            <Button variant="ghost" size="sm" icon={X} onClick={onCancel}>
              Cancel
            </Button>
          </div>
          <dl className="kv ai-brief">
            <dt>Page</dt>
            <dd>
              {brief.title} · {brief.goal === 'capture' ? 'collects emails' : `gives away ${documentName ?? 'a free document'}`}
            </dd>
            <dt>For</dt>
            <dd>{brief.audience}</dd>
            <dt>Benefits</dt>
            <dd>{brief.benefits.join(' · ')}</dd>
            <dt>Button</dt>
            <dd>“{brief.cta}”</dd>
            <dt>Voice</dt>
            <dd>
              {brief.brand} · {tone} · {language}
            </dd>
          </dl>
        </div>
        <div className="ai-generating__sketch" aria-hidden="true">
          <span className="skeleton ai-sketch__bar ai-sketch__bar--title" />
          <span className="skeleton ai-sketch__bar" />
          <span className="skeleton ai-sketch__bar ai-sketch__bar--short" />
          <span className="skeleton ai-sketch__block" />
          <span className="ai-sketch__row">
            <span className="skeleton" />
            <span className="skeleton" />
            <span className="skeleton" />
          </span>
          <span className="skeleton ai-sketch__bar" />
          <span className="skeleton ai-sketch__bar ai-sketch__bar--short" />
        </div>
      </div>
    </section>
  )
}
