import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight, ArrowLeft, Play, Pause, Volume2, VolumeX,
  Clock, Info, MapPin, Star, Headphones, BookOpen, Eye, Sparkles, Quote,
  Camera, Image as ImageIcon, Loader2, AlertCircle, RefreshCw, WifiOff, Search,
  Download, Smartphone, X,
  MessageCircle, Send, Map,
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
  const [view, setView] = useState('list'); // 'list' | 'floorplan' | 'routes'
  if (!attraction) return <div>명소를 찾을 수 없습니다.</div>;

  const accent = attraction.coverHue;
  const hasFloorPlan = attractionId === 'borghese' || attractionId === 'vatican';
  const hasRoutes = !!attraction.routes && attraction.routes.length > 0;

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
        <div className="dc-section-h-row">
          <h3 className="dc-section-h">
            <Headphones size={13} /> 오디오 가이드 ({attraction.points.length}점)
          </h3>
          {(hasFloorPlan || hasRoutes) && (
            <div className="dc-view-toggle">
              <button
                className={`dc-view-toggle-btn ${view === 'list' ? 'active' : ''}`}
                onClick={() => setView('list')}
              >
                리스트
              </button>
              {hasRoutes && (
                <button
                  className={`dc-view-toggle-btn ${view === 'routes' ? 'active' : ''}`}
                  onClick={() => setView('routes')}
                >
                  <Clock size={11} /> 동선
                </button>
              )}
              {hasFloorPlan && (
                <button
                  className={`dc-view-toggle-btn ${view === 'floorplan' ? 'active' : ''}`}
                  onClick={() => setView('floorplan')}
                >
                  <Map size={11} /> 평면도
                </button>
              )}
            </div>
          )}
        </div>

        {view === 'list' && (
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
        )}

        {view === 'floorplan' && attractionId === 'borghese' && (
          <BorgheseFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'vatican' && (
          <VaticanFlowPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'routes' && hasRoutes && (
          <RouteGuide
            routes={attraction.routes}
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}
      </section>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VaticanFlowPlan — 바티칸 박물관 동선 (수직 흐름)
// ─────────────────────────────────────────────────────────
function VaticanFlowPlan({ points, accent, onPointClick }) {
  // Vatican has a defined visit sequence — show as vertical flow with arrows
  const ZONES = [
    {
      id: 'pio-clementine',
      name: 'Pio-Clementine 박물관',
      sub: '벨베데레 정원 — 고대 그리스·로마 조각',
      pointIds: ['belvedere-torso', 'belvedere-apollo', 'laocoon'],
    },
    {
      id: 'maps-gallery',
      name: 'Galleria delle Carte Geografiche',
      sub: '120m 황금 천장 복도 — 시스티나 직전 마지막 충격',
      pointIds: ['gallery-maps'],
    },
    {
      id: 'raphael-rooms',
      name: 'Stanze di Raffaello',
      sub: '라파엘로의 4개 방 — 르네상스 인본주의의 정수',
      pointIds: ['school-of-athens', 'disputation-sacrament'],
    },
    {
      id: 'sistine',
      name: 'Cappella Sistina',
      sub: '미켈란젤로의 천장과 〈최후의 심판〉',
      pointIds: ['sistine-ceiling', 'last-judgment'],
    },
    {
      id: 'st-peters',
      name: 'Basilica di San Pietro',
      sub: '바티칸의 영적 중심 — 시스티나 출구로 직결',
      pointIds: ['pieta', 'baldacchino'],
    },
  ];

  const pointMap = {};
  points.forEach((p, i) => { pointMap[p.id] = { ...p, idx: i + 1 }; });

  return (
    <div className="dc-flowplan" style={{ '--accent': accent }}>
      <div className="dc-flowplan-header">
        <div className="dc-flowplan-title">바티칸 박물관 → 베드로 대성당</div>
        <div className="dc-flowplan-sub">관람 순서를 따라 5개 구역으로 흐릅니다. 출구는 시스티나에서 베드로 대성당으로.</div>
      </div>

      <div className="dc-flowplan-zones">
        {ZONES.map((zone, zoneIdx) => (
          <div className="dc-flowplan-zone-wrap" key={zone.id}>
            <div className="dc-flowplan-zone">
              <div className="dc-flowplan-zone-num">{zoneIdx + 1}</div>
              <div className="dc-flowplan-zone-body">
                <div className="dc-flowplan-zone-name">{zone.name}</div>
                <div className="dc-flowplan-zone-sub">{zone.sub}</div>
                <div className="dc-flowplan-zone-points">
                  {zone.pointIds.map((pid) => {
                    const p = pointMap[pid];
                    if (!p) return null;
                    return (
                      <button
                        key={pid}
                        className="dc-flowplan-point"
                        onClick={() => onPointClick(pid)}
                      >
                        <span className="dc-flowplan-point-num">{String(p.idx).padStart(2, '0')}</span>
                        <span className="dc-flowplan-point-name">{p.name}</span>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
            {zoneIdx < ZONES.length - 1 && (
              <div className="dc-flowplan-arrow">↓</div>
            )}
          </div>
        ))}
      </div>

      <div className="dc-floorplan-note">
        <Info size={10} /> 실제 박물관은 구역 사이에 추가 갤러리·복도가 있음. 위는 오디오 가이드 작품 기준 단순화.
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// RouteGuide — 동선 코스 추천 (시간별 / 테마별)
// ─────────────────────────────────────────────────────────
function RouteGuide({ routes, points, accent, onPointClick }) {
  const [selectedRouteId, setSelectedRouteId] = useState(routes[0].id);
  const route = routes.find((r) => r.id === selectedRouteId);

  const pointMap = {};
  points.forEach((p, i) => { pointMap[p.id] = { ...p, idx: i + 1 }; });

  if (!route) return null;

  return (
    <div className="dc-routes" style={{ '--accent': accent }}>
      <div className="dc-route-selector">
        {routes.map((r) => (
          <button
            key={r.id}
            className={`dc-route-tab ${r.id === selectedRouteId ? 'active' : ''}`}
            onClick={() => setSelectedRouteId(r.id)}
          >
            <div className="dc-route-tab-name">{r.name}</div>
            <div className="dc-route-tab-time">
              <Clock size={9} /> {r.duration_min}분
            </div>
          </button>
        ))}
      </div>

      <div className="dc-route-detail">
        <div className="dc-route-header">
          <div className="dc-route-name">{route.name}</div>
          <div className="dc-route-sub">{route.sub}</div>
          <div className="dc-route-meta">
            <span><Clock size={11} /> 약 {route.duration_min}분</span>
            <span>·</span>
            <span><Headphones size={11} /> {route.pointIds.length}점</span>
            <span>·</span>
            <span>작품당 평균 {Math.round(route.duration_min / route.pointIds.length)}분</span>
          </div>
          {route.note && (
            <div className="dc-route-note">
              <Info size={11} /> {route.note}
            </div>
          )}
        </div>

        <ol className="dc-route-steps">
          {route.pointIds.map((pid, i) => {
            const p = pointMap[pid];
            if (!p) return null;
            return (
              <li className="dc-route-step" key={pid}>
                <div className="dc-route-step-num">{i + 1}</div>
                <button
                  className="dc-route-step-card"
                  onClick={() => onPointClick(pid)}
                >
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div className="dc-route-step-body">
                    <div className="dc-route-step-name">{p.name}</div>
                    <div className="dc-route-step-artist">{p.artist}</div>
                    <div className="dc-route-step-loc">
                      <MapPin size={9} /> {p.location}
                    </div>
                  </div>
                  <ChevronRight size={14} className="dc-route-step-chev" />
                </button>
              </li>
            );
          })}
        </ol>

        <div className="dc-floorplan-note">
          <Info size={10} /> 시간은 평균치 기준 추정 — 작품에 따라 더 머무를 가치가 있을 수 있습니다
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BorgheseFloorPlan — 방별 작품 위치 평면도
// ─────────────────────────────────────────────────────────
function BorgheseFloorPlan({ points, accent, onPointClick }) {
  const [floor, setFloor] = useState('ground');

  // Map each point ID to its room and floor (approximated from museum layout)
  const ROOMS = {
    ground: {
      label: '1층 — 조각 (Pian Terreno)',
      sub: '베르니니, 카노바, 카라바조 등 — 보르게세 컬렉션의 출발점',
      // Rooms in approximate visit order, with their points
      rows: [
        // First row: rooms IV, III, II (going right)
        [
          { name: 'Sala IV', sub: '엠퍼러의 방', pointIds: ['proserpina'] },
          { name: 'Sala III', sub: '아폴로와 다프네의 방', pointIds: ['apollo-daphne', 'aeneas-anchises'] },
          { name: 'Sala II', sub: '검투사의 방', pointIds: ['david'] },
        ],
        // Center: entry hall (Sala I)
        [
          { name: 'Sala I', sub: '입구·카노바의 방', pointIds: ['pauline-bonaparte'], wide: true },
        ],
        // Bottom row: VI, VII, VIII
        [
          { name: 'Sala VI', sub: '아이네아스의 방', pointIds: [] },
          { name: 'Sala VII', sub: '이집트의 방', pointIds: ['truth-unveiled', 'caravaggio-jerome'] },
          { name: 'Sala VIII', sub: '실레노스의 방 — 카라바조', pointIds: ['david-goliath', 'madonna-palafrenieri', 'sick-bacchus'] },
        ],
      ],
    },
    first: {
      label: '2층 — 회화 (Pinacoteca)',
      sub: '라파엘로, 티치아노, 코레조 — 16세기 이탈리아 회화의 집결',
      rows: [
        [
          { name: 'Sala IX', sub: '라파엘로의 방', pointIds: ['raphael-entombment'] },
          { name: 'Sala X', sub: '매너리즘의 방', pointIds: ['correggio-danae'] },
          { name: 'Sala XX', sub: '베네치아 화파', pointIds: ['sacred-profane-love'] },
        ],
        [
          { name: 'Sala XIV', sub: '오로라의 방', pointIds: ['scipione-bust'], wide: true },
        ],
      ],
    },
  };

  // Build point lookup with index numbers (from original list)
  const pointMap = {};
  points.forEach((p, i) => { pointMap[p.id] = { ...p, idx: i + 1 }; });

  const current = ROOMS[floor];

  return (
    <div className="dc-floorplan" style={{ '--accent': accent }}>
      <div className="dc-floor-toggle">
        <button
          className={`dc-floor-btn ${floor === 'ground' ? 'active' : ''}`}
          onClick={() => setFloor('ground')}
        >
          1층 · 조각
        </button>
        <button
          className={`dc-floor-btn ${floor === 'first' ? 'active' : ''}`}
          onClick={() => setFloor('first')}
        >
          2층 · 회화
        </button>
      </div>

      <div className="dc-floor-label">
        <div className="dc-floor-label-title">{current.label}</div>
        <div className="dc-floor-label-sub">{current.sub}</div>
      </div>

      <div className="dc-floorplan-grid">
        {current.rows.map((row, rowIdx) => (
          <div className={`dc-floorplan-row dc-floorplan-row-${row.length}`} key={rowIdx}>
            {row.map((room) => (
              <div
                className={`dc-floorplan-room ${room.wide ? 'wide' : ''} ${room.pointIds.length === 0 ? 'empty' : ''}`}
                key={room.name}
              >
                <div className="dc-floorplan-room-name">{room.name}</div>
                <div className="dc-floorplan-room-sub">{room.sub}</div>
                {room.pointIds.length === 0 ? (
                  <div className="dc-floorplan-empty">소개 작품 없음</div>
                ) : (
                  <div className="dc-floorplan-points">
                    {room.pointIds.map((pid) => {
                      const p = pointMap[pid];
                      if (!p) return null;
                      return (
                        <button
                          key={pid}
                          className="dc-floorplan-point"
                          onClick={() => onPointClick(pid)}
                        >
                          <span className="dc-floorplan-point-num">{String(p.idx).padStart(2, '0')}</span>
                          <span className="dc-floorplan-point-name">{p.name}</span>
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
      </div>

      <div className="dc-floorplan-note">
        <Info size={10} /> 방 배치는 단순화된 도식. 실제 동선은 입장 시 받는 지도를 참고하세요.
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

      <QASection point={point} attraction={attraction} />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// QASection — Claude API로 작품에 대해 질문하기
// ─────────────────────────────────────────────────────────
function QASection({ point, attraction }) {
  const storageKey = `qa-${attraction.id}-${point.id}`;
  const [isOpen, setIsOpen] = useState(false);
  const [conversation, setConversation] = useState(() => {
    try {
      const stored = sessionStorage.getItem(storageKey);
      return stored ? JSON.parse(stored) : [];
    } catch { return []; }
  });
  const [question, setQuestion] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const scrollRef = useRef(null);

  // Persist conversation in session
  useEffect(() => {
    try {
      sessionStorage.setItem(storageKey, JSON.stringify(conversation));
    } catch { /* ignore quota */ }
  }, [conversation, storageKey]);

  // Auto-scroll to bottom on new message
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [conversation, loading]);

  const suggestedQuestions = [
    '이 작품의 가장 중요한 디테일은?',
    '비슷한 시기 다른 화가는 어떻게 그렸나요?',
    '제 자녀에게 어떻게 설명하면 좋을까요?',
    '근처에 함께 봐야 할 작품은?',
  ];

  async function ask(text) {
    const q = (text || question).trim();
    if (!q || loading) return;

    setQuestion('');
    setError(null);
    setLoading(true);

    const newConv = [...conversation, { role: 'user', content: q }];
    setConversation(newConv);

    const systemPrompt = `당신은 로마 미술에 정통한 한국어 도슨트입니다. 사용자가 ${attraction.name}(${attraction.nameLocal})의 작품 〈${point.name}〉에 대해 질문하고 있습니다.

작품 정보:
- 작가: ${point.artist}
- 연도: ${point.year}
- 위치: ${point.location}
- 종류: ${point.type}
- 간단 설명: ${point.shortDesc}

상세 정보:
${point.longDesc}

답변 가이드:
1. 한국어로 친근하지만 정확하게 답변
2. 위 정보 + 미술사 일반 지식 활용
3. 모르는 것은 솔직히 모른다고 명시
4. 답변은 2-4 문단 정도로 간결하게
5. 너무 학술적이지 않고 일반 관람객이 이해할 수 있게`;

    try {
      const r = await fetch('/api/claude', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          system: systemPrompt,
          max_tokens: 800,
          messages: newConv.map((m) => ({ role: m.role, content: m.content })),
        }),
      });
      if (!r.ok) {
        const errData = await r.json().catch(() => ({}));
        throw new Error(errData.error || `API ${r.status}`);
      }
      const data = await r.json();
      const answer = data.content?.[0]?.text || '답변이 비어있습니다.';
      setConversation([...newConv, { role: 'assistant', content: answer }]);
    } catch (e) {
      setError(e.message);
    } finally {
      setLoading(false);
    }
  }

  function clearConversation() {
    if (!confirm('이 작품의 대화 기록을 모두 지우시겠어요?')) return;
    setConversation([]);
    setError(null);
    try { sessionStorage.removeItem(storageKey); } catch {}
  }

  return (
    <section className="dc-section dc-qa">
      {!isOpen ? (
        <button className="dc-qa-toggle" onClick={() => setIsOpen(true)}>
          <MessageCircle size={16} />
          <div className="dc-qa-toggle-body">
            <div className="dc-qa-toggle-title">작품에 대해 질문하기</div>
            <div className="dc-qa-toggle-sub">
              {conversation.length > 0
                ? `이전 대화 ${Math.floor(conversation.length / 2)}건 있음`
                : 'Claude에게 무엇이든 물어보세요'}
            </div>
          </div>
          <ChevronRight size={14} />
        </button>
      ) : (
        <div className="dc-qa-panel">
          <div className="dc-qa-header">
            <h3 className="dc-section-h">
              <MessageCircle size={13} /> 작품에 대해 질문하기
            </h3>
            <div className="dc-qa-header-actions">
              {conversation.length > 0 && (
                <button className="dc-qa-clear" onClick={clearConversation} title="대화 지우기">
                  <X size={12} /> 지우기
                </button>
              )}
              <button className="dc-qa-close" onClick={() => setIsOpen(false)}>
                접기
              </button>
            </div>
          </div>

          <div className="dc-qa-conversation" ref={scrollRef}>
            {conversation.length === 0 && !loading && (
              <div className="dc-qa-suggestions">
                <div className="dc-qa-suggestions-label">예시 질문:</div>
                {suggestedQuestions.map((sq) => (
                  <button
                    key={sq}
                    className="dc-qa-suggestion"
                    onClick={() => ask(sq)}
                  >
                    {sq}
                  </button>
                ))}
              </div>
            )}

            {conversation.map((msg, i) => (
              <div
                key={i}
                className={`dc-qa-msg ${msg.role === 'user' ? 'dc-qa-msg-user' : 'dc-qa-msg-claude'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="dc-qa-msg-label">Claude</div>
                )}
                <div className="dc-qa-msg-body">{msg.content}</div>
              </div>
            ))}

            {loading && (
              <div className="dc-qa-msg dc-qa-msg-claude">
                <div className="dc-qa-msg-label">Claude</div>
                <div className="dc-qa-msg-body dc-qa-loading">
                  <Loader2 size={14} className="dc-spin" /> 답변 작성 중...
                </div>
              </div>
            )}

            {error && (
              <div className="dc-error" style={{ margin: '8px 0' }}>
                <AlertCircle size={14} /> 오류: {error}
              </div>
            )}
          </div>

          <form
            className="dc-qa-input-row"
            onSubmit={(e) => {
              e.preventDefault();
              ask();
            }}
          >
            <textarea
              className="dc-qa-input"
              value={question}
              onChange={(e) => setQuestion(e.target.value)}
              placeholder="이 작품에 대해 궁금한 것을 적어주세요..."
              rows={2}
              disabled={loading}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  ask();
                }
              }}
            />
            <button
              type="submit"
              className="dc-qa-send"
              disabled={!question.trim() || loading}
              aria-label="질문 보내기"
            >
              <Send size={16} />
            </button>
          </form>
        </div>
      )}
    </section>
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
