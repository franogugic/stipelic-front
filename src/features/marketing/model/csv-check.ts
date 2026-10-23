export const IMPORT_MAX_BYTES = 5 * 1024 * 1024
export const IMPORT_MAX_ROWS = 10000

/** Why the browser turns a file away before uploading it (the server checks the file again; its answer is final). */
export type CsvRejection =
  | { code: 'wrong-type' }
  | { code: 'too-big' }
  | { code: 'empty-file' }
  | { code: 'too-many-rows'; rows: number }
  | { code: 'no-email-column'; columns: string[] }

/** What the browser could tell about a file it accepted. */
export type CsvFacts = {
  delimiter: 'comma' | 'semicolon'
  /** The header of the email column; null for a file with one email per row and no header. */
  emailColumn: string | null
}

const cells = (line: string, delimiter: ',' | ';') => line.split(delimiter).map((cell) => cell.trim().replace(/^"|"$/g, ''))

/** Everything the browser can check, it checks before uploading, for fast feedback. */
export async function checkCsvFile(file: File): Promise<{ facts: CsvFacts } | { rejection: CsvRejection }> {
  if (!/\.csv$/i.test(file.name) && file.type !== 'text/csv') return { rejection: { code: 'wrong-type' } }
  if (file.size > IMPORT_MAX_BYTES) return { rejection: { code: 'too-big' } }
  const lines = (await file.text()).split(/\r?\n/).filter((line) => line.trim())
  if (lines.length === 0) return { rejection: { code: 'empty-file' } }
  if (lines.length > IMPORT_MAX_ROWS + 1) return { rejection: { code: 'too-many-rows', rows: lines.length - 1 } }

  const delimiter = (lines[0].match(/;/g)?.length ?? 0) > (lines[0].match(/,/g)?.length ?? 0) ? ';' : ','
  const header = cells(lines[0], delimiter)
  const emailColumn = header.find((cell) => /^e-?mail/i.test(cell)) ?? null
  const hasEmails = emailColumn !== null || lines.slice(0, 20).some((line) => cells(line, delimiter).some((cell) => /\S+@\S+/.test(cell)))
  if (!hasEmails) return { rejection: { code: 'no-email-column', columns: header.filter(Boolean) } }
  return { facts: { delimiter: delimiter === ';' ? 'semicolon' : 'comma', emailColumn } }
}

export const fileSizeLabel = (bytes: number) =>
  bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} KB` : `${(bytes / 1024 / 1024).toFixed(1)} MB`
