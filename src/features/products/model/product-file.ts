import type { Product } from './types'

/** Mirrors the backend `Media:ProductFileMaxSizeBytes` default — only for fast feedback before uploading; the server
 * reads the real blob and remains the authority. */
export const PRODUCT_FILE_MAX_BYTES = 104_857_600

/** What a product can deliver: the extensions the picker accepts and the content type each is uploaded as. */
const FORMATS = {
  pdf: 'application/pdf',
  epub: 'application/epub+zip',
  zip: 'application/zip',
} as const

export const PRODUCT_FILE_ACCEPT = '.pdf,.epub,.zip,application/pdf,application/epub+zip,application/zip'

export type ProductFileFormat = 'PDF' | 'EPUB' | 'ZIP'

const extensionOf = (fileName: string) => fileName.split('.').pop()?.toLowerCase() ?? ''

/** "PDF" / "EPUB" / "ZIP" for a file name, or null for anything else. */
export function fileFormatOf(fileName: string): ProductFileFormat | null {
  const extension = extensionOf(fileName)
  return extension in FORMATS ? (extension.toUpperCase() as ProductFileFormat) : null
}

/** The content type to upload the file as, from its extension (browsers report EPUB and sometimes ZIP unreliably). */
export const contentTypeOf = (fileName: string) => FORMATS[extensionOf(fileName) as keyof typeof FORMATS]

/** Checked before uploading: PDF, EPUB or ZIP, up to 100 MB. Null when the file is fine. */
export function validateProductFile(file: File): string | null {
  if (!fileFormatOf(file.name)) {
    return `“${file.name}” isn’t a PDF, EPUB or ZIP. Pack your files into a ZIP and upload that.`
  }
  if (file.size > PRODUCT_FILE_MAX_BYTES) {
    return `“${file.name}” is ${(file.size / 1_048_576).toFixed(0)} MB — the limit is 100 MB.`
  }
  if (file.size === 0) return `“${file.name}” is empty.`
  return null
}

/** A product given away for an email on lead pages rather than sold. */
export const isFreeProduct = (product: Pick<Product, 'priceCents'>) => product.priceCents === 0

/** "24.6 MB", "812 KB". */
export function fileSize(bytes: number) {
  if (bytes >= 1_048_576) return `${(bytes / 1_048_576).toFixed(bytes >= 10_485_760 ? 0 : 1)} MB`
  return `${Math.max(1, Math.round(bytes / 1024))} KB`
}

/** "PDF · 2.4 MB" for the file chip and the product's details. */
export function fileMeta(file: { fileName: string; fileSizeBytes: number }) {
  return [fileFormatOf(file.fileName) ?? file.fileName.split('.').pop()?.toUpperCase(), fileSize(file.fileSizeBytes)].filter(Boolean).join(' · ')
}
