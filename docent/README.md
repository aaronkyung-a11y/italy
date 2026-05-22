# 도슨트 · Docent

로마 핵심 명소 5곳의 한국어 오디오 도슨트 가이드.

## 명소
- 🎨 보르게세 미술관 · 베르니니, 카라바조
- ⛪ 바티칸 박물관 & 시스티나 성당 · 미켈란젤로, 라파엘로
- 🏛️ 콜로세움
- 🏛️ 판테온
- ⛲ 트레비 분수

## 개발

```bash
npm install
npm run dev      # localhost:5173
npm run build    # production build to /dist
```

## 환경 변수 (Vercel)

- `ANTHROPIC_API_KEY` — Claude API 키 (Vision + Q&A 용)

## 기술 스택
- React 18 + Vite
- Claude API (Anthropic) — 사진 인식, AI 질의응답
- Web Speech API — TTS (v0.1, v0.2에서 OpenAI MP3로 교체 예정)
