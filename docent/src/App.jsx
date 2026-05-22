import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight, ArrowLeft, Play, Pause, Volume2, VolumeX,
  Clock, Info, MapPin, Star, Headphones, BookOpen, Eye, Sparkles, Quote,
  Camera, Image as ImageIcon, Loader2, AlertCircle, RefreshCw, WifiOff, Search,
  Download, Smartphone, X,
} from 'lucide-react';
import { ATTRACTIONS, findAttraction, findPoint, TOTAL_POINTS } from './data/attractions.js';

// ─────────────────────────────────────────────────────────
// Image compression for Vision API uploads
// ─────────────────────────────────────────────────────────
function compressImage(file, maxDim = 1280) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      try { URL.revokeObjectURL(img.src); } catch { /* ignore */ }
      const ratio = Math.min(maxDim / img.width, maxDim / img.height, 1);
      const w = Math.round(img.width * ratio);
      const h = Math.round(img.height * ratio);
      const canvas = document.createElement('canvas');
      canvas.width = w; canvas.height = h;
      const ctx = canvas.getContext('2d');
      ctx.drawImage(img, 0, 0, w, h);
      const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
      const base64 = dataUrl.split(',')[1];
      resolve({ dataUrl, base64, mimeType: 'image/jpeg', width: w, height: h });
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

