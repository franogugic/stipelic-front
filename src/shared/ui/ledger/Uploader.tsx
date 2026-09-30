import { CircleAlert, ImagePlus, RefreshCw, Trash2 } from 'lucide-react'
import { useId, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties, DragEvent } from 'react'
import { Button } from './Button'

const MAX_BYTES = 5 * 1024 * 1024
const ACCEPTED_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif']

/**
 * Presentational image uploader: a drop zone, an upload progress bar and a preview with Replace / Remove.
 * It owns no upload logic — the parent decides what `value`, `uploading` and `error` are and reacts to
 * `onSelect` / `onRemove`. Files that are not images or exceed 5 MB are rejected here with a message and
 * never reach `onSelect`.
 */
export function Uploader({
  label,
  hint = 'PNG, JPG or WebP · up to 5 MB',
  aspect = 'square',
  value,
  fileName,
  uploading,
  progress = 0,
  error,
  onSelect,
  onRemove,
}: {
  /** Accessible name of the file input. */
  label?: string
  hint?: string
  aspect?: 'square' | 'wide'
  /** Image URL — shows the preview. */
  value?: string | null
  fileName?: string
  uploading?: boolean
  /** 0–100, shown while `uploading`. */
  progress?: number
  /** Error from the parent (e.g. the upload failed). */
  error?: string | null
  onSelect: (file: File) => void
  onRemove: () => void
}) {
  const id = useId()
  const errorId = `${id}-error`
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragOver, setDragOver] = useState(false)
  const [localError, setLocalError] = useState('')

  const view = uploading ? 'progress' : value ? 'preview' : 'drop'
  const message = localError || error || ''

  const accept = (file: File | undefined) => {
    if (!file) return
    if (!ACCEPTED_TYPES.includes(file.type)) {
      setLocalError('Use a PNG, JPG, WebP or GIF image.')
      return
    }
    if (file.size > MAX_BYTES) {
      setLocalError(`This image is ${(file.size / 1048576).toFixed(1)} MB — the limit is 5 MB.`)
      return
    }
    setLocalError('')
    onSelect(file)
  }

  const onChange = (event: ChangeEvent<HTMLInputElement>) => {
    accept(event.target.files?.[0])
    event.target.value = ''
  }

  const onDrag = (event: DragEvent, over: boolean) => {
    event.preventDefault()
    setDragOver(over)
  }

  return (
    <>
      <div
        className={['uploader', aspect === 'wide' && 'uploader--wide', dragOver && 'is-dragover'].filter(Boolean).join(' ')}
        aria-invalid={message ? true : false}
        onDragEnter={(event) => onDrag(event, true)}
        onDragOver={(event) => onDrag(event, true)}
        onDragLeave={(event) => onDrag(event, false)}
        onDrop={(event) => {
          onDrag(event, false)
          accept(event.dataTransfer.files[0])
        }}
      >
        <label className="uploader__drop" htmlFor={id} hidden={view !== 'drop'}>
          <input
            ref={inputRef}
            className="uploader__input"
            id={id}
            type="file"
            accept={ACCEPTED_TYPES.join(',')}
            aria-describedby={errorId}
            aria-label={label}
            onChange={onChange}
          />
          <span className="uploader__glyph">
            <ImagePlus />
          </span>
          <span className="uploader__title">
            Drop an image or <u>browse</u>
          </span>
          <span className="uploader__hint">{hint}</span>
        </label>
        <div className="uploader__progress" hidden={view !== 'progress'}>
          <div className="meter">
            <div className="meter__head">
              <span className="meter__label">{fileName ? `Uploading ${fileName}` : 'Uploading…'}</span>
              <span className="meter__value">{progress}%</span>
            </div>
            <div
              className="meter__track"
              role="progressbar"
              aria-label="Upload progress"
              aria-valuemin={0}
              aria-valuemax={100}
              aria-valuenow={progress}
            >
              <div className="meter__fill" style={{ '--meter-value': `${progress}%` } as CSSProperties} />
            </div>
          </div>
        </div>
        <div className="uploader__preview" hidden={view !== 'preview'}>
          <img className="uploader__thumb" src={value ?? ''} alt="" />
          <div className="uploader__meta">
            <span className="uploader__name">{fileName}</span>
            <div className="cluster cluster--sm">
              <Button variant="secondary" size="sm" icon={RefreshCw} onClick={() => inputRef.current?.click()}>
                Replace
              </Button>
              <Button
                variant="danger-ghost"
                size="sm"
                icon={Trash2}
                onClick={() => {
                  onRemove()
                  inputRef.current?.focus()
                }}
              >
                Remove
              </Button>
            </div>
          </div>
        </div>
      </div>
      <p className="field__error" id={errorId} hidden={!message}>
        {message && (
          <>
            <CircleAlert />
            <span>{message}</span>
          </>
        )}
      </p>
    </>
  )
}
