import { supabase } from './supabaseClient.js'

export const LOGIN_ERROR = 'อีเมลหรือรหัสผ่านไม่ถูกต้อง'

// client รับเป็นพารามิเตอร์ เพื่อให้ทดสอบด้วย client จำลองได้
// คืน null เมื่อสำเร็จ หรือข้อความผิดพลาดภาษาไทยเมื่อล็อกอินไม่สำเร็จ
export async function login(email, password, client = supabase) {
  const { error } = await client.auth.signInWithPassword({ email, password })
  return error ? LOGIN_ERROR : null
}

export async function logout(client = supabase) {
  await client.auth.signOut()
}

// คืน session ปัจจุบัน (null ถ้ายังไม่ล็อกอิน)
export async function getSession(client = supabase) {
  const {
    data: { session },
  } = await client.auth.getSession()
  return session
}

// callback ถูกเรียกทุกครั้งที่สถานะ session เปลี่ยน (ล็อกอิน, ออกจากระบบ, session หมดอายุ)
// คืนฟังก์ชันสำหรับยกเลิกการ subscribe
export function onAuthStateChange(callback, client = supabase) {
  const {
    data: { subscription },
  } = client.auth.onAuthStateChange((_event, session) => callback(session))
  return () => subscription.unsubscribe()
}
