import { ImageOff, Loader2, Upload, X } from 'lucide-react'
import { useRef, useState } from 'react'
import {
  ALLOWED_UPLOAD_CONTENT_TYPES,
  MAX_UPLOAD_FILE_SIZE_BYTES,
  type MediaUploadPurpose,
} from '../api/media-api'
import { useImageUpload } from '../lib/use-image-upload'

export function ImageUploadField({
  slug,
  purpose,
  label,
  value,
  onChange,
}: {
  slug: string
  purpose: MediaUploadPurpose
  label: string
  value: string
  onChange: (url: string) => void
}) {
  const { uploading: isUploading, error, upload } = useImageUpload({ slug, purpose, onUploaded: onChange })
  const [isDragOver, setIsDragOver] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  return (
    <div className="grid gap-1.5">
      <label className="text-sm font-medium text-white/80 light:text-neutral-700">{label}</label>

      {value ? (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/[0.03] p-3 light:border-neutral-200 light:bg-white">
          <img
            src={value}
            alt=""
            className="size-14 shrink-0 rounded-lg object-cover"
          />
          <div className="min-w-0 flex-1">
            <p className="truncate text-xs text-white/50 light:text-neutral-500">{value}</p>
          </div>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => inputRef.current?.click()}
            className="shrink-0 rounded-lg px-2.5 py-1.5 text-xs font-medium text-white/70 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-50 light:text-neutral-600 light:hover:bg-neutral-100"
          >
            Replace
          </button>
          <button
            type="button"
            disabled={isUploading}
            onClick={() => onChange('')}
            className="grid size-8 shrink-0 place-items-center rounded-lg text-white/40 transition hover:bg-white/10 hover:text-white disabled:cursor-not-allowed disabled:opacity-50 light:text-neutral-400 light:hover:bg-neutral-100 light:hover:text-neutral-700"
            title="Remove"
          >
            <X size={14} />
          </button>
        </div>
      ) : (
        <button
          type="button"
          disabled={isUploading}
          onClick={() => inputRef.current?.click()}
          onDragOver={(e) => { e.preventDefault(); setIsDragOver(true) }}
          onDragLeave={() => setIsDragOver(false)}
          onDrop={(e) => {
            e.preventDefault()
            setIsDragOver(false)
            const file = e.dataTransfer.files[0]
            if (file) void upload(file)
          }}
          className={`flex flex-col items-center justify-center gap-2 rounded-xl border border-dashed px-4 py-6 text-center transition disabled:cursor-not-allowed ${
            isDragOver
              ? 'border-accent/60 bg-accent/5'
              : 'border-white/15 bg-white/[0.02] hover:bg-white/[0.04] light:border-neutral-300 light:bg-neutral-50 light:hover:bg-neutral-100'
          }`}
        >
          {isUploading ? (
            <Loader2 className="animate-spin text-white/40 light:text-neutral-400" size={20} />
          ) : error ? (
            <ImageOff className="text-red-400" size={20} />
          ) : (
            <Upload className="text-white/40 light:text-neutral-400" size={20} />
          )}
          <p className="text-xs font-medium text-white/60 light:text-neutral-600">
            {isUploading ? 'Uploading…' : 'Click to upload or drag and drop'}
          </p>
          <p className="text-[11px] text-white/30 light:text-neutral-400">
            JPEG, PNG, or WebP · up to {Math.round(MAX_UPLOAD_FILE_SIZE_BYTES / 1_048_576)} MB
          </p>
        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ALLOWED_UPLOAD_CONTENT_TYPES.join(',')}
        className="hidden"
        onChange={(e) => {
          const file = e.target.files?.[0]
          if (file) void upload(file)
          e.target.value = ''
        }}
      />

      {error ? <p className="text-xs text-red-400 light:text-red-600">{error}</p> : null}
    </div>
  )
}
