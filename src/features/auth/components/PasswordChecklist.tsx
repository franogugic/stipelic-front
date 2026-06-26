import { Check } from 'lucide-react'
import type { PasswordCheck } from '../model/register-validation'

type PasswordChecklistProps = {
  checks: PasswordCheck[]
}

export function PasswordChecklist({ checks }: PasswordChecklistProps) {
  return (
    <div className="grid grid-cols-2 gap-1.5">
      {checks.map((check) => (
        <div
          key={check.id}
          className={`flex items-center gap-2 text-xs ${
            check.isMet ? 'text-emerald-700' : 'text-neutral-400'
          }`}
        >
          <span
            className={`grid size-4 shrink-0 place-items-center rounded-full transition ${
              check.isMet ? 'bg-emerald-100' : 'bg-neutral-100'
            }`}
          >
            {check.isMet ? (
              <Check size={9} strokeWidth={3} />
            ) : (
              <span className="size-1.5 rounded-full bg-neutral-300" />
            )}
          </span>
          {check.label}
        </div>
      ))}
    </div>
  )
}
