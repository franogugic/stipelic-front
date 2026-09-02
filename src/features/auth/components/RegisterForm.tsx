import { ArrowRight, Loader2, TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { AuthField } from './AuthField'
import { useAuthStore } from '../model/auth-store'
import { validateRegisterForm } from '../model/register-validation'
import type { RegisterFieldName } from '../model/register-validation'
import type { RegisterFormValues } from '../model/types'
import { PasswordChecklist } from './PasswordChecklist'

const initialValues: RegisterFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
}

type RegisterFormProps = { onRegistered: () => void }

export function RegisterForm({ onRegistered }: RegisterFormProps) {
  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<RegisterFieldName, boolean>>>({})

  const register = useAuthStore((s) => s.register)
  const registerStatus = useAuthStore((s) => s.registerStatus)
  const registerError = useAuthStore((s) => s.registerError)
  const resetRegisterFeedback = useAuthStore((s) => s.resetRegisterFeedback)

  const validation = useMemo(() => validateRegisterForm(values), [values])
  const isSubmitting = registerStatus === 'submitting'
  const canSubmit = validation.isValid && !isSubmitting

  const getVisibleError = (field: RegisterFieldName) =>
    touchedFields[field] ? validation.fieldErrors[field] : undefined

  const updateField = (field: RegisterFieldName, value: string) => {
    resetRegisterFeedback()
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const touchField = (field: RegisterFieldName) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouchedFields({ firstName: true, lastName: true, email: true, password: true })
    if (!validation.isValid) return
    const user = await register(values)
    if (user) onRegistered()
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <AuthField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="Ana"
          value={values.firstName}
          error={getVisibleError('firstName')}
          onBlur={() => touchField('firstName')}
          onChange={(e) => updateField('firstName', e.target.value)}
        />
        <AuthField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          placeholder="Horvat"
          value={values.lastName}
          error={getVisibleError('lastName')}
          onBlur={() => touchField('lastName')}
          onChange={(e) => updateField('lastName', e.target.value)}
        />
      </div>

      <AuthField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="ana@example.com"
        value={values.email}
        error={getVisibleError('email')}
        onBlur={() => touchField('email')}
        onChange={(e) => updateField('email', e.target.value)}
      />

      <div className="grid gap-2.5">
        <AuthField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          value={values.password}
          error={getVisibleError('password')}
          onBlur={() => touchField('password')}
          onChange={(e) => updateField('password', e.target.value)}
        />
        {values.password.length > 0 ? (
          <PasswordChecklist checks={validation.passwordChecks} />
        ) : null}
      </div>

      {registerError ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <TriangleAlert className="mt-0.5 shrink-0" size={15} />
          <span>{registerError}</span>
        </div>
      ) : null}

      <button
        className="mt-1 flex h-11 w-full items-center justify-center gap-2 rounded-lg bg-accent text-sm font-semibold text-white transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-40"
        type="submit"
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={16} />
            Creating account…
          </>
        ) : (
          <>
            Create account
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  )
}
