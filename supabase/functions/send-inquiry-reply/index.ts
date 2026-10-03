// send-inquiry-reply Edge Function
// 문의 답변 이메일 발송

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.38.4'

// 이메일 발신자 설정
// Resend 테스트: onboarding@resend.dev 또는 인증된 도메인 사용
const EMAIL_FROM = Deno.env.get('EMAIL_FROM') || 'onboarding@resend.dev'

interface SendReplyRequest {
  inquiry_id: string
  reply_content: string
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
    const resendKey = Deno.env.get('RESEND_API_KEY')

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase 환경변수가 설정되지 않았습니다')
    }

    if (!resendKey) {
      return new Response(
        JSON.stringify({ 
          error: 'RESEND_API_KEY가 설정되지 않았습니다',
          message: 'Resend API 키를 Supabase Edge Function Secrets에 등록해주세요'
        }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
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

    // 요청 본문 파싱
    const { inquiry_id, reply_content }: SendReplyRequest = await req.json()

    if (!inquiry_id || !reply_content || !reply_content.trim()) {
      return new Response(
        JSON.stringify({ error: 'inquiry_id와 reply_content가 필요합니다' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 문의 조회
    const { data: inquiry, error: inquiryError } = await supabase
      .from('inquiries')
      .select('name, contact, content')
      .eq('id', inquiry_id)
      .single()

    if (inquiryError || !inquiry) {
      return new Response(
        JSON.stringify({ error: '문의를 찾을 수 없습니다' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // 이메일 형식 확인
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(inquiry.contact)) {
      return new Response(
        JSON.stringify({ 
          error: '전화번호로 접수된 문의입니다',
          message: '이메일 주소가 아닌 연락처입니다. 직접 연락해주세요.'
        }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    // Resend API로 이메일 발송
    const resendResponse = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${resendKey}`,
      },
      body: JSON.stringify({
        from: EMAIL_FROM,
        to: inquiry.contact,
        subject: '[지그시] 문의 답변 드립니다',
        text: reply_content,
        html: `<div style="font-family: sans-serif; line-height: 1.6; color: #333;">
          <pre style="white-space: pre-wrap; font-family: inherit;">${reply_content}</pre>
        </div>`,
      }),
    })

    if (!resendResponse.ok) {
      const errorText = await resendResponse.text()
      console.error('Resend API 오류:', errorText)
      
      // Resend 설정 오류인지 확인
      if (resendResponse.status === 403 || resendResponse.status === 401) {
        return new Response(
          JSON.stringify({ 
            error: 'Resend API 인증 실패',
            message: 'Resend API 키가 올바르지 않거나 발신 도메인이 인증되지 않았습니다'
          }),
          { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        )
      }
      
      throw new Error('이메일 발송에 실패했습니다')
    }

    // 이메일 발송 성공 시 DB 업데이트
    const { error: updateError } = await supabase
      .from('inquiries')
      .update({
        reply_content,
        reply_status: 'replied',
        replied_at: new Date().toISOString(),
      })
      .eq('id', inquiry_id)

    if (updateError) {
      console.error('DB 업데이트 오류:', updateError)
      // 이메일은 발송되었으므로 성공으로 처리하되 경고 포함
      return new Response(
        JSON.stringify({ 
          success: true,
          warning: '이메일은 발송되었으나 DB 업데이트에 실패했습니다'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      )
    }

    return new Response(
      JSON.stringify({ success: true, message: '답변이 전송되었습니다' }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )

  } catch (error) {
    console.error('Error:', error)
    return new Response(
      JSON.stringify({ error: error.message || '답변 전송 중 오류가 발생했습니다' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    )
  }
})
