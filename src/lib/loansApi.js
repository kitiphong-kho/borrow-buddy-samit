import { supabase } from './supabaseClient.js'

export const LOAD_WARNING = 'โหลดข้อมูลจาก Supabase ไม่สำเร็จ ลองรีเฟรชหน้าอีกครั้ง'
export const SAVE_WARNING = 'บันทึกข้อมูลไม่สำเร็จ ข้อมูลล่าสุดอาจไม่ถูกเก็บไว้'

function toCamel(row) {
  return {
    id: row.id,
    friendName: row.friend_name,
    itemName: row.item_name,
    borrowedDate: row.borrowed_date,
    dueDate: row.due_date,
    returnedDate: row.returned_date,
  }
}

function toSnake(loan) {
  return {
    friend_name: loan.friendName,
    item_name: loan.itemName,
    borrowed_date: loan.borrowedDate,
    due_date: loan.dueDate,
    returned_date: loan.returnedDate ?? null,
  }
}

// โหลด Loan ของเจ้าของที่ล็อกอินอยู่ (RLS กรองให้อัตโนมัติ)
export async function fetchLoans(client = supabase) {
  const { data, error } = await client.from('loans').select('*')
  if (error) return { loans: [], warning: LOAD_WARNING }
  return { loans: data.map(toCamel), warning: null }
}

// เพิ่ม Loan ใหม่ ผูกกับ ownerId ที่ล็อกอินอยู่เสมอ ผู้ใช้แก้ owner_id เองไม่ได้
export async function createLoan(loan, ownerId, client = supabase) {
  const { data, error } = await client
    .from('loans')
    .insert({ ...toSnake(loan), owner_id: ownerId })
    .select()
    .single()
  if (error) return { loan: null, warning: SAVE_WARNING }
  return { loan: toCamel(data), warning: null }
}

export async function updateLoan(loan, client = supabase) {
  const { data, error } = await client
    .from('loans')
    .update(toSnake(loan))
    .eq('id', loan.id)
    .select()
    .single()
  if (error) return { loan: null, warning: SAVE_WARNING }
  return { loan: toCamel(data), warning: null }
}
