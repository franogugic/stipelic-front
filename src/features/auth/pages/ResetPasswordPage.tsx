import { ArrowRight, KeyRound, Loader2, XCircle } from 'lucide-react'
import type { FormEvent } from 'react'
import { useMemo, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { TextField } from '../../../shared/ui/TextField'
import { PasswordChecklist } from '../components/PasswordChecklist'
import { useAuthStore } from '../model/auth-store'
import { getPasswordChecks } from '../model/register-validation'

export function ResetPasswordPage() {
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const token = useMemo(() => searchParams.get('token')?.trim() ?? '', [searchParams])

  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [touched, setTouched] = useState({ newPassword: false, confirmPassword: false })

  const resetPasswordStatus = useAuthStore((s) => s.resetPasswordStatus)
  const resetPasswordError = useAuthStore((s) => s.resetPasswordError)
  const resetPasswordWithToken = useAuthStore((s) => s.resetPasswordWithToken)

  const passwordChecks = getPasswordChecks(newPassword)
  const isPasswordValid = passwordChecks.every((check) => check.isMet)
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword
  const confirmError =
    touched.confirmPassword && !passwordsMatch ? 'Passwords do not match.' : undefined

  const isSubmitting = resetPasswordStatus === 'submitting'
  const isError = resetPasswordStatus === 'error'
  const canSubmit = Boolean(token) && isPasswordValid && passwordsMatch && !isSubmitting

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    setTouched({ newPassword: true, confirmPassword: true })
    if (!canSubmit) return

    const succeeded = await resetPasswordWithToken(token, newPassword)
    if (succeeded) {
      navigate('/login', {
        replace: true,
        state: { message: 'Your password has been reset. Please sign in with your new password.' },
      })
    }
  }

  if (!token) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
        <div className="w-full max-w-sm">
          <div className="mb-10 flex items-center justify-center gap-2.5">
            <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
              <span className="text-xs font-black text-white">CP</span>
            </span>
            <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
          </div>

          <div className="rounded-2xl border border-neutral-200 bg-white p-8 text-center shadow-sm">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-red-50 text-red-600">
              <XCircle size={28} strokeWidth={1.8} />
            </div>
            <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
              Invalid reset link
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-neutral-500">
              This link is missing a token. Request a new password reset link.
            </p>
            <button
              className="mx-auto mt-8 flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800"
              type="button"
              onClick={() => navigate('/forgot-password')}
            >
              Request new link
              <ArrowRight size={16} />
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-50 px-6 py-12">
      <div className="w-full max-w-sm">
        <div className="mb-10 flex items-center justify-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-neutral-950">
            <span className="text-xs font-black text-white">CP</span>
          </span>
          <span className="text-sm font-semibold text-neutral-950">Creator Platform</span>
        </div>

        <div className="rounded-2xl border border-neutral-200 bg-white p-8 shadow-sm">
          <div className="mb-6 text-center">
            <div className="mx-auto grid size-16 place-items-center rounded-2xl bg-neutral-100 text-neutral-500">
              <KeyRound size={28} strokeWidth={1.8} />
            </div>
            <h1 className="mt-6 text-xl font-semibold tracking-tight text-neutral-950">
              Set a new password
            </h1>
            <p className="mt-2.5 text-sm leading-6 text-neutral-500">
              Choose a new password for your account.
            </p>
          </div>

          <form className="grid gap-5" onSubmit={handleSubmit} noValidate>
            <div className="grid gap-2.5">
              <TextField
                label="New password"
                name="newPassword"
                type="password"
                autoComplete="new-password"
                placeholder="••••••••"
                value={newPassword}
                onBlur={() => setTouched((prev) => ({ ...prev, newPassword: true }))}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <PasswordChecklist checks={passwordChecks} />
            </div>

            <TextField
              label="Confirm new password"
              name="confirmPassword"
              type="password"
              autoComplete="new-password"
              placeholder="••••••••"
              value={confirmPassword}
              error={confirmError}
              onBlur={() => setTouched((prev) => ({ ...prev, confirmPassword: true }))}
              onChange={(e) => setConfirmPassword(e.target.value)}
            />

            {isError ? (
              <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                <p>{resetPasswordError ?? 'This link is invalid or has expired.'}</p>
                <button
                  type="button"
                  className="mt-1.5 font-semibold underline-offset-2 hover:underline"
                  onClick={() => navigate('/forgot-password')}
                >
                  Request a new reset link
                </button>
              </div>
            ) : null}

            <button
              className="flex h-11 w-full items-center justify-center gap-2 rounded-xl bg-neutral-950 text-sm font-semibold text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-40"
              type="submit"
              disabled={!canSubmit}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="animate-spin" size={16} />
                  Resetting…
                </>
              ) : (
                <>
                  Reset password
                  <ArrowRight size={16} />
                </>
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
