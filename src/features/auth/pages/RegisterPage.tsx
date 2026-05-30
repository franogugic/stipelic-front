import { useNavigate } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <main className="min-h-screen bg-neutral-50 text-neutral-950">
      <div className="mx-auto grid min-h-screen w-full max-w-5xl gap-8 px-5 py-10 lg:grid-cols-2 lg:items-center lg:px-8">

        {/* Left — brand panel */}
        <section className="hidden lg:flex lg:flex-col lg:justify-center">
          <div className="flex items-center gap-2.5">
            <span className="grid size-9 place-items-center rounded-xl bg-neutral-950 text-white">
              <span className="text-sm font-bold">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <h1 className="mt-10 text-4xl font-semibold leading-tight tracking-tight text-neutral-950">
            Build your creator business from one workspace.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-neutral-500">
            Create landing pages, publish your offer, and read the signal from every visit without
            leaving the dashboard.
          </p>

          <div className="mt-10 rounded-2xl border border-neutral-200 bg-white p-5 shadow-sm">
            <p className="text-sm font-semibold text-neutral-950">Free to start</p>
            <p className="mt-1 text-sm leading-6 text-neutral-500">
              No credit card required for the free plan. Upgrade when you need more.
            </p>
          </div>
        </section>

        {/* Right — form */}
        <section className="mx-auto w-full max-w-md">
          {/* Mobile logo */}
          <div className="mb-8 flex items-center gap-2.5 lg:hidden">
            <span className="grid size-8 place-items-center rounded-lg bg-neutral-950 text-white">
              <span className="text-xs font-bold">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Create your account
            </h2>
            <p className="mt-2 text-sm leading-6 text-neutral-500">
              Start with your creator profile. Your dashboard comes next.
            </p>

            <div className="mt-7">
              <RegisterForm
                onRegistered={() => navigate('/login', { replace: true })}
              />
            </div>

            <div className="mt-6 border-t border-neutral-100 pt-5 text-center text-sm text-neutral-500">
              Already have an account?{' '}
              <button
                className="font-semibold text-neutral-950 transition hover:text-neutral-600"
                type="button"
                onClick={() => navigate('/login')}
              >
                Sign in
              </button>
            </div>
          </div>
        </section>
      </div>
    </main>
  )
}
