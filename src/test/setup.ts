import { vi } from 'vitest'

// Avoid router.push during store tests
vi.mock('@/router', () => ({ default: { push: vi.fn() } }))
