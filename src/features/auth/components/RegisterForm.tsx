import { ArrowRight, Loader2 } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { TextField } from '../../../shared/ui/TextField'
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

export function RegisterForm() {
  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<RegisterFieldName, boolean>>>({})

  const register = useAuthStore((state) => state.register)
  const registerStatus = useAuthStore((state) => state.registerStatus)
  const registerError = useAuthStore((state) => state.registerError)
  const resetRegisterFeedback = useAuthStore((state) => state.resetRegisterFeedback)

  const validation = useMemo(() => validateRegisterForm(values), [values])
  const isSubmitting = registerStatus === 'submitting'
  const canSubmit = validation.isValid && !isSubmitting

  const getVisibleError = (fieldName: RegisterFieldName) =>
    touchedFields[fieldName] ? validation.fieldErrors[fieldName] : undefined

  const updateField = (fieldName: RegisterFieldName, value: string) => {
    resetRegisterFeedback()
    setValues((current) => ({ ...current, [fieldName]: value }))
  }

  const touchField = (fieldName: RegisterFieldName) => {
    setTouchedFields((current) => ({ ...current, [fieldName]: true }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouchedFields({ firstName: true, lastName: true, email: true, password: true })

    if (!validation.isValid) {
      return
    }

    await register(values)
  }

  return (
    <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
      <div className="grid gap-4 sm:grid-cols-2">
        <TextField
          label="First name"
          name="firstName"
          autoComplete="given-name"
          placeholder="Ana"
          value={values.firstName}
          error={getVisibleError('firstName')}
          onBlur={() => touchField('firstName')}
          onChange={(event) => updateField('firstName', event.target.value)}
        />
        <TextField
          label="Last name"
          name="lastName"
          autoComplete="family-name"
          placeholder="Creator"
          value={values.lastName}
          error={getVisibleError('lastName')}
          onBlur={() => touchField('lastName')}
          onChange={(event) => updateField('lastName', event.target.value)}
        />
      </div>

      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="ana@example.com"
        value={values.email}
        error={getVisibleError('email')}
        onBlur={() => touchField('email')}
        onChange={(event) => updateField('email', event.target.value)}
      />

      <div className="grid gap-3">
        <TextField
          label="Password"
          name="password"
          type="password"
          autoComplete="new-password"
          placeholder="Create a strong password"
          value={values.password}
          error={getVisibleError('password')}
          onBlur={() => touchField('password')}
          onChange={(event) => updateField('password', event.target.value)}
        />
        <PasswordChecklist checks={validation.passwordChecks} />
      </div>

      {registerError ? (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          {registerError}
        </div>
      ) : null}

      <button
        className="flex h-12 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-300 disabled:text-neutral-500"
        type="submit"
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={18} />
            Creating account
          </>
        ) : (
          <>
            Create account
            <ArrowRight size={18} />
          </>
        )}
      </button>
    </form>
  )
}
