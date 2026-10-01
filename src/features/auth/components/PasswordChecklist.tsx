import { Circle, CircleCheck } from 'lucide-react'
import type { PasswordCheck } from '../model/register-validation'

/** The password rules under the password input; a met rule gets `.ok` and a check icon. */
export function PasswordChecklist({ checks }: { checks: PasswordCheck[] }) {
  return (
    <ul className="rules" role="list">
      {checks.map((check) => (
        <li key={check.id} className={check.isMet ? 'ok' : undefined}>
          {check.isMet ? <CircleCheck /> : <Circle />}
          {check.label}
        </li>
      ))}
    </ul>
  )
}
