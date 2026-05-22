# 도슨트 (Docent) v0.1 — 배포 가이드

## 📁 받은 파일

```
docent/
├── api/claude.js              ← Claude API 프록시 (서버리스)
├── public/manifest.json       ← PWA
├── src/
│   ├── App.jsx                ← 메인 컴포넌트 (홈/명소/포인트)
│   ├── main.jsx
│   ├── styles.css             ← 다크 + 골드 디자인 시스템
│   └── data/attractions.js    ← 5 명소, 11 포인트 콘텐츠
├── index.html
├── package.json
├── vite.config.js
├── vercel.json
├── .gitignore
└── README.md
```

## 🚀 배포 방법 (택 1)

### 방법 A — Vercel CLI (가장 빠름, ~3분)

GitHub 안 거치고 Vercel에 직접 배포:

```bash
cd ~/Downloads/docent       # 다운받은 폴더로 이동
npm install                  # 의존성 설치
npm run build                # 빌드 검증
npx vercel                   # Vercel 배포 — 로그인 후 진행
```

Vercel 질문에 답:
- Set up and deploy? **Y**
- Which scope? **aaronk-s-projects**
- Link to existing project? **N**
- Project name? **docent** (또는 원하는 이름)
- Directory? **./** (현재)
- Override settings? **N**

배포 완료 후 URL 발급. 그 후 Vercel 대시보드에서:
1. Settings → Environment Variables
2. `ANTHROPIC_API_KEY` 추가 (Bel Viaggio용 키 재사용 가능)
3. Redeploy

### 방법 B — GitHub + Vercel (Bel Viaggio와 동일 방식)

1. **GitHub 새 repo 생성** (https://github.com/new):
   - Name: `docent`
   - Public 또는 Private
   - **Initialize 옵션 모두 끄기** (README, .gitignore, license 다 해제)
   - "Create repository" 클릭

2. **로컬에서 push**:
```bash
cd ~/Downloads/docent
git init
git add .
git commit -m "feat: v0.1 — 5 attractions, 11 points (Bernini/Caravaggio/Michelangelo/Raphael)"
git branch -M main
git remote add origin https://github.com/aaronkyung-a11y/docent.git
git push -u origin main
```
   인증창에서 GitHub 비밀번호 대신 PAT 사용 (또는 새 PAT 생성)

3. **Vercel에서 Import**:
   - https://vercel.com/new
   - GitHub repo `docent` 선택
   - Framework: Vite (자동 감지)
   - Deploy

4. **환경 변수 추가**:
   - Project Settings → Environment Variables
   - `ANTHROPIC_API_KEY` 추가
   - Redeploy

## 🧪 로컬 테스트 (먼저 확인)

```bash
cd ~/Downloads/docent
npm install
npm run dev
# http://localhost:5173 에서 확인
```

확인할 것:
- 홈에 5개 명소 카드 보이는지
- 카드 누르면 명소 페이지로 이동
- 명소 페이지에서 포인트 목록 보이는지
- 포인트 누르면 디테일 + 오디오 버튼 보이는지
- "오디오 도슨트 듣기" 누르면 한국어 TTS 재생되는지 (브라우저 TTS, v0.1 임시)

## 🎵 오디오 v0.2 계획

현재 v0.1은 **Web Speech API** (브라우저 내장 TTS) 사용 — 음질 어색. v0.2에서:

1. OpenAI TTS API로 모든 포인트 MP3 사전 생성 (스크립트 `scripts/generate-audio.js`)
2. `/public/audio/{attraction}/{point}.mp3` 에 저장
3. 코드에서 `<audio src="...">` 로 재생
4. PWA Service Worker로 오프라인 캐싱

비용: 약 $0.5 (1회 생성). 재생 시 비용 0원.

## ✏️ 콘텐츠 확장 (v0.2~)

`src/data/attractions.js` 에 포인트 추가:

```js
{
  id: 'venus-pauline',
  name: '비너스로서의 파올리나 보나파르테',
  artist: 'Antonio Canova',
  // ... 기존 포인트 형식 그대로
}
```

전체 목표:
- 보르게세: 현재 3 → 30 (베르니니 6 + 카라바조 6 + 라파엘로 2 + 티치아노 2 + 기타)
- 바티칸: 현재 3 → 18 (시스티나 8 + 박물관 6 + 베드로 성당 4)
- 콜로세움: 현재 2 → 8
- 판테온: 현재 2 → 5
- 트레비: 현재 2 → 4

**총 65 포인트 목표**.
