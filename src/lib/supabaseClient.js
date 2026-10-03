import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error(
    'Supabase 환경변수가 설정되지 않았습니다. .env 파일을 확인해주세요.\n' +
    'VITE_SUPABASE_URL과 VITE_SUPABASE_ANON_KEY가 필요합니다.'
  )
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

// 관리자 권한 확인 함수
export const isAdmin = async () => {
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return false
  
  const { data, error } = await supabase
    .from('admin_users')
    .select('id')
    .eq('id', user.id)
    .single()
  
  return !error && data !== null
}

// 이메일 형식 검증
export const isValidEmail = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
  return emailRegex.test(email)
}

// 전화번호 형식 간단 검증 (숫자와 하이픈만)
export const isPhoneNumber = (contact) => {
  const phoneRegex = /^[0-9-]+$/
  return phoneRegex.test(contact)
}
