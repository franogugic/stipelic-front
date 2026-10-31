import { Lock, Pencil, Quote, Sparkles, Trash2, X } from 'lucide-react'
import { Alert, Button, Modal } from '../../../../shared/ui/ledger'
import { plural } from '../../../../shared/lib/format'
import { needsText, placeholderCount, placeholderNeeds } from '../../model/placeholder'
import type { PlaceholderIssue } from '../../model/placeholder'

/** "AI draft — review before publishing": stays until the creator says "Got it" or publishes. */
export function AiDraftBanner({
  hasPlaceholders,
  onFix,
  onDismiss,
}: {
  hasPlaceholders: boolean
  onFix: () => void
  onDismiss: () => void
}) {
  return (
    <div className="alert alert--accent draft-hint" role="status">
      <Sparkles />
      <div className="alert__body">
        <p className="alert__title">AI draft — review before publishing</p>
        <p>
          Luma wrote it from your answers. Read every text — facts, promises and tone — and add your own images; none were generated.
          {hasPlaceholders ? ' The testimonial is a placeholder: publishing stays blocked until you replace it with a real one or remove it.' : ''}
        </p>
        <div className="cluster cluster--sm">
          {hasPlaceholders && (
            <Button variant="primary" icon={Quote} onClick={onFix}>
              Fix the testimonial
            </Button>
          )}
          <Button variant="ghost" onClick={onDismiss}>
            Got it
          </Button>
        </div>
      </div>
    </div>
  )
}

/** Above the section list while a placeholder is left. */
export function PublishBlockedAlert({ issues, onFix }: { issues: PlaceholderIssue[]; onFix: (sectionKey: string) => void }) {
  const count = placeholderCount(issues)
  if (count === 0) return null
  return (
    <Alert tone="warning" icon={Lock} live={false} className="editor__blocked" title="Publishing is blocked">
      {plural(count, 'placeholder quote')} in Testimonials. Write real ones or delete the section.{' '}
      <button className="link" type="button" onClick={() => onFix(issues[0].sectionKey)}>
        Fix it
      </button>
    </Alert>
  )
}

/** Publish pressed (or refused with 409 PLACEHOLDER_TESTIMONIALS) while placeholders are left: what is missing, and how to fix it. */
export function PlaceholdersBlockedModal({
  open,
  issues,
  onEdit,
  onDeleteSection,
  onClose,
}: {
  open: boolean
  issues: PlaceholderIssue[]
  onEdit: (sectionKey: string) => void
  onDeleteSection: (sectionKey: string) => void
  onClose: () => void
}) {
  const count = placeholderCount(issues)
  return (
    <Modal
      open={open}
      onClose={onClose}
      title="Not ready to publish yet"
      description={`${plural(Math.max(count, 1), 'placeholder testimonial')} must become real, or be deleted, before this page can go live. Made-up reviews can’t be published.`}
      icon={Lock}
      tone="warning"
      actions={
        <Button variant="secondary" icon={X} onClick={onClose}>
          Close
        </Button>
      }
    >
      <ul className="publish-check" role="list">
        {issues.map((issue) => (
          <li className="publish-check__item publish-check__item--blocking" key={issue.sectionKey}>
            <span className="publish-check__icon">
              <X />
            </span>
            <div className="stack stack--xs">
              <strong>Testimonials · {plural(issue.items.length, 'placeholder quote')}</strong>
              <ul className="publish-check__needs" role="list">
                {issue.items.map(({ index, item }) => (
                  <li key={index}>
                    Quote {index + 1} needs {needsText(placeholderNeeds(item))}.
                  </li>
                ))}
              </ul>
              <span className="text-sm text-secondary">A quote counts as real only when both the quote and the name are real. Or delete what you don’t have yet.</span>
              <div className="cluster cluster--sm">
                <Button variant="primary" size="sm" icon={Pencil} onClick={() => onEdit(issue.sectionKey)}>
                  Edit testimonials
                </Button>
                <Button variant="danger-ghost" size="sm" icon={Trash2} onClick={() => onDeleteSection(issue.sectionKey)}>
                  Delete the section
                </Button>
              </div>
            </div>
          </li>
        ))}
        {issues.length === 0 && <li className="text-sm text-secondary">The saved page still has a placeholder testimonial. Save your changes and try again.</li>}
      </ul>
    </Modal>
  )
}
