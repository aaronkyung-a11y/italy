import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight, ArrowLeft, Play, Pause, Volume2, VolumeX,
  Clock, Info, MapPin, Star, Headphones, BookOpen, Eye, Sparkles, Quote,
  Camera, Image as ImageIcon, Loader2, AlertCircle, RefreshCw, WifiOff, Search,
  Download, Smartphone, X,
  MessageCircle, Send, Map,
  Heart, BookmarkCheck, Check, Trash2,
} from 'lucide-react';
import { CITIES, ATTRACTIONS, findAttraction, findPoint, TOTAL_POINTS } from './data/attractions.js';

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
    // 뷰 전환 시 스크롤 최상단으로 — 새 화면이 중간부터 보이는 문제 방지
    window.scrollTo({ top: 0, behavior: 'instant' });
  }, []);
  const pop = useCallback(() => {
    if (stack.length > 1) window.history.back();
  }, [stack.length]);
  const reset = useCallback(() => setStack([initial]), []);

  return { current: stack[stack.length - 1], push, pop, reset, depth: stack.length };
}

// ─────────────────────────────────────────────────────────
// useFavorites — localStorage 기반 즐겨찾기 & 본 작품 체크리스트
// ─────────────────────────────────────────────────────────
function useFavorites() {
  const WANT_KEY = 'docent-favorites-want';   // 가고 싶은 작품
  const SEEN_KEY = 'docent-favorites-seen';   // 본 작품

  const [wantSet, setWantSet] = useState(() => {
    try {
      const stored = localStorage.getItem(WANT_KEY);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });
  const [seenSet, setSeenSet] = useState(() => {
    try {
      const stored = localStorage.getItem(SEEN_KEY);
      return new Set(stored ? JSON.parse(stored) : []);
    } catch { return new Set(); }
  });

  function persistWant(s) {
    try { localStorage.setItem(WANT_KEY, JSON.stringify([...s])); } catch {}
  }
  function persistSeen(s) {
    try { localStorage.setItem(SEEN_KEY, JSON.stringify([...s])); } catch {}
  }

  function toggleWant(pointId) {
    setWantSet((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) next.delete(pointId);
      else next.add(pointId);
      persistWant(next);
      return next;
    });
  }
  function toggleSeen(pointId) {
    setSeenSet((prev) => {
      const next = new Set(prev);
      if (next.has(pointId)) next.delete(pointId);
      else next.add(pointId);
      persistSeen(next);
      return next;
    });
  }
  function clearAll() {
    setWantSet(new Set());
    setSeenSet(new Set());
    persistWant(new Set());
    persistSeen(new Set());
  }
  return { wantSet, seenSet, toggleWant, toggleSeen, clearAll };
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
  const favorites = useFavorites();

  // Stop audio on view change
  useEffect(() => { audio.stop(); }, [view.current.name]);

  return (
    <div className="dc-app">
      {view.current.name === 'home' && <HomeView push={view.push} favorites={favorites} />}
      {view.current.name === 'city' && (
        <CityView cityId={view.current.cityId} push={view.push} pop={view.pop} />
      )}
      {view.current.name === 'attraction' && (
        <AttractionView
          attractionId={view.current.attractionId}
          push={view.push}
          pop={view.pop}
          favorites={favorites}
        />
      )}
      {view.current.name === 'point' && (
        <PointView
          attractionId={view.current.attractionId}
          pointId={view.current.pointId}
          pop={view.pop}
          audio={audio}
          favorites={favorites}
        />
      )}
      {view.current.name === 'scan' && (
        <ScanView pop={view.pop} push={view.push} />
      )}
      {view.current.name === 'favorites' && (
        <FavoritesView pop={view.pop} push={view.push} favorites={favorites} />
      )}
      {view.current.name === 'search' && (
        <SearchView pop={view.pop} push={view.push} />
      )}

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Home — list of 5 attractions
// ─────────────────────────────────────────────────────────
function HomeView({ push, favorites }) {
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
        <p className="dc-hero-sub">이탈리아 핵심 도시 · 한국어 오디오 가이드</p>
        <div className="dc-hero-stats">
          <span><Headphones size={11} /> {TOTAL_POINTS} 포인트</span>
          <span>·</span>
          <span>{ATTRACTIONS.length} 명소 · {CITIES.filter(c => !c.comingSoon).length} 도시</span>
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

      <button className="dc-search-bar" onClick={() => push({ name: 'search' })}>
        <Search size={16} className="dc-search-bar-icon" />
        <span className="dc-search-bar-placeholder">작품·작가 이름으로 검색</span>
      </button>

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

      {favorites && (favorites.wantSet.size > 0 || favorites.seenSet.size > 0) && (
        <button
          className="dc-favorites-cta"
          onClick={() => push({ name: 'favorites' })}
        >
          <div className="dc-favorites-cta-icon">
            <Heart size={18} fill="currentColor" />
          </div>
          <div className="dc-favorites-cta-body">
            <div className="dc-favorites-cta-title">내가 찜한 작품</div>
            <div className="dc-favorites-cta-sub">
              가고 싶은 {favorites.wantSet.size}점 · 본 작품 {favorites.seenSet.size}점
            </div>
          </div>
          <ChevronRight size={16} className="dc-scan-cta-chev" />
        </button>
      )}

      <div className="dc-cities">
        {CITIES.map((c) => {
          const attrs = ATTRACTIONS.filter((a) => a.city === c.id);
          const pts = attrs.reduce((s, a) => s + a.points.length, 0);
          return (
            <CityCard
              key={c.id}
              city={c}
              attractionCount={attrs.length}
              pointCount={pts}
              onClick={() => !c.comingSoon && push({ name: 'city', cityId: c.id })}
            />
          );
        })}
      </div>
    </div>
  );
}

function CityCard({ city, attractionCount, pointCount, onClick }) {
  return (
    <button
      className={`dc-city-card ${city.comingSoon ? 'dc-city-card-disabled' : ''}`}
      onClick={onClick}
      style={{ '--accent': city.coverHue }}
    >
      <div className="dc-city-card-img">
        <img src={city.image} alt={city.name} loading="lazy" />
        <div className="dc-city-card-overlay" />
        <div className="dc-city-card-emoji">{city.emoji}</div>
      </div>
      <div className="dc-city-card-body">
        <div className="dc-city-card-head">
          <h2>{city.name}</h2>
          <span className="dc-city-card-local">{city.nameLocal}</span>
        </div>
        <p className="dc-city-card-tagline">{city.tagline}</p>
        {city.comingSoon ? (
          <div className="dc-city-card-meta dc-city-card-coming">
            <Clock size={11} /> 컨텐츠 준비 중
          </div>
        ) : (
          <div className="dc-city-card-meta">
            <span>{attractionCount} 명소</span>
            <span>·</span>
            <span><Headphones size={11} /> {pointCount} 포인트</span>
          </div>
        )}
      </div>
      {!city.comingSoon && <ChevronRight size={18} className="dc-city-card-chev" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// CityView — list of attractions for a given city
// ─────────────────────────────────────────────────────────
function CityView({ cityId, push, pop }) {
  const city = CITIES.find((c) => c.id === cityId);
  const attractions = ATTRACTIONS.filter((a) => a.city === cityId);
  const totalPoints = attractions.reduce((s, a) => s + a.points.length, 0);

  if (!city) return <div className="dc-subview">도시를 찾을 수 없음</div>;

  return (
    <div className="dc-subview dc-city-view">
      <div className="dc-city-hero" style={{ '--accent': city.coverHue }}>
        <img
          className="dc-city-hero-img"
          src={city.image ? city.image.replace(/\/330px-/, '/500px-') : ''}
          alt={city.name}
          loading="eager"
        />
        <div className="dc-city-hero-overlay" />
        <button className="dc-city-hero-back" onClick={pop} aria-label="뒤로">
          <ArrowLeft size={18} />
        </button>
        <div className="dc-city-hero-emoji">{city.emoji}</div>
        <div className="dc-city-hero-body">
          <h1 className="dc-city-hero-title">{city.name}</h1>
          <div className="dc-city-hero-local">{city.nameLocal}</div>
          <p className="dc-city-hero-tagline">{city.tagline}</p>
          <div className="dc-city-hero-stats">
            <span>{attractions.length} 명소</span>
            <span>·</span>
            <span><Headphones size={11} /> {totalPoints} 포인트</span>
          </div>
        </div>
      </div>

      <div className="dc-attractions">
        {attractions.map((a) => (
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
function AttractionView({ attractionId, push, pop, favorites }) {
  const attraction = findAttraction(attractionId);
  const [view, setView] = useState('list'); // 'list' | 'floorplan' | 'routes'
  if (!attraction) return <div>명소를 찾을 수 없습니다.</div>;

  const accent = attraction.coverHue;
  const hasFloorPlan = attractionId === 'borghese' || attractionId === 'vatican' || attractionId === 'uffizi' || attractionId === 'foro';
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
                favorites={favorites}
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

        {view === 'floorplan' && attractionId === 'uffizi' && (
          <UffiziFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'foro' && (
          <ForoFloorPlan
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
// ─────────────────────────────────────────────────────────
// ForoFloorPlan — 야외 유적 지도 (포로 로마노 + 팔라티노 언덕)
// ─────────────────────────────────────────────────────────
function ForoFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'foro-overview': 'capitoline',
    'arco-severo': 'severo',
    'curia-iulia': 'curia',
    'tempio-vesta': 'vesta',
    'palatino-augustana': 'palatine',
    'arco-tito': 'tito',
  };

  const pointMap = {};
  points.forEach((p, i) => { pointMap[p.id] = { ...p, idx: i + 1 }; });

  const pointsByArea = {};
  points.forEach((p, i) => {
    const a = POINT_TO_AREA[p.id];
    if (a) {
      if (!pointsByArea[a]) pointsByArea[a] = [];
      pointsByArea[a].push({ ...p, idx: i + 1 });
    }
  });

  // viewBox 600x500 — single outdoor map view
  const AREAS = [
    // West entry — Capitoline Hill
    { id: 'capitoline', name: '캄피돌리오 언덕', label: '입구 · 전망대', x: 30, y: 90, w: 100, h: 100, isEntry: true },
    // North side of Forum (top)
    { id: 'severo', name: 'Arco di Settimio Severo', label: '셉티미우스 세베루스 개선문', x: 145, y: 95, w: 110, h: 50 },
    { id: 'curia', name: 'Curia Iulia', label: '원로원 (쿠리아)', x: 270, y: 60, w: 110, h: 50 },
    // Middle — Via Sacra path indicator
    { id: 'via_sacra', name: 'Via Sacra', label: '비아 사크라 (성스러운 길)', x: 145, y: 155, w: 405, h: 30, isCorridor: true },
    // South side of Forum
    { id: 'vesta', name: 'Tempio di Vesta', label: '베스타 신전 + 처녀들의 집', x: 305, y: 195, w: 145, h: 55 },
    // East — Arch of Titus → Colosseum
    { id: 'tito', name: 'Arco di Tito', label: '티투스 개선문', x: 465, y: 95, w: 105, h: 50 },
    // Palatine Hill (south, separated)
    { id: 'palatine', name: 'Palatino', label: '팔라티노 언덕 · 도무스 아우구스타나', x: 180, y: 320, w: 320, h: 130 },
  ];

  function getPointPosition(area, pointIdx, totalPoints) {
    if (totalPoints === 1) {
      return { cx: area.x + area.w / 2, cy: area.y + area.h / 2 + 6 };
    }
    const cols = Math.min(totalPoints, 3);
    const col = pointIdx % cols;
    const row = Math.floor(pointIdx / cols);
    return {
      cx: area.x + area.w * (0.25 + (col / cols) * 0.5),
      cy: area.y + area.h * (0.55 + row * 0.25),
    };
  }

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          포로 로마노 + 팔라티노 언덕 지도
        </div>
        <div className="dc-floor-label-sub">
          서쪽 캄피돌리오 입구 → Via Sacra 따라 → 동쪽 콜로세움 출구. 팔라티노는 남쪽
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="foro-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#foro-grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {/* Colosseum hint (east, off-map) */}
          <g transform="translate(570, 110)">
            <text textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">→</text>
            <text y="14" textAnchor="middle" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">콜로</text>
            <text y="25" textAnchor="middle" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">세움</text>
          </g>

          {/* Forum valley outline (visual context) */}
          <rect
            x="135" y="50" width="445" height="220"
            rx="14"
            fill="rgba(184,91,63,0.04)"
            stroke="var(--line)"
            strokeWidth="1"
            strokeDasharray="2 4"
            opacity="0.5"
          />
          <text
            x="357" y="290"
            textAnchor="middle"
            fontSize="8.5"
            fill="var(--text-faint)"
            fontFamily="Cormorant Garamond, serif"
            fontStyle="italic"
            opacity="0.7"
          >
            Foro Romano (포로 로마노 계곡)
          </text>

          {/* Areas */}
          {AREAS.map((area) => {
            const isEmpty = !pointsByArea[area.id] || pointsByArea[area.id].length === 0;
            return (
              <g key={area.id}>
                <rect
                  x={area.x}
                  y={area.y}
                  width={area.w}
                  height={area.h}
                  rx="6"
                  fill={
                    area.isEntry ? 'rgba(201,169,97,0.06)'
                    : area.isCorridor ? 'transparent'
                    : 'var(--bg)'
                  }
                  stroke={
                    area.isCorridor ? 'var(--line)'
                    : (isEmpty ? 'var(--line)' : 'var(--accent)')
                  }
                  strokeWidth={isEmpty ? 1 : 1.5}
                  strokeDasharray={area.isCorridor ? '4 3' : 'none'}
                  opacity={area.isCorridor ? 0.6 : 1}
                />
                <text
                  x={area.x + 8}
                  y={area.y + 14}
                  fontSize="9.5"
                  fill={area.isCorridor ? 'var(--text-soft)' : 'var(--accent)'}
                  fontFamily="Cormorant Garamond, serif"
                  fontStyle="italic"
                  fontWeight="500"
                >
                  {area.name}
                </text>
                {area.label && (
                  <text
                    x={area.x + 8}
                    y={area.y + 26}
                    fontSize="8.5"
                    fill="var(--text-soft)"
                    fontFamily="Noto Sans KR, sans-serif"
                  >
                    {area.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Point dots */}
          {AREAS.map((area) => {
            const areaPoints = pointsByArea[area.id] || [];
            return areaPoints.map((p, i) => {
              const pos = getPointPosition(area, i, areaPoints.length);
              const isHovered = hoveredPoint === p.id;
              return (
                <g
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPointClick(p.id)}
                  onMouseEnter={() => setHoveredPoint(p.id)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={isHovered ? 14 : 11}
                    fill="var(--accent)"
                    stroke="var(--bg)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.15s' }}
                  />
                  <text
                    x={pos.cx}
                    y={pos.cy + 4}
                    fontSize="10"
                    fill="var(--bg)"
                    fontFamily="DM Sans, sans-serif"
                    fontWeight="600"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {String(p.idx).padStart(2, '0')}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        야외 유적 — 번호 탭하면 작품 상세로 이동
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">유적 목록:</div>
        {AREAS.map((area) => {
          const areaPoints = pointsByArea[area.id] || [];
          if (areaPoints.length === 0) return null;
          return (
            <div className="dc-floor-room-list" key={area.id}>
              <div className="dc-floor-room-list-name">{area.name} · {area.label}</div>
              {areaPoints.map((p) => (
                <button
                  key={p.id}
                  className="dc-floor-room-list-point"
                  onClick={() => onPointClick(p.id)}
                >
                  <span className="dc-floor-room-list-num">{String(p.idx).padStart(2, '0')}</span>
                  <span className="dc-floor-room-list-name-text">{p.name}</span>
                  <span className="dc-floor-room-list-artist">{p.artist}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// UffiziFloorPlan — U자형 평면도 (위층 13-16c · 아래층 16-17c)
// ─────────────────────────────────────────────────────────
function UffiziFloorPlan({ points, accent, onPointClick }) {
  const [floor, setFloor] = useState('upper');

  const POINT_TO_ROOM = {
    // Upper floor (Secondo Piano · 13-16c)
    'giotto-ognissanti-madonna': 'sala2',
    'simone-martini-annunciation': 'sala3',
    'gentile-da-fabriano-adoration': 'sala56',
    'piero-montefeltro-diptych': 'sala78',
    'uccello-battle-san-romano': 'sala78',
    'filippo-lippi-madonna-angels': 'sala78',
    'botticelli-primavera': 'sala1014',
    'botticelli-venus-birth': 'sala1014',
    'botticelli-adoration-magi': 'sala1014',
    'botticelli-pallas-centaur': 'sala1014',
    'leonardo-annunciation': 'sala15',
    'leonardo-adoration': 'sala15',
    'medici-venus': 'tribuna',
    'michelangelo-doni-tondo': 'sala35',
    'raphael-goldfinch-madonna': 'sala26',
    'raphael-leo-x': 'sala26',
    // Lower floor (Primo Piano · 16-17c)
    'titian-venus-urbino': 'sala83',
    'titian-flora': 'sala83',
    'parmigianino-long-neck': 'sala74',
    'bronzino-eleonora': 'sala65',
    'caravaggio-bacchus': 'sala96',
    'caravaggio-medusa': 'sala96',
    'caravaggio-isaac': 'sala96',
    'artemisia-judith': 'sala90',
  };

  // Point index map
  const pointMap = {};
  points.forEach((p, i) => { pointMap[p.id] = { ...p, idx: i + 1 }; });

  const pointsByRoom = {};
  points.forEach((p, i) => {
    const room = POINT_TO_ROOM[p.id];
    if (room) {
      if (!pointsByRoom[room]) pointsByRoom[room] = [];
      pointsByRoom[room].push({ ...p, idx: i + 1 });
    }
  });

  // Upper floor — U-shape: east wing (left) + cross corridor (south) + west wing (right)
  // viewBox 600×500
  const UPPER_ROOMS = [
    // East wing (left, north to south)
    { id: 'sala2', name: 'Sala 2', label: '지오토 · 치마부에', x: 70, y: 70, w: 130, h: 52 },
    { id: 'sala3', name: 'Sala 3', label: '시모네 마르티니', x: 70, y: 124, w: 130, h: 48 },
    { id: 'sala56', name: 'Sala 5-6', label: '국제 고딕', x: 70, y: 174, w: 130, h: 48 },
    { id: 'sala78', name: 'Sala 7-8', label: '피에로 · 우첼로 · 리피', x: 70, y: 224, w: 130, h: 70 },
    { id: 'sala1014', name: 'Sala 10-14', label: '보티첼리 룸', x: 70, y: 296, w: 130, h: 70 },
    { id: 'sala15', name: 'Sala 15', label: '레오나르도', x: 70, y: 368, w: 130, h: 50 },
    // Cross corridor (south, along Arno) — labels only
    { id: 'tribuna', name: 'Sala 18', label: '트리부나 — 메디치 비너스', x: 240, y: 380, w: 120, h: 58, isTribuna: true },
    // West wing (right, south to north — return path)
    { id: 'sala35', name: 'Sala 35', label: '미켈란젤로 도니 톤도', x: 400, y: 368, w: 130, h: 50 },
    { id: 'sala26', name: 'Sala 26', label: '라파엘로', x: 400, y: 296, w: 130, h: 70 },
    { id: 'sala25_empty', name: 'Sala 19-25', label: '뒤러 · 베네치아', x: 400, y: 224, w: 130, h: 70, isEmpty: true },
    { id: 'sala24_empty', name: 'Sala 17-23', label: '북유럽 르네상스', x: 400, y: 174, w: 130, h: 48, isEmpty: true },
    { id: 'sala16_empty', name: '복도', x: 400, y: 124, w: 130, h: 48, isCorridor: true },
    { id: 'exit', name: '출구', label: '아래층으로', x: 400, y: 70, w: 130, h: 52, isEntry: true },
    // North entry hall
    { id: 'entry', name: '입구', label: '계단 위층', x: 240, y: 70, w: 120, h: 52, isEntry: true },
  ];

  // Lower floor — U-shape continues, 16-17c
  const LOWER_ROOMS = [
    // East wing (left)
    { id: 'sala65', name: 'Sala 65', label: '브론치노', x: 70, y: 80, w: 130, h: 58 },
    { id: 'sala74', name: 'Sala 74', label: '파르미자니노 · 매너리즘', x: 70, y: 140, w: 130, h: 60 },
    { id: 'sala83', name: 'Sala 83', label: '티치아노', x: 70, y: 202, w: 130, h: 70 },
    // Middle / cross area  
    { id: 'corridor_mid', name: '복도', label: '베네치아 회화', x: 240, y: 202, w: 120, h: 70, isCorridor: true },
    // West wing (right) — Caravaggio cluster
    { id: 'sala90', name: 'Sala 90', label: '아르테미시아 젠틸레스키', x: 400, y: 140, w: 130, h: 60 },
    { id: 'sala96', name: 'Sala 96-97', label: '카라바조 (3점)', x: 400, y: 202, w: 130, h: 80 },
    // South - exit
    { id: 'exit_lower', name: '출구', label: '본 건물', x: 240, y: 320, w: 120, h: 50, isEntry: true },
  ];

  const rooms = floor === 'upper' ? UPPER_ROOMS : LOWER_ROOMS;

  function getPointPosition(room, pointIdx, totalPoints) {
    if (totalPoints === 1) {
      return { cx: room.x + room.w / 2, cy: room.y + room.h / 2 + 6 };
    }
    if (totalPoints === 2) {
      return {
        cx: room.x + room.w * (pointIdx === 0 ? 0.32 : 0.68),
        cy: room.y + room.h / 2 + 8,
      };
    }
    if (totalPoints === 3) {
      const positions = [
        { cx: room.x + room.w * 0.25, cy: room.y + room.h * 0.55 },
        { cx: room.x + room.w * 0.5, cy: room.y + room.h * 0.55 },
        { cx: room.x + room.w * 0.75, cy: room.y + room.h * 0.55 },
      ];
      return positions[pointIdx];
    }
    // 4+ points: 2x2 grid
    const col = pointIdx % 2;
    const row = Math.floor(pointIdx / 2);
    return {
      cx: room.x + room.w * (col === 0 ? 0.3 : 0.7),
      cy: room.y + room.h * (row === 0 ? 0.5 : 0.78),
    };
  }

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-toggle">
        <button
          className={`dc-floor-btn ${floor === 'upper' ? 'active' : ''}`}
          onClick={() => setFloor('upper')}
        >
          위층 · 13-16c
        </button>
        <button
          className={`dc-floor-btn ${floor === 'lower' ? 'active' : ''}`}
          onClick={() => setFloor('lower')}
        >
          아래층 · 16-17c
        </button>
      </div>

      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          {floor === 'upper' ? '위층 — Secondo Piano (초기·전성기 르네상스)' : '아래층 — Primo Piano (매너리즘·바로크)'}
        </div>
        <div className="dc-floor-label-sub">
          {floor === 'upper'
            ? '지오토 → 보티첼리 → 레오나르도 → 미켈란젤로 → 라파엘로 — U자형 회랑'
            : '티치아노 · 파르미자니노 · 브론치노 · 카라바조 · 아르테미시아'}
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="uffizi-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#uffizi-grid)" />

          {/* Cardinal directions */}
          <text x="300" y="22" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">
            ▲ 시뇨리아 광장 (북·입구)
          </text>
          <text x="300" y="490" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">
            아르노 강 (남) ▼
          </text>

          {/* U-shape connecting corridor outline (visual hint) */}
          {floor === 'upper' && (
            <path
              d="M 200 96 L 240 96 L 240 122 L 360 122 L 360 96 L 400 96 M 200 393 L 240 393 M 360 393 L 400 393"
              stroke="var(--line)"
              strokeWidth="1"
              fill="none"
              strokeDasharray="3 3"
              opacity="0.4"
            />
          )}

          {/* Rooms */}
          {rooms.map((room) => {
            const isEmpty = !pointsByRoom[room.id] || pointsByRoom[room.id].length === 0;
            return (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="6"
                  fill={
                    room.isTribuna ? 'rgba(201,169,97,0.08)'
                    : (room.isEntry || room.isCorridor) ? 'transparent'
                    : 'var(--bg)'
                  }
                  stroke={
                    room.isEntry || room.isCorridor ? 'var(--line)'
                    : (isEmpty ? 'var(--line)' : 'var(--accent)')
                  }
                  strokeWidth={isEmpty ? 1 : 1.5}
                  strokeDasharray={room.isEntry || room.isCorridor || room.isEmpty ? '4 3' : 'none'}
                  opacity={room.isEntry || room.isCorridor || room.isEmpty ? 0.6 : 1}
                />
                <text
                  x={room.x + 8}
                  y={room.y + 14}
                  fontSize="9.5"
                  fill="var(--accent)"
                  fontFamily="Cormorant Garamond, serif"
                  fontStyle="italic"
                  fontWeight="500"
                >
                  {room.name}
                </text>
                {room.label && (
                  <text
                    x={room.x + 8}
                    y={room.y + 26}
                    fontSize="8.5"
                    fill="var(--text-soft)"
                    fontFamily="Noto Sans KR, sans-serif"
                  >
                    {room.label}
                  </text>
                )}
              </g>
            );
          })}

          {/* Point dots */}
          {rooms.map((room) => {
            const roomPoints = pointsByRoom[room.id] || [];
            return roomPoints.map((p, i) => {
              const pos = getPointPosition(room, i, roomPoints.length);
              const isHovered = hoveredPoint === p.id;
              return (
                <g
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPointClick(p.id)}
                  onMouseEnter={() => setHoveredPoint(p.id)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={isHovered ? 13 : 10.5}
                    fill="var(--accent)"
                    stroke="var(--bg)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.15s' }}
                  />
                  <text
                    x={pos.cx}
                    y={pos.cy + 3.5}
                    fontSize="9.5"
                    fill="var(--bg)"
                    fontFamily="DM Sans, sans-serif"
                    fontWeight="600"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {String(p.idx).padStart(2, '0')}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        번호를 탭하면 작품 상세로 이동
      </div>

      {/* Point list below SVG */}
      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">이 층의 작품:</div>
        {rooms.map((room) => {
          const roomPoints = pointsByRoom[room.id] || [];
          if (roomPoints.length === 0) return null;
          return (
            <div className="dc-floor-room-list" key={room.id}>
              <div className="dc-floor-room-list-name">{room.name} · {room.label}</div>
              {roomPoints.map((p) => (
                <button
                  key={p.id}
                  className="dc-floor-room-list-point"
                  onClick={() => onPointClick(p.id)}
                >
                  <span className="dc-floor-room-list-num">{String(p.idx).padStart(2, '0')}</span>
                  <span className="dc-floor-room-list-name-text">{p.name}</span>
                  <span className="dc-floor-room-list-artist">{p.artist}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>
    </div>
  );
}

// BorgheseFloorPlan — 정확한 SVG 평면도
// ─────────────────────────────────────────────────────────
function BorgheseFloorPlan({ points, accent, onPointClick }) {
  const [floor, setFloor] = useState('ground');

  // Point ID → room ID mapping
  const POINT_TO_ROOM = {
    // Ground floor
    'pauline-bonaparte': 'I',
    'david': 'II',
    'apollo-daphne': 'III',
    'aeneas-anchises': 'III',
    'proserpina': 'IV',
    'truth-unveiled': 'VII',
    'caravaggio-jerome': 'VII',
    'david-goliath': 'VIII',
    'madonna-palafrenieri': 'VIII',
    'sick-bacchus': 'VIII',
    'boy-fruit-basket': 'VIII',
    // First floor (Pinacoteca)
    'raphael-entombment': 'IX',
    'lady-unicorn': 'IX',
    'correggio-danae': 'X',
    'diana-hunt': 'XVIII',
    'scipione-bust': 'XIV',
    'sacred-profane-love': 'XX',
  };

  // Build point map with idx
  const pointMap = {};
  points.forEach((p, i) => { pointMap[p.id] = { ...p, idx: i + 1 }; });

  // Group points by room
  const pointsByRoom = {};
  points.forEach((p, i) => {
    const room = POINT_TO_ROOM[p.id];
    if (room) {
      if (!pointsByRoom[room]) pointsByRoom[room] = [];
      pointsByRoom[room].push({ ...p, idx: i + 1 });
    }
  });

  // Floor plan layout — actual Borghese architecture
  // Casino Borghese is a rectangular villa with a central Salone surrounded by 8 rooms
  // Approximate proportions in 600×500 SVG viewBox
  const GROUND_FLOOR_ROOMS = [
    // Top row (north side)
    { id: 'IV', name: 'Sala IV', label: '엠퍼러의 방', x: 60, y: 40, w: 160, h: 110 },
    { id: 'V', name: 'Sala V', label: '에르마프로디테 방', x: 220, y: 40, w: 160, h: 110 },
    { id: 'VI', name: 'Sala VI', label: '아이네아스 방', x: 380, y: 40, w: 160, h: 110 },
    // Middle - main salone
    { id: 'III', name: 'Sala III', label: '아폴로와 다프네', x: 60, y: 150, w: 130, h: 200, special: 'apollo' },
    { id: 'I', name: 'Salone I', label: '입구·카노바의 방', x: 190, y: 150, w: 220, h: 200, isSalone: true },
    { id: 'VII', name: 'Sala VII', label: '이집트 방', x: 410, y: 150, w: 130, h: 200 },
    // Bottom row (south)
    { id: 'II', name: 'Sala II', label: '검투사의 방', x: 60, y: 350, w: 200, h: 100 },
    { id: 'entry', name: '입구', label: 'Entrance', x: 260, y: 350, w: 80, h: 100, isEntry: true },
    { id: 'VIII', name: 'Sala VIII', label: '실레노스 — 카라바조 ×4', x: 340, y: 350, w: 200, h: 100 },
  ];

  const FIRST_FLOOR_ROOMS = [
    // Pinacoteca — first floor paintings gallery
    // Simpler layout — roughly U-shape
    { id: 'IX', name: 'Sala IX', label: '라파엘로 방', x: 60, y: 60, w: 180, h: 130 },
    { id: 'X', name: 'Sala X', label: '매너리즘', x: 240, y: 60, w: 160, h: 130 },
    { id: 'XIV', name: 'Sala XIV', label: '오로라 — 시피오네', x: 400, y: 60, w: 140, h: 130 },
    { id: 'XVIII', name: 'Sala XVIII', label: '도메니키노', x: 60, y: 190, w: 180, h: 130 },
    { id: 'corridor', name: 'Corridor', label: '연결 복도', x: 240, y: 190, w: 160, h: 130, isCorridor: true },
    { id: 'XX', name: 'Sala XX', label: '베네치아 화파', x: 400, y: 190, w: 140, h: 130 },
  ];

  const rooms = floor === 'ground' ? GROUND_FLOOR_ROOMS : FIRST_FLOOR_ROOMS;

  // Position point dots inside each room
  function getPointPosition(room, pointIdx, totalPoints) {
    const padding = 14;
    const innerX = room.x + padding;
    const innerY = room.y + 26 + padding; // leave space for room label
    const innerW = room.w - padding * 2;
    const innerH = room.h - 26 - padding * 2;
    // Arrange dots in a grid within the room
    if (totalPoints === 1) {
      return { cx: room.x + room.w / 2, cy: room.y + room.h / 2 + 8 };
    }
    if (totalPoints <= 2) {
      const cx = room.x + room.w * (pointIdx === 0 ? 0.35 : 0.65);
      return { cx, cy: room.y + room.h / 2 + 8 };
    }
    if (totalPoints <= 4) {
      const col = pointIdx % 2;
      const row = Math.floor(pointIdx / 2);
      return {
        cx: room.x + room.w * (col === 0 ? 0.35 : 0.65),
        cy: room.y + room.h * (row === 0 ? 0.45 : 0.7),
      };
    }
    // 5+ points: spread across
    const cols = 3;
    const col = pointIdx % cols;
    const row = Math.floor(pointIdx / cols);
    return {
      cx: room.x + room.w * (0.25 + col * 0.25),
      cy: room.y + room.h * (0.45 + row * 0.25),
    };
  }

  // For hover/tap interaction
  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
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
        <div className="dc-floor-label-title">
          {floor === 'ground' ? '1층 — Piano Terreno (조각)' : '2층 — Pinacoteca (회화)'}
        </div>
        <div className="dc-floor-label-sub">
          {floor === 'ground'
            ? '베르니니, 카노바, 카라바조 — 시피오네의 조각 컬렉션'
            : '라파엘로, 티치아노, 코레조 — 16세기 이탈리아 회화'}
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 480" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          {/* Background grid for depth */}
          <defs>
            <pattern id="grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="480" fill="url(#grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {/* Rooms */}
          {rooms.map((room) => {
            const isEmpty = !pointsByRoom[room.id] || pointsByRoom[room.id].length === 0;
            const isSpecial = room.isSalone || room.isEntry || room.isCorridor;
            return (
              <g key={room.id}>
                <rect
                  x={room.x}
                  y={room.y}
                  width={room.w}
                  height={room.h}
                  rx="6"
                  fill={room.isSalone ? 'rgba(201,169,97,0.06)' : (room.isEntry || room.isCorridor) ? 'transparent' : 'var(--bg)'}
                  stroke={room.isEntry || room.isCorridor ? 'var(--line)' : (isEmpty ? 'var(--line)' : 'var(--accent)')}
                  strokeWidth={isEmpty ? 1 : 1.5}
                  strokeDasharray={room.isEntry || room.isCorridor ? '4 3' : (isEmpty ? '3 3' : 'none')}
                  opacity={isEmpty || room.isEntry || room.isCorridor ? 0.6 : 1}
                />
                {/* Room label */}
                <text
                  x={room.x + 8}
                  y={room.y + 16}
                  fontSize="10"
                  fill="var(--accent)"
                  fontFamily="Cormorant Garamond, serif"
                  fontStyle="italic"
                  fontWeight="500"
                >
                  {room.name}
                </text>
                <text
                  x={room.x + 8}
                  y={room.y + 28}
                  fontSize="8.5"
                  fill="var(--text-soft)"
                  fontFamily="Noto Sans KR, sans-serif"
                >
                  {room.label}
                </text>
              </g>
            );
          })}

          {/* Point dots */}
          {rooms.map((room) => {
            const roomPoints = pointsByRoom[room.id] || [];
            return roomPoints.map((p, i) => {
              const pos = getPointPosition(room, i, roomPoints.length);
              const isHovered = hoveredPoint === p.id;
              return (
                <g key={p.id} style={{ cursor: 'pointer' }} onClick={() => onPointClick(p.id)}
                   onMouseEnter={() => setHoveredPoint(p.id)}
                   onMouseLeave={() => setHoveredPoint(null)}>
                  <circle
                    cx={pos.cx}
                    cy={pos.cy}
                    r={isHovered ? 14 : 11}
                    fill="var(--accent)"
                    stroke="var(--bg)"
                    strokeWidth="2"
                    style={{ transition: 'all 0.15s' }}
                  />
                  <text
                    x={pos.cx}
                    y={pos.cy + 4}
                    fontSize="10"
                    fill="var(--bg)"
                    fontFamily="DM Sans, sans-serif"
                    fontWeight="600"
                    textAnchor="middle"
                    pointerEvents="none"
                  >
                    {String(p.idx).padStart(2, '0')}
                  </text>
                </g>
              );
            });
          })}
        </svg>
      </div>

      {/* Point list below SVG for accessibility */}
      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">이 층의 작품:</div>
        {rooms.map((room) => {
          const roomPoints = pointsByRoom[room.id] || [];
          if (roomPoints.length === 0) return null;
          return (
            <div className="dc-floor-room-list" key={room.id}>
              <div className="dc-floor-room-list-name">{room.name} · {room.label}</div>
              {roomPoints.map((p) => (
                <button
                  key={p.id}
                  className="dc-floor-room-list-point"
                  onClick={() => onPointClick(p.id)}
                >
                  <span className="dc-floor-room-list-num">{String(p.idx).padStart(2, '0')}</span>
                  <span className="dc-floor-room-list-name-text">{p.name}</span>
                  <span className="dc-floor-room-list-artist">{p.artist}</span>
                </button>
              ))}
            </div>
          );
        })}
      </div>

      <div className="dc-floorplan-note">
        <Info size={10} /> 방 배치는 실제 평면도에 가까운 비례. 작품 위치는 방 내 정확한 위치가 아님.
      </div>
    </div>
  );
}

function PointCard({ point, idx, accent, onClick, favorites }) {
  const isWanted = favorites?.wantSet.has(point.id);
  const isSeen = favorites?.seenSet.has(point.id);
  return (
    <button className="dc-point-card" onClick={onClick} style={{ '--accent': accent }}>
      <div className="dc-point-thumb">
        <img src={point.image} alt={point.name} loading="lazy" />
        <div className="dc-point-num">{String(idx).padStart(2, '0')}</div>
        {(isWanted || isSeen) && (
          <div className="dc-point-fav-badges">
            {isWanted && <Heart size={12} fill="currentColor" />}
            {isSeen && <Check size={12} strokeWidth={3} />}
          </div>
        )}
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
function PointView({ attractionId, pointId, pop, audio, favorites }) {
  const point = findPoint(attractionId, pointId);
  const attraction = findAttraction(attractionId);
  const isPlaying = audio.playing === pointId;
  const audioUrl = `/audio/${attractionId}/${pointId}.mp3`;
  const isWanted = favorites?.wantSet.has(pointId);
  const isSeen = favorites?.seenSet.has(pointId);

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

      {favorites && (
        <div className="dc-point-fav-row">
          <button
            className={`dc-fav-btn ${isWanted ? 'active want' : ''}`}
            onClick={() => favorites.toggleWant(pointId)}
          >
            <Heart size={13} fill={isWanted ? 'currentColor' : 'none'} />
            <span>{isWanted ? '가고 싶음' : '가고 싶어요'}</span>
          </button>
          <button
            className={`dc-fav-btn ${isSeen ? 'active seen' : ''}`}
            onClick={() => favorites.toggleSeen(pointId)}
          >
            <Check size={13} strokeWidth={isSeen ? 3 : 2} />
            <span>{isSeen ? '봤어요' : '본 작품'}</span>
          </button>
        </div>
      )}

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
// FavoritesView — 가고 싶은 작품 + 본 작품 목록
// ─────────────────────────────────────────────────────────
function FavoritesView({ pop, push, favorites }) {
  const [tab, setTab] = useState('want'); // 'want' | 'seen'

  // Gather all points across attractions, filter by favorites
  const allPoints = [];
  ATTRACTIONS.forEach((a) => {
    a.points.forEach((p, idx) => {
      allPoints.push({ ...p, attractionId: a.id, attractionName: a.name, attractionEmoji: a.emoji, attractionAccent: a.coverHue, attractionIdx: idx + 1 });
    });
  });

  const wantPoints = allPoints.filter((p) => favorites.wantSet.has(p.id));
  const seenPoints = allPoints.filter((p) => favorites.seenSet.has(p.id));
  const currentList = tab === 'want' ? wantPoints : seenPoints;

  // Group by attraction
  const grouped = {};
  currentList.forEach((p) => {
    if (!grouped[p.attractionId]) grouped[p.attractionId] = { name: p.attractionName, emoji: p.attractionEmoji, accent: p.attractionAccent, points: [] };
    grouped[p.attractionId].points.push(p);
  });

  function handleClear() {
    if (!confirm('찜한 작품과 본 작품을 모두 지우시겠어요? 되돌릴 수 없습니다.')) return;
    favorites.clearAll();
  }

  return (
    <div className="dc-subview">
      <button className="dc-back" onClick={pop}>
        <ArrowLeft size={14} /> 뒤로
      </button>

      <div className="dc-favorites-hero">
        <div className="dc-favorites-icon"><Heart size={26} fill="currentColor" /></div>
        <h1 className="dc-favorites-title">내가 찜한 작품</h1>
        <div className="dc-favorites-sub">
          가고 싶은 {favorites.wantSet.size}점 · 본 작품 {favorites.seenSet.size}점
        </div>
      </div>

      <div className="dc-fav-tabs">
        <button
          className={`dc-fav-tab ${tab === 'want' ? 'active' : ''}`}
          onClick={() => setTab('want')}
        >
          <Heart size={12} fill={tab === 'want' ? 'currentColor' : 'none'} />
          가고 싶은 ({favorites.wantSet.size})
        </button>
        <button
          className={`dc-fav-tab ${tab === 'seen' ? 'active' : ''}`}
          onClick={() => setTab('seen')}
        >
          <Check size={12} strokeWidth={tab === 'seen' ? 3 : 2} />
          본 작품 ({favorites.seenSet.size})
        </button>
      </div>

      {currentList.length === 0 ? (
        <div className="dc-fav-empty">
          <div className="dc-fav-empty-icon">
            {tab === 'want' ? <Heart size={32} /> : <Check size={32} />}
          </div>
          <div className="dc-fav-empty-title">
            {tab === 'want' ? '아직 찜한 작품이 없어요' : '아직 본 작품이 없어요'}
          </div>
          <div className="dc-fav-empty-sub">
            작품 페이지에서 {tab === 'want' ? '하트' : '체크'}를 눌러 추가하세요
          </div>
        </div>
      ) : (
        <div className="dc-fav-list">
          {Object.entries(grouped).map(([attrId, group]) => (
            <div className="dc-fav-group" key={attrId}>
              <div className="dc-fav-group-header" style={{ '--accent': group.accent }}>
                <span className="dc-fav-group-emoji">{group.emoji}</span>
                <span className="dc-fav-group-name">{group.name}</span>
                <span className="dc-fav-group-count">{group.points.length}점</span>
              </div>
              {group.points.map((p) => (
                <button
                  key={p.id}
                  className="dc-fav-item"
                  style={{ '--accent': group.accent }}
                  onClick={() => push({ name: 'point', attractionId: p.attractionId, pointId: p.id })}
                >
                  <img src={p.image} alt={p.name} loading="lazy" />
                  <div className="dc-fav-item-body">
                    <div className="dc-fav-item-name">{p.name}</div>
                    <div className="dc-fav-item-artist">{p.artist}</div>
                    <div className="dc-fav-item-loc"><MapPin size={9} /> {p.location}</div>
                  </div>
                  <ChevronRight size={14} className="dc-fav-item-chev" />
                </button>
              ))}
            </div>
          ))}
        </div>
      )}

      {(favorites.wantSet.size > 0 || favorites.seenSet.size > 0) && (
        <button className="dc-fav-clear" onClick={handleClear}>
          <Trash2 size={12} /> 전체 비우기
        </button>
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
            <Info size={11} /> {ATTRACTIONS.reduce((s, a) => s + a.points.length, 0)}점 카탈로그 중에서 인식합니다 ({ATTRACTIONS.length}개 명소: 보르게세·바티칸·콜로세움·판테온·트레비·산탄젤로·나보나·스페인광장).
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
          <div className="dc-scan-loading-sub">Claude Vision으로 {ATTRACTIONS.reduce((s, a) => s + a.points.length, 0)}점 카탈로그와 비교 중</div>
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
// SearchView — 작품·작가 이름 검색
// ─────────────────────────────────────────────────────────
function SearchView({ pop, push }) {
  const [query, setQuery] = useState('');
  const inputRef = useRef(null);

  // Autofocus on mount
  useEffect(() => {
    const t = setTimeout(() => inputRef.current?.focus(), 100);
    return () => clearTimeout(t);
  }, []);

  // Build searchable index once
  const allPoints = [];
  ATTRACTIONS.forEach((a) => {
    a.points.forEach((p, idx) => {
      allPoints.push({
        ...p,
        attractionId: a.id,
        attractionName: a.name,
        attractionEmoji: a.emoji,
        attractionAccent: a.coverHue,
        idx: idx + 1,
      });
    });
  });

  // Filter
  const q = query.trim().toLowerCase();
  const results = q
    ? allPoints.filter((p) => {
        const haystack = `${p.name} ${p.nameLocal || ''} ${p.artist || ''} ${p.attractionName}`.toLowerCase();
        return haystack.includes(q);
      })
    : [];

  return (
    <div className="dc-subview">
      <div className="dc-search-header">
        <button className="dc-search-back" onClick={pop} aria-label="뒤로">
          <ArrowLeft size={16} />
        </button>
        <div className="dc-search-input-wrap">
          <Search size={14} className="dc-search-input-icon" />
          <input
            ref={inputRef}
            type="text"
            inputMode="search"
            placeholder="모세, 카라바조, 라파엘로, 콜로세움..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="dc-search-input"
          />
          {query && (
            <button className="dc-search-clear" onClick={() => setQuery('')} aria-label="지우기">
              <X size={14} />
            </button>
          )}
        </div>
      </div>

      {!q && (
        <div className="dc-search-hint">
          <div className="dc-search-hint-title">전체 {TOTAL_POINTS}점 · {ATTRACTIONS.length}명소에서 검색</div>
          <div className="dc-search-hint-sub">한글 이름, 이탈리아어 원문, 작가 이름 모두 검색돼요</div>
        </div>
      )}

      {q && results.length === 0 && (
        <div className="dc-search-empty">
          <Search size={28} />
          <div className="dc-search-empty-title">"{query}"에 대한 결과 없음</div>
          <div className="dc-search-empty-sub">다른 키워드로 시도해보세요</div>
        </div>
      )}

      {q && results.length > 0 && (
        <>
          <div className="dc-search-count">{results.length}점 발견</div>
          <div className="dc-search-results">
            {results.map((p) => (
              <button
                key={`${p.attractionId}-${p.id}`}
                className="dc-search-item"
                style={{ '--accent': p.attractionAccent }}
                onClick={() => push({ name: 'point', attractionId: p.attractionId, pointId: p.id })}
              >
                <img src={p.image} alt={p.name} loading="lazy" />
                <div className="dc-search-item-body">
                  <div className="dc-search-item-name">{p.name}</div>
                  {p.artist && <div className="dc-search-item-artist">{p.artist}</div>}
                  <div className="dc-search-item-attr">
                    <span>{p.attractionEmoji}</span>
                    <span>{p.attractionName}</span>
                  </div>
                </div>
                <ChevronRight size={14} className="dc-search-item-chev" />
              </button>
            ))}
          </div>
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
      <div>도슨트 · Docent v0.22</div>
      <div>이미지: Wikimedia Commons (Public Domain)</div>
      <div>오디오: Microsoft Edge TTS · ko-KR-SunHi Neural</div>
      <div>오프라인 지원 · 카메라 인식 (Claude Vision)</div>
    </footer>
  );
}
