import { Check } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { RegisterForm } from '../components/RegisterForm'

const benefits = [
  'Free plan — no credit card needed',
  'Custom branded landing pages',
  'Built-in analytics from day one',
  'Upgrade or cancel anytime',
]

export function RegisterPage() {
  const navigate = useNavigate()

  return (
    <div className="flex min-h-screen">
      {/* Left — dark brand panel */}
      <div className="relative hidden w-[480px] shrink-0 flex-col justify-between overflow-hidden bg-neutral-950 p-10 lg:flex">
        <div
          className="pointer-events-none absolute inset-0 opacity-[0.035]"
          style={{
            backgroundImage:
              'linear-gradient(#fff 1px,transparent 1px),linear-gradient(90deg,#fff 1px,transparent 1px)',
            backgroundSize: '40px 40px',
          }}
        />

        {/* Logo */}
        <div className="flex items-center gap-3">
          <span className="grid size-9 place-items-center rounded-xl bg-white">
            <span className="text-sm font-black text-neutral-950">CP</span>
          </span>
          <span className="text-base font-semibold text-white">Creator Platform</span>
        </div>

        {/* Headline */}
        <div>
          <h1 className="text-4xl font-semibold leading-[1.2] tracking-tight text-white">
            Launch your
            <br />
            creator business
            <br />
            in minutes.
          </h1>
          <p className="mt-5 max-w-xs text-sm leading-7 text-white/50">
            Set up your workspace, publish a landing page, and start collecting leads — all before
            your next coffee gets cold.
          </p>

          <ul className="mt-10 grid gap-3.5">
            {benefits.map((b) => (
              <li key={b} className="flex items-center gap-3 text-sm text-white/70">
                <span className="grid size-5 shrink-0 place-items-center rounded-full bg-white/15 text-white">
                  <Check size={11} strokeWidth={2.5} />
                </span>
                {b}
              </li>
            ))}
          </ul>
        </div>

        {/* Plans preview */}
        <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
          <p className="text-xs font-semibold uppercase tracking-widest text-white/30">Plans</p>
          <div className="mt-4 grid gap-2">
            {[
              { name: 'Free',   price: '€0',   note: '1 landing page' },
              { name: 'Basic',  price: '€15',  note: '5 landing pages' },
              { name: 'Pro',    price: '€30',  note: '20 landing pages' },
              { name: 'Pro+',   price: '€99',  note: 'Unlimited pages' },
            ].map((plan) => (
              <div key={plan.name} className="flex items-center justify-between text-sm">
                <span className="text-white/60">{plan.name}</span>
                <span className="text-white/30">{plan.note}</span>
                <span className="font-semibold text-white">{plan.price}<span className="text-xs font-normal text-white/40">/mo</span></span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Right — form */}
      <div className="flex flex-1 flex-col items-center justify-center bg-neutral-50 px-6 py-12">
        {/* Mobile logo */}
        <div className="mb-10 flex items-center gap-2.5 lg:hidden">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
            <span className="text-xs font-black text-white">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="w-full max-w-sm">
          <div className="mb-8">
            <h2 className="text-2xl font-semibold tracking-tight text-neutral-950">
              Create your account
            </h2>
            <p className="mt-1.5 text-sm text-neutral-500">
              Free to start. No credit card required.
            </p>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
            <RegisterForm onRegistered={() => navigate('/login', { replace: true })} />
          </div>

          <p className="mt-6 text-center text-sm text-neutral-500">
            Already have an account?{' '}
            <button
              type="button"
              className="font-semibold text-neutral-950 underline-offset-2 transition hover:underline"
              onClick={() => navigate('/login')}
            >
              Sign in
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}
