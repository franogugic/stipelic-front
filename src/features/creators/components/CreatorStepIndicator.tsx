import { Check } from 'lucide-react'
import type { CreatorStep } from '../model/create-creator-validation'

type CreatorStepIndicatorProps = {
  currentStep: CreatorStep
  includeSettings: boolean
}

const getSteps = (includeSettings: boolean): Array<{ id: CreatorStep; label: string }> =>
  [
    { id: 'identity', label: 'Identity' },
    { id: 'plan', label: 'Plan' },
    { id: 'setup', label: 'Setup' },
    includeSettings ? { id: 'settings', label: 'Settings' } : null,
    { id: 'review', label: 'Review' },
  ].filter((step): step is { id: CreatorStep; label: string } => step !== null)

export function CreatorStepIndicator({ currentStep, includeSettings }: CreatorStepIndicatorProps) {
  const steps = getSteps(includeSettings)
  const currentIndex = steps.findIndex((step) => step.id === currentStep)

  return (
    <div className={`grid gap-2 ${includeSettings ? 'grid-cols-2 lg:grid-cols-5' : 'grid-cols-2 sm:grid-cols-4'}`}>
      {steps.map((step, index) => {
        const isDone = index < currentIndex
        const isActive = step.id === currentStep

        return (
          <div
            className={`flex items-center gap-2 rounded-xl border px-3 py-2 text-sm font-semibold ${
              isActive
                ? 'border-neutral-950 bg-neutral-950 text-white'
                : isDone
                  ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                  : 'border-neutral-200 bg-white text-neutral-500'
            }`}
            key={step.id}
          >
            <span
              className={`grid size-5 place-items-center rounded-full text-xs ${
                isActive
                  ? 'bg-white text-neutral-950'
                  : isDone
                    ? 'bg-emerald-100 text-emerald-700'
                    : 'bg-neutral-100 text-neutral-500'
              }`}
            >
              {isDone ? <Check size={13} /> : index + 1}
            </span>
            {step.label}
          </div>
        )
      })}
    </div>
  )
}
