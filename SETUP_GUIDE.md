# 지그시 프로젝트 설정 가이드

이 가이드는 지그시 프로젝트를 Supabase와 연결하고 관리자 기능을 활성화하는 단계별 설명입니다.

---

## 📋 사전 준비사항

- Node.js 설치
- Supabase 계정
- OpenAI API Key
- Resend 계정 (이메일 발송용)

---

## 🚀 설정 단계

### 1단계: Supabase 프로젝트 생성

1. [https://supabase.com](https://supabase.com) 접속
2. 새 프로젝트 생성
3. 프로젝트 이름: `jigusi` (또는 원하는 이름)
4. Database Password 설정 (안전하게 보관)
5. Region 선택 (가장 가까운 지역)

---

### 2단계: 데이터베이스 스키마 생성

1. Supabase Dashboard > SQL Editor 이동
2. `supabase/migrations/001_initial_schema.sql` 파일 내용 복사
3. SQL Editor에 붙여넣기
4. **Run** 버튼 클릭하여 실행
5. 성공 메시지 확인:
   - `admin_users` 테이블 생성됨
   - `inquiries` 테이블 생성됨
   - `posts` 테이블 생성됨
   - RLS 정책 적용됨

---

### 3단계: 관리자 계정 생성

#### 3-1. Auth에서 사용자 생성

1. Supabase Dashboard > Authentication > Users
2. **Add user** 클릭
3. 관리자 이메일 입력 (예: admin@jigusi.com)
4. 비밀번호 설정 (안전하게 보관)
5. **Auto Confirm User** 체크 (이메일 인증 건너뛰기)
6. Create user
7. 생성된 사용자의 **User ID (UUID)** 복사

#### 3-2. admin_users 테이블에 등록

1. Supabase Dashboard > SQL Editor
2. 아래 SQL 실행 (UUID는 3-1에서 복사한 값):

```sql
INSERT INTO public.admin_users (id, email)
VALUES 
  ('복사한-user-id-uuid', 'admin@jigusi.com');
```

3. 성공 확인

---

### 4단계: 환경변수 설정 (.env 파일)

1. 프로젝트 루트의 `.env` 파일 열기
2. Supabase Dashboard > Project Settings > API 이동
3. 아래 값 복사하여 `.env`에 입력:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbG...your-anon-key
```

**중요**: 
- `service_role` key는 절대 `.env`에 넣지 마세요
- `.env` 파일은 git에 커밋되지 않습니다 (`.gitignore`에 포함됨)

---

### 5단계: Edge Functions 배포

#### 5-1. Supabase CLI 설치

```bash
npm install -g supabase
```

#### 5-2. Supabase 로그인

```bash
supabase login
```

#### 5-3. 프로젝트 연결

```bash
supabase link --project-ref your-project-id
```

프로젝트 ID는 Supabase Dashboard URL에서 확인:
`https://supabase.com/dashboard/project/{your-project-id}`

#### 5-4. Edge Functions 배포

```bash
# AI 답변 생성 함수
supabase functions deploy generate-inquiry-reply

# 이메일 발송 함수
supabase functions deploy send-inquiry-reply
```

---

### 6단계: Edge Function Secrets 설정

#### 6-1. OpenAI API Key

1. [https://platform.openai.com/api-keys](https://platform.openai.com/api-keys) 접속
2. API Key 생성
3. Supabase에 Secret 등록:

```bash
supabase secrets set OPENAI_API_KEY=sk-...your-openai-key
```

또는 Supabase Dashboard > Edge Functions > Settings > Secrets에서 수동 등록:
- Name: `OPENAI_API_KEY`
- Value: `sk-...`

#### 6-2. Resend API Key

1. [https://resend.com](https://resend.com) 가입
2. API Keys 생성
3. 발신 도메인 인증 (또는 resend.dev 사용)
4. Supabase에 Secret 등록:

```bash
supabase secrets set RESEND_API_KEY=re_...your-resend-key
```

#### 6-3. Supabase Service Role Key (Edge Function 내부용)

Supabase Dashboard > Project Settings > API에서 `service_role` key 복사

```bash
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=eyJhbG...your-service-role-key
```

#### 6-4. Supabase URL

```bash
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
```

---

### 7단계: Resend 발신 이메일 설정

#### Option A: 테스트 (resend.dev 사용)

기본적으로 `hello@jigusi.com`을 발신자로 사용하도록 설정되어 있습니다.
테스트 환경에서는 Resend가 자동으로 `onboarding@resend.dev`로 발송합니다.

#### Option B: 실제 도메인 사용

1. Resend Dashboard > Domains
2. **Add Domain** 클릭
3. 도메인 입력 (예: jigusi.com)
4. DNS 레코드 추가 (Resend가 안내하는 대로)
5. 인증 완료 대기
6. `supabase/functions/send-inquiry-reply/index.ts` 파일 수정:

```typescript
from: 'hello@jigusi.com', // 인증된 도메인으로 변경
```

7. Edge Function 재배포:

```bash
supabase functions deploy send-inquiry-reply
```

---

### 8단계: 로컬 개발 서버 실행

```bash
npm install
npm run dev
```

브라우저에서 확인:
- 홈페이지: http://localhost:5173/
- 관리자: http://localhost:5173/admin

---

### 9단계: 기능 테스트

#### 9-1. 공개 홈페이지 테스트

1. http://localhost:5173/ 접속
2. 히어로 영상 재생 확인
3. 제품 3개 표시 확인
4. 게시판 > 글쓰기 > 등록 테스트
5. 문의하기 폼 제출 테스트

#### 9-2. 관리자 기능 테스트

1. http://localhost:5173/admin 접속
2. 3단계에서 생성한 관리자 계정으로 로그인
3. **문의 관리** 탭:
   - 9-1에서 제출한 문의 표시 확인
   - 문의 선택
   - **AI 답변 생성** 버튼 클릭
   - AI 답변이 textarea에 입력되는지 확인
   - 답변 수정
   - **답변 보내기** 클릭 (이메일 주소 문의만)
   - 답변 상태가 "답변완료"로 변경되는지 확인
4. **게시판 관리** 탭:
   - 게시글 목록 확인
   - 게시글 선택 및 상세 보기
   - 삭제 기능 테스트

---

### 10단계: 프로덕션 빌드

```bash
npm run build
```

빌드 오류가 없는지 확인하세요.

빌드 결과물은 `dist/` 폴더에 생성됩니다.

---

## 🔐 보안 체크리스트

- [x] `.env` 파일이 `.gitignore`에 포함되어 있음
- [x] `service_role` key가 브라우저에 노출되지 않음
- [x] OpenAI API Key가 Edge Function Secret으로만 관리됨
- [x] Resend API Key가 Edge Function Secret으로만 관리됨
- [x] RLS 정책이 모든 테이블에 활성화됨
- [x] 관리자 권한이 서버 측에서 검증됨

---

## 🚨 문제 해결

### "Supabase 환경변수가 설정되지 않았습니다"

→ `.env` 파일에 `VITE_SUPABASE_URL`과 `VITE_SUPABASE_ANON_KEY`를 정확히 입력했는지 확인
→ 개발 서버 재시작 (`npm run dev` 종료 후 재실행)

### "관리자 권한이 없습니다"

→ `admin_users` 테이블에 해당 User ID가 등록되어 있는지 SQL로 확인:

```sql
SELECT * FROM public.admin_users;
```

### "AI 답변 생성에 실패했습니다"

→ Edge Function Secrets에 `OPENAI_API_KEY`가 올바르게 설정되어 있는지 확인
→ OpenAI API Key가 유효한지 확인 (사용 한도, 결제 정보 등)
→ Supabase Dashboard > Edge Functions > Logs에서 오류 확인

### "이메일 발송에 실패했습니다"

→ `RESEND_API_KEY`가 Edge Function Secrets에 등록되어 있는지 확인
→ Resend에서 발신 도메인이 인증되었는지 확인
→ 문의가 이메일 주소로 접수되었는지 확인 (전화번호는 발송 불가)

---

## 📝 추가 설정 (선택사항)

### 도메인 연결

Vercel, Netlify 등에 배포 후 커스텀 도메인 연결 가능

### CORS 설정

Supabase Dashboard > Authentication > URL Configuration에서
Site URL 및 Redirect URLs 설정

---

## 📧 연락처

문제가 발생하면 관리자에게 문의하세요.
