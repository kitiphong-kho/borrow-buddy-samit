import { describe, expect, it, vi } from 'vitest'
import { LOGIN_ERROR, getSession, login, logout, onAuthStateChange } from './auth.js'

const fakeSession = { user: { id: 'user-1', email: 'owner@example.com' } }

const mockClient = (overrides = {}) => ({
  auth: {
    signInWithPassword: vi.fn().mockResolvedValue({ error: null }),
    signOut: vi.fn().mockResolvedValue({ error: null }),
    getSession: vi.fn().mockResolvedValue({ data: { session: fakeSession } }),
    onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe: vi.fn() } } }),
    ...overrides,
  },
})

describe('login', () => {
  it('สำเร็จ = คืน null', async () => {
    const client = mockClient()
    expect(await login('owner@example.com', 'secret', client)).toBeNull()
    expect(client.auth.signInWithPassword).toHaveBeenCalledWith({
      email: 'owner@example.com',
      password: 'secret',
    })
  })

  it('ล้มเหลว = คืนข้อความผิดพลาดภาษาไทย ไม่โยนข้อผิดพลาด', async () => {
    const client = mockClient({
      signInWithPassword: vi.fn().mockResolvedValue({ error: { message: 'Invalid credentials' } }),
    })
    expect(await login('owner@example.com', 'wrong', client)).toBe(LOGIN_ERROR)
  })
})

describe('logout', () => {
  it('เรียก signOut ของ client', async () => {
    const client = mockClient()
    await logout(client)
    expect(client.auth.signOut).toHaveBeenCalled()
  })
})

describe('getSession', () => {
  it('คืน session ปัจจุบัน', async () => {
    const client = mockClient()
    expect(await getSession(client)).toEqual(fakeSession)
  })

  it('ยังไม่ล็อกอิน = คืน null', async () => {
    const client = mockClient({ getSession: vi.fn().mockResolvedValue({ data: { session: null } }) })
    expect(await getSession(client)).toBeNull()
  })
})

describe('onAuthStateChange', () => {
  it('subscribe แล้วยกเลิกได้', () => {
    const unsubscribe = vi.fn()
    const client = mockClient({
      onAuthStateChange: vi.fn().mockReturnValue({ data: { subscription: { unsubscribe } } }),
    })
    const callback = vi.fn()
    const stop = onAuthStateChange(callback, client)
    expect(client.auth.onAuthStateChange).toHaveBeenCalled()

    const [handler] = client.auth.onAuthStateChange.mock.calls[0]
    handler('SIGNED_IN', fakeSession)
    expect(callback).toHaveBeenCalledWith(fakeSession)

    stop()
    expect(unsubscribe).toHaveBeenCalled()
  })
})
