import React, { useState, useEffect } from 'react'
import { supabase } from '../lib/supabaseClient'

function Board() {
  const [posts, setPosts] = useState([])
  const [showWriteForm, setShowWriteForm] = useState(false)
  const [selectedPost, setSelectedPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [formData, setFormData] = useState({
    author: '',
    title: '',
    content: ''
  })

  // 게시글 조회
  const fetchPosts = async () => {
    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('posts')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) throw error
      setPosts(data || [])
    } catch (err) {
      console.error('게시글 조회 오류:', err)
      setError('게시글을 불러오는 중 오류가 발생했습니다.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    setError('')

    try {
      const { error: insertError } = await supabase
        .from('posts')
        .insert([
          {
            name: formData.author,
            title: formData.title,
            content: formData.content
          }
        ])

      if (insertError) throw insertError

      setFormData({ author: '', title: '', content: '' })
      setShowWriteForm(false)
      await fetchPosts() // 목록 새로고침
    } catch (err) {
      console.error('게시글 등록 오류:', err)
      setError('게시글 등록 중 오류가 발생했습니다.')
    } finally {
      setSubmitting(false)
    }
  }

  const formatDate = (dateString) => {
    const date = new Date(dateString)
    return date.toLocaleDateString('ko-KR', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).replace(/\. /g, '.').replace(/\.$/, '')
  }

  return (
    <section id="board" className="py-20 md:py-32 px-6 bg-warm-white">
      <div className="container mx-auto max-w-4xl">
        <h2 className="elegant-serif text-4xl md:text-5xl text-center mb-12 md:mb-16">
          게시판
        </h2>
        
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6 text-center">
            <p className="text-red-800">{error}</p>
          </div>
        )}
        
        {loading ? (
          <div className="text-center py-12">
            <p className="text-charcoal/60">게시글을 불러오는 중...</p>
          </div>
        ) : !showWriteForm && !selectedPost && (
          <div className="bg-white rounded-lg shadow-sm overflow-hidden">
            {posts.length === 0 ? (
              <div className="text-center py-12 text-charcoal/60">
                아직 게시글이 없습니다.
              </div>
            ) : (
              <div className="divide-y divide-gray-100">
                {posts.map((post, index) => (
                  <div 
                    key={post.id}
                    onClick={() => setSelectedPost(post)}
                    className="flex items-center gap-4 px-6 py-5 hover:bg-gray-50 cursor-pointer transition-colors"
                  >
                    <span className="text-sm text-charcoal/40 w-8 flex-shrink-0">
                      {posts.length - index}
                    </span>
                    <span className="flex-1 text-base md:text-lg">
                      {post.title}
                    </span>
                    <span className="text-sm text-charcoal/50 flex-shrink-0">
                      {formatDate(post.created_at)}
                    </span>
                  </div>
                ))}
              </div>
            )}
            
            <div className="p-6 bg-gray-50 text-right">
              <button
                onClick={() => setShowWriteForm(true)}
                className="px-6 py-2 bg-charcoal text-white rounded hover:bg-charcoal/90 transition-colors"
              >
                글쓰기
              </button>
            </div>
          </div>
        )}
        
        {showWriteForm && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <h3 className="text-2xl font-medium mb-6">게시글 작성</h3>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div>
                <label className="block text-sm mb-2">이름</label>
                <input
                  type="text"
                  value={formData.author}
                  onChange={(e) => setFormData({...formData, author: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2">제목</label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) => setFormData({...formData, title: e.target.value})}
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal"
                  required
                />
              </div>
              
              <div>
                <label className="block text-sm mb-2">내용</label>
                <textarea
                  value={formData.content}
                  onChange={(e) => setFormData({...formData, content: e.target.value})}
                  rows="6"
                  className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal resize-none"
                  required
                />
              </div>
              
              <div className="flex gap-3 justify-end pt-4">
                <button
                  type="button"
                  onClick={() => setShowWriteForm(false)}
                  disabled={submitting}
                  className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors disabled:opacity-50"
                >
                  취소
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-charcoal text-white rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {submitting ? '등록 중...' : '등록하기'}
                </button>
              </div>
            </form>
          </div>
        )}
        
        {selectedPost && (
          <div className="bg-white rounded-lg shadow-sm p-8">
            <div className="border-b border-gray-200 pb-6 mb-6">
              <h3 className="text-2xl font-medium mb-3">{selectedPost.title}</h3>
              <div className="flex gap-4 text-sm text-charcoal/60">
                <span>{selectedPost.name}</span>
                <span>{formatDate(selectedPost.created_at)}</span>
              </div>
            </div>
            
            <div className="text-base leading-relaxed mb-8 min-h-[200px]">
              {selectedPost.content}
            </div>

            {/* 관리자 답변 표시 */}
            {selectedPost.reply_status === 'replied' && selectedPost.reply_content && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <div className="bg-warm-white rounded-lg p-6">
                  <h4 className="elegant-serif text-xl mb-4">지그시 답변</h4>
                  <div className="text-base leading-relaxed whitespace-pre-wrap mb-4">
                    {selectedPost.reply_content}
                  </div>
                  <div className="text-sm text-charcoal/50 text-right">
                    {formatDate(selectedPost.replied_at)}
                  </div>
                </div>
              </div>
            )}
            
            <div className="text-right mt-8">
              <button
                onClick={() => setSelectedPost(null)}
                className="px-6 py-2 border border-gray-300 rounded hover:bg-gray-50 transition-colors"
              >
                목록으로
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  )
}

export default Board
