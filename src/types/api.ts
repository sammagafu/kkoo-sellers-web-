/**
 * Shared types for KKOO API (API.md).
 * 4xx/5xx return JSON: { error: string }.
 */

export type ApiErrorBody = {
  error: string
}

export type PaginatedResponse<T> = {
  results: T[]
  count?: number
  total?: number
  page?: number
}
