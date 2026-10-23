import { CircleAlert, Download, FileUp, Mail, RefreshCw } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import { date } from '../../../shared/lib/format'
import { Button, Card } from '../../../shared/ui/ledger'
import { PRODUCT_FILE_ACCEPT, fileFormatOf, fileMeta, fileSize } from '../model/product-file'
import { FileGlyph } from './FileGlyph'

/** The document a product delivers: the file in storage, one just picked, or nothing yet. */
export type ProductFileView = {
  /** The file name and size shown. */
  fileName: string
  fileSizeBytes: number
  /** When it was uploaded; null for a file picked in this session that is not saved yet. */
  uploadedAt: string | null
}

/**
 * "What buyers get": the product's file with Replace, or a drop zone while there is none, a progress bar while it
 * uploads and the reason when a file is refused; and how the file reaches people. Replacing updates it for everyone.
 */
export function ProductFileCard({
  file,
  uploading,
  progress,
  uploadingName,
  uploadingSize,
  error,
  disabled,
  onSelect,
}: {
  file: ProductFileView | null
  uploading: boolean
  progress: number
  uploadingName: string | null
  uploadingSize: number
  /** Why the last file was refused or failed (the message is shown under the drop zone). */
  error: string | null
  disabled?: boolean
  onSelect: (file: File) => void
}) {
  const id = useId()
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    const picked = event.target.files?.[0]
    if (picked) onSelect(picked)
    event.target.value = ''
  }
  const onDrag = (event: DragEvent, over: boolean) => {
    event.preventDefault()
    setDragOver(over)
  }

  const errorId = `${id}-error`
  const hintId = `${id}-hint`

  const hiddenInput = (
    <input
      ref={inputRef}
      className="uploader__input"
      id={id}
      name="product-file"
      type="file"
      accept={PRODUCT_FILE_ACCEPT}
      disabled={disabled}
      aria-describedby={error ? `${hintId} ${errorId}` : hintId}
      aria-label="Product file"
      onChange={onChange}
    />
  )

  const body = () => {
    if (uploading) {
      const name = uploadingName ?? 'Your file'
      return (
        <>
          <div className="file-chip">
            <span className="file-chip__icon">
              <FileGlyph fileName={name} />
            </span>
            <span className="file-chip__text">
              <span className="table__primary">{name}</span>
              <span className="table__secondary">
                {[fileFormatOf(name), fileSize(uploadingSize)].filter(Boolean).join(' · ')}
              </span>
            </span>
          </div>
          <div className="meter">
            <div className="meter__head">
              <span className="meter__label">Uploading</span>
              <span className="meter__value">{progress}%</span>
            </div>
            <div className="meter__track" role="progressbar" aria-label="Upload progress" aria-valuemin={0} aria-valuemax={100} aria-valuenow={progress}>
              <div className="meter__fill" style={{ '--meter-value': `${progress}%` } as CSSProperties} />
            </div>
          </div>
        </>
      )
    }
    if (file) {
      return (
        <>
          <div className="file-chip">
            <span className="file-chip__icon">
              <FileGlyph fileName={file.fileName} />
            </span>
            <span className="file-chip__text">
              <span className="table__primary">{file.fileName}</span>
              <span className="table__secondary">
                {fileMeta(file)}
                {file.uploadedAt ? (
                  <>
                    {' · '}
                    <span className="file-chip__date">uploaded {date(file.uploadedAt)}</span>
                  </>
                ) : (
                  <>
                    {' · '}
                    <span className="file-chip__date">ready — saved with the product</span>
                  </>
                )}
              </span>
            </span>
          </div>
          <div className="cluster cluster--sm">
            <Button variant="secondary" size="sm" icon={RefreshCw} disabled={disabled} onClick={() => inputRef.current?.click()}>
              Replace file
            </Button>
          </div>
          {hiddenInput}
          <p className="field__hint" id={hintId}>
            Replacing it updates the file for everyone who already has it — their links always give the newest one.
          </p>
          {error && (
            <p className="field__error" id={errorId} role="alert">
              <CircleAlert />
              <span>{error}</span>
            </p>
          )}
        </>
      )
    }
    return (
      <>
        <div
          className={['uploader', 'uploader--file', dragOver && 'is-dragover'].filter(Boolean).join(' ')}
          aria-invalid={error ? true : undefined}
          onDragEnter={(event) => onDrag(event, true)}
          onDragOver={(event) => onDrag(event, true)}
          onDragLeave={(event) => onDrag(event, false)}
          onDrop={(event) => {
            onDrag(event, false)
            const dropped = event.dataTransfer.files[0]
            if (dropped && !disabled) onSelect(dropped)
          }}
        >
          <label className="uploader__drop" htmlFor={id}>
            {hiddenInput}
            <span className="uploader__glyph">
              <FileUp />
            </span>
            <span className="uploader__title">
              Drop your file or <u>browse</u>
            </span>
            <span className="uploader__hint" id={hintId}>
              PDF, EPUB or ZIP · up to 100 MB
            </span>
          </label>
        </div>
        {error ? (
          <p className="field__error" id={errorId} role="alert">
            <CircleAlert />
            <span>{error}</span>
          </p>
        ) : (
          <p className="field__hint">A product can’t be active until its file is uploaded.</p>
        )}
      </>
    )
  }

  return (
    <Card title="What buyers get" subtitle="The file buyers download">
      <div className="stack">
        {body()}
        <ol className="delivery-steps" role="list">
          <li>
            <Download />
            <span>
              <strong>Right after paying</strong> the file downloads to their computer.
            </span>
          </li>
          <li>
            <Mail />
            <span>
              <strong>By email</strong> they get a personal link to download it again, any time.
            </span>
          </li>
        </ol>
      </div>
    </Card>
  )
}
