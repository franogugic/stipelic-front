import { ArrowLeft, CircleAlert, ImagePlus, Trash2, TriangleAlert } from 'lucide-react'
import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  uploadImage,
} from '../../../../shared/api/media-api'
import { Button, Meter } from '../../../../shared/ui/ledger'
import { CONTENT_LIMITS } from '../../model/section-content'
import type { GalleryContent } from '../../model/section-content'
import { AltTextField, FormGroup } from './fields'
import { useDragReorder } from './use-drag-reorder'

const fileName = (url: string) => decodeURIComponent(url.split('?')[0].split('/').pop() ?? 'image')

const move = <T,>(items: T[], from: number, to: number) => {
  const next = [...items]
  const [item] = next.splice(from, 1)
  next.splice(to, 0, item)
  return next
}

/**
 * The gallery's images (the prototype's media grid): upload several at once, reorder by drag or "move earlier",
 * remove, and give each image its alt text in the "Selected image" panel. Images without alt text are flagged.
 * Uploads finish asynchronously, so a finished upload is applied through `onImageUploaded` (to the content as
 * it is then), not through a stale copy.
 */
export function GalleryField({
  slug,
  content,
  onChange,
  onImageUploaded,
}: {
  slug: string
  content: GalleryContent
  onChange: (content: GalleryContent) => void
  onImageUploaded: (url: string) => void
}) {
  const [selected, setSelected] = useState(0)
  const [uploading, setUploading] = useState<{ preview: string; progress: number } | null>(null)
  const [error, setError] = useState<string | null>(null)
  const queueRef = useRef<File[]>([])
  const busyRef = useRef(false)
  const count = content.imageUrls.length
  const free = CONTENT_LIMITS.images - count - (uploading ? 1 : 0)
  const selectedIndex = Math.min(selected, count - 1)

  const reorder = (from: number, to: number) => {
    onChange({ ...content, imageUrls: move(content.imageUrls, from, to), imageAlts: move(content.imageAlts, from, to) })
    if (selectedIndex === from) setSelected(to)
  }
  const drag = useDragReorder(reorder, 'x')

  const remove = (index: number) => {
    onChange({
      ...content,
      imageUrls: content.imageUrls.filter((_, i) => i !== index),
      imageAlts: content.imageAlts.filter((_, i) => i !== index),
    })
    if (selectedIndex >= index && selectedIndex > 0) setSelected(selectedIndex - 1)
  }

  // Revoke the uploading preview's object URL when it is replaced or the field goes away.
  useEffect(() => {
    const preview = uploading?.preview
    return () => {
      if (preview) URL.revokeObjectURL(preview)
    }
  }, [uploading?.preview])

  const uploadNext = async () => {
    const file = queueRef.current.shift()
    if (!file) {
      busyRef.current = false
      setUploading(null)
      return
    }
    busyRef.current = true
    setUploading({ preview: URL.createObjectURL(file), progress: 0 })
    try {
      const url = await uploadImage(slug, 'LandingPageProductImage', file, (progress) =>
        setUploading((current) => (current ? { ...current, progress } : current)),
      )
      onImageUploaded(url)
    } catch {
      setError(`“${file.name}” didn’t upload. Please try again.`)
    }
    await uploadNext()
  }

  const onFiles = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files ?? [])
    event.target.value = ''
    setError(null)
    const rejected = files.find(
      (file) => !ALLOWED_UPLOAD_CONTENT_TYPES.includes(file.type) || file.size > MAX_UPLOAD_FILE_SIZE_BYTES,
    )
    const valid = files.filter((file) => file !== rejected && ALLOWED_UPLOAD_CONTENT_TYPES.includes(file.type) && file.size <= MAX_UPLOAD_FILE_SIZE_BYTES)
    const accepted = valid.slice(0, Math.max(0, free - queueRef.current.length))
    if (rejected) setError(`“${rejected.name}” isn’t a JPG, PNG or WebP under 5 MB.`)
    else if (accepted.length < valid.length) setError(`A gallery holds up to ${CONTENT_LIMITS.images} images.`)
    if (accepted.length === 0) return
    queueRef.current.push(...accepted)
    if (!busyRef.current) void uploadNext()
  }

  const shown = count + (uploading ? 1 : 0)
  const atMax = free <= 0

  return (
    <>
      <FormGroup
        legend="Images"
        hint={`${shown} of ${CONTENT_LIMITS.images} images · JPG, PNG or WebP, up to 5 MB each · drag to reorder`}
      >
        <ul className="media-grid" role="list">
          {content.imageUrls.map((url, index) => {
            const name = fileName(url)
            const classes = ['media-grid__item', index === selectedIndex && 'is-selected', drag.dragIndex === index && 'is-placeholder']
            return (
              <li className={classes.filter(Boolean).join(' ')} key={`${url}-${index}`} {...drag.itemProps(index)} {...drag.handleProps(index)}>
                <span className="media-grid__thumb" style={{ '--thumb': `url("${url}") center / cover` } as CSSProperties} />
                <button
                  className="media-grid__select"
                  type="button"
                  aria-pressed={index === selectedIndex}
                  aria-label={`Edit image ${index + 1}, ${name}`}
                  onClick={() => setSelected(index)}
                />
                <span className="media-grid__order">{index + 1}</span>
                {!content.imageAlts[index]?.trim() && (
                  <span className="badge badge--warning media-grid__flag" data-tooltip="No alt text yet">
                    <TriangleAlert />
                    Alt
                  </span>
                )}
                <div className="media-grid__actions">
                  <Button
                    variant="ghost"
                    size="sm"
                    iconOnly
                    icon={ArrowLeft}
                    aria-label={`Move ${name} earlier`}
                    data-tooltip={`Move ${name} earlier`}
                    aria-disabled={index === 0}
                    onClick={() => reorder(index, index - 1)}
                  />
                  <Button
                    variant="danger-ghost"
                    size="sm"
                    iconOnly
                    icon={Trash2}
                    aria-label={`Remove ${name}`}
                    data-tooltip={`Remove ${name}`}
                    onClick={() => remove(index)}
                  />
                </div>
              </li>
            )
          })}
          {uploading && (
            <li className="media-grid__item is-uploading">
              <span className="media-grid__thumb" style={{ '--thumb': `url("${uploading.preview}") center / cover` } as CSSProperties} />
              <div className="media-grid__progress">
                <Meter label="Uploading" used={uploading.progress} limit={100} />
              </div>
            </li>
          )}
          <li>
            <label className="media-grid__add" aria-disabled={atMax || undefined} data-tooltip={atMax ? `You can add up to ${CONTENT_LIMITS.images} images` : undefined}>
              <input
                className="sr-only"
                type="file"
                accept={ALLOWED_UPLOAD_CONTENT_TYPES.join(',')}
                multiple
                disabled={atMax}
                onChange={onFiles}
              />
              <ImagePlus />
              <span>Add images</span>
            </label>
          </li>
        </ul>
        {error && (
          <p className="field__error" role="alert">
            <CircleAlert />
            <span>{error}</span>
          </p>
        )}
      </FormGroup>
      {count > 0 && (
        <FormGroup legend="Selected image">
          <div className="media-detail">
            <img className="media-detail__thumb" src={content.imageUrls[selectedIndex]} alt="" />
            <div className="stack stack--xs">
              <strong>
                Image {selectedIndex + 1} of {count}
              </strong>
              <span className="text-xs text-muted mono">{fileName(content.imageUrls[selectedIndex])}</span>
            </div>
          </div>
          <AltTextField
            key={selectedIndex}
            value={content.imageAlts[selectedIndex] ?? ''}
            onChange={(alt) =>
              onChange({ ...content, imageAlts: content.imageAlts.map((current, i) => (i === selectedIndex ? alt : current)) })
            }
          />
        </FormGroup>
      )}
    </>
  )
}
