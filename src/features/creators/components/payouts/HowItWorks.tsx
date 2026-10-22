import { Card } from '../../../../shared/ui/ledger'

const STEPS: Array<[number: string, title: string, text: string]> = [
  ['1', 'A customer pays', 'Card payment through Stripe checkout.'],
  ['2', 'To replace', 'To replace'],
  ['3', 'Money reaches you', 'Stripe pays out to your bank automatically.'],
]

/** The three-step explainer under the Stripe Connect states. */
export function HowItWorks() {
  return (
    <Card title="How it works">
      <div className="grid grid--3">
        {STEPS.map(([number, title, text]) => (
          <div className="stack stack--sm" key={number}>
            <span className="payout-step__num">0{number}</span>
            <strong>{title}</strong>
            <p className="text-secondary text-sm">{text}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}
