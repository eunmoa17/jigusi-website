import React, { useState, useEffect } from 'react'
import { supabase, isValidEmail } from '../../lib/supabaseClient'

function InquiryManagement() {
  const [inquiries, setInquiries] = useState([])
  const [selectedInquiry, setSelectedInquiry] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [sendingReply, setSendingReply] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const fetchInquiries = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('inquiries')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setInquiries(data || [])
    } catch (err) {
      console.error('문의 조회 오류:', err)
      setError('문의를 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchInquiries()
  }, [])

  const handleSelectInquiry = (inquiry) => {
    setSelectedInquiry(inquiry)
    setReplyText(inquiry.reply_content || '')
    setError('')
    setSuccess('')
  }

  const handleGenerateAIReply = async () => {
    if (!selectedInquiry) return

    // 이미 답변이 작성되어 있으면 확인
    if (replyText.trim() && !confirm('기존 작성 내용을 AI 답변으로 교체하시겠습니까?')) {
      return
    }

    setGeneratingAI(true)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('세션이 만료되었습니다')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-inquiry-reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            inquiry_id: selectedInquiry.id,
          }),
        }
      )

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'AI 답변 생성에 실패했습니다')
      }

      const { reply } = await response.json()
      setReplyText(reply)
      setSuccess('AI 답변이 생성되었습니다. 내용을 확인하고 수정하세요.')
    } catch (err) {
      console.error('AI 답변 생성 오류:', err)
      setError(err.message || 'AI 답변 생성에 실패했습니다')
    } finally {
      setGeneratingAI(false)
    }
  }

  const handleSendReply = async () => {
    if (!selectedInquiry || !replyText.trim()) {
      setError('답변 내용을 입력해주세요')
      return
    }

    if (!confirm('이 답변을 고객에게 전송하시겠습니까?')) {
      return
    }

    setSendingReply(true)
    setError('')
    setSuccess('')

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) throw new Error('세션이 만료되었습니다')

      const response = await fetch(
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/send-inquiry-reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            inquiry_id: selectedInquiry.id,
            reply_content: replyText,
          }),
        }
      )

      const result = await response.json()

      if (!response.ok) {
        throw new Error(result.error || result.message || '답변 전송에 실패했습니다')
      }

      setSuccess('답변이 전송되었습니다')
      await fetchInquiries()
      
      // 선택된 문의 정보 업데이트
      const updatedInquiry = {
        ...selectedInquiry,
        reply_content: replyText,
        reply_status: 'replied',
        replied_at: new Date().toISOString()
      }
      setSelectedInquiry(updatedInquiry)
    } catch (err) {
      console.error('답변 전송 오류:', err)
      setError(err.message || '답변 전송에 실패했습니다')
    } finally {
      setSendingReply(false)
    }
  }

  const handleDeleteInquiry = async (id) => {
    if (!confirm('이 문의를 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('inquiries')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchInquiries()
      if (selectedInquiry?.id === id) {
        setSelectedInquiry(null)
        setReplyText('')
      }
    } catch (err) {
      console.error('문의 삭제 오류:', err)
      alert('문의 삭제 중 오류가 발생했습니다')
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const isContactEmail = (contact) => isValidEmail(contact)

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium">문의 관리</h2>

      {loading ? (
        <p className="text-charcoal/60">불러오는 중...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 문의 목록 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">문의 목록</h3>
            {inquiries.length === 0 ? (
              <p className="text-charcoal/60">문의가 없습니다</p>
            ) : (
              <div className="space-y-2">
                {inquiries.map((inquiry) => (
                  <div
                    key={inquiry.id}
                    onClick={() => handleSelectInquiry(inquiry)}
                    className={`p-4 rounded border cursor-pointer transition-colors ${
                      selectedInquiry?.id === inquiry.id
                        ? 'border-charcoal bg-charcoal/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium">{inquiry.name}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded ${
                          inquiry.reply_status === 'replied'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {inquiry.reply_status === 'replied' ? '답변완료' : '미답변'}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/60 mb-1">{inquiry.contact}</p>
                    <p className="text-sm text-charcoal/80 line-clamp-2">{inquiry.content}</p>
                    <p className="text-xs text-charcoal/50 mt-2">
                      {formatDate(inquiry.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 문의 상세 및 답변 */}
          <div>
            {selectedInquiry ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">문의 상세</h3>
                  <button
                    onClick={() => handleDeleteInquiry(selectedInquiry.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <span className="text-sm text-charcoal/60">이름:</span>
                    <p className="font-medium">{selectedInquiry.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">연락처:</span>
                    <p>{selectedInquiry.contact}</p>
                    {!isContactEmail(selectedInquiry.contact) && (
                      <p className="text-xs text-orange-600 mt-1">
                        ⚠️ 전화번호로 접수된 문의입니다. 직접 연락해 주세요.
                      </p>
                    )}
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">문의 내용:</span>
                    <p className="whitespace-pre-wrap">{selectedInquiry.content}</p>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">작성일:</span>
                    <p className="text-sm">{formatDate(selectedInquiry.created_at)}</p>
                  </div>
                  {selectedInquiry.reply_status === 'replied' && (
                    <div>
                      <span className="text-sm text-charcoal/60">답변일:</span>
                      <p className="text-sm">{formatDate(selectedInquiry.replied_at)}</p>
                    </div>
                  )}
                </div>

                {error && (
                  <div className="bg-red-50 border border-red-200 rounded p-3">
                    <p className="text-sm text-red-800">{error}</p>
                  </div>
                )}

                {success && (
                  <div className="bg-green-50 border border-green-200 rounded p-3">
                    <p className="text-sm text-green-800">{success}</p>
                  </div>
                )}

                <div>
                  <button
                    onClick={handleGenerateAIReply}
                    disabled={generatingAI}
                    className="w-full py-2 border border-charcoal text-charcoal rounded hover:bg-charcoal hover:text-white transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {generatingAI ? 'AI 답변 생성 중...' : 'AI 답변 생성'}
                  </button>
                </div>

                <div>
                  <label className="block text-sm mb-2">답변</label>
                  <textarea
                    value={replyText}
                    onChange={(e) => setReplyText(e.target.value)}
                    rows="10"
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal resize-none"
                    placeholder="답변 내용을 입력하거나 AI 답변 생성 버튼을 클릭하세요"
                  />
                </div>

                <button
                  onClick={handleSendReply}
                  disabled={sendingReply || !replyText.trim() || !isContactEmail(selectedInquiry.contact)}
                  className="w-full py-3 bg-charcoal text-white rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {sendingReply ? '전송 중...' : '답변 보내기'}
                </button>
                
                {!isContactEmail(selectedInquiry.contact) && (
                  <p className="text-xs text-center text-charcoal/60">
                    전화번호로 접수된 문의는 이메일 발송이 불가능합니다
                  </p>
                )}
              </div>
            ) : (
              <p className="text-charcoal/60">문의를 선택하세요</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default InquiryManagement
