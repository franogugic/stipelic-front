import { useEffect, useState } from 'react'
import { resendCooldownMs, useAuthStore } from './auth-store'

const cooldownSeconds = resendCooldownMs / 1000

/**
 * The verification-resend cooldown from `resendAvailableAt`, ticking once a second while it runs.
 * `label` is the remaining time as `m:ss` (e.g. "0:42").
 */
export function useResendCooldown() {
  const resendAvailableAt = useAuthStore((s) => s.resendAvailableAt)
  const [now, setNow] = useState(() => Date.now())

  useEffect(() => {
    if (!resendAvailableAt) return
    const tick = () => setNow(Date.now())
    // Re-read the clock straight away: `now` may be from long before this cooldown started.
    const first = window.setTimeout(tick, 0)
    const timer = window.setInterval(() => {
      tick()
      if (Date.now() >= resendAvailableAt) window.clearInterval(timer)
    }, 1000)
    return () => {
      window.clearTimeout(first)
      window.clearInterval(timer)
    }
  }, [resendAvailableAt])

  // Clamped, so a clock read before the cooldown started can never show more than the cooldown itself.
  const secondsLeft = resendAvailableAt
    ? Math.min(cooldownSeconds, Math.max(0, Math.ceil((resendAvailableAt - now) / 1000)))
    : 0

  return {
    secondsLeft,
    label: `${Math.floor(secondsLeft / 60)}:${String(secondsLeft % 60).padStart(2, '0')}`,
    isCoolingDown: secondsLeft > 0,
  }
}
