// generate-post-reply Edge Function
// 게시판 답변 AI 초안 생성

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// OpenAI 모델 설정
const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// 중복 호출 방지
const recentRequests = new Map<string, number>()
const RATE_LIMIT_MS = 5000 // 5초

interface PostReplyRequest {
  post_id: string
}

serve(async (req) => {
  // CORS 헤더
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  }

  // OPTIONS 요청 처리
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    // 환경변수 확인
    const supabaseUrl = Deno.env.get('SUPABASE_URL')
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    const openaiKey = Deno.env.get('OPENAI_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey || !openaiKey) {
      throw new Error('필수 환경변수가 설정되지 않았습니다')
    }

    // 인증 토큰 추출
    const authHeader = req.headers.get('Authorization')
    if (!authHeader) {
      return new Response(
        JSON.stringify({ error: '인증이 필요합니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Bearer JWT 추출
    const token = authHeader.replace(/^Bearer\s+/i, '').trim()
    if (!token) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Supabase 클라이언트 생성
    const supabase = createClient(supabaseUrl, supabaseServiceKey)

    // 사용자 인증 확인 (JWT 직접 전달)
    const { data: { user }, error: userError } = await supabase.auth.getUser(token)
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: '유효하지 않은 인증입니다' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 관리자 권한 확인
    const { data: adminData, error: adminError } = await supabase
      .from('admin_users')
      .select('id')
      .eq('id', user.id)
      .single()

    if (adminError || !adminData) {
      return new Response(
        JSON.stringify({ error: '관리자 권한이 없습니다' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 중복 호출 방지
    const now = Date.now()
    const lastRequest = recentRequests.get(user.id)
    if (lastRequest && (now - lastRequest) < RATE_LIMIT_MS) {
      return new Response(
        JSON.stringify({ error: '너무 빠르게 요청하셨습니다. 잠시 후 다시 시도해주세요.' }),
        { status: 429, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }
    recentRequests.set(user.id, now)

    // 요청 본문 파싱
    const { post_id }: PostReplyRequest = await req.json()

    if (!post_id) {
      return new Response(
        JSON.stringify({ error: 'post_id가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 게시글 조회 (개인정보 제외)
    const { data: post, error: postError } = await supabase
      .from('posts')
      .select('name, title, content')
      .eq('id', post_id)
      .single()

    if (postError || !post) {
      return new Response(
        JSON.stringify({ error: '게시글을 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI API 호출
    const systemPrompt = `당신은 "지그시"라는 워터볼 문진 브랜드의 게시판 답변 작성 도우미입니다.

브랜드 특징:
- 작은 오브제 브랜드
- 차분하고 따뜻한 감성
- 제품: 글리터 워터볼 문진, 스노우 워터볼 문진, 모래사장 문진

답변 스타일:
- 한국어로 작성
- 자연스럽고 친근한 말투
- 짧고 명확하게
- 확인되지 않은 배송일, 재고, 가격 등을 임의로 만들어내지 않음
- 정보가 부족하면 "확인 후 안내드리겠습니다" 등으로 대응
- 게시판 공개 답글에 적합한 내용
- 이모지 사용 금지
- 과장하지 않음

답변 형식:
${post.name}님, 안녕하세요.

[게시글 내용에 대한 답변]

필요한 경우에만 자연스럽게:
감사합니다.
지그시 드림`

    const userPrompt = `작성자: ${post.name}
제목: ${post.title}
내용: ${post.content}

위 게시글에 대한 답변을 작성해주세요.`

    const openaiResponse = await fetch(OPENAI_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${openaiKey}`,
      },
      body: JSON.stringify({
        model: OPENAI_MODEL,
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    })

    if (!openaiResponse.ok) {
      const errorText = await openaiResponse.text()
      console.error('OpenAI API 오류:', errorText)
      throw new Error('AI 답변 생성에 실패했습니다')
    }

    const openaiData = await openaiResponse.json()
    const generatedReply = openaiData.choices[0]?.message?.content?.trim()

    if (!generatedReply) {
      throw new Error('AI 답변이 생성되지 않았습니다')
    }

    return new Response(
      JSON.stringify({ reply: generatedReply }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || '답변 생성 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
