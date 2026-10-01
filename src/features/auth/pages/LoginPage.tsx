import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { Button, Field, Input } from '../../../shared/ui/ledger'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { LoginAlert } from '../components/LoginAlert'
import { useAuthStore } from '../model/auth-store'
import { validateLoginForm } from '../model/login-validation'
import type { LoginFieldName } from '../model/login-validation'
import type { LoginFormValues } from '../model/types'

const initialValues: LoginFormValues = { email: '', password: '' }

export function LoginPage() {
  const location = useLocation()
  const successMessage = (location.state as { message?: string } | null)?.message

  const [values, setValues] = useState<LoginFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<LoginFieldName, boolean>>>({})

  const login = useAuthStore((s) => s.login)
  const loginStatus = useAuthStore((s) => s.loginStatus)
  const resetLoginFeedback = useAuthStore((s) => s.resetLoginFeedback)

  const validation = useMemo(() => validateLoginForm(values), [values])
  const isSubmitting = loginStatus === 'submitting'

  useDocumentTitle('Log in · Luma')

  const getVisibleError = (field: LoginFieldName) =>
    touchedFields[field] ? validation.fieldErrors[field] : undefined

  const updateField = (field: LoginFieldName, value: string) => {
    resetLoginFeedback()
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const touchField = (field: LoginFieldName) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }))

  // The button stays active (as in the prototype); an invalid submit only reveals the errors.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouchedFields({ email: true, password: true })
    if (!validation.isValid || isSubmitting) return
    await login(values)
  }

  return (
    <AuthSplitLayout>
      <div className="stack stack--sm">
        <h1 className="page-title">Welcome <em>back</em></h1>
        <p className="text-secondary">Log in to your creator workspace.</p>
      </div>

      <LoginAlert successMessage={successMessage} />

      <form className="form" onSubmit={handleSubmit} noValidate>
        <Field label="Email" error={getVisibleError('email')}>
          {(control) => (
            <Input
              {...control}
              type="email"
              name="email"
              autoComplete="email"
              inputMode="email"
              value={values.email}
              onBlur={() => touchField('email')}
              onChange={(e) => updateField('email', e.target.value)}
            />
          )}
        </Field>

        <Field
          label="Password"
          labelAction={<Link className="link text-sm" to="/forgot-password">Forgot password?</Link>}
          error={getVisibleError('password')}
        >
          {(control) => (
            <Input
              {...control}
              type="password"
              name="password"
              autoComplete="current-password"
              value={values.password}
              onBlur={() => touchField('password')}
              onChange={(e) => updateField('password', e.target.value)}
            />
          )}
        </Field>

        <Button variant="primary" size="lg" block type="submit" loading={isSubmitting}>
          Log in
        </Button>
      </form>

      <p className="text-sm text-secondary">
        New here? <Link className="link" to="/register">Create an account</Link>
      </p>
    </AuthSplitLayout>
  )
}
