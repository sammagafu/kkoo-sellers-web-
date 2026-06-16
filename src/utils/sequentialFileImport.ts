import type { AxiosProgressEvent } from 'axios'
import { tt } from '@/i18n/translate'
import { formatApiError } from '@/utils/formatApiError'

/** Typical admin import JSON body (categories, brands, catalog, users). */
export type AdminImportPayload = {
  message?: string
  created?: number
  errors?: string[]
}

/** Passed as the second argument to `importOne` for upload progress (axios). */
export type ImportOneContext = {
  onUploadProgress?: (event: AxiosProgressEvent) => void
}

/** Live state while a multi-file import runs. `null` is emitted when the batch finishes. */
export type ImportBatchProgress = {
  currentFileIndex: number
  totalFiles: number
  currentFileName: string
  /** 0–100 for the current file’s HTTP upload when the browser reports totals. */
  fileUploadPercent: number | null
  /** 0–100 overall (files completed + partial upload of the current file). */
  overallPercent: number
  /** True when `loaded` / `total` is not available for the current upload. */
  uploadIndeterminate: boolean
}

const importFailedLabel = () => tt('catalogImport.lineImportFailed')

/**
 * Run several import files one after another (same endpoint per file).
 * Returns per-file summary lines and total created count across successes.
 */
export async function runSequentialImports(
  files: File[],
  importOne: (file: File, ctx: ImportOneContext) => Promise<AdminImportPayload>,
  onBatchProgress?: (p: ImportBatchProgress | null) => void,
): Promise<{ lines: string[]; totalCreated: number }> {
  const lines: string[] = []
  let totalCreated = 0
  const n = files.length
  const failedLabel = importFailedLabel()
  try {
    for (let i = 0; i < n; i++) {
      const f = files[i]
      const emit = (partial: Partial<ImportBatchProgress> & Pick<ImportBatchProgress, 'overallPercent'>) => {
        onBatchProgress?.({
          currentFileIndex: i,
          totalFiles: n,
          currentFileName: f.name,
          fileUploadPercent: null,
          uploadIndeterminate: false,
          ...partial,
        })
      }
      emit({
        overallPercent: (i / n) * 100,
        fileUploadPercent: null,
        uploadIndeterminate: true,
      })
      const onUploadProgress = (event: AxiosProgressEvent) => {
        const total = event.total
        const loaded = event.loaded
        let filePct: number | null = null
        let frac = 0.5
        let indeterminate = true
        if (total != null && total > 0) {
          filePct = Math.min(100, Math.round((loaded / total) * 100))
          frac = loaded / total
          indeterminate = false
        }
        emit({
          overallPercent: Math.min(99.9, ((i + frac) / n) * 100),
          fileUploadPercent: filePct,
          uploadIndeterminate: indeterminate,
        })
      }
      try {
        const data = await importOne(f, { onUploadProgress })
        const c = data.created ?? 0
        totalCreated += c
        const errList = data.errors ?? []
        const errSnippet = errList.length
          ? ` — ${errList.slice(0, 3).join('; ')}${errList.length > 3 ? '…' : ''}`
          : ''
        lines.push(`${f.name}: ${tt('catalogImport.lineCreated', { count: c })}${errSnippet}`)
        emit({
          overallPercent: ((i + 1) / n) * 100,
          fileUploadPercent: 100,
          uploadIndeterminate: false,
        })
      } catch (e: unknown) {
        lines.push(`${f.name}: ${formatApiError(e, failedLabel)}`)
        emit({
          overallPercent: ((i + 1) / n) * 100,
          fileUploadPercent: null,
          uploadIndeterminate: false,
        })
      }
    }
  } finally {
    onBatchProgress?.(null)
  }
  return { lines, totalCreated }
}

export function formatImportBatchSummary(fileCount: number, lines: string[]): string {
  if (!lines.length) return ''
  return `${tt('catalogImport.processedFiles', { count: fileCount })} ` + lines.join(' · ')
}

export type ImportBatchLine = {
  label: string
  text: string
  ok?: boolean
}

/** Turn per-file summary strings into panel lines (parses leading `filename:`). */
export function importSummaryLinesFromStrings(lines: string[]): ImportBatchLine[] {
  const failedLabel = importFailedLabel()
  return lines.map((line) => {
    const colon = line.indexOf(':')
    if (colon <= 0) return { label: '•', text: line }
    const label = line.slice(0, colon).trim()
    const text = line.slice(colon + 1).trim()
    const failed = text.toLowerCase().includes(failedLabel.toLowerCase()) || /import failed|échec|umeshindwa/i.test(text)
    return { label, text, ok: failed ? false : true }
  })
}
