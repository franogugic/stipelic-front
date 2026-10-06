import type { ReactNode } from 'react'

/** Headline text: words wrapped in *asterisks* are set in the brand colour (the asterisks stay in the text). */
export function rich(text: string): ReactNode {
  return text.split(/\*(.+?)\*/).map((part, index) => (index % 2 ? <em key={index}>{part}</em> : part))
}
