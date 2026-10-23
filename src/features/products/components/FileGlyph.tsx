import { BookOpen, FileArchive, FileText } from 'lucide-react'
import { fileFormatOf } from '../model/product-file'

/** The icon of a document by its format: PDF → text, EPUB → book, ZIP → archive. */
export function FileGlyph({ fileName }: { fileName: string }) {
  const format = fileFormatOf(fileName)
  if (format === 'EPUB') return <BookOpen />
  if (format === 'ZIP') return <FileArchive />
  return <FileText />
}
