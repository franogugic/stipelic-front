import { CircleAlert, FileSpreadsheet, FileX, ShieldCheck, WifiOff, Check, RotateCw } from 'lucide-react'
import type { DragEvent } from 'react'
import { useId, useState } from 'react'
import { number } from '../../../../shared/lib/format'
import { Alert, Badge, Button, Card } from '../../../../shared/ui/ledger'
import { IMPORT_MAX_ROWS, fileSizeLabel } from '../../model/csv-check'
import type { CsvRejection } from '../../model/csv-check'

/** Why the last file did not get through. */
export type UploadProblem =
  | { kind: 'rejected'; fileName: string; fileSize: number; rejection: CsvRejection }
  /** The server read the file and refused it (a 400 with its own explanation). */
  | { kind: 'unreadable'; fileName: string; reason: string }
  /** The upload itself failed. */
  | { kind: 'network' }

function rejectionText(name: string, size: number, rejection: CsvRejection) {
  switch (rejection.code) {
    case 'wrong-type':
      return `“${name}” isn’t a CSV file. Export it as CSV from Excel, Numbers or Google Sheets and upload that.`
    case 'too-big':
      return `“${name}” is ${fileSizeLabel(size)}. A file can be up to 5 MB and ${number(IMPORT_MAX_ROWS)} rows — split it into smaller files.`
    case 'too-many-rows':
      return `“${name}” has ${number(rejection.rows)} rows. A file can be up to ${number(IMPORT_MAX_ROWS)} rows — split it into smaller files.`
    case 'empty-file':
      return `“${name}” is empty, so there’s nothing to import.`
    case 'no-email-column':
      return `We couldn’t find email addresses in “${name}”. Name the column with the addresses “email”, or use a file with one email per row.`
  }
}

/** Step 1: choose a CSV file (drop or browse), with what it should look like. */
export function ImportUploadStep({
  problem,
  roomText,
  onFile,
  onRetry,
}: {
  problem: UploadProblem | null
  /** "Room for 4,514 more active contacts on Pro · unsubscribed ones don’t count", or the no-limit line. */
  roomText: string
  onFile: (file: File) => void
  onRetry: () => void
}) {
  const id = useId()
  const [dragOver, setDragOver] = useState(false)
  const rejected = problem?.kind === 'rejected' ? problem : null
  const onDrag = (event: DragEvent, over: boolean) => {
    event.preventDefault()
    setDragOver(over)
  }
  const errorText = rejected ? rejectionText(rejected.fileName, rejected.fileSize, rejected.rejection) : null

  return (
    <>
      {problem?.kind === 'unreadable' && (
        <Alert tone="danger" icon={FileX} title={`We couldn’t check “${problem.fileName}”`} live>
          {problem.reason} Nothing was imported.
        </Alert>
      )}
      {problem?.kind === 'network' && (
        <div className="alert alert--danger import-retry" role="alert">
          <WifiOff />
          <div className="alert__body">
            <p className="alert__title">The upload didn’t go through</p>
            <p>Check your connection and try again. Nothing was imported.</p>
          </div>
          <Button variant="secondary" icon={RotateCw} onClick={onRetry}>
            Try again
          </Button>
        </div>
      )}
      <div className="dash">
        <div className="span-7">
          <Card title="Choose a CSV file" subtitle={roomText}>
            <div className="stack">
              <div
                className={['uploader', 'uploader--file', dragOver && 'is-dragover'].filter(Boolean).join(' ')}
                aria-invalid={errorText ? true : undefined}
                onDragEnter={(event) => onDrag(event, true)}
                onDragOver={(event) => onDrag(event, true)}
                onDragLeave={(event) => onDrag(event, false)}
                onDrop={(event) => {
                  onDrag(event, false)
                  const dropped = event.dataTransfer.files[0]
                  if (dropped) onFile(dropped)
                }}
              >
                <label className="uploader__drop" htmlFor={id}>
                  <input
                    className="uploader__input"
                    id={id}
                    type="file"
                    accept=".csv,text/csv"
                    aria-describedby={`${id}-hint${errorText ? ` ${id}-error` : ''}`}
                    onChange={(event) => {
                      const picked = event.target.files?.[0]
                      if (picked) onFile(picked)
                      event.target.value = ''
                    }}
                  />
                  <span className="uploader__glyph">
                    <FileSpreadsheet />
                  </span>
                  <span className="uploader__title">
                    Drop a CSV file or <u>browse</u>
                  </span>
                  <span className="uploader__hint" id={`${id}-hint`}>
                    Up to 5 MB and {number(IMPORT_MAX_ROWS)} rows
                  </span>
                </label>
              </div>
              {errorText && (
                <p className="field__error" id={`${id}-error`} role="alert">
                  <CircleAlert />
                  <span>{errorText}</span>
                </p>
              )}
              {rejected?.rejection.code === 'no-email-column' && rejected.rejection.columns.length > 0 && (
                <div className="stack stack--xs">
                  <span className="field__label">Columns we found</span>
                  <div className="cluster cluster--sm">
                    {rejected.rejection.columns.map((column) => (
                      <Badge tone="outline" key={column}>
                        {column}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}
              <p className="text-sm text-secondary">
                Checking a file saves nothing. You see what would be imported, and confirm, before anyone is added.
              </p>
            </div>
          </Card>
        </div>
        <div className="span-5">
          <Card title="What the file should look like">
            <div className="fill-stack">
              <div className="csv-examples">
                <figure className="csv-example">
                  <figcaption>One email per row</figcaption>
                  <pre>{'ana@example.com\nmarko@example.com\npetra@example.com'}</pre>
                </figure>
                <figure className="csv-example">
                  <figcaption>Or a column named “email”</figcaption>
                  <pre>{'name;email\nAna;ana@example.com\nMarko;marko@example.com'}</pre>
                </figure>
              </div>
              <ul className="import-rules" role="list">
                <li>
                  <Check />
                  <span>Commas or semicolons both work.</span>
                </li>
                <li>
                  <Check />
                  <span>Only the email address is imported; other columns are ignored.</span>
                </li>
                <li>
                  <Check />
                  <span>People who unsubscribed from you are never added back.</span>
                </li>
              </ul>
              <p className="fill-stack__foot">
                <span>
                  <ShieldCheck className="inline-icon" /> Only import people who agreed to get emails from you.
                </span>
              </p>
            </div>
          </Card>
        </div>
      </div>
    </>
  )
}

