import { ref, computed } from 'vue'
import { tt } from '@/i18n/translate'
import type { ImportBatchProgress } from '@/utils/sequentialFileImport'

/** Shared CSV multi-file import progress state for `runSequentialImports` + `ImportBatchProgressBar`. */
export function useImportBatchProgress() {
  const importProgress = ref<ImportBatchProgress | null>(null)

  const importProgressSubtitle = computed(() => {
    const p = importProgress.value
    if (!p) return ''
    const n = p.currentFileIndex + 1
    const base = tt('catalogImport.progressFileOf', {
      n,
      total: p.totalFiles,
      name: p.currentFileName,
    })
    if (p.fileUploadPercent == null) return base
    return `${base} — ${tt('catalogImport.progressFilePercent', { percent: p.fileUploadPercent })}`
  })

  const importProgressPulse = computed(
    () => !!importProgress.value?.uploadIndeterminate && importProgress.value?.fileUploadPercent == null,
  )

  return {
    importProgress,
    importProgressSubtitle,
    importProgressPulse,
  }
}
