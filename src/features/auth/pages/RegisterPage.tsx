import { useNavigate } from 'react-router-dom'
import { AuthLayout } from '../components/AuthLayout'
import { AuthModeSwitch } from '../components/AuthModeSwitch'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <AuthLayout>
      <div className="mb-6 text-center">
        <p className="text-sm text-muted-foreground">Free to start. No credit card required.</p>
      </div>

      <div className="rounded-xl border border-border bg-card p-7">
        <AuthModeSwitch mode="register" />
        <RegisterForm onRegistered={() => navigate('/login', { replace: true })} />
      </div>

      <p className="mt-6 text-center text-xs text-muted-foreground">
        Already have an account?{' '}
        <button type="button" className="font-semibold text-accent hover:opacity-85" onClick={() => navigate('/login')}>
          Sign in
        </button>
      </p>
    </AuthLayout>
  )
}
