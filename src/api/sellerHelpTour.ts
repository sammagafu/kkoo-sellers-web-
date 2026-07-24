import client from './client'

export type SellerHelpTourSection = {
  key: string
  title: string
  body: string
  video_url?: string
  cta_label?: string
  enabled?: boolean
  sort_order?: number
}

export async function getAdminSiteExperience(): Promise<{
  seller_help_tour?: { sections?: SellerHelpTourSection[] }
}> {
  const { data } = await client.get('/admin/site-experience/')
  return data
}

export async function patchSellerHelpTour(sections: SellerHelpTourSection[]) {
  const { data } = await client.patch('/admin/site-experience/', {
    seller_help_tour: { sections },
  })
  return data
}
