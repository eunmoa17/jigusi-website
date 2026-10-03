-- ============================================
-- 지그시 프로젝트 초기 데이터베이스 스키마
-- 실행 순서: Supabase Dashboard > SQL Editor에서 전체 실행
-- ============================================

-- ============================================
-- 1. admin_users 테이블 (관리자 판별용)
-- ============================================
CREATE TABLE IF NOT EXISTS public.admin_users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_admin_users_email ON public.admin_users(email);

ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;


-- ============================================
-- 2. 관리자 권한 확인 함수
-- ============================================
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = ''
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.admin_users
    WHERE id = auth.uid()
  );
$$;

REVOKE ALL ON FUNCTION public.is_admin() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.is_admin() TO authenticated;


-- ============================================
-- 3. admin_users RLS 정책
-- ============================================
CREATE POLICY "Admin users can view their own record"
  ON public.admin_users
  FOR SELECT
  USING (auth.uid() = id);


-- ============================================
-- 4. inquiries 테이블 (문의)
-- ============================================
CREATE TABLE IF NOT EXISTS public.inquiries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  contact TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  reply_content TEXT,
  reply_status TEXT NOT NULL DEFAULT 'pending' CHECK (reply_status IN ('pending', 'replied')),
  replied_at TIMESTAMPTZ
);

CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON public.inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_reply_status ON public.inquiries(reply_status);

ALTER TABLE public.inquiries ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can insert inquiries"
  ON public.inquiries
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can view inquiries"
  ON public.inquiries
  FOR SELECT
  USING (public.is_admin());

CREATE POLICY "Admins can update inquiries"
  ON public.inquiries
  FOR UPDATE
  USING (public.is_admin())
  WITH CHECK (public.is_admin());

CREATE POLICY "Admins can delete inquiries"
  ON public.inquiries
  FOR DELETE
  USING (public.is_admin());


-- ============================================
-- 5. posts 테이블 (게시판)
-- ============================================
CREATE TABLE IF NOT EXISTS public.posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);

ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Anyone can view posts"
  ON public.posts
  FOR SELECT
  USING (true);

CREATE POLICY "Anyone can insert posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (true);

CREATE POLICY "Admins can delete posts"
  ON public.posts
  FOR DELETE
  USING (public.is_admin());


-- ============================================
-- 완료 메시지
-- ============================================
DO $$
BEGIN
  RAISE NOTICE '========================================';
  RAISE NOTICE '지그시 데이터베이스 스키마 생성 완료';
  RAISE NOTICE '========================================';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 테이블:';
  RAISE NOTICE '  - admin_users (관리자 판별)';
  RAISE NOTICE '  - inquiries (문의)';
  RAISE NOTICE '  - posts (게시판)';
  RAISE NOTICE '';
  RAISE NOTICE '생성된 함수:';
  RAISE NOTICE '  - public.is_admin() (관리자 권한 확인)';
  RAISE NOTICE '';
  RAISE NOTICE '다음 단계:';
  RAISE NOTICE '1. Supabase Dashboard > Authentication > Users';
  RAISE NOTICE '2. Add user로 관리자 계정 생성';
  RAISE NOTICE '3. 생성된 User ID (UUID) 복사';
  RAISE NOTICE '4. 아래 SQL 실행:';
  RAISE NOTICE '';
  RAISE NOTICE '   INSERT INTO public.admin_users (id, email)';
  RAISE NOTICE '   VALUES (''복사한-user-id-uuid'', ''admin@jigusi.com'');';
  RAISE NOTICE '';
  RAISE NOTICE '========================================';
END $$;
