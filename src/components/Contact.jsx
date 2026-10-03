import React, { useState } from 'react'
import { supabase } from '../lib/supabaseClient'

function Contact() {
  const [formData, setFormData] = useState({
    name: '',
    contact: '',
    content: ''
  })
  const [submitted, setSubmitted] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('inquiries')
        .insert([
          {
            name: formData.name,
            contact: formData.contact,
            content: formData.content
          }
        ])

      if (insertError) throw insertError

      setSubmitted(true)
      setFormData({ name: '', contact: '', content: '' })
      
      setTimeout(() => {
        setSubmitted(false)
      }, 3000)
    } catch (err) {
      console.error('문의 등록 오류:', err)
      setError('문의 등록 중 오류가 발생했습니다. 다시 시도해주세요.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <section id="contact" className="py-20 md:py-32 px-6 bg-white">
      <div className="container mx-auto max-w-2xl">
        <div className="text-center mb-12 md:mb-16">
          <h2 className="elegant-serif text-4xl md:text-5xl mb-6">문의하기</h2>
          <p className="text-lg text-charcoal/70">
            구매 및 제품에 관한 문의를 남겨주세요.
          </p>
        </div>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {submitted ? (
          <div className="bg-green-50 border border-green-200 rounded-lg p-8 text-center">
            <p className="text-lg text-green-800 leading-relaxed">
              문의가 접수되었습니다.<br />
              확인 후 연락드리겠습니다.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm mb-2">이름</label>
              <input
                type="text"
                value={formData.name}
                onChange={(e) => setFormData({...formData, name: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">연락처 또는 이메일</label>
              <input
                type="text"
                value={formData.contact}
                onChange={(e) => setFormData({...formData, contact: e.target.value})}
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal"
                required
              />
            </div>
            
            <div>
              <label className="block text-sm mb-2">내용</label>
              <textarea
                value={formData.content}
                onChange={(e) => setFormData({...formData, content: e.target.value})}
                rows="8"
                className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal resize-none"
                required
              />
            </div>
            
            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="w-full py-4 bg-charcoal text-white rounded hover:bg-charcoal/90 transition-colors text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '전송 중...' : '문의 보내기'}
              </button>
            </div>
          </form>
        )}
      </div>
    </section>
  )
}

export default Contact
