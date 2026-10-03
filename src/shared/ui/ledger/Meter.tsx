import type { CSSProperties } from 'react'
import { number } from '../../lib/format'

/**
 * Usage meter. `limit` of `null`, `undefined` or a negative number (the API sends -1) means unlimited.
 * Warning colour from 85 %, danger at 100 %.
 */
export function Meter({ label, used, limit }: { label: string; used: number; limit: number | null | undefined }) {
  const unlimited = limit === null || limit === undefined || limit < 0
  // A limit of 0 is full as soon as anything is used (and empty, not NaN, when nothing is).
  const ratio = unlimited ? 0 : limit > 0 ? Math.min(1, used / limit) : used > 0 ? 1 : 0
  const tone = ratio >= 1 ? 'meter--danger' : ratio >= 0.85 ? 'meter--warning' : ''
  return (
    <div className={['meter', tone].filter(Boolean).join(' ')}>
      <div className="meter__head">
        <span className="meter__label">{label}</span>
        <span className="meter__value">
          {number(used)} <span>/ {unlimited ? 'Unlimited' : number(limit)}</span>
        </span>
      </div>
      <div
        className="meter__track"
        role="meter"
        aria-label={label}
        aria-valuemin={0}
        aria-valuemax={unlimited ? used : limit}
        aria-valuenow={used}
      >
        <div className="meter__fill" style={{ '--meter-value': `${(ratio * 100).toFixed(1)}%` } as CSSProperties} />
      </div>
    </div>
  )
}
