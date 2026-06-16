/**
 * Admin panel routes — admin.kkooapp.co.tz
 */
import { urlAliasRoutes } from './url-aliases'
import { authRoutes } from './auth'
import { errorRoutes } from './errors'
import { dashboardRoutes } from './dashboard'
import { accountRoutes } from './account'
import { kkooAdminRoutes } from './kkoo-admin'
import { previewRoutes } from './kkoo-preview'

export { setTitle, setLandingTitle, baseBrand } from './meta'

export const allRoutes = [
  { path: '/', redirect: { name: 'dashboards.index' } },
  ...urlAliasRoutes,
  ...dashboardRoutes,
  ...accountRoutes,
  ...kkooAdminRoutes,
  ...previewRoutes,
  ...authRoutes,
  ...errorRoutes,
]
