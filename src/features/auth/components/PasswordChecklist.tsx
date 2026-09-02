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
            check.isMet ? 'text-emerald-400' : 'text-muted-foreground'
          }`}
        >
          <span
            className={`grid size-4 shrink-0 place-items-center rounded-full transition ${
              check.isMet ? 'bg-emerald-500/15 text-emerald-400' : 'bg-muted'
            }`}
          >
            {check.isMet ? (
              <Check size={9} strokeWidth={3} />
            ) : (
              <span className="size-1.5 rounded-full bg-muted-foreground/40" />
            )}
          </span>
          {check.label}
        </div>
      ))}
    </div>
  )
}
