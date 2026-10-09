export type FailureKind = { tone: 'danger' | 'warning' | 'neutral'; label: string }

const HARD = /(mailbox|user|recipient|address)[^.]*(does not exist|doesn['’]t exist|not found|unknown|no such)|no such user|user unknown|domain[^.]*(not found|does not exist|unknown)|unknown domain|invalid (address|recipient)|\b5\.1\.[1-2]\b/i
const SOFT = /mailbox full|over quota|quota exceeded|temporar|try again later|deferred|greylist|\b4\.\d\.\d\b/i
const REJECTED = /reject|blocked|blacklist|spam|denied|refused|policy/i

/** Sorts the provider's `lastError` into what the sender can do about it: hard bounce, soft bounce, rejected, or plain failed. */
export function classifyFailure(lastError: string | null): FailureKind {
  const error = lastError ?? ''
  if (HARD.test(error)) return { tone: 'danger', label: 'Hard bounce' }
  if (SOFT.test(error)) return { tone: 'warning', label: 'Soft bounce' }
  if (REJECTED.test(error)) return { tone: 'danger', label: 'Rejected' }
  return { tone: 'neutral', label: 'Failed' }
}
