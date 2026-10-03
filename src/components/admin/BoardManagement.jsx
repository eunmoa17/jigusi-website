import React, { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabaseClient'

function BoardManagement() {
  const [posts, setPosts] = useState([])
  const [selectedPost, setSelectedPost] = useState(null)
  const [loading, setLoading] = useState(true)
  const [replyText, setReplyText] = useState('')
  const [generatingAI, setGeneratingAI] = useState(false)
  const [savingReply, setSavingReply] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

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
      alert('게시글을 불러오는 중 오류가 발생했습니다')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchPosts()
  }, [])

  const handleSelectPost = (post) => {
    setSelectedPost(post)
    setReplyText(post.reply_content || '')
    setError('')
    setSuccess('')
  }

  const handleGenerateAIReply = async () => {
    if (!selectedPost) return

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
        `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/generate-post-reply`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${session.access_token}`,
          },
          body: JSON.stringify({
            post_id: selectedPost.id,
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

  const handleSaveReply = async () => {
    if (!selectedPost || !replyText.trim()) {
      setError('답변 내용을 입력해주세요')
      return
    }

    const action = selectedPost.reply_status === 'replied' ? '수정' : '등록'
    if (!confirm(`이 답변을 ${action}하시겠습니까?`)) {
      return
    }

    setSavingReply(true)
    setError('')
    setSuccess('')

    try {
      const { error: updateError } = await supabase
        .from('posts')
        .update({
          reply_content: replyText,
          reply_status: 'replied',
          replied_at: new Date().toISOString(),
        })
        .eq('id', selectedPost.id)

      if (updateError) throw updateError

      setSuccess(`답변이 ${action}되었습니다`)
      await fetchPosts()
      
      // 선택된 게시글 정보 업데이트
      const updatedPost = {
        ...selectedPost,
        reply_content: replyText,
        reply_status: 'replied',
        replied_at: new Date().toISOString()
      }
      setSelectedPost(updatedPost)
    } catch (err) {
      console.error('답변 저장 오류:', err)
      setError('답변 저장에 실패했습니다')
    } finally {
      setSavingReply(false)
    }
  }

  const handleDeletePost = async (id) => {
    if (!confirm('이 게시글을 삭제하시겠습니까?')) return

    try {
      const { error } = await supabase
        .from('posts')
        .delete()
        .eq('id', id)

      if (error) throw error

      await fetchPosts()
      if (selectedPost?.id === id) {
        setSelectedPost(null)
      }
    } catch (err) {
      console.error('게시글 삭제 오류:', err)
      alert('게시글 삭제 중 오류가 발생했습니다')
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-medium">게시판 관리</h2>

      {loading ? (
        <p className="text-charcoal/60">불러오는 중...</p>
      ) : (
        <div className="grid md:grid-cols-2 gap-6">
          {/* 게시글 목록 */}
          <div className="space-y-4">
            <h3 className="text-lg font-medium">게시글 목록</h3>
            {posts.length === 0 ? (
              <p className="text-charcoal/60">게시글이 없습니다</p>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <div
                    key={post.id}
                    onClick={() => handleSelectPost(post)}
                    className={`p-4 rounded border cursor-pointer transition-colors ${
                      selectedPost?.id === post.id
                        ? 'border-charcoal bg-charcoal/5'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-medium line-clamp-1">{post.title}</span>
                      <span
                        className={`text-xs px-2 py-1 rounded flex-shrink-0 ml-2 ${
                          post.reply_status === 'replied'
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }`}
                      >
                        {post.reply_status === 'replied' ? '답변완료' : '미답변'}
                      </span>
                    </div>
                    <p className="text-sm text-charcoal/60 mb-1">작성자: {post.name}</p>
                    <p className="text-sm text-charcoal/80 line-clamp-2">{post.content}</p>
                    <p className="text-xs text-charcoal/50 mt-2">
                      {formatDate(post.created_at)}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* 게시글 상세 및 답변 */}
          <div>
            {selectedPost ? (
              <div className="space-y-4">
                <div className="flex justify-between items-start">
                  <h3 className="text-lg font-medium">게시글 상세</h3>
                  <button
                    onClick={() => handleDeletePost(selectedPost.id)}
                    className="text-sm text-red-600 hover:text-red-700"
                  >
                    삭제
                  </button>
                </div>

                <div className="bg-gray-50 p-4 rounded space-y-3">
                  <div>
                    <span className="text-sm text-charcoal/60">제목:</span>
                    <p className="font-medium">{selectedPost.title}</p>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">작성자:</span>
                    <p>{selectedPost.name}</p>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">작성일:</span>
                    <p className="text-sm">{formatDate(selectedPost.created_at)}</p>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">답변 상태:</span>
                    <span
                      className={`inline-block ml-2 text-xs px-2 py-1 rounded ${
                        selectedPost.reply_status === 'replied'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}
                    >
                      {selectedPost.reply_status === 'replied' ? '답변완료' : '미답변'}
                    </span>
                  </div>
                  <div>
                    <span className="text-sm text-charcoal/60">내용:</span>
                    <p className="whitespace-pre-wrap mt-2">{selectedPost.content}</p>
                  </div>
                  {selectedPost.reply_status === 'replied' && selectedPost.replied_at && (
                    <div>
                      <span className="text-sm text-charcoal/60">답변일:</span>
                      <p className="text-sm">{formatDate(selectedPost.replied_at)}</p>
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
                    rows="8"
                    className="w-full px-4 py-3 border border-gray-200 rounded focus:outline-none focus:border-charcoal resize-none"
                    placeholder="답변 내용을 입력하거나 AI 답변 생성 버튼을 클릭하세요"
                  />
                </div>

                <button
                  onClick={handleSaveReply}
                  disabled={savingReply || !replyText.trim()}
                  className="w-full py-3 bg-charcoal text-white rounded hover:bg-charcoal/90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {savingReply
                    ? '저장 중...'
                    : selectedPost.reply_status === 'replied'
                    ? '답변 수정'
                    : '답변 등록'}
                </button>
              </div>
            ) : (
              <p className="text-charcoal/60">게시글을 선택하세요</p>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default BoardManagement
