import { CircleAlert } from 'lucide-react'
import type { FormEvent } from 'react'
import { useId, useMemo, useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { PRIVACY_URL, TERMS_URL } from '../../../shared/lib/legal-links'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { Alert, Button, Checkbox, Field, Input } from '../../../shared/ui/ledger'
import { AuthSplitLayout } from '../components/AuthSplitLayout'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { useAuthStore } from '../model/auth-store'
import { validateRegisterForm } from '../model/register-validation'
import type { RegisterFieldName } from '../model/register-validation'
import type { RegisterFormValues } from '../model/types'

const initialValues: RegisterFormValues = {
  firstName: '',
  lastName: '',
  email: '',
  password: '',
  acceptTerms: false,
}

export function RegisterPage() {
  const navigate = useNavigate()
  const termsErrorId = useId()

  const [values, setValues] = useState<RegisterFormValues>(initialValues)
  const [touchedFields, setTouchedFields] = useState<Partial<Record<RegisterFieldName, boolean>>>({})

  const register = useAuthStore((s) => s.register)
  const registerStatus = useAuthStore((s) => s.registerStatus)
  const registerError = useAuthStore((s) => s.registerError)
  const resetRegisterFeedback = useAuthStore((s) => s.resetRegisterFeedback)

  const validation = useMemo(() => validateRegisterForm(values), [values])
  const isSubmitting = registerStatus === 'submitting'

  useDocumentTitle('Sign up · Luma')

  const getVisibleError = (field: RegisterFieldName) =>
    touchedFields[field] ? validation.fieldErrors[field] : undefined

  const updateField = <K extends RegisterFieldName>(field: K, value: RegisterFormValues[K]) => {
    resetRegisterFeedback()
    setValues((prev) => ({ ...prev, [field]: value }))
  }

  const touchField = (field: RegisterFieldName) =>
    setTouchedFields((prev) => ({ ...prev, [field]: true }))

  // The button stays active (as in the prototype); an invalid submit only reveals the errors.
  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouchedFields({ firstName: true, lastName: true, email: true, password: true, acceptTerms: true })
    if (!validation.isValid || isSubmitting) return
    const user = await register(values)
    if (user) navigate('/check-inbox', { replace: true })
  }

  const termsError = getVisibleError('acceptTerms')

  return (
    <AuthSplitLayout>
      <div className="stack stack--sm">
        <h1 className="page-title">Start <em>selling</em></h1>
        <p className="text-secondary">Free to start. No card needed.</p>
      </div>

      {registerError ? (
        <Alert tone="danger" icon={CircleAlert} live>
          <p>{registerError}</p>
        </Alert>
      ) : null}

      <form className="form" onSubmit={handleSubmit} noValidate>
        <div className="form-row">
          <Field label="First name" error={getVisibleError('firstName')}>
            {(control) => (
              <Input
                {...control}
                name="firstName"
                autoComplete="given-name"
                value={values.firstName}
                onBlur={() => touchField('firstName')}
                onChange={(e) => updateField('firstName', e.target.value)}
              />
            )}
          </Field>
          <Field label="Last name" error={getVisibleError('lastName')}>
            {(control) => (
              <Input
                {...control}
                name="lastName"
                autoComplete="family-name"
                value={values.lastName}
                onBlur={() => touchField('lastName')}
                onChange={(e) => updateField('lastName', e.target.value)}
              />
            )}
          </Field>
        </div>

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

        <Field label="Password" error={getVisibleError('password')}>
          {(control) => (
            <>
              <Input
                {...control}
                type="password"
                name="password"
                autoComplete="new-password"
                value={values.password}
                onBlur={() => touchField('password')}
                onChange={(e) => updateField('password', e.target.value)}
              />
              <PasswordChecklist checks={validation.passwordChecks} />
            </>
          )}
        </Field>

        <div className="field">
          <Checkbox
            name="acceptTerms"
            checked={values.acceptTerms}
            aria-invalid={termsError ? true : undefined}
            aria-describedby={termsError ? termsErrorId : undefined}
            onBlur={() => touchField('acceptTerms')}
            onChange={(e) => updateField('acceptTerms', e.target.checked)}
            label={
              <>
                I agree to the <a className="link" href={TERMS_URL}>Terms</a> and{' '}
                <a className="link" href={PRIVACY_URL}>Privacy Policy</a>
              </>
            }
          />
          {termsError && (
            <p className="field__error" id={termsErrorId}>
              <CircleAlert />
              <span>{termsError}</span>
            </p>
          )}
        </div>

        <Button variant="primary" size="lg" block type="submit" loading={isSubmitting}>
          Create account
        </Button>
      </form>

      <p className="text-sm text-secondary">
        Already have an account? <Link className="link" to="/login">Log in</Link>
      </p>
    </AuthSplitLayout>
  )
}
