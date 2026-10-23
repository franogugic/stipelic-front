import { ArrowUpRight, CircleAlert, Copy, FileSpreadsheet, FileUp, Upload, UserCheck, UserPlus, UserX, Users } from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import { number, plural } from '../../../../shared/lib/format'
import { Alert, Button, Card, Meter } from '../../../../shared/ui/ledger'
import { fileSizeLabel } from '../../model/csv-check'
import type { CsvFacts } from '../../model/csv-check'
import type { ContactImportSummary } from '../../model/types'

const INVALID_REASONS: Record<string, string> = {
  EMPTY: 'The email cell is empty',
  TOO_LONG: 'The address is longer than 254 characters',
  INVALID_EMAIL: 'Not a valid email address',
}
const SHOWN_INVALID = 5
const UNSUBSCRIBED_FREE = 'Unsubscribed contacts don’t count toward the limit.'

/** One file, as it was read: name, size, rows, separator and where the emails are. */
export function FileChip({ name, size, rows, facts }: { name: string; size: number; rows?: number; facts?: CsvFacts }) {
  const parts = [
    fileSizeLabel(size),
    ...(rows === undefined ? [] : [plural(rows, 'row')]),
    ...(facts ? [facts.delimiter === 'semicolon' ? 'semicolons' : 'commas', facts.emailColumn ? `emails in “${facts.emailColumn}”` : 'one email per row'] : []),
  ]
  return (
    <div className="file-chip">
      <span className="file-chip__icon">
        <FileSpreadsheet />
      </span>
      <span className="file-chip__text">
        <span className="table__primary">{name}</span>
        <span className="table__secondary">{parts.join(' · ')}</span>
      </span>
    </div>
  )
}

function Tally({ result }: { result: ContactImportSummary }) {
  const rows: Array<[LucideIcon, string, string, number, string]> = [
    [UserPlus, 'New contacts', 'Will be added', result.new, 'new'],
    [UserCheck, 'Already in your list', 'Stay as they are', result.existing, ''],
    [Copy, 'Duplicates in the file', 'Added once', result.duplicatesInFile, ''],
    [UserX, 'Unsubscribed', 'Won’t be imported — they asked not to get emails from you', result.unsubscribed, 'warning'],
    [CircleAlert, 'Invalid rows', result.invalidCount ? 'Skipped — listed below' : 'None', result.invalidCount, 'danger'],
  ]
  return (
    <ul className="tally" role="list">
      {rows.map(([Icon, label, text, count, tone]) => (
        <li className={`tally__row${tone && count ? ` tally__row--${tone}` : ''}`} key={label}>
          <span className="tally__icon">
            <Icon />
          </span>
          <span className="tally__text">
            <span className="tally__label">{label}</span>
            <span className="text-xs text-muted">{text}</span>
          </span>
          <span className="tally__count">{number(count)}</span>
        </li>
      ))}
    </ul>
  )
}

