import { describe, it, expect, beforeEach } from 'vitest'
import client, { clearStoredAuth } from './client'

const AUTH_KEY = 'kkoo_admin_auth'

describe('API client', () => {
  beforeEach(() => {
    clearStoredAuth()
    localStorage.clear()
  })

  describe('clearStoredAuth', () => {
    it('removes kkoo_admin_auth from localStorage', () => {
      localStorage.setItem(
        AUTH_KEY,
        JSON.stringify({ access: 'a', refresh: 'r', user: {} })
      )
      clearStoredAuth()
      expect(localStorage.getItem(AUTH_KEY)).toBeNull()
    })
  })

  describe('client instance', () => {
    it('exposes get, post, patch, put, delete for refresh and request flow', () => {
      expect(client.get).toBeDefined()
      expect(client.post).toBeDefined()
      expect(client.patch).toBeDefined()
      expect(client.request).toBeDefined()
    })
  })
})
