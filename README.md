# 지그시 (Jigusi)

> 지그시 바라보는 작은 풍경

워터볼 문진 브랜드 **지그시**의 공식 원페이지 홈페이지입니다.

![지그시](https://img.shields.io/badge/React-18.3-61DAFB?logo=react)
![Vite](https://img.shields.io/badge/Vite-5.3-646CFF?logo=vite)
![Supabase](https://img.shields.io/badge/Supabase-Backend-3ECF8E?logo=supabase)
![Tailwind CSS](https://img.shields.io/badge/Tailwind-3.4-06B6D4?logo=tailwindcss)

## 🎯 프로젝트 소개

지그시는 책상 위에 두고 천천히 바라볼 수 있는 작은 풍경을 제안하는 문진 브랜드입니다.

### 주요 제품
- 글리터 워터볼 문진 (빛을 담은 작은 풍경)
- 스노우 워터볼 문진 (가만히 내려앉는 겨울)
- 모래사장 문진 (작은 모래 풍경)

## ✨ 주요 기능

### 공개 홈페이지
- 📱 **원페이지 스크롤**: 부드러운 섹션 이동
- 🎬 **히어로 영상**: 모래 문진 자동 재생
- 🛍️ **제품 소개**: 3가지 워터볼 문진
- 💬 **게시판**: 공개 글쓰기 및 관리자 답변
- 📧 **문의하기**: Supabase 연동 문의 제출

### 관리자 페이지 (`/admin`)
- 🔐 **Supabase Auth**: 이메일/비밀번호 로그인
- 📬 **문의 관리**: 
  - AI 답변 초안 생성 (OpenAI)
  - 관리자 확인/수정
  - 이메일 발송 (Resend)
- 📝 **게시판 관리**:
  - AI 답변 초안 생성
  - 공개 답변 등록/수정
  - 게시글 삭제

## 🛠️ 기술 스택

### Frontend
- **React 18** - UI 라이브러리
- **Vite** - 빌드 도구
- **React Router** - 라우팅
- **Tailwind CSS** - 스타일링

### Backend
- **Supabase** - 백엔드 플랫폼
  - PostgreSQL 데이터베이스
  - Row Level Security (RLS)
  - Auth (인증)
  - Edge Functions

### AI & Email
- **OpenAI API** (gpt-4o-mini) - AI 답변 생성
- **Resend** - 이메일 발송

## 📦 설치 및 실행

### 사전 준비
- Node.js 18+
- Supabase 계정
- OpenAI API Key
- Resend API Key

### 환경변수 설정

`.env` 파일을 생성하고 다음 값을 입력하세요:

```env
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
```

### 로컬 개발

```bash
# 의존성 설치
npm install

# 개발 서버 실행
npm run dev

# 접속
# 홈페이지: http://localhost:5173/
# 관리자: http://localhost:5173/admin
```

### 프로덕션 빌드

```bash
npm run build
npm run preview
```

## 🗄️ 데이터베이스 설정

### 1. Supabase 프로젝트 생성
1. [Supabase](https://supabase.com) 접속
2. 새 프로젝트 생성

### 2. SQL Migration 실행

Supabase Dashboard > SQL Editor에서 순서대로 실행:

```bash
# 1. 기본 스키마
supabase/migrations/001_initial_schema.sql

# 2. 게시판 답변 기능
supabase/migrations/002_add_posts_reply.sql
```

### 3. 관리자 계정 생성

1. **Supabase Dashboard** > **Authentication** > **Users**
2. **Add user** 클릭
3. 이메일/비밀번호 입력
4. **Auto Confirm User** 체크
5. User ID 복사 후 아래 SQL 실행:

```sql
INSERT INTO public.admin_users (id, email)
VALUES ('your-user-id-uuid', 'admin@example.com');
```

### 4. Edge Functions 배포

```bash
# Supabase CLI 로그인
supabase login

# 프로젝트 연결
supabase link --project-ref your-project-id

# Edge Functions 배포
supabase functions deploy generate-inquiry-reply
supabase functions deploy send-inquiry-reply
supabase functions deploy generate-post-reply
```

### 5. Secrets 설정

```bash
# Supabase
supabase secrets set SUPABASE_URL=https://your-project.supabase.co
supabase secrets set SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# OpenAI
supabase secrets set OPENAI_API_KEY=sk-your-openai-key

# Resend
supabase secrets set RESEND_API_KEY=re-your-resend-key
supabase secrets set EMAIL_FROM=onboarding@resend.dev
```

## 📁 프로젝트 구조

```
지그시/
├── public/              # 정적 파일
│   ├── 히어로 영상.mp4
│   ├── 글리터 문진.png
│   ├── 눈 문진.png
│   └── 모래 문진.png
├── src/
│   ├── components/      # React 컴포넌트
│   │   ├── admin/       # 관리자 컴포넌트
│   │   │   ├── AdminLogin.jsx
│   │   │   ├── InquiryManagement.jsx
│   │   │   └── BoardManagement.jsx
│   │   ├── Header.jsx
│   │   ├── Hero.jsx
│   │   ├── Products.jsx
│   │   ├── Brand.jsx
│   │   ├── Board.jsx
│   │   ├── Contact.jsx
│   │   └── Footer.jsx
│   ├── pages/           # 페이지
│   │   ├── Home.jsx
│   │   └── Admin.jsx
│   ├── lib/             # 유틸리티
│   │   └── supabaseClient.js
│   ├── App.jsx
│   ├── main.jsx
│   └── index.css
├── supabase/
│   ├── migrations/      # DB 마이그레이션
│   │   ├── 001_initial_schema.sql
│   │   └── 002_add_posts_reply.sql
│   └── functions/       # Edge Functions
│       ├── generate-inquiry-reply/
│       ├── send-inquiry-reply/
│       └── generate-post-reply/
├── .env.example
├── SETUP_GUIDE.md       # 상세 설정 가이드
└── README.md
```

## 🎨 디자인 컨셉

- **미니멀**: 넓은 여백, 깔끔한 레이아웃
- **따뜻함**: Warm White 배경, 자연광 느낌
- **차분함**: 느린 애니메이션, 절제된 인터랙션
- **타이포그래피**: ElegantSerif (브랜드), Pretendard (본문)

## 🔒 보안

- ✅ Row Level Security (RLS) 활성화
- ✅ 관리자 권한 서버 측 검증
- ✅ OpenAI/Resend API Key 서버 전용
- ✅ JWT 기반 인증
- ✅ CORS 설정
- ✅ 환경변수 분리

## 📄 라이선스

이 프로젝트는 지그시 브랜드 전용입니다.

## 🙋 문의

**이메일**: hello@jigusi.com  
**주소**: 문진도 지그시 빛나길 32-7

---

© 2026 지그시. All rights reserved.
