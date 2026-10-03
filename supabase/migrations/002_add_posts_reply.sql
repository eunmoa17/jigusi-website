-- ============================================
-- 게시판 관리자 답변 기능 추가
-- ============================================

-- posts 테이블에 답변 컬럼 추가
ALTER TABLE public.posts
ADD COLUMN IF NOT EXISTS reply_content TEXT,
ADD COLUMN IF NOT EXISTS reply_status TEXT NOT NULL DEFAULT 'pending' CHECK (reply_status IN ('pending', 'replied')),
ADD COLUMN IF NOT EXISTS replied_at TIMESTAMPTZ;

-- 답변 상태 인덱스 (검색 최적화)
CREATE INDEX IF NOT EXISTS idx_posts_reply_status ON public.posts(reply_status);

-- 기존 RLS 정책 확인
-- posts UPDATE 정책이 이미 없으므로 관리자 UPDATE 정책 추가

CREATE POLICY "Admins can update posts"
  ON public.posts
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

-- 완료 메시지
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '게시판 관리자 답변 기능 추가 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '추가된 컬럼:';
  RAISE NOTICE '  - reply_content (관리자 답변 내용)';
  RAISE NOTICE '  - reply_status (답변 상태: pending/replied)';
  RAISE NOTICE '  - replied_at (답변 시간)';
  RAISE NOTICE '';
  RAISE NOTICE '추가된 정책:';
  RAISE NOTICE '  - Admins can update posts (관리자 UPDATE 권한)';
  RAISE NOTICE '';
  RAISE NOTICE '기존 게시글은 reply_status=pending 상태로 유지됩니다.';
  RAISE NOTICE '========================================';
END $$;
