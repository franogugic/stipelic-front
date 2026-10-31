import { FileText } from 'lucide-react'
import { useDocumentTitle } from '../../../shared/lib/use-document-title'
import { SoloLayout } from '../../../shared/ui/SoloLayout'
import { StateArt } from '../../../shared/ui/StateArt'
import { BackToLoginButton } from '../../auth/components/SoloStates'
import { useHasSession } from '../../auth/model/use-has-session'

// TODO(owner): the real texts of the Terms of Service and the Privacy Policy replace the body of these pages.
const PAGES = {
  terms: { title: 'Terms of Service', word: 'Terms' },
  privacy: { title: 'Privacy Policy', word: 'Privacy Policy' },
} as const

/** Static page behind `/terms` and `/privacy`. A placeholder until the owner supplies the text. */
export function LegalPage({ page }: { page: keyof typeof PAGES }) {
  const hasSession = useHasSession()
  const { title, word } = PAGES[page]
  useDocumentTitle(`${title} · Luma`)
  return (
    <SoloLayout user={hasSession}>
      <StateArt icon={FileText} />
      <h1 className="solo__title">{title}</h1>
      <p className="solo__text">The full text of our {word} is being finalised and will be published here before Luma opens to everyone.</p>
      <div className="cluster cluster--center">{!hasSession && <BackToLoginButton />}</div>
    </SoloLayout>
  )
}
