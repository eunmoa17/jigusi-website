// generate-inquiry-reply Edge Function
// 문의 답변 AI 초안 생성

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// OpenAI 모델 설정 (한 곳에서 관리)
const OPENAI_MODEL = 'gpt-4o-mini'
const OPENAI_API_URL = 'https://api.openai.com/v1/chat/completions'

// 중복 호출 방지를 위한 간단한 인메모리 캐시
const recentRequests = new Map<string, number>()
const RATE_LIMIT_MS = 5000 // 5초

interface InquiryReplyRequest {
  inquiry_id: string
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
    const { inquiry_id }: InquiryReplyRequest = await req.json()

    if (!inquiry_id) {
      return new Response(
        JSON.stringify({ error: 'inquiry_id가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 문의 조회 (name과 content만)
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('name, content')
      .eq('id', inquiry_id)
      .single()

    if (inquiryError || !inquiry) {
      return new Response(
        JSON.stringify({ error: '문의를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // OpenAI API 호출
    const systemPrompt = `당신은 "지그시"라는 워터볼 문진 브랜드의 고객 문의 답변 작성 도우미입니다.

브랜드 특징:
- 작은 오브제 브랜드
- 차분하고 따뜻한 감성
- 제품: 글리터 워터볼 문진, 스노우 워터볼 문진, 모래사장 문진

답변 스타일:
- 한국어로 작성
- 친절하고 자연스러운 말투
- 지나치게 격식적이지 않음
- 짧고 명확함
- 확인되지 않은 배송일, 재고, 가격 등을 임의로 만들어내지 않음
- 정보가 부족하면 "확인 후 연락드리겠습니다" 등으로 대응
- 고객 이름을 자연스럽게 사용
- 이모지 사용 금지
- 과장하지 않음

답변 형식:
안녕하세요, [고객명]님.
지그시에 문의해 주셔서 감사합니다.

[문의 내용에 대한 답변]

감사합니다.
지그시 드림`

    const userPrompt = `고객명: ${inquiry.name}
문의 내용: ${inquiry.content}

위 문의에 대한 답변을 작성해주세요.`

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