// ─────────────────────────────────────────────────────────
// PWA install prompt — beforeinstallprompt event
// 사이트 내 "앱 설치" 버튼을 위한 hook
// ─────────────────────────────────────────────────────────
function useInstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);

  useEffect(() => {
    // 1. 이미 PWA로 실행 중이면 설치된 상태
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      window.navigator.standalone === true;
    if (isStandalone) setIsInstalled(true);

    // 2. iOS 감지 (iOS Safari는 beforeinstallprompt 미지원)
    const iOS = /iPad|iPhone|iPod/.test(navigator.userAgent) && !window.MSStream;
    setIsIOS(iOS);

    // 3. install prompt 가로채기
    const onBeforeInstall = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', onBeforeInstall);

    // 4. 설치 완료 감지
    const onInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
    };
    window.addEventListener('appinstalled', onInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function install() {
    if (!deferredPrompt) return false;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    setDeferredPrompt(null);
    return outcome === 'accepted';
  }

  return {
    canInstall: !!deferredPrompt,
    isInstalled,
    isIOS,
    install,
  };
}

// ─────────────────────────────────────────────────────────
// View stack with browser history sync
// ─────────────────────────────────────────────────────────
function useViewStack(initial = { name: 'home' }) {
  const [stack, setStack] = useState([initial]);

  useEffect(() => {
    const onPop = () => setStack((s) => (s.length > 1 ? s.slice(0, -1) : s));
    window.addEventListener('popstate', onPop);
    return () => window.removeEventListener('popstate', onPop);
  }, []);

  const push = useCallback((v) => {
    setStack((s) => [...s, v]);
    window.history.pushState({}, '');
  }, []);
  const pop = useCallback(() => {
    if (stack.length > 1) window.history.back();
  }, [stack.length]);
  const reset = useCallback(() => setStack([initial]), []);

  return { current: stack[stack.length - 1], push, pop, reset, depth: stack.length };
}

// ─────────────────────────────────────────────────────────
// MP3 audio player (v0.3 — replaces Web Speech with pre-generated MP3)
// Audio files at /audio/{attractionId}/{pointId}.mp3
// Generated via Microsoft Edge TTS (ko-KR-SunHiNeural voice)
// ─────────────────────────────────────────────────────────
function useAudio() {
  const [playing, setPlaying] = useState(null); // pointId currently playing
  const [progress, setProgress] = useState(0);  // 0-1
  const [duration, setDuration] = useState(0);  // seconds
  const audioRef = useRef(null);

  useEffect(() => () => stop(), []);

  function stop() {
    if (audioRef.current) {
      audioRef.current.pause();
      audioRef.current.currentTime = 0;
    }
    setPlaying(null);
    setProgress(0);
    setDuration(0);
  }

  function play(pointId, audioUrl) {
    stop();
    const audio = new Audio(audioUrl);
    audio.preload = 'auto';
    audioRef.current = audio;
    setPlaying(pointId);

    audio.addEventListener('loadedmetadata', () => {
      setDuration(audio.duration);
    });
    audio.addEventListener('timeupdate', () => {
      if (audio.duration) setProgress(audio.currentTime / audio.duration);
    });
    audio.addEventListener('ended', () => {
      setPlaying(null);
      setProgress(0);
    });
    audio.addEventListener('error', (e) => {
      console.error('Audio playback error:', e);
      setPlaying(null);
    });

    audio.play().catch((err) => {
      console.error('Play rejected:', err);
      setPlaying(null);
    });
  }

  function toggle(pointId, audioUrl) {
    if (playing === pointId) stop();
    else play(pointId, audioUrl);
  }

  function seek(t) {
    if (audioRef.current) audioRef.current.currentTime = t;
  }

  return { playing, progress, duration, play, stop, toggle, seek };
}

// ─────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────
export default function App() {
  const view = useViewStack();
  const audio = useAudio();

  // Stop audio on view change
  useEffect(() => { audio.stop(); }, [view.current.name]);

  return (
    <div className="dc-app">
      {view.current.name === 'home' && <HomeView push={view.push} />}
      {view.current.name === 'attraction' && (
        <AttractionView
          attractionId={view.current.attractionId}
          push={view.push}
          pop={view.pop}
        />
      )}
      {view.current.name === 'point' && (
        <PointView
          attractionId={view.current.attractionId}
          pointId={view.current.pointId}
          pop={view.pop}
          audio={audio}
        />
      )}
      {view.current.name === 'scan' && (
        <ScanView pop={view.pop} push={view.push} />
      )}

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Home — list of 5 attractions
// ─────────────────────────────────────────────────────────
function HomeView({ push }) {
  const [isOffline, setIsOffline] = useState(!navigator.onLine);
  const installer = useInstallPrompt();
  const [iosGuideOpen, setIosGuideOpen] = useState(false);
  const [installDismissed, setInstallDismissed] = useState(
    () => sessionStorage.getItem('docent-install-dismissed') === '1'
  );

  useEffect(() => {
    const onOnline = () => setIsOffline(false);
    const onOffline = () => setIsOffline(true);
    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);
    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  const showInstallCard =
    !installer.isInstalled &&
    !installDismissed &&
    (installer.canInstall || installer.isIOS);

  function dismissInstall() {
    sessionStorage.setItem('docent-install-dismissed', '1');
    setInstallDismissed(true);
  }

  async function handleInstall() {
    if (installer.isIOS) {
      setIosGuideOpen((v) => !v);
    } else {
      const accepted = await installer.install();
      if (accepted) setInstallDismissed(true);
    }
  }

  return (
    <div className="dc-home">
      <header className="dc-hero">
        <div className="dc-hero-mark">DOCENT</div>
        <h1 className="dc-hero-title">도슨트</h1>
        <p className="dc-hero-sub">로마 핵심 명소 5곳 · 한국어 오디오 가이드</p>
        <div className="dc-hero-stats">
          <span><Headphones size={11} /> {TOTAL_POINTS} 포인트</span>
          <span>·</span>
          <span>{ATTRACTIONS.length} 명소</span>
          {isOffline && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--terracotta)' }}>
                <WifiOff size={11} /> 오프라인 모드
              </span>
            </>
          )}
          {installer.isInstalled && (
            <>
              <span>·</span>
              <span style={{ color: 'var(--sage)' }}>
                <Smartphone size={11} /> 앱 모드
              </span>
            </>
          )}
        </div>
      </header>

      {showInstallCard && (
        <div className="dc-install-card">
          <button className="dc-install-dismiss" onClick={dismissInstall} aria-label="닫기">
            <X size={14} />
          </button>
          <div className="dc-install-icon">
            <Smartphone size={20} />
          </div>
          <div className="dc-install-body">
            <div className="dc-install-title">앱으로 설치하기</div>
            <div className="dc-install-sub">
              풀스크린·홈 화면 아이콘·오프라인 가이드
            </div>
            {iosGuideOpen && (
              <div className="dc-ios-guide">
                <strong>iPhone 설치:</strong><br />
                1. Safari 하단 공유 버튼 (□↑) 탭<br />
                2. "<strong>홈 화면에 추가</strong>" 선택<br />
                3. 우상단 "추가"
              </div>
            )}
          </div>
          <button className="dc-install-btn" onClick={handleInstall}>
            <Download size={14} />
            {installer.isIOS ? (iosGuideOpen ? '닫기' : '방법') : '설치'}
          </button>
        </div>
      )}

      <button className="dc-scan-cta" onClick={() => push({ name: 'scan' })}>
        <div className="dc-scan-cta-icon">
          <Camera size={20} />
        </div>
        <div className="dc-scan-cta-body">
          <div className="dc-scan-cta-title">작품 사진으로 찾기</div>
          <div className="dc-scan-cta-sub">카메라로 비추면 어떤 작품인지 자동 식별</div>
        </div>
        <ChevronRight size={16} className="dc-scan-cta-chev" />
      </button>

      <div className="dc-attractions">
        {ATTRACTIONS.map((a) => (
          <AttractionCard
            key={a.id}
            attraction={a}
            onClick={() => push({ name: 'attraction', attractionId: a.id })}
          />
        ))}
      </div>
    </div>
  );
}

function AttractionCard({ attraction, onClick }) {
  return (
    <button className="dc-attraction-card" onClick={onClick}>
      <div className="dc-card-emoji" style={{ color: attraction.coverHue }}>
        {attraction.emoji}
      </div>
      <div className="dc-card-body">
        <h2>{attraction.name}</h2>
        <div className="dc-card-local">{attraction.nameLocal}</div>
        <p className="dc-card-tagline">{attraction.overview.tagline}</p>
        <div className="dc-card-meta">
          <span><Headphones size={10} /> {attraction.points.length} 포인트</span>
          <span><Clock size={10} /> {attraction.overview.duration}</span>
        </div>
      </div>
      <ChevronRight size={18} className="dc-card-chev" style={{ color: attraction.coverHue }} />
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Attraction — overview + point list
// ─────────────────────────────────────────────────────────
function AttractionView({ attractionId, push, pop }) {
  const attraction = findAttraction(attractionId);
  if (!attraction) return <div>명소를 찾을 수 없습니다.</div>;

  const accent = attraction.coverHue;

  return (
    <div className="dc-subview">
      <button className="dc-back" onClick={pop}>
        <ArrowLeft size={14} /> 뒤로
      </button>

      <div className="dc-attraction-hero" style={{ '--accent': accent }}>
        <div className="dc-emoji-big">{attraction.emoji}</div>
        <h1 className="dc-attraction-title">{attraction.name}</h1>
        <div className="dc-attraction-local">{attraction.nameLocal}</div>
        <div className="dc-attraction-tagline">{attraction.overview.tagline}</div>
      </div>

      <section className="dc-section">
        <h3 className="dc-section-h">개요</h3>
        <p className="dc-prose">{attraction.overview.summary}</p>
      </section>

      <section className="dc-section">
        <h3 className="dc-section-h">알아두면 좋아요</h3>
        <ul className="dc-must-know">
          {attraction.overview.mustKnow.map((item, i) => (
            <li key={i}><Info size={11} /> {item}</li>
          ))}
        </ul>
      </section>

      <section className="dc-section">
        <h3 className="dc-section-h">
          <Headphones size={13} /> 오디오 가이드 ({attraction.points.length}점)
        </h3>
        <div className="dc-points">
          {attraction.points.map((p, idx) => (
            <PointCard
              key={p.id}
              point={p}
              idx={idx + 1}
              accent={accent}
              onClick={() => push({ name: 'point', attractionId, pointId: p.id })}
            />
          ))}
        </div>
      </section>

      <div className="dc-coming-soon">
        <Sparkles size={11} /> 더 많은 포인트가 곧 추가됩니다 (v0.2~)
      </div>
    </div>
  );
}

function PointCard({ point, idx, accent, onClick }) {
  return (
    <button className="dc-point-card" onClick={onClick} style={{ '--accent': accent }}>
      <div className="dc-point-thumb">
        <img src={point.image} alt={point.name} loading="lazy" />
        <div className="dc-point-num">{String(idx).padStart(2, '0')}</div>
      </div>
      <div className="dc-point-body">
        <h4>{point.name}</h4>
        <div className="dc-point-artist">{point.artist} · {point.year}</div>
        <div className="dc-point-location"><MapPin size={9} /> {point.location}</div>
        <div className="dc-point-rating">
          {Array.from({ length: 5 }).map((_, i) => (
            <Star key={i} size={9} fill={i < point.rating ? 'currentColor' : 'none'} />
          ))}
        </div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Point detail — image, audio player, viewing points, fun fact
// ─────────────────────────────────────────────────────────
function PointView({ attractionId, pointId, pop, audio }) {
  const point = findPoint(attractionId, pointId);
  const attraction = findAttraction(attractionId);
  const isPlaying = audio.playing === pointId;
  const audioUrl = `/audio/${attractionId}/${pointId}.mp3`;

  if (!point) return <div>포인트를 찾을 수 없습니다.</div>;

  function fmtTime(s) {
    if (!s || !isFinite(s)) return '--:--';
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  }

  return (
    <div className="dc-subview" style={{ '--accent': attraction.coverHue }}>
      <button className="dc-back" onClick={pop}>
        <ArrowLeft size={14} /> {attraction.name}
      </button>

      <div className="dc-point-hero">
        <img src={point.image} alt={point.name} />
        <div className="dc-point-credit">📷 {point.imageCredit}</div>
      </div>

      <div className="dc-point-header">
        <h1>{point.name}</h1>
        <div className="dc-point-italian">{point.nameLocal}</div>
        <div className="dc-point-by">
          <span>{point.artist}</span>
          <span>·</span>
          <span>{point.year}</span>
          <span>·</span>
          <span>{point.type}</span>
        </div>
        <div className="dc-point-loc-detail"><MapPin size={11} /> {point.location}</div>
      </div>

      <div className={`dc-audio-player ${isPlaying ? 'on' : ''}`}>
        <button
          className="dc-audio-play"
          onClick={() => audio.toggle(pointId, audioUrl)}
          aria-label={isPlaying ? '일시정지' : '재생'}
        >
          {isPlaying ? <Pause size={22} /> : <Play size={22} />}
        </button>
        <div className="dc-audio-info">
          <div className="dc-audio-label">
            <Headphones size={11} /> 도슨트 오디오
            <span className="dc-audio-voice">SunHi · 한국어</span>
          </div>
          <div
            className="dc-audio-progress"
            onClick={(e) => {
              if (!isPlaying || !audio.duration) return;
              const rect = e.currentTarget.getBoundingClientRect();
              const x = e.clientX - rect.left;
              audio.seek((x / rect.width) * audio.duration);
            }}
          >
            <div className="dc-audio-progress-fill" style={{ width: `${audio.progress * 100}%` }} />
          </div>
          <div className="dc-audio-time">
            <span>{fmtTime(audio.duration * audio.progress)}</span>
            <span>{fmtTime(audio.duration)}</span>
          </div>
        </div>
      </div>

      <div className="dc-short-desc">
        <Quote size={14} /> {point.shortDesc}
      </div>

      <section className="dc-section">
        <h3 className="dc-section-h"><BookOpen size={13} /> 도슨트</h3>
        <div className="dc-prose dc-long-desc">{point.longDesc}</div>
      </section>

      <section className="dc-section">
        <h3 className="dc-section-h"><Eye size={13} /> 봐야 할 포인트</h3>
        <div className="dc-viewing">
          {point.viewingPoints.map((vp, i) => (
            <div key={i} className="dc-viewing-item">
              <div className="dc-viewing-num">{i + 1}</div>
              <div>
                <div className="dc-viewing-title">{vp.title}</div>
                <div className="dc-viewing-detail">{vp.detail}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {point.funFact && (
        <section className="dc-section dc-funfact">
          <h3 className="dc-section-h"><Sparkles size={13} /> 알아두면 재밌어요</h3>
          <p className="dc-prose">{point.funFact}</p>
        </section>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// ScanView — 카메라로 작품 식별 (Claude Vision)
// ─────────────────────────────────────────────────────────
function ScanView({ pop, push }) {
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const cameraRef = useRef(null);
  const galleryRef = useRef(null);

  async function handleFile(file) {
    if (!file) return;
    setAnalyzing(true);
    setError(null);
    setResult(null);
    try {
      const compressed = await compressImage(file, 1280);
      setImagePreview(compressed.dataUrl);

      // 카탈로그 구축 — Claude가 식별할 후보 리스트
      const catalogStr = ATTRACTIONS.flatMap((a) =>
        a.points.map(
          (p) =>
            `- ${a.id}/${p.id}: ${p.artist} 〈${p.name}〉 (${p.type}, ${p.year}, ${p.location})`
        )
      ).join('\n');

      const resp = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          max_tokens: 600,
          messages: [
            {
              role: 'user',
              content: [
                {
                  type: 'image',
                  source: {
                    type: 'base64',
                    media_type: compressed.mimeType,
                    data: compressed.base64,
                  },
                },
                {
                  type: 'text',
                  text: `이 사진은 로마의 미술관·역사 명소에서 찍은 작품 또는 건축의 일부입니다.

아래 카탈로그 중 어느 것에 가장 가깝게 일치하는지 식별해주세요:

${catalogStr}

JSON만 출력 (코드블록·다른 텍스트 금지):
{
  "matched": "attractionId/pointId" 형식 (예: "borghese/apollo-daphne"), 또는 어느 것도 아닐 경우 null,
  "confidence": "high" | "medium" | "low",
  "reasoning": "왜 그렇게 판단했는지 한국어로 1-2문장",
  "alternates": ["다른 후보 attractionId/pointId 형식", ...]  // confidence가 medium 이하일 때 최대 2개
}`,
                },
              ],
            },
          ],
        }),
      });

      if (!resp.ok) {
        const errData = await resp.json().catch(() => ({}));
        throw new Error(errData.error || `API ${resp.status}`);
      }

      const data = await resp.json();
      const text = data.content?.[0]?.text || '';
      const cleaned = text.replace(/```json|```/g, '').trim();
      const parsed = JSON.parse(cleaned);
      setResult(parsed);
    } catch (e) {
      setError(e.message);
    } finally {
      setAnalyzing(false);
    }
  }

  function navigateToMatch(matchKey) {
    if (!matchKey || !matchKey.includes('/')) return;
    const [attractionId, pointId] = matchKey.split('/');
    if (findPoint(attractionId, pointId)) {
      push({ name: 'point', attractionId, pointId });
    }
  }

  function reset() {
    setResult(null);
    setError(null);
    setImagePreview(null);
  }

  // Lookup matched point details for display
  const matchedPoint = result?.matched
    ? (() => {
        const [aId, pId] = result.matched.split('/');
        const a = findAttraction(aId);
        const p = findPoint(aId, pId);
        return a && p ? { attraction: a, point: p, attractionId: aId, pointId: pId } : null;
      })()
    : null;

  return (
    <div className="dc-subview dc-scan-view">
      <button className="dc-back" onClick={pop}>
        <ArrowLeft size={14} /> 뒤로
      </button>

      <h2 className="dc-h1">작품 사진으로 찾기</h2>
      <div className="dc-h1-sub">📷 사진 한 장이면 어떤 작품인지 알려드려요</div>

      {!imagePreview && !analyzing && (
        <div className="dc-scan-pick">
          <button className="dc-primary-btn" onClick={() => cameraRef.current?.click()}>
            <Camera size={18} /> 카메라로 찍기
          </button>
          <button className="dc-secondary-btn" onClick={() => galleryRef.current?.click()}>
            <ImageIcon size={16} /> 갤러리에서 선택
          </button>
          <div className="dc-scan-hint">
            <Info size={11} /> 17점 카탈로그 중에서 인식합니다. 보르게세·바티칸·콜로세움·판테온·트레비.
          </div>
        </div>
      )}

      <input
        ref={cameraRef}
        type="file"
        accept="image/*"
        capture="environment"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleFile(f);
            e.target.value = '';
          }
        }}
      />
      <input
        ref={galleryRef}
        type="file"
        accept="image/*"
        style={{ display: 'none' }}
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) {
            handleFile(f);
            e.target.value = '';
          }
        }}
      />

      {imagePreview && (
        <div className="dc-scan-preview">
          <img src={imagePreview} alt="찍은 사진" />
        </div>
      )}

      {analyzing && (
        <div className="dc-scan-loading">
          <Loader2 size={26} className="dc-spin" />
          <div>작품을 분석하고 있어요…</div>
          <div className="dc-scan-loading-sub">Claude Vision으로 17점 카탈로그와 비교 중</div>
        </div>
      )}

      {error && (
        <div className="dc-error">
          <AlertCircle size={16} />
          <div>분석 오류: {error}</div>
        </div>
      )}

      {result && !analyzing && (
        <>
          {matchedPoint ? (
            <div className="dc-scan-match">
              <div className="dc-scan-match-badge" data-confidence={result.confidence}>
                {result.confidence === 'high'
                  ? '🎯 확실'
                  : result.confidence === 'medium'
                  ? '👍 일치 가능'
                  : '🤔 비슷'}
              </div>
              <button
                className="dc-scan-match-card"
                onClick={() => navigateToMatch(result.matched)}
              >
                <img src={matchedPoint.point.image} alt={matchedPoint.point.name} />
                <div className="dc-scan-match-body">
                  <div className="dc-scan-match-attraction">
                    {matchedPoint.attraction.emoji} {matchedPoint.attraction.name}
                  </div>
                  <h3>{matchedPoint.point.name}</h3>
                  <div className="dc-scan-match-artist">
                    {matchedPoint.point.artist} · {matchedPoint.point.year}
                  </div>
                  <div className="dc-scan-match-cta">
                    <Headphones size={11} /> 도슨트 듣기 →
                  </div>
                </div>
              </button>
              {result.reasoning && (
                <div className="dc-scan-reasoning">
                  <Sparkles size={11} /> {result.reasoning}
                </div>
              )}
              {result.alternates && result.alternates.length > 0 && (
                <div className="dc-scan-alternates">
                  <div className="dc-scan-alternates-label">다른 후보:</div>
                  {result.alternates.map((alt) => {
                    const [aId, pId] = alt.split('/');
                    const p = findPoint(aId, pId);
                    if (!p) return null;
                    return (
                      <button
                        key={alt}
                        className="dc-scan-alternate-item"
                        onClick={() => navigateToMatch(alt)}
                      >
                        {p.name} <span>· {p.artist}</span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>
          ) : (
            <div className="dc-scan-no-match">
              <Search size={20} />
              <div className="dc-scan-no-match-title">카탈로그에 없는 작품 같아요</div>
              <div className="dc-scan-no-match-sub">{result.reasoning || '다른 사진으로 다시 시도해보세요.'}</div>
            </div>
          )}

          <button className="dc-secondary-btn" onClick={reset} style={{ marginTop: 16 }}>
            <RefreshCw size={14} /> 다른 사진 찾기
          </button>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Footer
// ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="dc-footer">
      <div>도슨트 · Docent v0.4</div>
      <div>이미지: Wikimedia Commons (Public Domain)</div>
      <div>오디오: Microsoft Edge TTS · ko-KR-SunHi Neural</div>
      <div>오프라인 지원 · 카메라 인식 (Claude Vision)</div>
    </footer>
  );
}
