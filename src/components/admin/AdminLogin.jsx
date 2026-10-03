import React, { useState } from 'react'
import { supabase } from '../../lib/supabaseClient'

function AdminLogin({ onLoginSuccess }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      // 로그인 시도
      const { data, error: signInError } = await supabase.auth.signInWithPassword({
        email,
        password,
      })

      if (signInError) throw signInError

      // 관리자 권한 확인
      const { data: adminData, error: adminError } = await supabase
        .from('admin_users')
        .select('id')
        .eq('id', data.user.id)
        .single()

      if (adminError || !adminData) {
        // 관리자가 아니면 로그아웃
        await supabase.auth.signOut()
        throw new Error('관리자 권한이 없습니다')
      }

      onLoginSuccess()
    } catch (err) {
      console.error('로그인 오류:', err)
      setError(err.message || '로그인에 실패했습니다')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-warm-white px-6">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-sm p-8">
          <h1 className="text-3xl font-medium text-center mb-8">지그시 관리</h1>
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded p-4 mb-6">
              <p className="text-sm text-red-800">{error}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-sm mb-2">이메일</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal"
                required
                disabled={loading}
              />
            </div>

            <div>
              <label className="block text-sm mb-2">비밀번호</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal"
                required
                disabled={loading}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-charcoal text-white rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {loading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}

export default AdminLogin
