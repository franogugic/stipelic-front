import { Check, Info, LoaderCircle, Upload } from 'lucide-react'
import { plural } from '../../../../shared/lib/format'
import { Button, Card, KeyValue } from '../../../../shared/ui/ledger'
import { number } from '../../../../shared/lib/format'
import type { CsvFacts } from '../../model/csv-check'
import type { ContactImportSummary } from '../../model/types'
import { FileChip } from './ImportCheckStep'

/** Step 2 while the file goes up for its check. */
export function ImportCheckingStep({ file, facts }: { file: { name: string; size: number }; facts: CsvFacts }) {
  return (
    <Card title="Checking the file">
      <div className="stack">
        <FileChip name={file.name} size={file.size} facts={facts} />
        <div className="import-checking" role="status">
          <LoaderCircle />
          <span>Uploading and checking every row. Nothing is saved yet.</span>
        </div>
      </div>
    </Card>
  )
}

/** Step 3 while the contacts are being added. */
export function ImportingStep({ fileName, count }: { fileName: string; count: number }) {
  return (
    <section className="card sending-panel" aria-labelledby="import-title">
      <div className="card__body stack stack--lg">
        <span className="sending-panel__icon">
          <Upload />
        </span>
        <div className="stack stack--sm">
          <h2 className="state__title" id="import-title">
            Importing {plural(count, 'contact')}
          </h2>
          <p className="text-secondary">From “{fileName}”. It usually takes a few seconds.</p>
        </div>
        <div className="import-checking" role="status">
          <LoaderCircle />
          <span>Adding contacts…</span>
        </div>
        <p className="text-sm text-muted">
          <Info className="inline-icon" /> Keep this page open until it’s done.
        </p>
      </div>
    </section>
  )
}

/** The end: what was added, and what was left out. */
export function ImportDoneStep({
  fileName,
  result,
  subscribersUrl,
  onAnother,
}: {
  fileName: string
  result: ContactImportSummary
  subscribersUrl: string
  onAnother: () => void
}) {
  return (
    <section className="card sending-panel" aria-labelledby="import-title">
      <div className="card__body stack stack--lg">
        <span className="sending-panel__icon">
          <Check />
        </span>
        <div className="stack stack--sm">
          <h2 className="state__title" id="import-title">
            {plural(result.new, 'contact')} imported
          </h2>
          <p className="text-secondary">
            From “{fileName}”. They’re in your list now, with “Import” as their source, and count toward your active contacts.
          </p>
        </div>
        <KeyValue
          items={[
            { term: 'Already in your list', description: `${number(result.existing)} · unchanged` },
            { term: 'Duplicates in the file', description: `${number(result.duplicatesInFile)} · added once` },
            { term: 'Unsubscribed', description: `${number(result.unsubscribed)} · not imported` },
            { term: 'Invalid rows', description: `${number(result.invalidCount)} · skipped` },
          ]}
        />
        <div className="cluster">
          <Button variant="primary" to={subscribersUrl}>
            Back to subscribers
          </Button>
          <Button variant="ghost" onClick={onAnother}>
            Import another file
          </Button>
        </div>
      </div>
    </section>
  )
}
