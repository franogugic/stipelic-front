import { Info } from 'lucide-react'

/** The one thing payouts say about costs — the platform fee itself is never shown. */
export function PayoutsNetNote() {
  return (
    <p className="quiet-note">
      <Info />
      <span>Payouts are net of platform and card processing costs.</span>
    </p>
  )
}
