import { describe, expect, it, vi } from 'vitest'
import { LOAD_WARNING, SAVE_WARNING, createLoan, fetchLoans, updateLoan } from './loansApi.js'

const row = {
  id: '1',
  owner_id: 'owner-1',
  friend_name: 'ต้น',
  item_name: 'ร่มสีฟ้า',
  borrowed_date: '2026-09-01',
  due_date: '2026-09-24',
  returned_date: null,
}

const camelLoan = {
  id: '1',
  friendName: 'ต้น',
  itemName: 'ร่มสีฟ้า',
  borrowedDate: '2026-09-01',
  dueDate: '2026-09-24',
  returnedDate: null,
}

// builder จำลองที่ chain เมธอดได้เหมือน supabase-js แล้ว resolve ด้วยผลลัพธ์ที่กำหนด
function mockBuilder(result) {
  const builder = {
    select: vi.fn(() => builder),
    insert: vi.fn(() => builder),
    update: vi.fn(() => builder),
    eq: vi.fn(() => builder),
    single: vi.fn(() => Promise.resolve(result)),
    then: (resolve) => Promise.resolve(result).then(resolve),
  }
  return builder
}

describe('fetchLoans', () => {
  it('โหลดสำเร็จ = แปลงเป็น camelCase', async () => {
    const builder = mockBuilder({ data: [row], error: null })
    const client = { from: vi.fn(() => builder) }
    expect(await fetchLoans(client)).toEqual({ loans: [camelLoan], warning: null })
    expect(client.from).toHaveBeenCalledWith('loans')
  })

  it('โหลดล้มเหลว = รายการว่างพร้อมคำเตือนภาษาไทย ไม่โยนข้อผิดพลาด', async () => {
    const builder = mockBuilder({ data: null, error: { message: 'network' } })
    const client = { from: vi.fn(() => builder) }
    expect(await fetchLoans(client)).toEqual({ loans: [], warning: LOAD_WARNING })
  })
})

describe('createLoan', () => {
  it('สำเร็จ = คืน Loan ที่แปลงเป็น camelCase พร้อม owner_id ที่ส่งเข้าไป', async () => {
    const builder = mockBuilder({ data: row, error: null })
    const client = { from: vi.fn(() => builder) }
    const result = await createLoan(camelLoan, 'owner-1', client)
    expect(result).toEqual({ loan: camelLoan, warning: null })
    expect(builder.insert).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: 'owner-1', friend_name: 'ต้น' }),
    )
  })

  it('ล้มเหลว = คืนคำเตือนภาษาไทย ไม่โยนข้อผิดพลาด', async () => {
    const builder = mockBuilder({ data: null, error: { message: 'denied' } })
    const client = { from: vi.fn(() => builder) }
    expect(await createLoan(camelLoan, 'owner-1', client)).toEqual({ loan: null, warning: SAVE_WARNING })
  })
})

describe('updateLoan', () => {
  it('สำเร็จ = คืน Loan ที่แปลงเป็น camelCase', async () => {
    const builder = mockBuilder({ data: row, error: null })
    const client = { from: vi.fn(() => builder) }
    expect(await updateLoan(camelLoan, client)).toEqual({ loan: camelLoan, warning: null })
    expect(builder.eq).toHaveBeenCalledWith('id', '1')
  })

  it('ล้มเหลว = คืนคำเตือนภาษาไทย ไม่โยนข้อผิดพลาด', async () => {
    const builder = mockBuilder({ data: null, error: { message: 'denied' } })
    const client = { from: vi.fn(() => builder) }
    expect(await updateLoan(camelLoan, client)).toEqual({ loan: null, warning: SAVE_WARNING })
  })
})
