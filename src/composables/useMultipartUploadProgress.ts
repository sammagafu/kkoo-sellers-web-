import { ref } from 'vue'
import type { AxiosProgressEvent } from 'axios'

/** One-shot multipart upload progress (product images, category icon, brand logo). */
export function useMultipartUploadProgress() {
  const uploadActive = ref(false)
  const uploadPercent = ref(0)
  const uploadPulse = ref(false)

  function beginUpload() {
    uploadActive.value = true
    uploadPulse.value = true
    uploadPercent.value = 0
  }

  function onUploadProgress(e: AxiosProgressEvent) {
    const t = e.total
    if (t != null && t > 0) {
      uploadPulse.value = false
      uploadPercent.value = Math.round((e.loaded / t) * 100)
    }
  }

  function endUpload() {
    uploadActive.value = false
    uploadPulse.value = false
  }

  return {
    uploadActive,
    uploadPercent,
    uploadPulse,
    beginUpload,
    onUploadProgress,
    endUpload,
  }
}
