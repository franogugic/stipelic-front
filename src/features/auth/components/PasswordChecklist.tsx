import { Check, Circle } from 'lucide-react'
import type { PasswordCheck } from '../model/register-validation'

type PasswordChecklistProps = {
  checks: PasswordCheck[]
}

export function PasswordChecklist({ checks }: PasswordChecklistProps) {
  return (
    <div className="grid gap-2 rounded-xl border border-neutral-200 bg-neutral-50 p-3">
      {checks.map((check) => (
        <div
          className={`flex items-center gap-2 text-sm ${
            check.isMet ? 'text-emerald-700' : 'text-neutral-500'
          }`}
          key={check.id}
        >
          <span
            className={`grid size-5 place-items-center rounded-full ${
              check.isMet ? 'bg-emerald-100' : 'bg-white'
            }`}
          >
            {check.isMet ? <Check size={14} strokeWidth={2.4} /> : <Circle size={8} />}
          </span>
          {check.label}
        </div>
      ))}
    </div>
  )
}