/** Step 2: the dry run — what the file holds, what an import would do, and the confirmation. */
export function ImportCheckStep({
  file,
  facts,
  result,
  activeContacts,
  planName,
  contactLimit,
  consent,
  importError,
  onConsent,
  onImport,
  onAnother,
  upgradeTo,
}: {
  file: { name: string; size: number }
  facts: CsvFacts
  result: ContactImportSummary
  /** Active contacts now: the part of the plan's limit already used. */
  activeContacts: number
  planName: string
  /** The plan's limit of active contacts; null when the plan has none. */
  contactLimit: number | null
  consent: boolean
  /** Why the real import didn't go through (nothing was imported). */
  importError: string | null
  onConsent: (value: boolean) => void
  onImport: () => void
  onAnother: () => void
  upgradeTo: string
}) {
  const shown = result.invalid.slice(0, SHOWN_INVALID)
  const remaining = result.remainingContactLimit
  const overLimit = remaining !== null && remaining < 0
  // The limit of the plan when it is known; else as the server applies it (what is left, plus this import, plus what is used).
  const limit = contactLimit ?? (remaining === null ? null : activeContacts + result.new + remaining)
  const room = limit === null ? null : Math.max(limit - activeContacts, 0)
  const another = (
    <Button variant="secondary" icon={FileUp} onClick={onAnother}>
      Choose another file
    </Button>
  )

  const decision = () => {
    if (result.new === 0) {
      return (
        <Card title="Import">
          <div className="fill-stack">
            <Alert tone="warning" icon={CircleAlert} title="Nothing to import" live>
              None of the {plural(result.rows, 'row')} has a new valid email address. Check that the file has the right column, or export it again.
            </Alert>
            <div className="fill-stack__foot import-actions">{another}</div>
          </div>
        </Card>
      )
    }
    if (overLimit) {
      return (
        <Card title="Import" subtitle={`${number(result.new)} of ${number(room ?? 0)} remaining contacts — too many`}>
          <div className="fill-stack">
            <Alert tone="warning" icon={Users} title="Not enough room on your plan" live>
              This file has {plural(result.new, 'new contact')} and your {planName} plan has room for {number(room ?? 0)} more. Nothing is imported — an
              import is all or nothing.
            </Alert>
            <Meter label={`Active contacts after this import · ${planName} plan`} used={activeContacts + result.new} limit={limit} />
            <p className="field__hint">{UNSUBSCRIBED_FREE}</p>
            <div className="fill-stack__foot import-actions">
              <Button variant="accent" icon={ArrowUpRight} to={upgradeTo}>
                Upgrade plan
              </Button>
              {another}
            </div>
          </div>
        </Card>
      )
    }
    return (
      <Card title="Import" subtitle="Imported contacts get “Import” as their source">
        <div className="fill-stack">
          {importError && (
            <Alert tone="danger" icon={CircleAlert} title="The import didn’t go through" live>
              {importError} Nothing was imported.
            </Alert>
          )}
          <Meter label="Active contacts after the import" used={activeContacts + result.new} limit={limit} />
          <p className="text-sm text-secondary">
            {room === null
              ? `${plural(result.new, 'new contact')} — your plan has no contact limit.`
              : `${number(result.new)} of your ${number(room)} remaining contacts on ${planName}. ${UNSUBSCRIBED_FREE}`}
          </p>
          <label className="check import-consent">
            <input className="check__input" type="checkbox" name="import-consent" checked={consent} onChange={(event) => onConsent(event.target.checked)} />
            <span className="check__text">
              I confirm that everyone in this file agreed to receive emails from me, and that I can show it if asked.
            </span>
          </label>
          <div className="fill-stack__foot import-actions">
            <Button variant="primary" icon={Upload} disabledReason={consent ? undefined : 'Tick the confirmation first'} onClick={onImport}>
              Import {plural(result.new, 'contact')}
            </Button>
            {another}
          </div>
        </div>
      </Card>
    )
  }

  return (
    <>
      <div className="dash">
        <div className="span-7">
          <Card title="Check" subtitle="A dry run — nothing has been saved yet">
            <div className="stack">
              <FileChip name={file.name} size={file.size} rows={result.rows} facts={facts} />
              <Tally result={result} />
            </div>
          </Card>
        </div>
        <div className="span-5">{decision()}</div>
      </div>
      {shown.length > 0 && (
        <Card title="Invalid rows" flush>
          <div className="table-wrap">
            <table className="table table--stack">
              <thead>
                <tr>
                  <th scope="col">Row</th>
                  <th scope="col">Value</th>
                  <th scope="col">Why it was skipped</th>
                </tr>
              </thead>
              <tbody>
                {shown.map((row) => (
                  <tr key={row.row}>
                    <td className="is-lead num">
                      <span className="import-row">{number(row.row)}</span>
                    </td>
                    <td data-label="Value">{row.value ? <span className="mono">{row.value}</span> : <span className="text-muted">(empty)</span>}</td>
                    <td data-label="Why" className="text-secondary">
                      {INVALID_REASONS[row.reason] ?? 'Not a valid email address'}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="table-footer">
            <span className="table-footer__count">
              {result.invalidCount > shown.length ? `The first ${shown.length} of ${number(result.invalidCount)} invalid rows. ` : ''}Fix them in your file
              and import it again — contacts already in your list stay as they are.
            </span>
          </div>
        </Card>
      )}
    </>
  )
}
