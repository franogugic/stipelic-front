import { Download, LoaderCircle } from 'lucide-react'
import { FileGlyph } from '../../products/components/FileGlyph'
import { fileMeta } from '../../products/model/product-file'

/** The file a buyer or a subscriber downloads: its icon, name, format and size, and the download button. */
export function BuyerFile({
  fileName,
  fileSizeBytes,
  label = 'Download',
  busy,
  onDownload,
}: {
  fileName: string
  fileSizeBytes: number
  label?: string
  busy?: boolean
  onDownload: () => void
}) {
  return (
    <div className="lp-file">
      <span className="lp-file__icon">
        <FileGlyph fileName={fileName} />
      </span>
      <span className="lp-file__text">
        <span className="lp-file__name">{fileName}</span>
        <span className="lp-file__meta">{fileMeta({ fileName, fileSizeBytes })}</span>
      </span>
      <button className="lp__cta lp-file__cta" type="button" aria-busy={busy || undefined} disabled={busy} onClick={onDownload}>
        {busy ? <LoaderCircle /> : <Download />}
        <span>{busy ? 'Preparing…' : label}</span>
      </button>
    </div>
  )
}
