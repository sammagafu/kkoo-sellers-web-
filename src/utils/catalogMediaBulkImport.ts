import type { AxiosProgressEvent, AxiosRequestConfig } from 'axios'
import { catalogSellerApi } from '@/api/catalog'
import { tt } from '@/i18n/translate'
import { formatApiError } from '@/utils/formatApiError'

export type MediaImportItemResult = {
  fileName: string
  productSlug: string
  ok: boolean
  message: string
}

export type MediaBatchProgress = {
  currentIndex: number
  total: number
  currentFileName: string
  overallPercent: number
  uploadIndeterminate: boolean
  fileUploadPercent: number | null
}

/** Derive product slug from image file name (e.g. `galaxy-phone.jpg`, `galaxy-phone_2.png`, `galaxy-phone.primary.webp`). */
export function productSlugFromImageFileName(fileName: string): string {
  let base = fileName.replace(/\.[^.]+$/i, '').trim().toLowerCase()
  base = base.replace(/\.primary$/i, '').replace(/_primary$/i, '')
  base = base.replace(/_\d+$/i, '')
  return base
}

export function isPrimaryImageFileName(fileName: string): boolean {
  const lower = fileName.toLowerCase()
  return lower.includes('.primary.') || lower.includes('_primary.') || /\.primary\.[^.]+$/i.test(lower)
}

function uploadOne(
  slug: string,
  file: File,
  isPrimary: boolean,
  config?: AxiosRequestConfig,
): Promise<void> {
  const form = new FormData()
  form.append('file', file)
  if (isPrimary) form.append('is_primary', 'true')
  return catalogSellerApi.addMedia(slug, form, config).then(() => undefined)
}

/**
 * Upload many product images sequentially. File names must match product `slug` (see `productSlugFromImageFileName`).
 */
export async function runSequentialProductMediaImports(
  files: File[],
  options?: {
    onProgress?: (p: MediaBatchProgress | null) => void
    /** When true, only the first image per slug is marked primary (unless filename hints primary). */
    markFirstPerSlugPrimary?: boolean
  },
): Promise<{ results: MediaImportItemResult[]; uploaded: number }> {
  const results: MediaImportItemResult[] = []
  let uploaded = 0
  const n = files.length
  const primarySet = new Set<string>()
  const markFirst = options?.markFirstPerSlugPrimary !== false

  try {
    for (let i = 0; i < n; i++) {
      const file = files[i]
      const slug = productSlugFromImageFileName(file.name)
      const emit = (partial: Partial<MediaBatchProgress> & Pick<MediaBatchProgress, 'overallPercent'>) => {
        options?.onProgress?.({
          currentIndex: i,
          total: n,
          currentFileName: file.name,
          fileUploadPercent: null,
          uploadIndeterminate: true,
          ...partial,
        })
      }
      emit({ overallPercent: (i / n) * 100 })

      if (!slug) {
        results.push({
          fileName: file.name,
          productSlug: '',
          ok: false,
          message: tt('catalogImport.mediaSlugFromNameFailed'),
        })
        emit({ overallPercent: ((i + 1) / n) * 100, uploadIndeterminate: false })
        continue
      }

      let isPrimary = isPrimaryImageFileName(file.name)
      if (!isPrimary && markFirst && !primarySet.has(slug)) {
        isPrimary = true
        primarySet.add(slug)
      } else if (isPrimary) {
        primarySet.add(slug)
      }

      try {
        await uploadOne(slug, file, isPrimary, {
          onUploadProgress: (event: AxiosProgressEvent) => {
            const total = event.total
            let filePct: number | null = null
            let frac = 0.5
            let indeterminate = true
            if (total != null && total > 0) {
              filePct = Math.min(100, Math.round((event.loaded / total) * 100))
              frac = event.loaded / total
              indeterminate = false
            }
            emit({
              overallPercent: Math.min(99.9, ((i + frac) / n) * 100),
              fileUploadPercent: filePct,
              uploadIndeterminate: indeterminate,
            })
          },
        })
        uploaded++
        results.push({
          fileName: file.name,
          productSlug: slug,
          ok: true,
          message: isPrimary ? tt('catalogImport.mediaUploadedPrimary') : tt('catalogImport.mediaUploaded'),
        })
        emit({ overallPercent: ((i + 1) / n) * 100, fileUploadPercent: 100, uploadIndeterminate: false })
      } catch (e: unknown) {
        results.push({
          fileName: file.name,
          productSlug: slug,
          ok: false,
          message: formatApiError(e, tt('catalogImport.mediaUploadFailed')),
        })
        emit({ overallPercent: ((i + 1) / n) * 100, uploadIndeterminate: false })
      }
    }
  } finally {
    options?.onProgress?.(null)
  }
  return { results, uploaded }
}

export function formatMediaImportSummary(results: MediaImportItemResult[]): string {
  const ok = results.filter((r) => r.ok).length
  const fail = results.length - ok
  if (!results.length) return ''
  const failedPart = fail ? tt('catalogImport.mediaSummaryFailedPart', { count: fail }) : ''
  return tt('catalogImport.mediaSummary', { ok, failedPart })
}
