# Bel Viaggio · 안드로이드 배포 가이드

> Aaron의 폰에 PWA 앱으로 설치하기 위한 단계별 가이드.
> **터미널·Node.js·코딩 전혀 필요 없음**. 브라우저만 있으면 됩니다.

---

## 📦 이 zip 파일에 들어있는 것

```
bel-viaggio-deploy/
├── package.json          ← Vercel이 어떤 패키지를 설치할지 알려줌
├── vite.config.js        ← 빌드 설정
├── vercel.json           ← PWA용 HTTP 헤더 설정
├── index.html            ← 앱 진입 HTML
├── .gitignore
├── README.md             ← 이 파일
├── src/
│   ├── main.jsx          ← React 진입
│   └── App.jsx           ← Bel Viaggio 본체 (~2,260줄)
├── public/               ← 정적 파일 (manifest, sw, 아이콘 7종)
│   ├── manifest.webmanifest
│   ├── sw.js
│   ├── icon-192.png      ← 일반 아이콘
│   ├── icon-512.png
│   ├── icon-maskable-192.png   ← 안드로이드 Material You 적응형
│   ├── icon-maskable-512.png
│   ├── icon-monochrome.png     ← 알림 뱃지용
│   ├── apple-touch-icon.png
│   └── favicon-32.png
└── api/
    └── claude.js         ← Vercel Serverless 함수 (API 키 보안용 프록시)
```

**중요**: 모든 아이콘은 이미 PNG로 변환되어 있습니다. 추가 변환 작업 없어요.

---

## 🚀 배포 단계 (총 30~40분, 100% 브라우저 작업)

### 1단계 — GitHub에 리포지토리 만들기 (5분)

1. **https://github.com/new** 접속
2. 빈 양식 입력:
   - **Repository name**: `bel-viaggio` (또는 원하는 이름)
   - **Public/Private**: Private 권장 (혼자만 쓸 거니까)
   - **Initialize this repository with**: 어떤 것도 체크하지 마세요 (README, .gitignore, license 모두 X)
3. **"Create repository"** 클릭

빈 repo가 만들어지면 안내 페이지가 보일 거예요. 거기서 잠깐 멈추고 다음 단계.

---

### 2단계 — 파일 업로드 (10분)

1. 방금 만든 repo 페이지에서 **"uploading an existing file"** 링크 클릭
   (또는 **Add file → Upload files**)

2. 컴퓨터에서 이 zip을 압축 푼 폴더 `bel-viaggio-deploy/` **내부 내용물을 모두 선택**해서 GitHub 페이지로 드래그앤드롭
   - ⚠️ `bel-viaggio-deploy` 폴더 자체가 아니라, **그 안의 모든 파일과 하위 폴더**를 드래그
   - `node_modules`, `dist` 같은 폴더가 보이면 같이 올리지 마세요 (이미 .gitignore에 들어있지만 혹시나)

3. GitHub가 폴더 구조까지 인식해서 업로드합니다 (드래그한 채로 잠깐 기다리면 파일 트리가 미리 표시됨)

4. 페이지 하단으로 스크롤 → **"Commit changes"** 버튼 클릭 (commit message는 그냥 두면 됨)

업로드 완료되면 repo 메인 페이지로 돌아갑니다. `src/`, `public/`, `api/`, `package.json` 등이 보이면 성공.

---

### 3단계 — Vercel 가입 + 연동 (5분)

1. **https://vercel.com/signup** 접속
2. **"Continue with GitHub"** 선택 → GitHub 로그인 → Vercel에 권한 부여 동의
3. Vercel 대시보드 진입

---

### 4단계 — 프로젝트 임포트 (5분)

1. Vercel 대시보드 우상단 **"Add New..." → "Project"** 클릭
2. **"Import Git Repository"** 화면에서 방금 만든 `bel-viaggio` repo 찾기
   - 안 보이면 **"Adjust GitHub App Permissions"** 클릭해서 repo 접근 권한 추가
3. repo 옆 **"Import"** 클릭

**Configure Project** 화면이 나옵니다:
- **Framework Preset**: Vite로 자동 감지됨 (안 되면 수동으로 선택)
- **Root Directory**: `./` (변경하지 마세요)
- **Build Command, Output Directory**: 기본값 그대로

⚠️ **여기서 멈춰서 환경 변수 추가**:

5. **"Environment Variables"** 섹션 펼치기
6. 다음 추가:
   - **Name**: `ANTHROPIC_API_KEY`
   - **Value**: 본인의 Anthropic API 키 (`sk-ant-...`로 시작)
   - **Environment**: Production, Preview, Development 모두 체크
7. **"Add"** 클릭

8. 하단 **"Deploy"** 버튼 클릭

빌드가 시작됩니다. 약 1~2분 걸려요. 빌드 로그가 실시간으로 보입니다.

빌드 성공하면 🎉 화면 + 배포된 URL이 표시됩니다. URL은 보통 `https://bel-viaggio-xxxx.vercel.app` 같은 형태.

---

### 5단계 — 안드로이드폰에 PWA 설치 (5분)

