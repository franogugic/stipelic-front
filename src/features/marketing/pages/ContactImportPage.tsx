import { useEffect, useState } from 'react'
import { useParams } from 'react-router-dom'
import { ApiError } from '../../../shared/api/http-client'
import { plural } from '../../../shared/lib/format'
import { useKeyedLoad } from '../../../shared/lib/use-keyed-load'
import { AppShell } from '../../../shared/ui/AppShell'
import { Button, ErrorState, PageHeader, SkeletonBlock } from '../../../shared/ui/ledger'
import { useCreatorStore } from '../../creators/model/creator-store'
import { getContactStats, importContacts } from '../api/contacts-api'
import { ImportCheckStep } from '../components/import/ImportCheckStep'
import { ImportCheckingStep, ImportDoneStep, ImportingStep } from '../components/import/ImportProgressStep'
import { ImportUploadStep } from '../components/import/ImportUploadStep'
import type { UploadProblem } from '../components/import/ImportUploadStep'
import { checkCsvFile } from '../model/csv-check'
import type { CsvFacts } from '../model/csv-check'
import type { ContactImportSummary } from '../model/types'

const STEPS = ['Upload', 'Check', 'Import']

type Flow =
  | { step: 'upload'; problem: UploadProblem | null }
  | { step: 'checking'; file: File; facts: CsvFacts }
  | { step: 'check'; file: File; facts: CsvFacts; result: ContactImportSummary; consent: boolean; importError: string | null }
  | { step: 'importing'; file: File; facts: CsvFacts; result: ContactImportSummary }
  | { step: 'done'; file: File; result: ContactImportSummary }

const STEP_INDEX = { upload: 0, checking: 1, check: 1, importing: 2, done: 3 }
const FILE_PROBLEM_CODES = new Set(['FILE_MISSING', 'FILE_TOO_LARGE', 'FILE_EMPTY', 'TOO_MANY_ROWS', 'NO_EMAIL_COLUMN', 'INVALID_ENCODING', 'INVALID_CSV'])

