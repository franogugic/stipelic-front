import { Sparkles } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-[#f5f5f7] text-neutral-950">
      <div className="mx-auto grid min-h-screen w-full max-w-6xl items-center gap-10 px-5 py-8 lg:grid-cols-[0.92fr_1.08fr] lg:px-8">
        <section className="hidden lg:block">
          <div className="max-w-md">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-neutral-200 bg-white/70 px-3 py-1.5 text-sm font-medium text-neutral-700 shadow-sm backdrop-blur">
              <Sparkles size={15} />
              Creator Platform
            </div>
            <h1 className="text-5xl font-semibold leading-[1.02] tracking-normal text-neutral-950">
              Build your creator business from one elegant workspace.
            </h1>
            <p className="mt-5 text-lg leading-8 text-neutral-600">
              Create a landing page, publish your offer, and read the signal from every visit
              without leaving the dashboard.
            </p>
          </div>
        </section>

        <section className="mx-auto w-full max-w-[520px] rounded-[28px] border border-white/70 bg-white/85 p-6 shadow-[0_24px_70px_rgba(15,23,42,0.10)] backdrop-blur-xl sm:p-8">
          <div className="mb-8">
            <p className="text-sm font-semibold text-neutral-500">Creator Platform</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-normal text-neutral-950">
              Create your account
            </h2>
            <p className="mt-3 text-sm leading-6 text-neutral-500">
              Start with your creator profile. Your landing page and stats dashboard come next.
            </p>
          </div>

          <RegisterForm onRegistered={() => navigate('/login', { replace: true })} />

          <div className="mt-6 border-t border-neutral-200 pt-5 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <button
              className="font-semibold text-neutral-950 transition hover:text-neutral-600"
              type="button"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </div>
        </section>
      </div>
    </main>
  )
}
