import { ArrowRight, Loader2, LockKeyhole } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { TextField } from '../../../shared/ui/TextField'
import { useAuthStore } from '../model/auth-store'
import { validateLoginForm } from '../model/login-validation'
import type { LoginFieldName } from '../model/login-validation'
import type { LoginFormValues } from '../model/types'

const initialValues: LoginFormValues = {
  email: '',
  password: '',
}

export function LoginForm() {
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<LoginFieldName, boolean>>>({})

  const login = useAuthStore((state) => state.login)
  const loginStatus = useAuthStore((state) => state.loginStatus)
  const loginError = useAuthStore((state) => state.loginError)
  const resetLoginFeedback = useAuthStore((state) => state.resetLoginFeedback)

  const validation = useMemo(() => validateLoginForm(values), [values])
  const isSubmitting = loginStatus === 'submitting'
  const canSubmit = validation.isValid && !isSubmitting

  const getVisibleError = (fieldName: LoginFieldName) =>
    touchedFields[fieldName] ? validation.fieldErrors[fieldName] : undefined

  const updateField = (fieldName: LoginFieldName, value: string) => {
    resetLoginFeedback()
    setValues((current) => ({ ...current, [fieldName]: value }))
  }

  const touchField = (fieldName: LoginFieldName) => {
    setTouchedFields((current) => ({ ...current, [fieldName]: true }))
  }

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    setTouchedFields({ email: true, password: true })

    if (!validation.isValid) {
      return
    }

    await login(values)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <TextField
        label="Email"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={values.email}
        error={getVisibleError('email')}
        onBlur={() => touchField('email')}
        onChange={(event) => updateField('email', event.target.value)}
      />

      <TextField
        label="Password"
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="Your password"
        value={values.password}
        error={getVisibleError('password')}
        onBlur={() => touchField('password')}
        onChange={(event) => updateField('password', event.target.value)}
      />

      {loginError ? (
        <div className="flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-700">
          <LockKeyhole className="mt-0.5 shrink-0" size={16} />
          {loginError}
        </div>
      ) : null}

      <button
        className="mt-1 flex h-11 items-center justify-center gap-2 rounded-xl bg-neutral-950 px-5 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:bg-neutral-200 disabled:text-neutral-400"
        type="submit"
        disabled={!canSubmit}
      >
        {isSubmitting ? (
          <>
            <Loader2 className="animate-spin" size={17} />
            Signing in
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={17} />
          </>
        )}
      </button>
    </form>
  )
}
