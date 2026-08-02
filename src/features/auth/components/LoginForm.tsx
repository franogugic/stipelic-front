import { ArrowRight, Loader2, TriangleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AuthField } from './AuthField'
import { useAuthStore } from '../model/auth-store'
import { validateLoginForm } from '../model/login-validation'
import type { LoginFieldName } from '../model/login-validation'
import type { LoginFormValues } from '../model/types'

const initialValues: LoginFormValues = { email: '', password: '' }

export function LoginForm() {
  const navigate = useNavigate()
  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<LoginFieldName, boolean>>>({})

  const login = useAuthStore((s) => s.login)
  const loginStatus = useAuthStore((s) => s.loginStatus)
  const loginError = useAuthStore((s) => s.loginError)
  const resetLoginFeedback = useAuthStore((s) => s.resetLoginFeedback)

  const validation = useMemo(() => validateLoginForm(values), [values])
  const isSubmitting = loginStatus === 'submitting'
  const canSubmit = validation.isValid && !isSubmitting

  const getVisibleError = (field: LoginFieldName) =>
    touchedFields[field] ? validation.fieldErrors[field] : undefined

  const updateField = (field: LoginFieldName, value: string) => {
    resetLoginFeedback()
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const touchField = (field: LoginFieldName) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }))

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouchedFields({ email: true, password: true })
    if (!validation.isValid) return
    await login(values)
  }

  return (
    <form className="grid gap-4" onSubmit={handleSubmit} noValidate>
      <AuthField
        label="Email address"
        name="email"
        type="email"
        autoComplete="email"
        inputMode="email"
        placeholder="you@example.com"
        value={values.email}
        error={getVisibleError('email')}
        onBlur={() => touchField('email')}
        onChange={(e) => updateField('email', e.target.value)}
      />

      <AuthField
        label="Password"
        labelAction={
          <button
            type="button"
            className="text-xs font-medium text-muted-foreground transition hover:text-foreground"
            onClick={() => navigate('/forgot-password')}
          >
            Forgot password?
          </button>
        }
        name="password"
        type="password"
        autoComplete="current-password"
        placeholder="••••••••"
        value={values.password}
        error={getVisibleError('password')}
        onBlur={() => touchField('password')}
        onChange={(e) => updateField('password', e.target.value)}
      />

      {loginError ? (
        <div className="flex items-start gap-2.5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-sm text-red-400">
          <TriangleAlert className="mt-0.5 shrink-0" size={15} />
          <span>{loginError}</span>
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
            Signing in…
          </>
        ) : (
          <>
            Sign in
            <ArrowRight size={16} />
          </>
        )}
      </button>
    </form>
  )
}
