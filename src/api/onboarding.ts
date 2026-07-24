import client from './client'

export type OnboardingVertical = {
  key: string
  label: string
  description: string
  business_type: string
  suggested_module_keys: string[]
}

export type CrmModuleInfo = {
  key: string
  name: string
  description: string
  category: string
  plan_required: string
  icon: string
}

/** Vertical + module catalog (same payload seller setup uses). Auth required. */
export async function getSellerOnboardingOptions(): Promise<{
  verticals: OnboardingVertical[]
  modules: CrmModuleInfo[]
}> {
  const { data } = await client.get('/users/seller/onboarding/options/')
  return data
}