/** "Import contacts": choose a CSV → check it (a dry run) → import it. All or nothing against the plan's contact limit. */
export function ContactImportPage() {
  const { slug = '' } = useParams<{ slug: string }>()
  const creator = useCreatorStore((s) => (s.currentCreator?.slug === slug ? s.currentCreator : null))
  const plans = useCreatorStore((s) => s.creatorPlans)
  const loadCreatorPlans = useCreatorStore((s) => s.loadCreatorPlans)
  const currentCreatorStatus = useCreatorStore((s) => s.currentCreatorStatus)
  const loadCurrentCreator = useCreatorStore((s) => s.loadCurrentCreator)
  useEffect(() => {
    if (currentCreatorStatus === 'idle') void loadCurrentCreator()
  }, [currentCreatorStatus, loadCurrentCreator])
  useEffect(() => {
    void loadCreatorPlans()
  }, [loadCreatorPlans])
  const stats = useKeyedLoad(slug ? `stats|${slug}` : null, () => getContactStats(slug))
  const [flow, setFlow] = useState<Flow>({ step: 'upload', problem: null })
  // The last file the upload was tried with, for "Try again" after a network failure.
  const [lastFile, setLastFile] = useState<File | null>(null)

  const planName = creator?.planName ?? 'your'
  const limit = creator ? (plans.find((plan) => plan.code === creator.planCode)?.limits.max_contacts ?? null) : null
  const active = stats.load.status === 'success' ? stats.load.data.active : 0
  const roomText =
    limit === null || limit < 0
      ? 'Your plan has no contact limit'
      : `Room for ${plural(Math.max(limit - active, 0), 'more active contact')} on ${planName} · unsubscribed ones don’t count`

  const start = async (file: File) => {
    setLastFile(file)
    const checked = await checkCsvFile(file)
    if ('rejection' in checked) {
      setFlow({ step: 'upload', problem: { kind: 'rejected', fileName: file.name, fileSize: file.size, rejection: checked.rejection } })
      return
    }
    setFlow({ step: 'checking', file, facts: checked.facts })
    try {
      const result = await importContacts(slug, file, { dryRun: true, consentAttested: false })
      setFlow({ step: 'check', file, facts: checked.facts, result, consent: false, importError: null })
    } catch (error) {
      // The server read the file and refused it: its explanation is final. Anything else is a failed upload.
      if (error instanceof ApiError && error.status === 400 && error.code && FILE_PROBLEM_CODES.has(error.code)) {
        setFlow({ step: 'upload', problem: { kind: 'unreadable', fileName: file.name, reason: error.message } })
      } else {
        setFlow({ step: 'upload', problem: { kind: 'network' } })
      }
    }
  }

  const runImport = async (current: Extract<Flow, { step: 'check' }>) => {
    setFlow({ step: 'importing', file: current.file, facts: current.facts, result: current.result })
    try {
      const result = await importContacts(slug, current.file, { dryRun: false, consentAttested: true })
      setFlow({ step: 'done', file: current.file, result })
      stats.reload()
    } catch (error) {
      // The limit moved since the check (all or nothing): show the limit state; anything else: say it and let them retry.
      const exceeded = error instanceof ApiError && error.status === 409
      setFlow({
        step: 'check',
        file: current.file,
        facts: current.facts,
        result: exceeded ? { ...current.result, remainingContactLimit: -1 } : current.result,
        consent: true,
        importError: exceeded ? null : error instanceof ApiError ? error.message : 'We couldn’t reach the server.',
      })
    }
  }

  const again = () => setFlow({ step: 'upload', problem: null })
  const settingsUrl = `/app/${slug}/settings?tab=billing`

  const body = () => {
    if (stats.load.status === 'error') return <ErrorState onRetry={stats.reload} />
    switch (flow.step) {
      case 'upload':
        return (
          <ImportUploadStep
            problem={flow.problem}
            roomText={roomText}
            onFile={(file) => void start(file)}
            onRetry={() => (lastFile ? void start(lastFile) : again())}
          />
        )
      case 'checking':
        return <ImportCheckingStep file={flow.file} facts={flow.facts} />
      case 'check':
        return stats.load.status === 'success' ? (
          <ImportCheckStep
            file={flow.file}
            facts={flow.facts}
            result={flow.result}
            activeContacts={active}
            planName={planName}
            contactLimit={limit !== null && limit >= 0 ? limit : null}
            consent={flow.consent}
            importError={flow.importError}
            onConsent={(consent) => setFlow({ ...flow, consent })}
            onImport={() => void runImport(flow)}
            onAnother={again}
            upgradeTo={settingsUrl}
          />
        ) : (
          <SkeletonBlock />
        )
      case 'importing':
        return <ImportingStep fileName={flow.file.name} count={flow.result.new} />
      case 'done':
        return (
          <ImportDoneStep
            fileName={flow.file.name}
            result={flow.result}
            subscribersUrl={`/app/${slug}/subscribers?imported=${flow.result.new}`}
            onAnother={again}
          />
        )
    }
  }

  return (
    <AppShell slug={slug} activeSection="subscribers" documentTitle="Import contacts · Luma">
      <PageHeader
        eyebrow="Subscribers"
        title={
          <>
            Import <em>contacts</em>
          </>
        }
        subtitle="Add people from a CSV file. You see the result of the check before anything is saved."
        actions={
          flow.step === 'done' || flow.step === 'importing' ? undefined : (
            <Button variant="ghost" to={`/app/${slug}/subscribers`}>
              Cancel
            </Button>
          )
        }
      />
      <div className="stack stack--lg reveal">
        <ol className="stepper import-stepper" role="list" aria-label="Import steps">
          {STEPS.map((label, index) => {
            const current = STEP_INDEX[flow.step]
            return (
              <li
                className={`stepper__step${index < current ? ' stepper__step--done' : index === current ? ' stepper__step--current' : ''}`}
                aria-current={index === current ? 'step' : undefined}
                key={label}
              >
                {index + 1} · {label}
              </li>
            )
          })}
        </ol>
        {body()}
      </div>
    </AppShell>
  )
}

