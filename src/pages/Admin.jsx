import React, { useState, useEffect } from 'react'
import { supabase, isAdmin } from '../lib/supabaseClient'
import AdminLogin from '../components/admin/AdminLogin'
import InquiryManagement from '../components/admin/InquiryManagement'
import BoardManagement from '../components/admin/BoardManagement'

function Admin() {
  const [authenticated, setAuthenticated] = useState(false)
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('inquiries') // 'inquiries' or 'board'

  useEffect(() => {
    checkAuth()
  }, [])

  const checkAuth = async () => {
    try {
      const adminStatus = await isAdmin()
      setAuthenticated(adminStatus)
    } catch (err) {
      console.error('인증 확인 오류:', err)
      setAuthenticated(false)
    } finally {
      setLoading(false)
    }
  }

  const handleLoginSuccess = () => {
    setAuthenticated(true)
  }

  const handleLogout = async () => {
    if (!confirm('로그아웃하시겠습니까?')) return
    
    await supabase.auth.signOut()
    setAuthenticated(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-warm-white">
        <p className="text-charcoal/60">확인 중...</p>
      </div>
    )
  }

  if (!authenticated) {
    return <AdminLogin onLoginSuccess={handleLoginSuccess} />
  }

  return (
    <div className="min-h-screen bg-warm-white">
      {/* 관리자 헤더 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-medium">지그시 관리</h1>
            <button
              onClick={handleLogout}
              className="px-4 py-2 text-sm border border-gray-300 rounded hover:bg-gray-50 transition-colors"
            >
              로그아웃
            </button>
          </div>
        </div>
      </div>

      {/* 탭 네비게이션 */}
      <div className="bg-white border-b border-gray-200">
        <div className="container mx-auto px-6">
          <div className="flex gap-1">
            <button
              onClick={() => setActiveTab('inquiries')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'inquiries'
                  ? 'border-b-2 border-charcoal text-charcoal'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              문의 관리
            </button>
            <button
              onClick={() => setActiveTab('board')}
              className={`px-6 py-3 font-medium transition-colors ${
                activeTab === 'board'
                  ? 'border-b-2 border-charcoal text-charcoal'
                  : 'text-charcoal/60 hover:text-charcoal'
              }`}
            >
              게시판 관리
            </button>
          </div>
        </div>
      </div>

      {/* 컨텐츠 영역 */}
      <div className="container mx-auto px-6 py-8">
        {activeTab === 'inquiries' ? (
          <InquiryManagement />
        ) : (
          <BoardManagement />
        )}
      </div>
    </div>
  )
}

export default Admin