1. 안드로이드 Chrome으로 위에서 받은 Vercel URL 접속
2. 첫 로드 시 앱이 정상 표시되면 성공
3. 다음 중 하나로 설치:

   **A. Chrome 자동 배너**: 잠시 페이지에 머물면 하단에 "홈 화면에 추가" 배너가 자동으로 떠요. 탭하면 설치.

   **B. 앱 안의 "설치" 버튼**: Bel Viaggio 홈 화면에 "앱 설치" 패널이 있어요. 거기 "설치" 버튼 탭.

   **C. Chrome 메뉴**: Chrome 우상단 ⋮ → "앱 설치" 또는 "홈 화면에 추가"

4. 설치 다이얼로그 → "설치" 확인
5. 안드로이드 홈 화면에 Bel Viaggio 아이콘 등장 → 탭하면 standalone 모드(브라우저 UI 없이) 실행

---

### 6단계 — 권한 허용 (앱 첫 실행 시)

앱 첫 실행 시 다음을 모두 허용해주세요:

- 📍 **위치**: 주변 명소 탐지에 필수
- 📷 **카메라**: 명소·메뉴·영수증 사진 분석에 필수
- 🎙 **마이크**: 음성 입력 번역에 필수 (안 쓸 거면 거부해도 됨)
- 🔔 **알림**: 백그라운드 근접 알림에 필요 (다른 앱 쓰고 있을 때도 알림 받기)

---

## ✅ 동작 확인

설치 후 다음을 한 번씩 시도해보세요:

- [ ] 홈 화면에서 위치 정보 표시됨
- [ ] 주변 명소 리스트 표시 (실제 위치 OR 데모 모드)
- [ ] 카메라로 사진 찍어 명소 분석 → AI 결과 정상
- [ ] 영수증 사진 → € → ₩ 환산 표시
- [ ] 메뉴 사진 여러 장 동시 분석
- [ ] 음성으로 "이거 얼마예요?" 한국어 → 이탈리아어 번역
- [ ] 명소 상세 페이지에 위키피디아 사진 표시
- [ ] 즐겨찾기 추가 → 앱 종료 → 다시 열어서 유지되는지 확인 (IndexedDB 영구 저장)
- [ ] 즐겨찾기 2곳 이상 → "방문 코스 짜기" → 도보 순서 + 시간 표시

---

## 💸 비용 (추정)

- **Vercel 호스팅**: 무료 (Hobby plan, 개인 사용에 충분)
- **GitHub 리포지토리**: 무료 (Private 가능)
- **Anthropic API**: 사용량 종량제

  **추정 비용** (실측 아닌 견적):
  - Claude Sonnet Vision 호출 1회 ≈ $0.01~0.03 (사진 크기에 따라)
  - 메뉴 4장 동시 분석 1회 ≈ $0.04~0.10
  - 1주일 이탈리아 여행 가정 (사진 50회 + 메뉴 10회 + 영수증 20회): **약 $1~3 추정**

  ⚠️ **정확한 비용은 Anthropic 콘솔에서 실사용량 확인 필요**합니다. 출국 전 콘솔에 사용량 알림(Spend Alert)을 $10 등으로 설정해두는 걸 권장.

---

## ⚙️ 코드 수정하고 싶을 때

1. GitHub repo에서 파일 클릭 → 연필 아이콘(Edit) → 수정 → Commit
2. Vercel이 변경 감지해서 자동 재배포 (약 1~2분)
3. 폰에서 앱 새로고침 (서비스 워커 캐시 갱신은 다음 실행 때 적용)

---

## 🚨 트러블슈팅

### "배포는 됐는데 사진 분석이 작동 안 함"
→ Vercel 환경 변수 `ANTHROPIC_API_KEY`가 제대로 등록됐는지 확인. 키 변경 후엔 **재배포 필수** (Vercel → Deployments → 최근 배포 → ⋮ → Redeploy).

### "홈 화면에 추가" 옵션이 안 보임
→ 페이지를 처음 방문 후 30초~1분 정도 머무르거나, 페이지 새로고침 후 다시 시도. Chrome이 PWA로 인식할 시간이 필요해요.

### "위치 권한이 허용 안 됨"
→ 안드로이드 설정 → 앱 → Bel Viaggio → 권한에서 위치를 "허용"으로 변경.

### "영수증 분석 결과가 정확하지 않음"
→ 사진을 더 밝고 선명하게 찍어보세요. 그래도 안 되면 다른 사진으로 재시도. Claude Vision도 영수증마다 정확도 차이 있어요.

### "Vercel 배포가 실패함 (빌드 에러)"
→ Vercel Deployments → 실패한 배포 → "View Function Logs"에서 에러 메시지 확인. 보통 `package.json` 누락이나 파일 구조 문제. GitHub repo의 파일 구조가 위 트리와 같은지 확인.

---

## 📞 빠른 도움

문제가 생기면 Vercel 빌드 로그 또는 에러 메시지를 캡처해서 다시 Claude에 물어보시면 됩니다. 어디서 막혔는지만 알려주세요.
