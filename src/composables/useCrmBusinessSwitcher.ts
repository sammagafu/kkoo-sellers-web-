/**
 * @deprecated Use useCrmWorkspace — thin alias for CRM pages still importing this name.
 */
import { onMounted } from 'vue'
import { useCrmWorkspace, type CrmBusinessWorkspace } from '@/composables/useCrmWorkspace'

export type CrmBusiness = CrmBusinessWorkspace

export function useCrmBusinessSwitcher() {
  const workspace = useCrmWorkspace()
  onMounted(() => {
    void workspace.loadWorkspace()
  })
  return {
    businesses: workspace.businesses,
    loading: workspace.loading,
    error: workspace.error,
    selectedBusinessId: workspace.activeBusinessId,
    selectedBusiness: workspace.activeBusiness,
    hasMultipleBusinesses: workspace.hasMultipleBusinesses,
    setSelectedBusinessId: workspace.setSelectedBusinessId,
    loadBusinesses: workspace.loadWorkspace,
  }
}
