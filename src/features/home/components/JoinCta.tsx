import { ArrowRight } from 'lucide-react'
import { Button } from '../../../shared/ui/ledger'
import { useFeatures } from '../../../shared/model/features-store'

/** The homepage's sign-up button. While registration is closed (or not yet known) it reads "Log in", with a one-line note. */
export function JoinCta({
  size,
  arrow = false,
  block = false,
  variant = 'accent',
  label = 'Start free',
  note = true,
}: {
  size?: 'sm' | 'lg'
  arrow?: boolean
  block?: boolean
  variant?: 'accent' | 'secondary'
  /** What it says while sign-up is open. */
  label?: string
  /** The "by invitation" line under the button (left out in tight places like the nav bar). */
  note?: boolean
}) {
  const { registrationOpen } = useFeatures()
  const open = registrationOpen
  return (
    <span className="mk-join">
      <Button to={open ? '/register' : '/login'} variant={variant} size={size} block={block}>
        <span>{open ? label : 'Log in'}</span>
        {arrow && <ArrowRight />}
      </Button>
      {!open && note && <small className="mk-join__note">Private beta — by invitation</small>}
    </span>
  )
}
