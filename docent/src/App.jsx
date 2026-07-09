// v0.40 redeploy trigger
import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight, ChevronLeft, ArrowLeft, Play, Pause, Volume2, VolumeX,
  Clock, Info, MapPin, Star, Headphones, BookOpen, Eye, Sparkles, Quote,
  Camera, Image as ImageIcon, Loader2, AlertCircle, RefreshCw, WifiOff, Search,
  Download, Smartphone, X,
  MessageCircle, Send, Map,
  Heart, BookmarkCheck, Check, Trash2,
} from 'lucide-react';
import { CITIES, ATTRACTIONS, findAttraction, findPoint, TOTAL_POINTS } from './data/attractions.js';
import {
  loadTrip, saveTrip, clearTrip, createEmptyTrip, AARON_CONFIRMED_TRIP,
  getReservationInfo, getTransitInfo, getTransitTiming, computeDaySchedule,
  attractionReminderUrl, transitReminderUrl,
  getClosureStatus, getRecommendedCourses,
  inferCityForDay, getAssignedAttractionIds,
  analyzeDay, analyzeTrip, getCluster,
  analyzeTripWithMode, loadKidMode, saveKidMode, getKidFriendly,
  getBookingOpenInfo, attractionReminderUrlV2, visitCalendarUrl,
  getBookingStatus, getBookingData, updateBooking,
  buildShareUrl, decodeTripFromShare, downloadICS, shareTrip,
  getChecklist, mergeAutoChecklist, updateChecklistItem, addChecklistItem,
  removeChecklistItem, groupChecklistByCategory, getChecklistProgress,
} from './data/trip.js';

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
  const replace = useCallback((patch) => {
    // 현재 스택 최상단 아이템을 patch와 병합 (history는 그대로)
    setStack((s) => {
      if (s.length === 0) return s;
      const top = s[s.length - 1];
      return [...s.slice(0, -1), { ...top, ...patch }];
    });
  }, []);
  const reset = useCallback(() => setStack([initial]), []);

  return { current: stack[stack.length - 1], push, pop, replace, reset, depth: stack.length };
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

  // URL ?trip=base64 — 공유 받은 일정 자동 임포트
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const encoded = params.get('trip');
    if (!encoded) return;
    const decoded = decodeTripFromShare(encoded);
    if (!decoded) return;
    const existing = loadTrip();
    const proceed = !existing || window.confirm('이미 저장된 일정이 있습니다. 공유된 일정으로 덮어쓰시겠습니까?');
    if (proceed) {
      saveTrip(decoded);
      view.push({ name: 'trip' });
    }
    const cleanUrl = window.location.origin + window.location.pathname;
    window.history.replaceState({}, '', cleanUrl);
  }, []);

  // Stop audio on view change
  useEffect(() => { audio.stop(); }, [view.current.name]);

  return (
    <div className="dc-app">
      {view.current.name === 'home' && <HomeView push={view.push} favorites={favorites} />}
      {view.current.name === 'trip' && <TripView pop={view.pop} push={view.push} />}
      {view.current.name === 'city' && (
        <CityView cityId={view.current.cityId} push={view.push} pop={view.pop} />
      )}
      {view.current.name === 'attraction' && (
        <AttractionView
          attractionId={view.current.attractionId}
          initialView={view.current.view || 'list'}
          initialRouteId={view.current.routeId}
          push={view.push}
          pop={view.pop}
          replace={view.replace}
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
// TripView — 내 일정 관리 (일정 + 예약 + 도시간 이동 + 캘린더)
// ─────────────────────────────────────────────────────────
function TripView({ pop, push }) {
  const [trip, setTripState] = useState(() => loadTrip());
  const [showPicker, setShowPicker] = useState(null); // null or { dayIdx }
  const [showCourses, setShowCourses] = useState(null); // null or { dayIdx }
  const [expandedAttraction, setExpandedAttraction] = useState(null); // attractionId
  const [expandedTransit, setExpandedTransit] = useState(null); // dayIdx
  const [showSetup, setShowSetup] = useState(!trip);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [kidMode, setKidModeState] = useState(() => loadKidMode());

  function toggleKidMode() {
    const next = !kidMode;
    setKidModeState(next);
    saveKidMode(next);
  }

  // 분석 — 트립 전체 + 일별 (kidMode 반영)
  const analysis = trip ? analyzeTripWithMode(trip, findAttraction, { kidMode }) : null;

  // 빈 상태 — 날짜 입력 폼
  const [setupStart, setSetupStart] = useState('');
  const [setupEnd, setSetupEnd] = useState('');
  const [setupError, setSetupError] = useState('');

  function update(t) {
    setTripState(t);
    if (t) saveTrip(t);
    else clearTrip();
  }

  function handleCreate() {
    setSetupError('');
    if (!setupStart || !setupEnd) {
      setSetupError('출발일과 복귀일을 모두 선택해주세요');
      return;
    }
    if (setupEnd < setupStart) {
      setSetupError('복귀일은 출발일보다 늦어야 합니다');
      return;
    }
    const days = Math.ceil((new Date(setupEnd) - new Date(setupStart)) / (1000 * 60 * 60 * 24)) + 1;
    if (days > 30) {
      setSetupError('일정은 30일 이내로 설정해주세요');
      return;
    }
    const newTrip = createEmptyTrip(setupStart, setupEnd);
    update(newTrip);
    setShowSetup(false);
  }

  function addAttractionToDay(dayIdx, attractionId) {
    if (!trip) return;
    const newDays = [...trip.days];
    const day = { ...newDays[dayIdx] };
    if (day.attractionIds.includes(attractionId)) {
      day.attractionIds = day.attractionIds.filter((id) => id !== attractionId);
    } else {
      day.attractionIds = [...day.attractionIds, attractionId];
    }
    newDays[dayIdx] = day;
    update({ ...trip, days: newDays });
  }

  function applyCourse(dayIdx, attractionIds) {
    if (!trip) return;
    const newDays = [...trip.days];
    // 추천 코스의 명소를 그 날에 배정 (다른 날에 이미 있는 명소는 자동 제외)
    const otherDaysAssigned = getAssignedAttractionIds(trip, dayIdx);
    const existing = new Set(newDays[dayIdx].attractionIds);
    const merged = [...newDays[dayIdx].attractionIds];
    attractionIds.forEach((aid) => {
      if (!existing.has(aid) && !otherDaysAssigned.has(aid)) merged.push(aid);
    });
    newDays[dayIdx] = { ...newDays[dayIdx], attractionIds: merged };
    update({ ...trip, days: newDays });
  }

  // 인접 일정 기반 자동 채우기: 빈 날의 추천 도시 → 첫 추천 코스 적용 (중복 제외)
  function autoFillDay(dayIdx) {
    if (!trip) return;
    const inferredCity = inferCityForDay(trip, dayIdx, getDayCity);
    if (!inferredCity) {
      window.alert('인접 일정이 비어있어 도시를 추론할 수 없어요. 〈추천 코스로 시작〉을 이용해주세요.');
      return;
    }
    const courses = getRecommendedCourses(inferredCity);
    if (!courses.length) return;
    // 중복 가장 적은 코스 선택
    const otherDaysAssigned = getAssignedAttractionIds(trip, dayIdx);
    const bestCourse = courses
      .map((c) => ({ c, available: c.attractionIds.filter((aid) => !otherDaysAssigned.has(aid)).length }))
      .sort((a, b) => b.available - a.available)[0].c;
    applyCourse(dayIdx, bestCourse.attractionIds);
  }

  function resetTrip() {
    if (!window.confirm('정말 일정을 초기화하시겠습니까? 모든 명소 배정이 삭제됩니다.')) return;
    update(null);
    setShowSetup(true);
    setSetupStart('');
    setSetupEnd('');
  }

  function getDayCity(day) {
    if (!day.attractionIds.length) return null;
    const cities = day.attractionIds.map((id) => {
      const a = findAttraction(id);
      return a ? a.city : null;
    }).filter(Boolean);
    if (!cities.length) return null;
    // 가장 많이 나온 도시
    const counts = {};
    cities.forEach((c) => { counts[c] = (counts[c] || 0) + 1; });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
  }

  function formatDate(iso) {
    const d = new Date(iso);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  }

  function daysUntil(iso) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const target = new Date(iso); target.setHours(0, 0, 0, 0);
    return Math.round((target - today) / (1000 * 60 * 60 * 24));
  }

  // ── 빈 상태: 날짜 입력 폼
  if (showSetup || !trip) {
    const today = new Date().toISOString().slice(0, 10);
    return (
      <div className="dc-subview dc-trip-setup">
        <button className="dc-back" onClick={pop}><ChevronLeft size={20} /></button>
        <h1 className="dc-trip-setup-title">내 일정 만들기</h1>
        <p className="dc-trip-setup-sub">출발일과 복귀일을 선택하면 매일 가고 싶은 명소를 배정할 수 있어요</p>

        <div className="dc-trip-setup-form">
          <label className="dc-trip-setup-label">
            <span>출발일</span>
            <input
              type="date"
              className="dc-trip-setup-input"
              value={setupStart}
              min={today}
              onChange={(e) => setSetupStart(e.target.value)}
            />
          </label>
          <label className="dc-trip-setup-label">
            <span>복귀일</span>
            <input
              type="date"
              className="dc-trip-setup-input"
              value={setupEnd}
              min={setupStart || today}
              onChange={(e) => setSetupEnd(e.target.value)}
            />
          </label>
          {setupError && <div className="dc-trip-setup-error">{setupError}</div>}
          <button className="dc-trip-setup-btn" onClick={handleCreate}>
            일정 만들기
          </button>

          <div style={{marginTop: 20, padding: '16px 14px', background: 'linear-gradient(135deg, #fff5f0, #fef8f0)', borderRadius: 12, border: '1.5px solid #f0d5a5'}}>
            <div style={{fontSize: 13, fontWeight: 700, color: '#8b5a2b', marginBottom: 8}}>
              ⚡ Aaron 확정 여정 바로 불러오기
            </div>
            <div style={{fontSize: 11, color: '#7a5a3a', lineHeight: 1.5, marginBottom: 12}}>
              9/16~9/25 로마→피렌체→베네치아→밀라노 10일 일정.<br/>
              항공권 · 호텔 3곳 · 열차 3구간 · 예약 3건 (Vatican, Uffizi, Cenacolo) 반영. Borghese · Accademia 예약 필요 상태 포함.
            </div>
            <button
              className="dc-trip-setup-btn"
              style={{background: 'linear-gradient(135deg, #b85b3f, #c9a961)', color: 'white'}}
              onClick={() => {
                if (window.confirm('Aaron 확정 여정을 불러오시겠습니까?\n(기존 일정은 덮어씁니다)')) {
                  update(AARON_CONFIRMED_TRIP);
                  setShowSetup(false);
                }
              }}
            >
              📥 Aaron 확정 여정 불러오기 (9/16~9/25)
            </button>
          </div>
        </div>

        <div className="dc-trip-setup-info">
          <div className="dc-trip-setup-info-title">💡 일정 관리로 할 수 있는 것</div>
          <ul>
            <li>매일 가고 싶은 명소를 탭으로 추가</li>
            <li>예약이 필요한 곳에 〈🔴 지금 예약〉 같은 긴급도 표시</li>
            <li>공식 + 서드파티 예약 사이트 한 번에 (Tiqets · GetYourGuide · Trainline · Omio)</li>
            <li>도시간 이동 자동 감지 (Trenitalia · Italo 비교)</li>
            <li>적절한 예약 시점을 Google 캘린더에 한 번에 추가</li>
          </ul>
        </div>
      </div>
    );
  }

  // ── 일정 있음: 일별 카드 + 예약 정보
  return (
    <div className="dc-subview dc-trip">
      <button className="dc-back" onClick={pop}><ChevronLeft size={20} /></button>
      <div className="dc-trip-header">
        <h1 className="dc-trip-title">내 일정</h1>
        <div className="dc-trip-range">
          {formatDate(trip.startDate)} ~ {formatDate(trip.endDate)} · {trip.days.length}일
        </div>
        <div className="dc-trip-countdown">
          {(() => {
            const d = daysUntil(trip.startDate);
            if (d > 0) return `출발 ${d}일 전`;
            if (d === 0) return '오늘 출발 🎉';
            if (d < 0 && daysUntil(trip.endDate) >= 0) return '여행 중 ✈️';
            return '여행 완료';
          })()}
        </div>

        <div className="dc-trip-share-row">
          <button
            className="dc-trip-share-btn"
            onClick={async () => {
              const result = await shareTrip(trip);
              if (result.method === 'clipboard') window.alert('공유 URL이 클립보드에 복사되었습니다');
              else if (result.method === 'failed' && !String(result.error).includes('AbortError')) window.alert('공유 실패: ' + result.error);
            }}
          >
            🔗 일정 공유
          </button>
          <button
            className="dc-trip-share-btn"
            onClick={() => {
              const ok = downloadICS(trip, findAttraction);
              if (ok) window.alert('docent-trip-' + trip.startDate + '.ics 파일이 다운로드되었습니다.\n캘린더 앱에서 가져오기 메뉴로 열어주세요.');
            }}
          >
            📥 .ics 내보내기
          </button>
        </div>
      </div>

      {/* 분석 패널 */}
      {analysis && analysis.score !== null && (
        <div className={`dc-trip-analysis score-${analysis.score >= 80 ? 'high' : analysis.score >= 60 ? 'mid' : 'low'}`}>
          <button
            className="dc-trip-analysis-head"
            onClick={() => setShowAnalysis((v) => !v)}
          >
            <div className="dc-trip-analysis-score">
              <div className="dc-trip-analysis-score-num">{analysis.score}</div>
              <div className="dc-trip-analysis-score-label">/ 100</div>
            </div>
            <div className="dc-trip-analysis-summary">
              <div className="dc-trip-analysis-title">
                📊 일정 점수{kidMode && <span className="dc-kid-badge"> 🧒 어린이 동반</span>}
              </div>
              <div className="dc-trip-analysis-meta">
                {analysis.errorCount > 0 && <span className="err">⚠️ {analysis.errorCount} 오류</span>}
                {analysis.warningCount > 0 && <span className="warn"> · 🟡 {analysis.warningCount} 주의</span>}
                {analysis.errorCount === 0 && analysis.warningCount === 0 && <span className="ok">✓ 큰 문제 없음</span>}
                {analysis.emptyDays > 0 && <span className="empty"> · {analysis.emptyDays}일 비어있음</span>}
              </div>
            </div>
            <ChevronRight size={16} className="dc-trip-analysis-chev" style={{ transform: showAnalysis ? 'rotate(90deg)' : 'none' }} />
          </button>
          {showAnalysis && (
            <div className="dc-trip-analysis-body">
              {analysis.dayAnalyses.map((dayA, idx) => {
                if (dayA.score === null) return null;
                if (!dayA.issues.length) return null;
                const day = trip.days[idx];
                const formatD = (iso) => {
                  const d = new Date(iso);
                  return `${d.getMonth() + 1}/${d.getDate()}`;
                };
                return (
                  <div key={idx} className="dc-trip-analysis-day">
                    <div className="dc-trip-analysis-day-head">
                      <span className="dc-trip-analysis-day-date">{formatD(day.date)}</span>
                      <span className={`dc-trip-analysis-day-score score-${dayA.score >= 80 ? 'high' : dayA.score >= 60 ? 'mid' : 'low'}`}>
                        {dayA.score}
                      </span>
                    </div>
                    <ul className="dc-trip-analysis-issues">
                      {dayA.issues.map((iss, i) => (
                        <li key={i} className={`dc-trip-analysis-issue sev-${iss.severity}`}>
                          {iss.text}
                        </li>
                      ))}
                    </ul>
                  </div>
                );
              })}
              <button
                className="dc-kid-toggle"
                onClick={(e) => { e.stopPropagation(); toggleKidMode(); }}
              >
                <span className={`dc-kid-toggle-knob ${kidMode ? 'on' : 'off'}`}>{kidMode ? '✓' : ''}</span>
                <span className="dc-kid-toggle-label">
                  🧒 어린이(10세) 동반 모드
                  <span className="dc-kid-toggle-sub">
                    {kidMode
                      ? '주요 박물관 카운트 · 6h 한도 · 명소별 친화도 평가 적용 중'
                      : '꺼져 있음 — 탭하면 어린이 기준으로 점수 다시 계산'}
                  </span>
                </span>
              </button>
              <div className="dc-trip-analysis-legend">
                점수 기준: 🟢 80+ 좋음 · 🟡 60~79 보통 · 🔴 59 이하 재검토 권장
              </div>
            </div>
          )}
        </div>
      )}

      {/* 체크리스트 패널 */}
      <ChecklistPanel
        trip={trip}
        update={update}
        findAttraction={findAttraction}
      />

      {/* 도시별 박일 수 요약 */}
      {(() => {
        const cityCounts = {};
        const cityOrder = [];
        trip.days.forEach(d => {
          const c = getDayCity(d);
          if (!c) return;
          if (!(c in cityCounts)) cityOrder.push(c);
          cityCounts[c] = (cityCounts[c] || 0) + 1;
        });
        if (cityOrder.length < 2) return null;
        return (
          <div className="dc-trip-city-summary">
            <div className="dc-trip-city-summary-label">📍 도시별 머묾</div>
            <div className="dc-trip-city-summary-cities">
              {cityOrder.map((c, i) => {
                const ko = { rome: '로마', florence: '피렌체', milan: '밀라노', venice: '베네치아' }[c] || c;
                return (
                  <span key={c} className="dc-trip-city-chip">
                    {ko} <strong>{cityCounts[c]}일</strong>
                    {i < cityOrder.length - 1 && <span className="dc-trip-city-arrow"> → </span>}
                  </span>
                );
              })}
            </div>
            <div className="dc-trip-city-summary-note">
              ※ 〈N일〉 = 해당 도시에서 일정이 잡힌 날짜 수. 이동날은 출발 도시로 카운트.
            </div>
          </div>
        );
      })()}

      <div className="dc-trip-days">
        {trip.days.map((day, dayIdx) => {
          const dayCity = getDayCity(day);
          const prevDay = dayIdx > 0 ? trip.days[dayIdx - 1] : null;
          const prevCity = prevDay ? getDayCity(prevDay) : null;
          const transitInfo = (prevCity && dayCity && prevCity !== dayCity)
            ? getTransitInfo(prevCity, dayCity)
            : null;
          const transitTiming = (transitInfo && prevDay)
            ? getTransitTiming(prevDay, day, transitInfo, findAttraction)
            : null;

          return (
            <div key={day.date}>
              {/* 도시 이동 카드 (전날과 도시가 다르면) */}
              {transitInfo && (
                <div className="dc-trip-transit">
                  <button
                    className="dc-trip-transit-header"
                    onClick={() => setExpandedTransit(expandedTransit === dayIdx ? null : dayIdx)}
                  >
                    <div className="dc-trip-transit-icon">🚆</div>
                    <div className="dc-trip-transit-body">
                      <div className="dc-trip-transit-name">{transitInfo.name}</div>
                      <div className="dc-trip-transit-sub">
                        {transitInfo.distance} · {transitInfo.options[0].duration} ({transitInfo.options[0].provider} 기준)
                      </div>
                      {transitTiming && (
                        <div className={`dc-trip-transit-timing ${transitTiming.feasible === 'overnight' ? 'overnight' : ''} ${transitTiming.warning ? 'tight' : ''}`}>
                          <div className="dc-trip-transit-timing-row">
                            <span className="dc-trip-transit-timing-tag">{transitTiming.mode}</span>
                            <span className="dc-trip-transit-timing-time">
                              🕐 <strong>{transitTiming.depRecommended}</strong> 출발 → <strong>{transitTiming.arrRecommended}</strong> 도착
                            </span>
                          </div>
                          <div className="dc-trip-transit-timing-window">{transitTiming.message}</div>
                          {transitTiming.warning && (
                            <div className="dc-trip-transit-timing-warn">⚠️ {transitTiming.warning}</div>
                          )}
                          {transitTiming.alternative && (
                            <div className="dc-trip-transit-timing-alt">
                              <div className="dc-trip-transit-timing-alt-head">대안: {transitTiming.alternative.mode}</div>
                              <div className="dc-trip-transit-timing-alt-body">
                                🕐 {transitTiming.alternative.depRecommended} 출발 → {transitTiming.alternative.arrRecommended} 도착<br/>
                                <span style={{ color: '#999', fontSize: 11 }}>{transitTiming.alternative.message}</span>
                              </div>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                    <ChevronRight
                      size={16}
                      className="dc-trip-transit-chev"
                      style={{ transform: expandedTransit === dayIdx ? 'rotate(90deg)' : 'none' }}
                    />
                  </button>

                  {expandedTransit === dayIdx && (
                    <div className="dc-trip-transit-options">
                      {transitInfo.options.map((opt, i) => (
                        <div key={i} className="dc-trip-transit-opt">
                          <div className="dc-trip-transit-opt-head">
                            <div className="dc-trip-transit-opt-name">{opt.provider}</div>
                            <div className="dc-trip-transit-opt-meta">
                              {opt.duration !== '-' && <span>{opt.duration}</span>}
                              {opt.priceRange !== '-' && <span>· {opt.priceRange}</span>}
                            </div>
                          </div>
                          {opt.notes && <div className="dc-trip-transit-opt-notes">{opt.notes}</div>}
                          <div className="dc-trip-transit-opt-sites">
                            {opt.bookingSites.map((s, j) => (
                              <a
                                key={j}
                                href={s.url}
                                target="_blank"
                                rel="noopener noreferrer"
                                className={`dc-trip-site-btn ${s.official ? 'official' : 'thirdparty'}`}
                              >
                                {s.name} {s.official && '✓'}
                              </a>
                            ))}
                          </div>
                          {opt.leadTimeDays && (
                            <a
                              className="dc-trip-cal-btn"
                              href={transitReminderUrl(
                                `${transitInfo.name} (${opt.provider})`,
                                day.date,
                                opt.leadTimeDays,
                                opt.notes,
                                opt.bookingSites[0]?.url
                              )}
                              target="_blank"
                              rel="noopener noreferrer"
                            >
                              📅 {opt.leadTimeDays}일 전 알림 캘린더에 추가
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* 일별 카드 */}
              <div className="dc-trip-day">
                <div className="dc-trip-day-header">
                  <div className="dc-trip-day-date">{formatDate(day.date)}</div>
                  <div className="dc-trip-day-meta">
                    {(() => {
                      const dayA = analysis?.dayAnalyses[dayIdx];
                      if (!dayA || dayA.score === null) return null;
                      const cls = dayA.score >= 80 ? 'high' : dayA.score >= 60 ? 'mid' : 'low';
                      return (
                        <span className={`dc-trip-day-score score-${cls}`} title={`동선 점수 ${dayA.score}/100`}>
                          {dayA.score}
                        </span>
                      );
                    })()}
                    {dayCity && (
                      <span className="dc-trip-day-city">
                        {dayCity === 'rome' && '로마'}
                        {dayCity === 'florence' && '피렌체'}
                        {dayCity === 'milan' && '밀라노'}
                        {dayCity === 'venice' && '베네치아'}
                      </span>
                    )}
                  </div>
                </div>

                {/* dayInfo — 확정된 항공/열차/호텔/예약 정보 (AARON_CONFIRMED_TRIP에서 로드된 데이터) */}
                {day.dayInfo && (
                  <div style={{
                    margin: '10px 12px 0',
                    padding: '10px 12px',
                    background: 'linear-gradient(135deg, #fff5f0, #fef8f0)',
                    borderLeft: '3px solid #b85b3f',
                    borderRadius: 6,
                    fontSize: 12,
                    lineHeight: 1.5,
                    color: '#4a3529',
                  }}>
                    {day.dayInfo.title && (
                      <div style={{fontWeight: 700, marginBottom: 6, color: '#8b3a1e', fontSize: 12.5}}>
                        📌 {day.dayInfo.title}
                      </div>
                    )}
                    {day.dayInfo.reservations?.map((r, i) => (
                      <div key={`r-${i}`} style={{marginBottom: 4, padding: '4px 8px', background: '#fff', borderRadius: 4, borderLeft: '2px solid #4a7c59'}}>
                        <span style={{fontWeight: 600, color: '#4a7c59'}}>{r.time}</span> · {r.label}
                      </div>
                    ))}
                    {day.dayInfo.transit?.map((t, i) => (
                      <div key={`t-${i}`} style={{marginBottom: 4, padding: '4px 8px', background: '#fff', borderRadius: 4, borderLeft: '2px solid #7a9e8f'}}>
                        {t.label}
                      </div>
                    ))}
                    {day.dayInfo.hotel && (
                      <div style={{marginBottom: 4, padding: '4px 8px', background: '#fff', borderRadius: 4, borderLeft: '2px solid #b8860b'}}>
                        {day.dayInfo.hotel}
                      </div>
                    )}
                    {day.dayInfo.note && (
                      <div style={{marginTop: 4, fontSize: 11, color: '#7a5a3a', fontStyle: 'italic'}}>
                        💡 {day.dayInfo.note}
                      </div>
                    )}
                  </div>
                )}

                <div className="dc-trip-day-attractions">
                  {(() => {
                    const schedule = computeDaySchedule(day, findAttraction, trip);
                    const hasAny = schedule.length > 0;
                    const dayEnd = hasAny ? schedule.filter(s => s.endStr !== '—').slice(-1)[0]?.endStr : null;
                    const dayStart = hasAny ? schedule.filter(s => s.startStr !== '—')[0]?.startStr : null;
                    const hasFixed = schedule.some(s => s.fixed);
                    const hasConflict = schedule.some(s => s.conflict);
                    const hasOverflow = schedule.some(s => s.overflow);
                    const reorderedFromOriginal = schedule.some((s, i) => s.id !== day.attractionIds[i]);
                    if (!hasAny) return null;
                    return (
                      <div className={`dc-trip-day-timeline ${hasConflict || hasOverflow ? 'has-conflict' : ''}`}>
                        <span className="dc-trip-day-timeline-time">
                          🕐 {dayStart} ~ {dayEnd}
                        </span>
                        {hasFixed && (
                          <span className="dc-trip-day-timeline-locked" title="예약 확정된 슬롯">
                            🔒 {schedule.filter(s => s.fixed).length}개 고정
                          </span>
                        )}
                        {reorderedFromOriginal && !hasOverflow && (
                          <span className="dc-trip-day-timeline-reorder" title="예약 시간 맞춰 자동 재배치">
                            ✨ 자동 재정렬
                          </span>
                        )}
                        {hasOverflow && (
                          <span className="dc-trip-day-timeline-overflow">⚠️ 일정 초과 — {schedule.filter(s => s.overflow).length}개 미배치</span>
                        )}
                        {hasConflict && (
                          <span className="dc-trip-day-timeline-conflict">⚠️ 시간 충돌</span>
                        )}
                      </div>
                    );
                  })()}
                  {(() => {
                    const schedule = computeDaySchedule(day, findAttraction, trip);
                    const reorderedFromOriginal = schedule.some((s, i) => s.id !== day.attractionIds[i]);
                    return schedule.map((sched) => {
                      const attractionId = sched.id;
                      const attr = findAttraction(attractionId);
                      if (!attr) return null;
                      const res = getReservationInfo(attractionId);
                      const expanded = expandedAttraction === `${dayIdx}-${attractionId}`;
                      const urgencyEmoji = {
                        critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', none: ''
                      }[res.urgency] || '';
                      const urgencyLabel = {
                        critical: '지금 예약!', high: '1개월 전', medium: '2~3주 전', low: '1주 전 OK', none: '예약 불필요'
                      }[res.urgency];

                      const closure = getClosureStatus(attractionId, day.date);

                      return (
                        <div key={attractionId} className={`dc-trip-attr ${closure?.status === 'closed' ? 'closed' : ''} ${sched?.conflict ? 'conflict' : ''} ${sched?.overflow ? 'overflow' : ''}`}>
                          <button
                            className="dc-trip-attr-row"
                            onClick={() => setExpandedAttraction(expanded ? null : `${dayIdx}-${attractionId}`)}
                          >
                            {sched && (
                              <span className={`dc-trip-attr-time ${sched.fixed ? 'fixed' : ''} ${sched.overflow ? 'overflow' : ''}`}>
                                {sched.fixed ? '🔒 ' : ''}{sched.overflow ? '⚠️' : sched.startStr}
                              </span>
                            )}
                            <span className="dc-trip-attr-emoji">{attr.emoji}</span>
                            <span className="dc-trip-attr-name">{attr.name}</span>
                            {urgencyEmoji && (
                              <span className={`dc-trip-attr-badge urg-${res.urgency}`}>
                                {urgencyEmoji} {urgencyLabel}
                              </span>
                            )}
                            <ChevronRight
                              size={14}
                              className="dc-trip-attr-chev"
                              style={{ transform: expanded ? 'rotate(90deg)' : 'none' }}
                            />
                          </button>
                          {sched?.conflict && (
                            <div className="dc-trip-conflict">⚠️ {sched.conflict}</div>
                          )}
                        {closure && (
                          <div className={`dc-trip-closure ${closure.status}`}>
                            {closure.status === 'closed' ? '⚠️ 휴관일!' : '⏰ 시간 제한'} — {closure.notes}
                          </div>
                        )}

                        {expanded && (
                          <BookingPanel
                            attr={attr}
                            visitDate={day.date}
                            res={res}
                            trip={trip}
                            onUpdateBooking={(patch) => update(updateBooking(trip, attractionId, patch))}
                            onRemove={() => {
                              addAttractionToDay(dayIdx, attractionId);
                              setExpandedAttraction(null);
                            }}
                            onOpenDocent={() => push({ name: 'attraction', attractionId })}
                          />
                        )}
                      </div>
                    );
                  });
                  })()}

                  <div className="dc-trip-day-actions">
                    <button
                      className="dc-trip-add-btn"
                      onClick={() => setShowPicker({ dayIdx })}
                    >
                      + 명소 추가
                    </button>
                    {day.attractionIds.length === 0 && (
                      <>
                        <button
                          className="dc-trip-course-btn"
                          onClick={() => setShowCourses({ dayIdx })}
                        >
                          ✨ 추천 코스
                        </button>
                        {(() => {
                          const inferred = inferCityForDay(trip, dayIdx, getDayCity);
                          if (!inferred) return null;
                          const cityLabel = { rome: '로마', florence: '피렌체', milan: '밀라노', venice: '베네치아' }[inferred];
                          return (
                            <button
                              className="dc-trip-auto-btn"
                              onClick={() => autoFillDay(dayIdx)}
                              title={`인접 일정 기준 ${cityLabel} 자동 채우기`}
                            >
                              🎯 {cityLabel} 자동 채우기
                            </button>
                          );
                        })()}
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <button className="dc-trip-reset" onClick={resetTrip}>
        🗑 일정 초기화
      </button>

      {/* 명소 선택 모달 */}
      {showPicker && (
        <AttractionPicker
          dayIdx={showPicker.dayIdx}
          dayDate={trip.days[showPicker.dayIdx].date}
          selectedIds={trip.days[showPicker.dayIdx].attractionIds}
          onToggle={(aid) => addAttractionToDay(showPicker.dayIdx, aid)}
          onClose={() => setShowPicker(null)}
        />
      )}

      {/* 추천 코스 모달 */}
      {showCourses && (
        <CoursePicker
          dayDate={trip.days[showCourses.dayIdx].date}
          inferredCity={inferCityForDay(trip, showCourses.dayIdx, getDayCity)}
          assignedElsewhere={getAssignedAttractionIds(trip, showCourses.dayIdx)}
          onApply={(attractionIds) => {
            applyCourse(showCourses.dayIdx, attractionIds);
            setShowCourses(null);
          }}
          onClose={() => setShowCourses(null)}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BookingPanel — 예약 상태 추적 + 캘린더 통합
// ─────────────────────────────────────────────────────────
function BookingPanel({ attr, visitDate, res, trip, onUpdateBooking, onRemove, onOpenDocent }) {
  const booking = getBookingData(trip, attr.id) || {};
  const status = booking.status || 'unbooked';
  const openInfo = getBookingOpenInfo(attr.id, visitDate);
  const [editing, setEditing] = useState(false);
  const [confirmation, setConfirmation] = useState(booking.confirmation || '');
  const [slotTime, setSlotTime] = useState(booking.slotTime || '10:00');
  const [bookingNotes, setBookingNotes] = useState(booking.notes || '');

  // 알람 등록 시점
  const handleSetReminder = () => {
    onUpdateBooking({
      status: 'reminder-set',
      reminderDate: openInfo?.date,
      reminderSetAt: new Date().toISOString(),
    });
  };

  const handleMarkBooked = () => {
    setEditing(true);
  };

  const handleSaveBooking = () => {
    onUpdateBooking({
      status: 'booked',
      confirmation: confirmation.trim(),
      slotTime: slotTime,
      notes: bookingNotes.trim(),
      bookedAt: new Date().toISOString(),
    });
    setEditing(false);
  };

  const handleCancel = () => {
    if (!window.confirm('예약을 취소 상태로 변경하시겠습니까? (캘린더 이벤트는 수동으로 삭제 필요)')) return;
    onUpdateBooking({ status: 'cancelled', cancelledAt: new Date().toISOString() });
  };

  const handleReset = () => {
    if (!window.confirm('예약 상태를 초기화하시겠습니까?')) return;
    onUpdateBooking(null);
  };

  // 방문 시간 캘린더 URL
  const visitUrl = (status === 'booked' && booking.slotTime)
    ? visitCalendarUrl(
        attr.name,
        visitDate,
        booking.slotTime,
        attr.overview?.duration_min || 60,
        booking.confirmation,
        res.sites?.[0]?.url
      )
    : null;

  const reminderUrl = openInfo
    ? attractionReminderUrlV2(attr.name, visitDate, attr.id, res.sites?.[0]?.url)
    : null;

  return (
    <div className="dc-trip-attr-detail">
      {/* 도슨트 (오디오 가이드) 바로가기 */}
      {onOpenDocent && (
        <button className="dc-trip-attr-docent-btn" onClick={onOpenDocent}>
          🎧 도슨트로 보기 — 오디오 가이드 · 포인트 · 평면도
        </button>
      )}

      {res.notes && <div className="dc-trip-attr-notes">{res.notes}</div>}

      {/* 예약 팁 (디테일) */}
      {res.tips && res.tips.length > 0 && (
        <details className="dc-book-tips">
          <summary>💡 예약 팁 ({res.tips.length})</summary>
          <ul className="dc-book-tips-list">
            {res.tips.map((tip, i) => <li key={i}>{tip}</li>)}
          </ul>
        </details>
      )}

      {/* 정확한 예약 오픈 시점 안내 */}
      {openInfo && (
        <div className={`dc-book-open-info type-${openInfo.type}`}>
          📅 <strong>예약 오픈 시점: {openInfo.date}</strong>
          <div className="dc-book-open-notes">{openInfo.notes}</div>
        </div>
      )}

      {/* 예약 사이트 */}
      {res.sites && res.sites.length > 0 && (
        <div className="dc-trip-attr-sites">
          <div className="dc-trip-attr-sites-label">예약 사이트:</div>
          <div className="dc-trip-attr-sites-row">
            {res.sites.map((s, i) => (
              <a
                key={i}
                href={s.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`dc-trip-site-btn ${s.official ? 'official' : 'thirdparty'}`}
              >
                {s.name} {s.official && '✓'}
              </a>
            ))}
          </div>
        </div>
      )}

      {/* 예약 상태 + 액션 */}
      {res.urgency !== 'none' && (
        <div className="dc-book-status-section">
          <div className={`dc-book-status status-${status}`}>
            {status === 'unbooked' && '🔔 예약 안 함'}
            {status === 'reminder-set' && `⏰ 알람 설정됨 (${booking.reminderDate})`}
            {status === 'booked' && `✅ 예약 완료${booking.confirmation ? ` · ${booking.confirmation}` : ''}${booking.slotTime ? ` · ${booking.slotTime}` : ''}`}
            {status === 'cancelled' && '❌ 취소됨'}
          </div>

          {/* 예약 입력 폼 (편집 모드) */}
          {editing && (
            <div className="dc-book-form">
              <label className="dc-book-form-row">
                <span>확인번호</span>
                <input
                  type="text"
                  value={confirmation}
                  onChange={(e) => setConfirmation(e.target.value)}
                  placeholder="예: TIC-12345"
                  className="dc-book-input"
                />
              </label>
              <label className="dc-book-form-row">
                <span>방문 시간</span>
                <input
                  type="time"
                  value={slotTime}
                  onChange={(e) => setSlotTime(e.target.value)}
                  className="dc-book-input"
                />
              </label>
              <label className="dc-book-form-row">
                <span>메모</span>
                <input
                  type="text"
                  value={bookingNotes}
                  onChange={(e) => setBookingNotes(e.target.value)}
                  placeholder="추가 정보"
                  className="dc-book-input"
                />
              </label>
              <div className="dc-book-form-actions">
                <button className="dc-book-btn-save" onClick={handleSaveBooking}>저장</button>
                <button className="dc-book-btn-cancel" onClick={() => setEditing(false)}>취소</button>
              </div>
            </div>
          )}

          {/* 상태별 액션 버튼 */}
          {!editing && (
            <div className="dc-book-actions">
              {(status === 'unbooked' || status === 'reminder-set') && reminderUrl && (
                <a
                  className="dc-trip-cal-btn"
                  href={reminderUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={handleSetReminder}
                >
                  📅 {status === 'reminder-set' ? '알람 다시 추가' : '예약 알람 캘린더에 추가'}
                </a>
              )}

              {(status === 'unbooked' || status === 'reminder-set') && (
                <button className="dc-book-btn-mark" onClick={handleMarkBooked}>
                  ✅ 예약 완료로 표시
                </button>
              )}

              {status === 'booked' && (
                <>
                  {visitUrl && (
                    <a
                      className="dc-trip-cal-btn"
                      href={visitUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      📅 방문 시간 ({booking.slotTime}) 캘린더에 추가
                    </a>
                  )}
                  <button className="dc-book-btn-edit" onClick={handleMarkBooked}>
                    ✏️ 예약 정보 수정
                  </button>
                  <button className="dc-book-btn-cancel-booking" onClick={handleCancel}>
                    🗑 예약 취소
                  </button>
                </>
              )}

              {status === 'cancelled' && (
                <>
                  <div className="dc-book-cancel-note">
                    ⚠️ 캘린더에 이미 추가된 이벤트는 수동으로 삭제 필요
                  </div>
                  <button className="dc-book-btn-mark" onClick={handleReset}>
                    🔄 상태 초기화 (다시 예약)
                  </button>
                </>
              )}
            </div>
          )}
        </div>
      )}

      <button
        className="dc-trip-attr-remove"
        onClick={(e) => {
          e.stopPropagation();
          onRemove();
        }}
      >
        일정에서 제거
      </button>
    </div>
  );
}


// ─────────────────────────────────────────────────────────
// ChecklistPanel — 예약 준비 체크리스트 (자동 + 수동, localStorage 영구 저장)
// ─────────────────────────────────────────────────────────
function ChecklistPanel({ trip, update, findAttraction }) {
  const [open, setOpen] = useState(false);
  const [addingCustom, setAddingCustom] = useState(false);
  const [newLabel, setNewLabel] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState(null);
  const [editNotes, setEditNotes] = useState('');

  const checklist = getChecklist(trip);
  const progress = getChecklistProgress(checklist.items);
  const groups = groupChecklistByCategory(checklist.items);

  // 첫 진입 시 자동 동기화
  useEffect(() => {
    if (!checklist.lastAutoSyncAt) {
      update(mergeAutoChecklist(trip, findAttraction));
    }
  }, []);

  const handleResync = () => {
    update(mergeAutoChecklist(trip, findAttraction));
  };

  const handleToggle = (itemId, checked) => {
    update(updateChecklistItem(trip, itemId, { checked }));
  };

  const handleAddCustom = () => {
    if (!newLabel.trim()) return;
    update(addChecklistItem(trip, {
      label: newLabel.trim(),
      notes: newNotes.trim(),
      dueDate: newDueDate || null,
      category: 'custom',
    }));
    setNewLabel(''); setNewNotes(''); setNewDueDate('');
    setAddingCustom(false);
  };

  const handleRemove = (itemId) => {
    if (!window.confirm('이 항목을 삭제하시겠습니까?')) return;
    update(removeChecklistItem(trip, itemId));
  };

  const handleSaveNotes = (itemId) => {
    update(updateChecklistItem(trip, itemId, { notes: editNotes }));
    setEditingId(null);
  };

  const fmtDate = (iso) => {
    if (!iso) return '';
    const d = new Date(iso);
    return `${d.getMonth() + 1}/${d.getDate()}`;
  };

  const daysUntilDue = (dueDate) => {
    if (!dueDate) return null;
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(dueDate); due.setHours(0, 0, 0, 0);
    const diff = Math.round((due - today) / (1000 * 60 * 60 * 24));
    return diff;
  };

  const categoryLabels = {
    hotel: '🏨 호텔',
    train: '🚆 기차',
    reservation: '🎫 명소 예약',
    custom: '✏️ 직접 추가',
  };

  return (
    <div className={`dc-checklist ${progress.pct === 100 ? 'complete' : ''}`}>
      <button
        className="dc-checklist-head"
        onClick={() => setOpen((v) => !v)}
      >
        <div className="dc-checklist-progress-ring">
          <svg viewBox="0 0 36 36" className="dc-checklist-ring-svg">
            <path
              className="dc-checklist-ring-bg"
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
              fill="none"
            />
            <path
              className="dc-checklist-ring-fg"
              d="M18 2.5 a 15.5 15.5 0 0 1 0 31 a 15.5 15.5 0 0 1 0 -31"
              fill="none"
              strokeDasharray={`${progress.pct}, 100`}
            />
          </svg>
          <div className="dc-checklist-pct">{progress.pct}%</div>
        </div>
        <div className="dc-checklist-summary">
          <div className="dc-checklist-title">✅ 예약 체크리스트</div>
          <div className="dc-checklist-meta">
            {progress.done} / {progress.total} 완료
            {progress.pct === 100 && <span className="dc-checklist-all-done"> · 전부 완료! 🎉</span>}
          </div>
        </div>
        <ChevronRight size={16} className="dc-checklist-chev" style={{ transform: open ? 'rotate(90deg)' : 'none' }} />
      </button>

      {open && (
        <div className="dc-checklist-body">
          {/* 자동 동기화 + 수동 추가 버튼 */}
          <div className="dc-checklist-actions-row">
            <button className="dc-checklist-action" onClick={handleResync}>
              🔄 자동 항목 재생성
            </button>
            <button className="dc-checklist-action" onClick={() => setAddingCustom((v) => !v)}>
              {addingCustom ? '취소' : '＋ 항목 추가'}
            </button>
          </div>

          {/* 새 항목 추가 폼 */}
          {addingCustom && (
            <div className="dc-checklist-add-form">
              <input
                type="text"
                placeholder="예: 여행 보험 가입"
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                className="dc-checklist-input"
              />
              <input
                type="date"
                value={newDueDate}
                onChange={(e) => setNewDueDate(e.target.value)}
                className="dc-checklist-input"
              />
              <input
                type="text"
                placeholder="메모 (선택)"
                value={newNotes}
                onChange={(e) => setNewNotes(e.target.value)}
                className="dc-checklist-input"
              />
              <button className="dc-checklist-save" onClick={handleAddCustom}>
                추가
              </button>
            </div>
          )}

          {/* 카테고리별 항목 */}
          {Object.entries(groups).map(([cat, items]) => {
            if (!items.length) return null;
            const catLabel = categoryLabels[cat] || cat;
            const catDone = items.filter((i) => i.checked).length;
            return (
              <div key={cat} className="dc-checklist-group">
                <div className="dc-checklist-group-head">
                  {catLabel} <span className="dc-checklist-group-count">({catDone}/{items.length})</span>
                </div>
                <ul className="dc-checklist-list">
                  {items.map((item) => {
                    const due = daysUntilDue(item.dueDate);
                    const urgent = due !== null && due >= 0 && due <= 7 && !item.checked;
                    const overdue = due !== null && due < 0 && !item.checked;
                    return (
                      <li
                        key={item.id}
                        className={`dc-checklist-item ${item.checked ? 'checked' : ''} ${urgent ? 'urgent' : ''} ${overdue ? 'overdue' : ''}`}
                      >
                        <label className="dc-checklist-row">
                          <input
                            type="checkbox"
                            checked={item.checked}
                            onChange={(e) => handleToggle(item.id, e.target.checked)}
                            className="dc-checklist-check"
                          />
                          <div className="dc-checklist-content">
                            <div className="dc-checklist-label">
                              {item.label}
                            </div>
                            {item.dueDate && (
                              <div className="dc-checklist-due">
                                예약 시점: {fmtDate(item.dueDate)}
                                {due !== null && !item.checked && (
                                  <span className={`dc-checklist-due-badge ${overdue ? 'overdue' : urgent ? 'urgent' : ''}`}>
                                    {overdue ? `D+${Math.abs(due)} 지남` : due === 0 ? '오늘' : `D-${due}`}
                                  </span>
                                )}
                              </div>
                            )}
                            {editingId === item.id ? (
                              <div className="dc-checklist-edit-notes">
                                <input
                                  type="text"
                                  value={editNotes}
                                  onChange={(e) => setEditNotes(e.target.value)}
                                  className="dc-checklist-input"
                                  autoFocus
                                />
                                <button
                                  className="dc-checklist-save-sm"
                                  onClick={(e) => { e.preventDefault(); handleSaveNotes(item.id); }}
                                >저장</button>
                              </div>
                            ) : (
                              item.notes && <div className="dc-checklist-notes">{item.notes}</div>
                            )}
                          </div>
                        </label>
                        <div className="dc-checklist-item-actions">
                          {editingId !== item.id && (
                            <button
                              className="dc-checklist-icon-btn"
                              onClick={(e) => {
                                e.stopPropagation();
                                setEditingId(item.id);
                                setEditNotes(item.notes || '');
                              }}
                              title="메모 편집"
                            >✏️</button>
                          )}
                          {!item.autoGenerated && (
                            <button
                              className="dc-checklist-icon-btn"
                              onClick={(e) => { e.stopPropagation(); handleRemove(item.id); }}
                              title="삭제"
                            >🗑</button>
                          )}
                        </div>
                      </li>
                    );
                  })}
                </ul>
              </div>
            );
          })}

          {checklist.items.length === 0 && (
            <div className="dc-checklist-empty">
              체크리스트가 비어 있습니다. 〈🔄 자동 항목 재생성〉을 눌러 일정 기반 자동 추가하세요.
            </div>
          )}

          {checklist.lastAutoSyncAt && (
            <div className="dc-checklist-sync-time">
              마지막 자동 동기화: {new Date(checklist.lastAutoSyncAt).toLocaleString('ko-KR')}
            </div>
          )}
        </div>
      )}
    </div>
  );
}


function AttractionPicker({ dayIdx, dayDate, selectedIds, onToggle, onClose }) {
  const [tabCity, setTabCity] = useState('rome');
  const cityAttrs = ATTRACTIONS.filter((a) => a.city === tabCity);

  function formatDate(iso) {
    const d = new Date(iso);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  }

  return (
    <div className="dc-trip-picker-overlay" onClick={onClose}>
      <div className="dc-trip-picker" onClick={(e) => e.stopPropagation()}>
        <div className="dc-trip-picker-header">
          <div className="dc-trip-picker-title">
            {formatDate(dayDate)}에 명소 추가
          </div>
          <button className="dc-trip-picker-close" onClick={onClose}>
            ✕
          </button>
        </div>

        <div className="dc-trip-picker-tabs">
          {['rome', 'florence', 'milan'].map((c) => (
            <button
              key={c}
              className={`dc-trip-picker-tab ${tabCity === c ? 'active' : ''}`}
              onClick={() => setTabCity(c)}
            >
              {c === 'rome' && '로마'}
              {c === 'florence' && '피렌체'}
              {c === 'milan' && '밀라노'}
            </button>
          ))}
        </div>

        <div className="dc-trip-picker-list">
          {cityAttrs.map((a) => {
            const selected = selectedIds.includes(a.id);
            const res = getReservationInfo(a.id);
            const closure = getClosureStatus(a.id, dayDate);
            const urgencyEmoji = {
              critical: '🔴', high: '🟠', medium: '🟡', low: '🟢', none: ''
            }[res.urgency];
            return (
              <button
                key={a.id}
                className={`dc-trip-picker-item ${selected ? 'selected' : ''} ${closure?.status === 'closed' ? 'closed-day' : ''}`}
                onClick={() => onToggle(a.id)}
              >
                <span className="dc-trip-picker-emoji">{a.emoji}</span>
                <div className="dc-trip-picker-info">
                  <div className="dc-trip-picker-name">{a.name}</div>
                  <div className="dc-trip-picker-sub">
                    {urgencyEmoji && <span>{urgencyEmoji} </span>}
                    {a.points.length}점 · {a.overview?.duration || '시간 미정'}
                  </div>
                  {closure && (
                    <div className={`dc-trip-picker-closure ${closure.status}`}>
                      {closure.status === 'closed' ? '⚠️ 휴관일' : '⏰ 시간 제한'} · {closure.notes}
                    </div>
                  )}
                </div>
                {selected && <Check size={18} className="dc-trip-picker-check" />}
              </button>
            );
          })}
        </div>

        <button className="dc-trip-picker-done" onClick={onClose}>
          완료
        </button>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CoursePicker — 추천 코스 모달
// ─────────────────────────────────────────────────────────
function CoursePicker({ dayDate, inferredCity, assignedElsewhere, onApply, onClose }) {
  const [tabCity, setTabCity] = useState(inferredCity || 'rome');
  const courses = getRecommendedCourses(tabCity);
  const elsewhereSet = assignedElsewhere || new Set();

  function formatDate(iso) {
    const d = new Date(iso);
    const days = ['일', '월', '화', '수', '목', '금', '토'];
    return `${d.getMonth() + 1}/${d.getDate()} (${days[d.getDay()]})`;
  }

  return (
    <div className="dc-trip-picker-overlay" onClick={onClose}>
      <div className="dc-trip-picker" onClick={(e) => e.stopPropagation()}>
        <div className="dc-trip-picker-header">
          <div className="dc-trip-picker-title">
            {formatDate(dayDate)} — 추천 코스
          </div>
          <button className="dc-trip-picker-close" onClick={onClose}>✕</button>
        </div>

        <div className="dc-trip-picker-tabs">
          {['rome', 'florence', 'milan'].map((c) => (
            <button
              key={c}
              className={`dc-trip-picker-tab ${tabCity === c ? 'active' : ''}`}
              onClick={() => setTabCity(c)}
            >
              {c === 'rome' && '로마'}
              {c === 'florence' && '피렌체'}
              {c === 'milan' && '밀라노'}
            </button>
          ))}
        </div>

        <div className="dc-trip-picker-list">
          {courses.map((course) => {
            // 코스 안 명소들 중 그 날 휴관인 게 있으면 경고
            const closedAttrs = course.attractionIds
              .map((aid) => {
                const closure = getClosureStatus(aid, dayDate);
                if (closure?.status === 'closed') {
                  const a = findAttraction(aid);
                  return a?.name;
                }
                return null;
              })
              .filter(Boolean);

            const assignedHere = course.attractionIds.filter((aid) => elsewhereSet.has(aid));
            return (
              <div key={course.id} className="dc-course-item">
                <div className="dc-course-item-head">
                  <div className="dc-course-item-name">{course.name}</div>
                  <div className="dc-course-item-duration">{course.durationHint}</div>
                </div>
                <div className="dc-course-item-summary">{course.summary}</div>
                <div className="dc-course-item-attrs">
                  {course.attractionIds.map((aid) => {
                    const a = findAttraction(aid);
                    if (!a) return null;
                    const closure = getClosureStatus(aid, dayDate);
                    const inOtherDay = elsewhereSet.has(aid);
                    return (
                      <span
                        key={aid}
                        className={`dc-course-item-attr ${closure?.status === 'closed' ? 'closed' : ''} ${inOtherDay ? 'assigned' : ''}`}
                      >
                        {a.emoji} {a.name}{inOtherDay ? ' (다른 날)' : ''}
                      </span>
                    );
                  })}
                </div>
                {assignedHere.length > 0 && (
                  <div className="dc-course-item-info">
                    ℹ️ {assignedHere.length}개는 이미 다른 날에 — 적용 시 자동 제외됨
                  </div>
                )}
                {closedAttrs.length > 0 && (
                  <div className="dc-course-item-warning">
                    ⚠️ 이 날 휴관: {closedAttrs.join(', ')}
                  </div>
                )}
                <button
                  className="dc-course-item-apply"
                  onClick={() => onApply(course.attractionIds)}
                >
                  이 코스 적용
                </button>
              </div>
            );
          })}
        </div>
      </div>
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

      <button className="dc-trip-cta" onClick={() => push({ name: 'trip' })}>
        <div className="dc-trip-cta-icon">📅</div>
        <div className="dc-trip-cta-body">
          <div className="dc-trip-cta-title">내 일정</div>
          <div className="dc-trip-cta-sub">출발/복귀 + 매일 명소 · 예약 사이트 + 캘린더 알림</div>
        </div>
        <ChevronRight size={16} className="dc-scan-cta-chev" />
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
function AttractionView({ attractionId, initialView, initialRouteId, push, pop, replace, favorites }) {
  const attraction = findAttraction(attractionId);
  const [view, setViewLocal] = useState(initialView || 'list'); // 'list' | 'floorplan' | 'routes'
  // 뷰 전환 시 nav stack에도 반영 — 다시 돌아왔을 때 마지막 뷰 복원
  const setView = useCallback((v) => {
    setViewLocal(v);
    if (replace) replace({ view: v });
  }, [replace]);
  if (!attraction) return <div>명소를 찾을 수 없습니다.</div>;

  const accent = attraction.coverHue;
  const hasFloorPlan = attractionId === 'borghese' || attractionId === 'vatican' || attractionId === 'uffizi' || attractionId === 'foro' || attractionId === 'colosseum' || attractionId === 'duomo-milan' || attractionId === 'capitolini' || attractionId === 'vecchio' || attractionId === 'duomo' || attractionId === 'castel' || attractionId === 'sforzesco' || attractionId === 'santacroce' || attractionId === 'bargello' || attractionId === 'brera';
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

        {view === 'floorplan' && attractionId === 'colosseum' && (
          <ColosseumFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'duomo-milan' && (
          <DuomoMilanoFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'capitolini' && (
          <CapitoliniFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'vecchio' && (
          <VecchioFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'duomo' && (
          <DuomoFlorenceFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'castel' && (
          <CastelFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'sforzesco' && (
          <SforzescoFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'santacroce' && (
          <SantaCroceFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'bargello' && (
          <BargelloFloorPlan
            points={attraction.points}
            accent={accent}
            onPointClick={(pid) => push({ name: 'point', attractionId, pointId: pid })}
          />
        )}

        {view === 'floorplan' && attractionId === 'brera' && (
          <BreraFloorPlan
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
            initialRouteId={initialRouteId}
            replace={replace}
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
function RouteGuide({ routes, points, accent, initialRouteId, replace, onPointClick }) {
  // 처음 보였을 때 초기값 — nav stack에 저장된 게 있으면 그걸, 없으면 첫 번째
  const fallback = routes[0].id;
  const valid = initialRouteId && routes.some(r => r.id === initialRouteId);
  const [selectedRouteId, setSelectedRouteIdLocal] = useState(valid ? initialRouteId : fallback);
  // 코스 변경 시 nav stack에도 반영 → 작품 갔다가 뒤로 와도 같은 코스 유지
  const setSelectedRouteId = useCallback((rid) => {
    setSelectedRouteIdLocal(rid);
    if (replace) replace({ routeId: rid });
  }, [replace]);
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

// ─────────────────────────────────────────────────────────
// ColosseumFloorPlan — 타원형 + 하이포지움 단면 (다층 구조)
// ─────────────────────────────────────────────────────────
function ColosseumFloorPlan({ points, accent, onPointClick }) {
  const [view, setView] = useState('top');  // 'top' or 'section'

  const POINT_TO_AREA = {
    // Top view
    'exterior-arches': 'outer-ring',
    'colosseum-cavea': 'cavea',
    'velarium-awning': 'awning',
    'gladiator-types': 'arena',
    'arch-constantine': 'arch-constantine',
    'ludus-magnus': 'ludus-magnus',
    // Section view (hypogeum)
    'hypogeum': 'hypogeum-section',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  // viewBox 600x500
  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-toggle">
        <button
          className={`dc-floor-btn ${view === 'top' ? 'active' : ''}`}
          onClick={() => setView('top')}
        >
          평면도 (위에서)
        </button>
        <button
          className={`dc-floor-btn ${view === 'section' ? 'active' : ''}`}
          onClick={() => setView('section')}
        >
          단면도 (하이포지움)
        </button>
      </div>

      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          {view === 'top' ? '콜로세움 + 주변 — 위에서 본 모습' : '콜로세움 단면 — 지하 하이포지움'}
        </div>
        <div className="dc-floor-label-sub">
          {view === 'top'
            ? '타원 188m × 156m · 콘스탄티누스 개선문(서쪽) · 루두스 마그누스(동쪽)'
            : '아레나 바닥 아래 2층 지하 — 검투사·맹수 대기 + 엘리베이터 32대'}
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="colosseum-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#colosseum-grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {view === 'top' && (
            <>
              {/* Arch of Constantine (west side) */}
              <g>
                <rect
                  x="40" y="220" width="80" height="60" rx="4"
                  fill="var(--bg)"
                  stroke={pointsByArea['arch-constantine'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['arch-constantine'] ? 1.5 : 1}
                />
                <text x="48" y="240" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Arco di Costantino
                </text>
                <text x="48" y="252" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  콘스탄티누스 개선문
                </text>
                <text x="48" y="262" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  315 AD
                </text>
              </g>

              {/* Colosseum — outer ellipse */}
              <g>
                <ellipse
                  cx="320" cy="250" rx="155" ry="125"
                  fill="rgba(184,91,63,0.04)"
                  stroke={pointsByArea['outer-ring'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['outer-ring'] ? 1.8 : 1}
                />
                {/* Cavea (seating) — middle ellipse */}
                <ellipse
                  cx="320" cy="250" rx="110" ry="88"
                  fill="rgba(184,91,63,0.06)"
                  stroke={pointsByArea['cavea'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['cavea'] ? 1.5 : 1}
                  strokeDasharray="4 3"
                  opacity="0.7"
                />
                {/* Arena — inner ellipse */}
                <ellipse
                  cx="320" cy="250" rx="70" ry="50"
                  fill="rgba(201,169,97,0.08)"
                  stroke={pointsByArea['arena'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['arena'] ? 1.5 : 1}
                />
                {/* Labels */}
                <text x="320" y="118" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  외부 아치 (4층)
                </text>
                <text x="320" y="175" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR" opacity="0.85">
                  카베아 (관객석 5만석)
                </text>
                <text x="320" y="250" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Arena
                </text>
                <text x="320" y="262" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  아레나 (검투사 무대)
                </text>
                
                {/* Velarium label (top) */}
                <text x="320" y="100" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                  ↑ 벨라리움 (천막)
                </text>
              </g>

              {/* Ludus Magnus (east side) */}
              <g>
                <rect
                  x="500" y="220" width="80" height="60" rx="4"
                  fill="var(--bg)"
                  stroke={pointsByArea['ludus-magnus'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['ludus-magnus'] ? 1.5 : 1}
                />
                <text x="508" y="240" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Ludus Magnus
                </text>
                <text x="508" y="252" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  루두스 마그누스
                </text>
                <text x="508" y="262" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  검투사 훈련소
                </text>
              </g>

              {/* Connecting lines */}
              <line x1="120" y1="250" x2="165" y2="250" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />
              <line x1="475" y1="250" x2="500" y2="250" stroke="var(--line)" strokeWidth="1" strokeDasharray="3 3" opacity="0.5" />

              {/* Scale */}
              <text x="320" y="395" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
                188m × 156m · 5만석 · 80년 완공 (CE)
              </text>
            </>
          )}

          {view === 'section' && (
            <>
              {/* Cross-section view */}
              {/* Sky/awning area */}
              <line x1="80" y1="80" x2="520" y2="80" stroke="var(--line)" strokeWidth="1" strokeDasharray="4 2" opacity="0.5" />
              <text x="300" y="74" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                ↑ 벨라리움 천막 (70m 높이)
              </text>

              {/* Stadium outer walls */}
              <polygon
                points="100,360 110,90 490,90 500,360"
                fill="rgba(184,91,63,0.04)"
                stroke="var(--line)"
                strokeWidth="1.5"
              />
              {/* Cavea seating (terraced) */}
              <polygon
                points="160,290 180,170 420,170 440,290"
                fill="rgba(184,91,63,0.08)"
                stroke="var(--line)"
                strokeWidth="1"
              />
              {/* Arena floor line */}
              <line x1="180" y1="290" x2="420" y2="290" stroke="var(--accent)" strokeWidth="2" />
              <text x="300" y="285" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                아레나 (모래 바닥)
              </text>

              {/* Hypogeum (highlighted) */}
              <rect
                x="180" y="295" width="240" height="80" rx="4"
                fill="rgba(201,169,97,0.10)"
                stroke="var(--accent)"
                strokeWidth="1.8"
              />
              <text x="300" y="320" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Hypogeum (지하)
              </text>
              <text x="300" y="338" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                2층 지하 — 검투사·맹수 대기실
              </text>
              <text x="300" y="354" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                엘리베이터 32대 (목재 + 도르래)
              </text>

              {/* Ground level line */}
              <line x1="80" y1="380" x2="520" y2="380" stroke="var(--text-faint)" strokeWidth="1.5" />
              <text x="300" y="395" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                지면 (외부)
              </text>

              {/* Side labels */}
              <text x="115" y="180" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR" transform="rotate(-90, 115, 180)">
                외부 아치 4층
              </text>
              <text x="200" y="210" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                관객석 (카베아)
              </text>
            </>
          )}

          {/* Render point dots based on current view */}
          {view === 'top' && (() => {
            const areas = [
              { id: 'outer-ring', cx: 320, cy: 130, label: '외부 아치' },
              { id: 'cavea', cx: 280, cy: 200, label: '카베아' },
              { id: 'awning', cx: 380, cy: 200, label: '벨라리움' },
              { id: 'arena', cx: 320, cy: 250, label: '아레나' },
              { id: 'arch-constantine', cx: 80, cy: 250, label: '개선문' },
              { id: 'ludus-magnus', cx: 540, cy: 250, label: '루두스' },
            ];
            return areas.map((area) => {
              const pts = pointsByArea[area.id] || [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                const cx = area.cx + offset;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={cx} cy={area.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={cx} y={area.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}

          {view === 'section' && (() => {
            const pts = pointsByArea['hypogeum-section'] || [];
            return pts.map((p, i) => (
              <g
                key={p.id}
                style={{ cursor: 'pointer' }}
                onClick={() => onPointClick(p.id)}
                onMouseEnter={() => setHoveredPoint(p.id)}
                onMouseLeave={() => setHoveredPoint(null)}
              >
                <circle
                  cx={300} cy={335}
                  r={hoveredPoint === p.id ? 14 : 11}
                  fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                  style={{ transition: 'all 0.15s' }}
                />
                <text
                  x={300} y={339}
                  fontSize="10" fill="var(--bg)"
                  fontFamily="DM Sans" fontWeight="600"
                  textAnchor="middle" pointerEvents="none"
                >
                  {String(p.idx).padStart(2, '0')}
                </text>
              </g>
            ));
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        {view === 'top' ? '위에서 본 모습 — 6점' : '단면도 — 1점 (하이포지움)'} · 번호 탭하면 작품 상세
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 7점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DuomoMilanoFloorPlan — 다층 수직 구조 (지하 → 본당 → 옥상 → 첨탑)
// ─────────────────────────────────────────────────────────
function DuomoMilanoFloorPlan({ points, accent, onPointClick }) {
  const [view, setView] = useState('section');  // 'section' (단면도) or 'plan' (평면도)

  const POINT_TO_AREA = {
    // Section view (vertical layout)
    'duomo-milan-facade': 'facade',
    'duomo-milan-interior': 'nave',
    'duomo-milan-glass': 'transept',
    'carlo-borromeo-crypt': 'crypt',
    'battistero-milan': 'archaeology',
    'duomo-milan-roof': 'roof',
    'duomo-milan-spires': 'spires',
    'madonnina': 'madonnina',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-toggle">
        <button
          className={`dc-floor-btn ${view === 'section' ? 'active' : ''}`}
          onClick={() => setView('section')}
        >
          단면도 (수직)
        </button>
        <button
          className={`dc-floor-btn ${view === 'plan' ? 'active' : ''}`}
          onClick={() => setView('plan')}
        >
          평면도 (위에서)
        </button>
      </div>

      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          {view === 'section' ? '두오모 디 밀라노 — 단면 (지하부터 첨탑까지)' : '두오모 디 밀라노 — 평면도 (본당 위에서)'}
        </div>
        <div className="dc-floor-label-sub">
          {view === 'section'
            ? '108.5m 높이 — 600년 공사 (1386~1965) · 마돈니나 황금 정상 · 옥상 패스 별도'
            : '라틴 십자형 본당 158m · 5 신랑 (5 nave) · 후진 + 익랑(transept)'}
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="dm-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#dm-grid)" />

          {view === 'section' && (
            <>
              {/* Vertical scale label on left */}
              <text x="20" y="60" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">108.5m</text>
              <text x="20" y="180" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">70m</text>
              <text x="20" y="280" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">45m</text>
              <text x="20" y="380" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">지면</text>
              <text x="20" y="440" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">-5m</text>

              {/* Vertical scale line */}
              <line x1="50" y1="50" x2="50" y2="450" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />
              
              {/* Madonnina at top */}
              <g>
                <polygon
                  points="295,30 305,30 300,55"
                  fill={pointsByArea['madonnina'] ? 'var(--accent)' : 'var(--gold)'}
                  stroke="var(--gold)" strokeWidth="1.5"
                />
                <text x="350" y="50" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Madonnina (108.5m)
                </text>
                <text x="350" y="62" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  황금 마돈나 첨탑 정상
                </text>
              </g>

              {/* Spires (forest of spires) */}
              <g>
                {[110, 150, 190, 230, 270, 310, 350, 390, 430, 470].map((x, i) => {
                  const h = 70 + (Math.abs(x - 290) < 40 ? 30 : 0);
                  return (
                    <polygon
                      key={i}
                      points={`${x-3},${h+120} ${x+3},${h+120} ${x},${h+80}`}
                      fill="rgba(184,91,63,0.15)"
                      stroke={pointsByArea['spires'] ? 'var(--accent)' : 'var(--line)'}
                      strokeWidth={pointsByArea['spires'] ? 1.2 : 0.8}
                    />
                  );
                })}
                <text x="350" y="155" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Spires (135개 첨탑)
                </text>
                <text x="350" y="167" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  첨탑의 숲
                </text>
              </g>

              {/* Roof terrace */}
              <g>
                <rect
                  x="110" y="220" width="380" height="35" rx="3"
                  fill="rgba(184,91,63,0.08)"
                  stroke={pointsByArea['roof'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['roof'] ? 1.5 : 1}
                />
                <text x="120" y="240" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Terrazza (옥상 — 패스 별도)
                </text>
              </g>

              {/* Main nave / interior */}
              <g>
                <polygon
                  points="100,260 500,260 490,375 110,375"
                  fill="rgba(184,91,63,0.06)"
                  stroke={pointsByArea['nave'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['nave'] ? 1.5 : 1}
                />
                <text x="190" y="295" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Navata (본당)
                </text>
                <text x="190" y="307" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  158m × 92m · 5 신랑
                </text>
              </g>

              {/* Transept / glass (stained glass windows on side) */}
              <g>
                <rect
                  x="380" y="265" width="40" height="105" rx="2"
                  fill="rgba(201,169,97,0.08)"
                  stroke={pointsByArea['transept'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['transept'] ? 1.2 : 0.8}
                />
                <text x="385" y="338" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR" textAnchor="middle" transform="rotate(-90, 400, 335)">
                  스테인드글라스
                </text>
              </g>

              {/* Facade */}
              <g>
                <rect
                  x="100" y="240" width="14" height="135" rx="2"
                  fill="rgba(201,169,97,0.10)"
                  stroke={pointsByArea['facade'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['facade'] ? 1.2 : 0.8}
                />
                <text x="92" y="320" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR" transform="rotate(-90, 95, 320)">
                  정면 파사드
                </text>
              </g>

              {/* Ground line */}
              <line x1="80" y1="378" x2="520" y2="378" stroke="var(--text-faint)" strokeWidth="1.5" />
              <text x="535" y="382" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">지면</text>

              {/* Crypt */}
              <g>
                <rect
                  x="240" y="385" width="120" height="30" rx="3"
                  fill="rgba(184,91,63,0.08)"
                  stroke={pointsByArea['crypt'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['crypt'] ? 1.5 : 1}
                />
                <text x="250" y="405" fontSize="9.5" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Cripta — 카를로 보로메오
                </text>
              </g>

              {/* Archaeology (Battistero) */}
              <g>
                <rect
                  x="150" y="420" width="300" height="35" rx="3"
                  fill="rgba(184,91,63,0.06)"
                  stroke={pointsByArea['archaeology'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['archaeology'] ? 1.5 : 1}
                />
                <text x="160" y="438" fontSize="9.5" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Area Archeologica
                </text>
                <text x="160" y="450" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  4세기 세례당 + 로마 유적 (지하)
                </text>
              </g>
            </>
          )}

          {view === 'plan' && (
            <>
              {/* Plan view — top-down */}
              {/* Piazza del Duomo */}
              <g>
                <rect
                  x="100" y="80" width="400" height="50" rx="4"
                  fill="rgba(201,169,97,0.04)"
                  stroke="var(--line)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.6"
                />
                <text x="300" y="110" textAnchor="middle" fontSize="9.5" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Piazza del Duomo (광장)
                </text>
              </g>

              {/* Facade strip */}
              <g>
                <rect
                  x="120" y="135" width="360" height="20" rx="3"
                  fill="rgba(201,169,97,0.10)"
                  stroke={pointsByArea['facade'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['facade'] ? 1.5 : 1}
                />
                <text x="300" y="150" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Noto Sans KR" fontWeight="500">
                  정면 파사드
                </text>
              </g>

              {/* Latin cross plan */}
              {/* Main nave (long body) */}
              <rect
                x="160" y="160" width="280" height="180" rx="4"
                fill="rgba(184,91,63,0.04)"
                stroke={pointsByArea['nave'] ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={pointsByArea['nave'] ? 1.5 : 1}
              />
              {/* Transept (cross arms) */}
              <rect
                x="120" y="240" width="360" height="50" rx="3"
                fill="rgba(184,91,63,0.05)"
                stroke={pointsByArea['transept'] ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={pointsByArea['transept'] ? 1.2 : 0.8}
                strokeDasharray={pointsByArea['transept'] ? 'none' : '3 3'}
                opacity={pointsByArea['transept'] ? 1 : 0.7}
              />
              {/* Apse (semicircle at top) */}
              <path
                d="M 200 160 Q 300 90, 400 160"
                fill="rgba(184,91,63,0.06)"
                stroke="var(--line)"
                strokeWidth="1"
              />

              {/* Labels */}
              <text x="300" y="195" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Navata Centrale
              </text>
              <text x="300" y="208" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                중앙 본당 (5 nave 중 가운데)
              </text>
              
              <text x="148" y="268" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                좌측 익랑
              </text>
              <text x="442" y="268" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR" textAnchor="end">
                우측 익랑
              </text>

              {/* Apse label */}
              <text x="300" y="135" textAnchor="middle" fontSize="8.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                후진 ↑ (북쪽)
              </text>

              {/* Crypt indicator (dashed) */}
              <rect
                x="240" y="270" width="120" height="25" rx="2"
                fill="rgba(201,169,97,0.04)"
                stroke={pointsByArea['crypt'] ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={pointsByArea['crypt'] ? 1.2 : 0.8}
                strokeDasharray="4 2"
              />
              <text x="300" y="287" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                지하 크립트 (점선)
              </text>

              {/* Archaeology (below) */}
              <rect
                x="180" y="350" width="240" height="30" rx="3"
                fill="rgba(184,91,63,0.05)"
                stroke={pointsByArea['archaeology'] ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={pointsByArea['archaeology'] ? 1.5 : 1}
                strokeDasharray="3 3"
              />
              <text x="300" y="370" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                ↓ 지하 고고학 (입구 본당 안)
              </text>

              {/* Roof (legend top) */}
              <g transform="translate(450, 410)">
                <rect width="120" height="40" rx="4" fill="rgba(184,91,63,0.06)" stroke="var(--line)" strokeWidth="1" />
                <text x="60" y="17" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  옥상 + 첨탑 + 마돈니나
                </text>
                <text x="60" y="30" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  단면도에서 확인
                </text>
              </g>

              {/* Scale */}
              <text x="300" y="420" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
                158m × 92m · 라틴 십자형 평면
              </text>
            </>
          )}

          {/* Point dots */}
          {(() => {
            const positions = view === 'section' ? {
              'madonnina': { cx: 300, cy: 42 },
              'spires': { cx: 470, cy: 160 },
              'roof': { cx: 300, cy: 237 },
              'facade': { cx: 107, cy: 310 },
              'nave': { cx: 300, cy: 317 },
              'transept': { cx: 400, cy: 318 },
              'crypt': { cx: 300, cy: 400 },
              'archaeology': { cx: 300, cy: 437 },
            } : {
              'facade': { cx: 300, cy: 145 },
              'nave': { cx: 300, cy: 220 },
              'transept': { cx: 145, cy: 265 },
              'crypt': { cx: 300, cy: 282 },
              'archaeology': { cx: 300, cy: 365 },
              'roof': { cx: 510, cy: 423 },
              'spires': { cx: 510, cy: 437 },
              'madonnina': { cx: 510, cy: 451 },
            };
            
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        {view === 'section' ? '단면 — 지하 5m부터 첨탑 108.5m까지' : '평면 — 라틴 십자형 본당 위에서'}
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 8점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CapitoliniFloorPlan — 미켈란젤로 광장 + 2 건물 (팔라초 콘세르바토리·누오보)
// ─────────────────────────────────────────────────────────
function CapitoliniFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'campidoglio': 'piazza',
    'marcus-aurelius': 'conservatori-courtyard',
    'lupa-capitolina': 'conservatori-lupa',
    'costantino-colosso': 'conservatori-colossus',
    'galata-morente': 'nuovo-galata',
    'venere-capitolina': 'nuovo-venus',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  // viewBox 600x500 — Michelangelo's iconic trapezoidal piazza design
  // North = top (Palazzo Senatorio = town hall, not part of museum)
  // Palazzo dei Conservatori = south of piazza
  // Palazzo Nuovo = north (across piazza)
  
  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          캄피돌리오 광장 + 카피톨리니 박물관
        </div>
        <div className="dc-floor-label-sub">
          미켈란젤로의 사다리꼴 광장 (1538~1654) · 두 박물관 동 + 지하 회랑 연결
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="cap-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#cap-grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {/* Cordonata (Michelangelo stairway) from south */}
          <g>
            <polygon
              points="240,440 360,440 320,470 280,470"
              fill="rgba(184,91,63,0.04)"
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            <text x="300" y="465" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              ↓ 코르도나타 (미켈란젤로 계단)
            </text>
          </g>

          {/* Palazzo Senatorio (town hall, not museum) - top */}
          <g>
            <rect
              x="180" y="55" width="240" height="55" rx="4"
              fill="rgba(255,255,255,0.02)"
              stroke="var(--line)"
              strokeWidth="1"
              strokeDasharray="4 3"
              opacity="0.5"
            />
            <text x="300" y="80" textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Palazzo Senatorio
            </text>
            <text x="300" y="93" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              로마 시청 (박물관 아님)
            </text>
            <text x="300" y="105" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              ← 마르쿠스 아우렐리우스 원본 옆에 (지하 연결)
            </text>
          </g>

          {/* Trapezoidal piazza (Michelangelo design) */}
          <g>
            <polygon
              points="220,120 380,120 405,400 195,400"
              fill="rgba(201,169,97,0.04)"
              stroke={pointsByArea['piazza'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['piazza'] ? 1.8 : 1}
            />
            <text x="300" y="160" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Piazza del Campidoglio
            </text>
            <text x="300" y="175" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              미켈란젤로 사다리꼴 광장
            </text>
            
            {/* Center: Marcus Aurelius equestrian (copy) */}
            <circle cx="300" cy="260" r="18" fill="rgba(201,169,97,0.10)" stroke="var(--gold)" strokeWidth="1.2" />
            <text x="300" y="263" textAnchor="middle" fontSize="7" fill="var(--gold)" fontFamily="Noto Sans KR">
              기마상
            </text>
            <text x="300" y="290" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (광장은 복제 · 진품은 우측 건물 안)
            </text>

            {/* Star pattern (Michelangelo's oval) */}
            <ellipse cx="300" cy="260" rx="80" ry="55" fill="none" stroke="var(--text-faint)" strokeWidth="0.7" opacity="0.4" strokeDasharray="2 3" />
            
            {/* 12-pointed star pattern (simplified) */}
            <g opacity="0.3">
              {[0, 30, 60, 90, 120, 150].map(angle => {
                const rad = (angle * Math.PI) / 180;
                const x1 = 300 + Math.cos(rad) * 70;
                const y1 = 260 + Math.sin(rad) * 45;
                const x2 = 300 - Math.cos(rad) * 70;
                const y2 = 260 - Math.sin(rad) * 45;
                return <line key={angle} x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--gold)" strokeWidth="0.6" />;
              })}
            </g>
          </g>

          {/* Palazzo dei Conservatori (right/east side of piazza when looking from cordonata) */}
          <g>
            <rect
              x="405" y="150" width="140" height="220" rx="4"
              fill="rgba(184,91,63,0.06)"
              stroke="var(--accent)"
              strokeWidth="1.3"
            />
            <text x="475" y="175" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Palazzo dei
            </text>
            <text x="475" y="188" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Conservatori
            </text>
            <text x="475" y="202" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              (우측 박물관 동)
            </text>
            
            {/* Subdivisions */}
            <line x1="405" y1="220" x2="545" y2="220" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            <line x1="405" y1="275" x2="545" y2="275" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            <line x1="405" y1="325" x2="545" y2="325" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            
            <text x="412" y="237" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · 안뜰 (유리 천장)
            </text>
            <text x="412" y="293" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · 늑대의 방
            </text>
            <text x="412" y="340" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · 콘스탄티노 거상
            </text>
            <text x="412" y="358" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (거대 두상·발·손)
            </text>
          </g>

          {/* Palazzo Nuovo (left/west side of piazza) */}
          <g>
            <rect
              x="55" y="150" width="140" height="220" rx="4"
              fill="rgba(184,91,63,0.06)"
              stroke="var(--accent)"
              strokeWidth="1.3"
            />
            <text x="125" y="175" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Palazzo
            </text>
            <text x="125" y="188" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Nuovo
            </text>
            <text x="125" y="202" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              (좌측 박물관 동)
            </text>
            
            <line x1="55" y1="240" x2="195" y2="240" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            <line x1="55" y1="310" x2="195" y2="310" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            
            <text x="62" y="265" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · 갈리아의 방
            </text>
            <text x="62" y="282" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (죽어가는 갈리아인)
            </text>
            <text x="62" y="335" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · 비너스의 방
            </text>
            <text x="62" y="352" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (카피톨린 비너스)
            </text>
          </g>

          {/* Underground connection (Galleria Lapidaria) */}
          <g>
            <line x1="195" y1="385" x2="405" y2="385" stroke="var(--gold)" strokeWidth="1.5" strokeDasharray="6 3" opacity="0.7" />
            <text x="300" y="402" textAnchor="middle" fontSize="8" fill="var(--gold)" fontFamily="Noto Sans KR" opacity="0.8">
              ↑ 지하 회랑 (Galleria Lapidaria) — 두 박물관 연결
            </text>
          </g>

          {/* Bottom info */}
          <text x="300" y="437" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
            세계 첫 공공 박물관 (1471) · 통합권 €15
          </text>
        
          {/* Point dots */}
          {(() => {
            const positions = {
              'piazza': { cx: 300, cy: 230 },
              'conservatori-courtyard': { cx: 475, cy: 200 },
              'conservatori-lupa': { cx: 475, cy: 250 },
              'conservatori-colossus': { cx: 475, cy: 345 },
              'nuovo-galata': { cx: 125, cy: 270 },
              'nuovo-venus': { cx: 125, cy: 340 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p) => (
                <g
                  key={p.id}
                  style={{ cursor: 'pointer' }}
                  onClick={() => onPointClick(p.id)}
                  onMouseEnter={() => setHoveredPoint(p.id)}
                  onMouseLeave={() => setHoveredPoint(null)}
                >
                  <circle
                    cx={pos.cx} cy={pos.cy}
                    r={hoveredPoint === p.id ? 14 : 11}
                    fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                    style={{ transition: 'all 0.15s' }}
                  />
                  <text
                    x={pos.cx} y={pos.cy + 4}
                    fontSize="10" fill="var(--bg)"
                    fontFamily="DM Sans" fontWeight="600"
                    textAnchor="middle" pointerEvents="none"
                  >
                    {String(p.idx).padStart(2, '0')}
                  </text>
                </g>
              ));
            });
          })()}
</svg>
      </div>

      <div className="dc-floorplan-note">
        광장 1점 + 콘세르바토리 3점 + 누오보 2점 — 번호 탭하면 작품 상세
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 6점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────
// VecchioFloorPlan — 시뇨리아 광장 + 베키오 궁 내부 (2뷰 토글)
// ─────────────────────────────────────────────────────────
function VecchioFloorPlan({ points, accent, onPointClick }) {
  const [view, setView] = useState('piazza'); // 'piazza' or 'palazzo'

  const POINT_TO_AREA = {
    // Piazza view
    'piazza-signoria': 'piazza-center',
    'palazzo-vecchio-exterior': 'palazzo-facade',
    'loggia-perseus': 'loggia-left',
    'loggia-sabines': 'loggia-right',
    'neptune-fountain': 'fountain',
    'cosimo-equestrian': 'equestrian',
    // Palazzo view
    'salone-cinquecento': 'salone',
    'studiolo-francesco': 'studiolo',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-toggle">
        <button
          className={`dc-floor-btn ${view === 'piazza' ? 'active' : ''}`}
          onClick={() => setView('piazza')}
        >
          광장 (야외 6점)
        </button>
        <button
          className={`dc-floor-btn ${view === 'palazzo' ? 'active' : ''}`}
          onClick={() => setView('palazzo')}
        >
          베키오 궁 내부 (2점)
        </button>
      </div>

      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          {view === 'piazza' ? '시뇨리아 광장 (위에서)' : '베키오 궁 2층 (500인의 방 + 스투디올로)'}
        </div>
        <div className="dc-floor-label-sub">
          {view === 'piazza'
            ? '13세기 광장 + 5 조각 + 베키오 궁 정면 · 700년 정치의 무대'
            : '500인의 방 (54m × 22m × 18m) — 스투디올로 (숨겨진 작은 방)'}
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="vec-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#vec-grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {view === 'piazza' && (
            <>
              {/* Piazza outline */}
              <polygon
                points="80,90 520,90 520,400 80,400"
                fill="rgba(201,169,97,0.04)"
                stroke={pointsByArea['piazza-center'] ? 'var(--accent)' : 'var(--line)'}
                strokeWidth={pointsByArea['piazza-center'] ? 1.5 : 1}
                strokeDasharray="3 3"
              />
              <text x="100" y="110" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Piazza della Signoria
              </text>
              <text x="100" y="123" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                시뇨리아 광장 (13세기 ~)
              </text>

              {/* Palazzo Vecchio (east side of piazza, north of Loggia) */}
              <g>
                <rect
                  x="280" y="135" width="220" height="120" rx="4"
                  fill="rgba(184,91,63,0.06)"
                  stroke={pointsByArea['palazzo-facade'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['palazzo-facade'] ? 1.5 : 1}
                />
                <text x="390" y="160" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Palazzo Vecchio
                </text>
                <text x="390" y="173" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  베키오 궁 (1299)
                </text>
                {/* Tower */}
                <rect x="305" y="100" width="30" height="35" fill="rgba(184,91,63,0.10)" stroke="var(--line)" strokeWidth="1" />
                <text x="320" y="92" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  Torre Arnolfo (93.7m)
                </text>
                {/* Davide copy + Heracles */}
                <text x="320" y="220" textAnchor="middle" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  ▴ 다비드(복) + 헤라클레스
                </text>
                <text x="320" y="235" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  (정문 양옆)
                </text>
              </g>

              {/* Loggia dei Lanzi (south of Palazzo Vecchio) */}
              <g>
                <rect
                  x="280" y="270" width="220" height="80" rx="4"
                  fill="rgba(201,169,97,0.06)"
                  stroke="var(--line)"
                  strokeWidth="1"
                />
                <text x="390" y="290" textAnchor="middle" fontSize="10" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Loggia dei Lanzi
                </text>
                <text x="390" y="302" textAnchor="middle" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  야외 조각 갤러리
                </text>
              </g>

              {/* Cosimo Equestrian (center of piazza) */}
              <g>
                <circle
                  cx="190" cy="225" r="14"
                  fill="rgba(201,169,97,0.10)"
                  stroke={pointsByArea['equestrian'] ? 'var(--accent)' : 'var(--gold)'}
                  strokeWidth={pointsByArea['equestrian'] ? 1.5 : 1}
                />
                <text x="190" y="228" textAnchor="middle" fontSize="7" fill="var(--gold)" fontFamily="Noto Sans KR">
                  기마상
                </text>
                <text x="190" y="252" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  코시모 1세
                </text>
              </g>

              {/* Neptune Fountain */}
              <g>
                <circle
                  cx="190" cy="155" r="13"
                  fill="rgba(201,169,97,0.10)"
                  stroke={pointsByArea['fountain'] ? 'var(--accent)' : 'var(--gold)'}
                  strokeWidth={pointsByArea['fountain'] ? 1.5 : 1}
                />
                <text x="190" y="158" textAnchor="middle" fontSize="7" fill="var(--gold)" fontFamily="Noto Sans KR">
                  분수
                </text>
                <text x="190" y="180" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  넵튠
                </text>
              </g>

              {/* Uffizi (south, off-screen indicator) */}
              <g transform="translate(420, 425)">
                <text fontSize="9" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  ↓ 우피치 미술관 (도보 1분)
                </text>
              </g>

              {/* Savonarola marker */}
              <circle cx="280" cy="225" r="5" fill="none" stroke="var(--text-faint)" strokeWidth="1" strokeDasharray="2 2" opacity="0.6" />
              <text x="282" y="245" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                사보나롤라 화형판 (1498)
              </text>

              {/* Scale */}
              <text x="300" y="430" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
                광장: 약 60m × 80m · 베키오 궁 정면 길이 30m
              </text>
            </>
          )}

          {view === 'palazzo' && (
            <>
              {/* Palazzo interior — 2nd floor */}
              {/* Outer building outline */}
              <rect
                x="60" y="80" width="480" height="320" rx="6"
                fill="rgba(184,91,63,0.04)"
                stroke="var(--line)"
                strokeWidth="1.2"
              />
              <text x="80" y="105" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Palazzo Vecchio — Piano Primo (2층)
              </text>
              <text x="80" y="118" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                대공의 공식 행정 + 거주 공간
              </text>

              {/* Cortile (entrance courtyard) — left side */}
              <g>
                <rect
                  x="80" y="135" width="100" height="100" rx="3"
                  fill="rgba(201,169,97,0.03)"
                  stroke="var(--line)"
                  strokeWidth="0.8"
                  strokeDasharray="3 3"
                />
                <text x="130" y="160" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Cortile
                </text>
                <text x="130" y="173" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  안뜰
                </text>
                <text x="130" y="190" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  (입구)
                </text>
              </g>

              {/* Salone dei Cinquecento — massive central hall */}
              <g>
                <rect
                  x="195" y="135" width="280" height="180" rx="4"
                  fill="rgba(184,91,63,0.08)"
                  stroke={pointsByArea['salone'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['salone'] ? 1.8 : 1}
                />
                <text x="335" y="170" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Salone dei Cinquecento
                </text>
                <text x="335" y="184" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  500인의 방
                </text>
                <text x="335" y="200" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  54m × 22m × 천장 18m
                </text>
                <text x="335" y="214" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  바사리 6 거대 프레스코 (메디치 영광)
                </text>
                <text x="335" y="228" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                  〈Cerca Trova〉 — 레오나르도가 아래에?
                </text>
                
                {/* Center markers — Vasari frescoes positions */}
                <rect x="220" y="245" width="20" height="40" fill="rgba(184,91,63,0.10)" stroke="var(--text-faint)" strokeWidth="0.5" />
                <rect x="430" y="245" width="20" height="40" fill="rgba(184,91,63,0.10)" stroke="var(--text-faint)" strokeWidth="0.5" />
                <text x="335" y="270" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
                  ←  바사리 프레스코  →
                </text>
                <text x="335" y="295" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
                  미켈란젤로 〈천재〉 (측면)
                </text>
              </g>

              {/* Studiolo of Francesco I — small hidden room */}
              <g>
                <rect
                  x="490" y="170" width="40" height="50" rx="3"
                  fill="rgba(201,169,97,0.10)"
                  stroke={pointsByArea['studiolo'] ? 'var(--accent)' : 'var(--gold)'}
                  strokeWidth={pointsByArea['studiolo'] ? 1.5 : 1}
                />
                <text x="510" y="190" textAnchor="middle" fontSize="7.5" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Studiolo
                </text>
                <text x="510" y="202" textAnchor="middle" fontSize="6.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  스튜디올로
                </text>
                <text x="510" y="212" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  (숨김 입구)
                </text>
                {/* Arrow to indicate hidden door */}
                <line x1="490" y1="195" x2="475" y2="195" stroke="var(--gold)" strokeWidth="1" markerEnd="url(#arrowhead)" />
              </g>

              {/* Arrow definition */}
              <defs>
                <marker id="arrowhead" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                  <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--gold)" />
                </marker>
              </defs>

              {/* Other rooms (Apartments, etc.) */}
              <rect x="80" y="245" width="100" height="55" rx="3" fill="rgba(255,255,255,0.02)" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
              <text x="130" y="270" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                대공 거주 공간
              </text>
              <text x="130" y="282" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                (관람 동선)
              </text>

              <rect x="80" y="310" width="395" height="60" rx="3" fill="rgba(255,255,255,0.02)" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
              <text x="280" y="335" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                기타 공간: 사보나롤라 거주실 · 지도의 방 · 비전 그림 갤러리
              </text>
              <text x="280" y="350" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                (관람 동선 따라 통과)
              </text>

              {/* Scale */}
              <text x="300" y="425" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
                베키오 궁 2층 — 500인의 방 중심
              </text>
            </>
          )}

          {/* Point dots */}
          {(() => {
            const positions = view === 'piazza' ? {
              'piazza-center': { cx: 220, cy: 350 },
              'palazzo-facade': { cx: 390, cy: 200 },
              'loggia-left': { cx: 330, cy: 310 },
              'loggia-right': { cx: 440, cy: 310 },
              'fountain': { cx: 190, cy: 155 },
              'equestrian': { cx: 190, cy: 225 },
            } : {
              'salone': { cx: 335, cy: 225 },
              'studiolo': { cx: 510, cy: 195 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        {view === 'piazza' ? '광장 6점 — 야외 무료 입장' : '베키오 궁 내부 2점 — 입장료 별도'}
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 8점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// DuomoFlorenceFloorPlan — 5건물 캠퍼스 (두오모 광장 + 산 조반니 광장)
// ─────────────────────────────────────────────────────────
function DuomoFlorenceFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'duomo-facade': 'facade',
    'brunelleschi-dome': 'dome',
    'duomo-interior': 'nave-interior',
    'battistero-gates-paradise': 'battistero-gates',
    'battistero-mosaics': 'battistero-interior',
    'giotto-campanile': 'campanile',
    'donatello-magdalene': 'museum-magdalene',
    'michelangelo-bandini-pieta': 'museum-pieta',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          두오모 캠퍼스 — 5개 건물 한 자리
        </div>
        <div className="dc-floor-label-sub">
          본당 · 돔 · 종탑 · 세례당 · 박물관 — 통합권으로 5개 다 입장
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="duomo-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#duomo-grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {/* Piazza San Giovanni (west — battistero side) */}
          <rect
            x="60" y="150" width="135" height="200" rx="4"
            fill="rgba(201,169,97,0.03)"
            stroke="var(--line)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            opacity="0.5"
          />
          <text x="127" y="170" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
            Piazza San Giovanni
          </text>
          <text x="127" y="183" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
            산 조반니 광장
          </text>

          {/* Piazza del Duomo (main — surrounds cathedral) */}
          <rect
            x="200" y="40" width="350" height="420" rx="4"
            fill="rgba(201,169,97,0.02)"
            stroke="var(--line)"
            strokeWidth="0.8"
            strokeDasharray="3 3"
            opacity="0.4"
          />
          <text x="220" y="60" fontSize="9" fill="var(--text-faint)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
            Piazza del Duomo (두오모 광장)
          </text>

          {/* 1. Battistero (octagonal building) */}
          <g>
            <polygon
              points="98,240 156,240 175,270 156,300 98,300 79,270"
              fill="rgba(184,91,63,0.06)"
              stroke={(pointsByArea['battistero-gates'] || pointsByArea['battistero-interior']) ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={(pointsByArea['battistero-gates'] || pointsByArea['battistero-interior']) ? 1.5 : 1}
            />
            <text x="127" y="265" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Battistero
            </text>
            <text x="127" y="278" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              세례당
            </text>
            <text x="127" y="291" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (8각형 · 1059~1128)
            </text>
            {/* Gates of Paradise — east side */}
            <line x1="175" y1="270" x2="195" y2="270" stroke="var(--gold)" strokeWidth="2" />
            <text x="200" y="265" fontSize="6.5" fill="var(--gold)" fontFamily="Noto Sans KR">
              ↓ 천국의 문 (동측)
            </text>
            <text x="200" y="277" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (광장 = 복제, 진품 박물관)
            </text>
          </g>

          {/* 2. Duomo Facade (cathedral west end) */}
          <g>
            <rect
              x="225" y="248" width="22" height="100" rx="2"
              fill="rgba(201,169,97,0.10)"
              stroke={pointsByArea['facade'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['facade'] ? 1.5 : 1}
            />
            <text x="219" y="295" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR" transform="rotate(-90, 230, 295)">
              정면 파사드 (1887)
            </text>
          </g>

          {/* 3. Duomo Nave (main cathedral body) */}
          <g>
            <rect
              x="247" y="230" width="250" height="135" rx="3"
              fill="rgba(184,91,63,0.06)"
              stroke={pointsByArea['nave-interior'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['nave-interior'] ? 1.5 : 1}
            />
            {/* Transept (cross arms) */}
            <rect
              x="397" y="200" width="100" height="200" rx="3"
              fill="rgba(184,91,63,0.04)"
              stroke="var(--line)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.7"
            />
            <text x="320" y="270" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Santa Maria del Fiore
            </text>
            <text x="320" y="284" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              본당 (1296~1436)
            </text>
            <text x="320" y="298" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              153m · 라틴 십자형
            </text>
          </g>

          {/* 4. Brunelleschi Dome (over the transept/crossing) */}
          <g>
            {/* Dome circle on top of nave */}
            <circle
              cx="447" cy="300" r="48"
              fill="rgba(201,169,97,0.08)"
              stroke={pointsByArea['dome'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['dome'] ? 1.8 : 1.2}
            />
            {/* Inner ring */}
            <circle
              cx="447" cy="300" r="32"
              fill="none"
              stroke="var(--gold)"
              strokeWidth="0.8"
              strokeDasharray="2 2"
              opacity="0.6"
            />
            <text x="447" y="298" textAnchor="middle" fontSize="9.5" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Cupola
            </text>
            <text x="447" y="310" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              브루넬레스키 돔
            </text>
            <text x="447" y="322" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              463계단 (1420~1436)
            </text>
          </g>

          {/* 5. Campanile (Giotto's bell tower) — south of facade */}
          <g>
            <rect
              x="260" y="380" width="50" height="50" rx="3"
              fill="rgba(184,91,63,0.08)"
              stroke={pointsByArea['campanile'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['campanile'] ? 1.5 : 1}
            />
            <text x="285" y="400" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Campanile
            </text>
            <text x="285" y="413" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              조토 종탑
            </text>
            <text x="285" y="425" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              414계단 · 84.7m
            </text>
          </g>

          {/* 6. Museo dell'Opera (east of cathedral, behind apse) */}
          <g>
            <rect
              x="510" y="240" width="65" height="120" rx="3"
              fill="rgba(184,91,63,0.06)"
              stroke={(pointsByArea['museum-magdalene'] || pointsByArea['museum-pieta']) ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={(pointsByArea['museum-magdalene'] || pointsByArea['museum-pieta']) ? 1.5 : 1}
            />
            <text x="542" y="262" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Museo
            </text>
            <text x="542" y="275" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              두오모 박물관
            </text>
            <text x="542" y="295" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              · 천국의 문 (진품)
            </text>
            <text x="542" y="308" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              · 도나텔로 막달레나
            </text>
            <text x="542" y="321" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              · 미켈란젤로 피에타
            </text>
            <text x="542" y="345" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
              (실내 — 더위 피난 좋음)
            </text>
          </g>

          {/* Visual indicators between buildings */}
          <text x="207" y="270" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
            ↔
          </text>
          <text x="500" y="305" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
            ↔
          </text>

          {/* Scale info */}
          <text x="300" y="465" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
            5건물 통합권 €30~ · 돔·종탑 등반 사전 예약 권장
          </text>

          {/* Point dots */}
          {(() => {
            const positions = {
              'battistero-gates': { cx: 185, cy: 270 },
              'battistero-interior': { cx: 127, cy: 270 },
              'facade': { cx: 236, cy: 298 },
              'nave-interior': { cx: 320, cy: 320 },
              'dome': { cx: 447, cy: 300 },
              'campanile': { cx: 285, cy: 405 },
              'museum-magdalene': { cx: 542, cy: 285 },
              'museum-pieta': { cx: 542, cy: 318 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        5건물 캠퍼스 — 광장에서 5개 다 보임 (도보 1분 이내)
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 8점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// CastelFloorPlan — 산탄젤로 성 수직 다층 + 다리 + 패세토 (2뷰 토글)
// ─────────────────────────────────────────────────────────
function CastelFloorPlan({ points, accent, onPointClick }) {
  const [view, setView] = useState('section'); // 'section' or 'plan'

  const POINT_TO_AREA = {
    // Section view (vertical)
    'castel-exterior': 'exterior',
    'castel-prisoners': 'prisoners',
    'castel-papal-apartments': 'apartments',
    'castel-rooftop': 'rooftop',
    'tosca-puccini-spot': 'tosca',
    // Plan view (top-down)
    'ponte-angeli': 'bridge',
    'passetto-di-borgo': 'passetto',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-toggle">
        <button
          className={`dc-floor-btn ${view === 'section' ? 'active' : ''}`}
          onClick={() => setView('section')}
        >
          단면도 (수직 5층)
        </button>
        <button
          className={`dc-floor-btn ${view === 'plan' ? 'active' : ''}`}
          onClick={() => setView('plan')}
        >
          평면도 (다리·패세토)
        </button>
      </div>

      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          {view === 'section' ? '산탄젤로 성 — 수직 단면 (5층 + 옥상)' : '산탄젤로 성 — 위에서 (다리 + 패세토)'}
        </div>
        <div className="dc-floor-label-sub">
          {view === 'section'
            ? '하드리아누스 영묘(135) → 중세 요새 → 교황 거주지 → 19세기 박물관'
            : '테베레 강변 + 산탄젤로 다리 (베르니니 천사 10) + 바티칸 비밀 통로 800m'}
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="castel-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#castel-grid)" />

          {view === 'section' && (
            <>
              {/* Height scale on left */}
              <text x="20" y="65" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">옥상</text>
              <text x="20" y="155" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">교황</text>
              <text x="20" y="245" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">감옥</text>
              <text x="20" y="330" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">하부</text>
              <text x="20" y="410" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">지면</text>

              <line x1="50" y1="50" x2="50" y2="425" stroke="var(--line)" strokeWidth="1" strokeDasharray="2 4" opacity="0.4" />

              {/* Tower/Angelo statue at top */}
              <g>
                <polygon
                  points="295,30 305,30 300,50"
                  fill="var(--gold)"
                  stroke="var(--gold)"
                  strokeWidth="1"
                />
                <text x="350" y="42" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  San Michele Arcangelo
                </text>
                <text x="350" y="54" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  대천사 미카엘 (1753 청동)
                </text>
              </g>

              {/* Rooftop / Tosca spot */}
              <g>
                <rect
                  x="140" y="55" width="320" height="50" rx="3"
                  fill="rgba(184,91,63,0.08)"
                  stroke={(pointsByArea['rooftop'] || pointsByArea['tosca']) ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={(pointsByArea['rooftop'] || pointsByArea['tosca']) ? 1.5 : 1}
                />
                <text x="160" y="75" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Terrazza
                </text>
                <text x="160" y="88" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  옥상 · 360도 로마 뷰
                </text>
                <text x="160" y="100" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  동쪽 난간 = 푸치니 〈토스카〉 투신 장면
                </text>
                {/* East railing accent */}
                <line x1="440" y1="55" x2="440" y2="105" stroke="var(--gold)" strokeWidth="1.5" opacity="0.8" />
                <text x="445" y="80" fontSize="7" fill="var(--gold)" fontFamily="Noto Sans KR">동→</text>
              </g>

              {/* Papal Apartments */}
              <g>
                <rect
                  x="140" y="115" width="320" height="80" rx="3"
                  fill="rgba(201,169,97,0.06)"
                  stroke={pointsByArea['apartments'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['apartments'] ? 1.5 : 1}
                />
                <text x="160" y="138" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Appartamenti Papali
                </text>
                <text x="160" y="151" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  교황 거주 공간 (16세기)
                </text>
                <text x="160" y="168" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  · Sala Paolina (Pierin del Vaga 프레스코)
                </text>
                <text x="160" y="181" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  · 클레멘스 7세 침실 (1527 사코 디 로마)
                </text>
              </g>

              {/* Prisoners (middle level) */}
              <g>
                <rect
                  x="140" y="205" width="320" height="70" rx="3"
                  fill="rgba(184,91,63,0.05)"
                  stroke={pointsByArea['prisoners'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['prisoners'] ? 1.5 : 1}
                />
                <text x="160" y="228" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Prigioni
                </text>
                <text x="160" y="241" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  감옥 (중층)
                </text>
                <text x="160" y="257" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  · 베네벤토 추기경 · 베아트리체 첸치 · 카글리오스트로 ·
                </text>
                <text x="160" y="269" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  · 〈토스카〉의 카바라도시 (오페라 허구)
                </text>
              </g>

              {/* Lower levels (Hadrian's mausoleum core) */}
              <g>
                <rect
                  x="140" y="285" width="320" height="65" rx="3"
                  fill="rgba(184,91,63,0.04)"
                  stroke="var(--line)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
                <text x="160" y="305" fontSize="9.5" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Mausoleo di Adriano (135 AD 핵심)
                </text>
                <text x="160" y="320" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  하드리아누스 원형 영묘 — 64m 직경
                </text>
                <text x="160" y="333" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  · 나선 경사로 (군대 행진용) · 영묘실 (현재 비어 있음)
                </text>
              </g>

              {/* Cylindrical exterior (visual indicator) */}
              <g>
                {/* Round wall hint - simplified to vertical lines */}
                <line x1="135" y1="55" x2="135" y2="395" stroke="var(--line)" strokeWidth="2" />
                <line x1="465" y1="55" x2="465" y2="395" stroke="var(--line)" strokeWidth="2" />
                <text x="115" y="225" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" transform="rotate(-90, 115, 225)">
                  원통형 외벽
                </text>
              </g>

              {/* Ground level */}
              <g>
                <rect
                  x="140" y="360" width="320" height="35" rx="3"
                  fill="rgba(201,169,97,0.03)"
                  stroke={pointsByArea['exterior'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['exterior'] ? 1.5 : 1}
                />
                <text x="160" y="380" fontSize="9.5" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  외관 + 입구
                </text>
                <text x="160" y="393" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  테베레 강변 — 다리에서 진입
                </text>
              </g>

              <line x1="80" y1="398" x2="520" y2="398" stroke="var(--text-faint)" strokeWidth="1.5" />
              <text x="535" y="402" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">지면</text>

              {/* Tiber river indicator */}
              <g>
                <rect x="80" y="405" width="440" height="20" fill="rgba(80,140,180,0.1)" stroke="rgba(80,140,180,0.3)" strokeWidth="0.5" />
                <text x="300" y="419" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                  ~~~ 테베레 강 (Tevere) ~~~
                </text>
              </g>
            </>
          )}

          {view === 'plan' && (
            <>
              {/* Plan view — top-down */}
              {/* Vatican (top left, off-edge marker) */}
              <g>
                <rect x="20" y="55" width="100" height="55" rx="3" fill="rgba(255,255,255,0.03)" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="3 3" />
                <text x="70" y="78" textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
                  Vaticano
                </text>
                <text x="70" y="92" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  바티칸
                </text>
                <text x="70" y="103" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  (북서쪽)
                </text>
              </g>

              {/* Passetto di Borgo — wall connecting Vatican to Castel */}
              <g>
                <line x1="120" y1="80" x2="350" y2="240" stroke={pointsByArea['passetto'] ? 'var(--accent)' : 'var(--gold)'} strokeWidth={pointsByArea['passetto'] ? 2.5 : 2} strokeDasharray="8 3" opacity="0.85" />
                <text x="220" y="145" fontSize="9" fill={pointsByArea['passetto'] ? 'var(--accent)' : 'var(--gold)'} fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500" transform="rotate(35, 220, 145)">
                  Passetto di Borgo
                </text>
                <text x="225" y="160" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR" transform="rotate(35, 225, 160)">
                  교황 비밀 통로 (800m, 1277)
                </text>
              </g>

              {/* Castel Sant'Angelo — cylindrical */}
              <g>
                <circle
                  cx="370" cy="260" r="85"
                  fill="rgba(184,91,63,0.06)"
                  stroke={pointsByArea['exterior'] ? 'var(--accent)' : 'var(--line)'}
                  strokeWidth={pointsByArea['exterior'] ? 1.8 : 1.2}
                />
                {/* Inner core (Hadrian's mausoleum original) */}
                <circle
                  cx="370" cy="260" r="50"
                  fill="rgba(184,91,63,0.10)"
                  stroke="var(--line)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.7"
                />
                {/* Center marker */}
                <circle cx="370" cy="260" r="6" fill="var(--gold)" stroke="var(--gold)" strokeWidth="1" />
                
                <text x="370" y="195" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Castel Sant'Angelo
                </text>
                <text x="370" y="208" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                  산탄젤로 성 (64m 직경)
                </text>
                <text x="370" y="273" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  ↑ 단면도에서 5층 확인
                </text>
              </g>

              {/* Ponte Sant'Angelo */}
              <g>
                <rect
                  x="295" y="370" width="150" height="20" rx="2"
                  fill="rgba(201,169,97,0.10)"
                  stroke={pointsByArea['bridge'] ? 'var(--accent)' : 'var(--gold)'}
                  strokeWidth={pointsByArea['bridge'] ? 1.5 : 1}
                />
                {/* 10 angels indicators on bridge sides */}
                <g opacity="0.7">
                  {[305, 320, 335, 350, 365, 380, 395, 410, 425, 440].map((x, i) => (
                    <circle key={i} cx={x} cy={i % 2 ? 365 : 395} r="2" fill="var(--gold)" />
                  ))}
                </g>
                <text x="370" y="357" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                  Ponte Sant'Angelo
                </text>
                <text x="370" y="383" textAnchor="middle" fontSize="7.5" fill="var(--bg)" fontFamily="Noto Sans KR" fontWeight="500">
                  베르니니 천사상 10
                </text>
                <text x="370" y="412" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                  ↑ 다리에서 성으로 진입 (도보)
                </text>
              </g>

              {/* Tiber river */}
              <g>
                <rect x="220" y="345" width="300" height="65" fill="rgba(80,140,180,0.08)" stroke="rgba(80,140,180,0.25)" strokeWidth="0.5" />
                <text x="240" y="425" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                  ~~~ 테베레 강 (Tevere) ~~~
                </text>
              </g>

              {/* Direction labels */}
              <text x="540" y="200" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                동→
              </text>
              <text x="540" y="220" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                (시내)
              </text>

              {/* North arrow */}
              <g transform="translate(560, 30)">
                <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
                <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
                <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
              </g>
            </>
          )}

          {/* Point dots */}
          {(() => {
            const positions = view === 'section' ? {
              'tosca': { cx: 440, cy: 78 },
              'rooftop': { cx: 200, cy: 78 },
              'apartments': { cx: 300, cy: 155 },
              'prisoners': { cx: 300, cy: 240 },
              'exterior': { cx: 300, cy: 378 },
            } : {
              'passetto': { cx: 225, cy: 155 },
              'exterior': { cx: 370, cy: 260 },
              'bridge': { cx: 370, cy: 380 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        {view === 'section' ? '단면 — 지면부터 옥상 + 천사상까지 5층' : '평면 — 강 + 다리 + 성 + 패세토 (바티칸 800m 연결)'}
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 7점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SforzescoFloorPlan — 3 중정 가로 배치 (Armi → Rocchetta → Ducale)
// ─────────────────────────────────────────────────────────
function SforzescoFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'sforzesco-exterior': 'exterior',
    'filarete-tower': 'filarete',
    'cortile-armi': 'cortile-armi',
    'pieta-rondanini': 'pieta-museum',
    'sala-asse': 'sala-asse',
    'sforzesco-museum-pinacoteca': 'pinacoteca',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          스포르체스코 성 — 3 중정 + 11 박물관
        </div>
        <div className="dc-floor-label-sub">
          비스콘티 요새 (1370) → 스포르차 궁전 (1450) → 1893 벨트라미 복원 · 두오모 도보 15분
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="sforza-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#sforza-grid)" />

          {/* North arrow */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">N</text>
          </g>

          {/* Duomo direction (south, off-edge) */}
          <text x="300" y="475" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
            ↓ 두오모 광장 (도보 15분, 트램 1호선)
          </text>

          {/* Sempione Park (north, off-edge) */}
          <text x="300" y="28" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
            ↑ 셈피오네 공원 (성 뒤편)
          </text>

          {/* Castle main outer rectangle */}
          <rect
            x="55" y="105" width="490" height="285" rx="6"
            fill="rgba(184,91,63,0.04)"
            stroke={pointsByArea['exterior'] ? 'var(--accent)' : 'var(--line)'}
            strokeWidth={pointsByArea['exterior'] ? 1.8 : 1.2}
          />

          {/* 4 corner towers */}
          <g>
            <rect x="40" y="90" width="35" height="35" rx="2" fill="rgba(184,91,63,0.10)" stroke="var(--line)" strokeWidth="1" />
            <rect x="525" y="90" width="35" height="35" rx="2" fill="rgba(184,91,63,0.10)" stroke="var(--line)" strokeWidth="1" />
            <rect x="40" y="370" width="35" height="35" rx="2" fill="rgba(184,91,63,0.10)" stroke="var(--line)" strokeWidth="1" />
            <rect x="525" y="370" width="35" height="35" rx="2" fill="rgba(184,91,63,0.10)" stroke="var(--line)" strokeWidth="1" />
            <text x="32" y="113" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">4탑</text>
          </g>

          {/* Filarete Tower (south entrance, center bottom) */}
          <g>
            <rect
              x="280" y="370" width="50" height="30" rx="3"
              fill="rgba(201,169,97,0.12)"
              stroke={pointsByArea['filarete'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['filarete'] ? 1.8 : 1.2}
            />
            <text x="305" y="389" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Torre del
            </text>
            <text x="305" y="400" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Filarete
            </text>
            <text x="305" y="420" textAnchor="middle" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              필라레테 탑 (70m)
            </text>
            <text x="305" y="431" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              1521 폭발 → 1905 재건
            </text>
            {/* Entry arrow */}
            <line x1="305" y1="450" x2="305" y2="440" stroke="var(--gold)" strokeWidth="1.5" markerEnd="url(#sforza-arrow)" />
            <defs>
              <marker id="sforza-arrow" markerWidth="6" markerHeight="6" refX="3" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--gold)" />
              </marker>
            </defs>
          </g>

          {/* Cortile delle Armi (largest, first courtyard — south half) */}
          <g>
            <rect
              x="75" y="220" width="450" height="150" rx="4"
              fill="rgba(184,91,63,0.06)"
              stroke={pointsByArea['cortile-armi'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['cortile-armi'] ? 1.5 : 1}
            />
            <text x="300" y="248" textAnchor="middle" fontSize="11" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Cortile delle Armi
            </text>
            <text x="300" y="263" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              무기 정원 (가장 큰 중정)
            </text>
            <text x="300" y="295" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              15세기 병사 훈련장 → 오늘 노천 페스티벌 무대
            </text>
            <text x="300" y="312" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
              Estate Sforzesca (여름 6~9월)
            </text>
            
            {/* Center marker */}
            <circle cx="300" cy="295" r="3" fill="var(--text-faint)" opacity="0.5" />
          </g>

          {/* Inner walls/dividers (between courtyards) */}
          <line x1="220" y1="125" x2="220" y2="220" stroke="var(--line)" strokeWidth="1.2" />
          <line x1="380" y1="125" x2="380" y2="220" stroke="var(--line)" strokeWidth="1.2" />

          {/* Cortile della Rocchetta (middle small) */}
          <g>
            <rect
              x="225" y="130" width="155" height="85" rx="3"
              fill="rgba(255,255,255,0.02)"
              stroke="var(--line)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.6"
            />
            <text x="302" y="158" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Cortile della
            </text>
            <text x="302" y="171" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Rocchetta
            </text>
            <text x="302" y="186" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              둘째 중정
            </text>
            <text x="302" y="199" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (사적 공간 — 통과)
            </text>
          </g>

          {/* Pinacoteca + Sala Asse (Corte Ducale — east, 3rd courtyard) */}
          <g>
            <rect
              x="385" y="130" width="140" height="85" rx="3"
              fill="rgba(201,169,97,0.06)"
              stroke={(pointsByArea['sala-asse'] || pointsByArea['pinacoteca']) ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={(pointsByArea['sala-asse'] || pointsByArea['pinacoteca']) ? 1.5 : 1}
            />
            <text x="455" y="148" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Corte Ducale
            </text>
            <text x="455" y="161" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              공작 거주 (셋째 중정)
            </text>
            <line x1="385" y1="180" x2="525" y2="180" stroke="var(--line)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.5" />
            <text x="395" y="195" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · Sala delle Asse (레오나르도 1498)
            </text>
            <text x="395" y="208" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              · Pinacoteca (위층)
            </text>
          </g>

          {/* Pietà Rondanini Museum (west — separate building inside castle, 2015 신축) */}
          <g>
            <rect
              x="80" y="130" width="135" height="85" rx="3"
              fill="rgba(201,169,97,0.08)"
              stroke={pointsByArea['pieta-museum'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['pieta-museum'] ? 1.8 : 1.2}
            />
            <text x="147" y="150" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Pietà Rondanini
            </text>
            <text x="147" y="163" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              미켈란젤로 박물관
            </text>
            <text x="147" y="180" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              2015 별도 신축
            </text>
            <text x="147" y="195" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              (89세 미켈란젤로 미완성)
            </text>
            <text x="147" y="207" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              사망 6일 전까지 작업
            </text>
          </g>

          {/* 11 박물관 통합권 indicator */}
          <g>
            <rect x="80" y="424" width="450" height="22" rx="3" fill="rgba(255,255,255,0.02)" stroke="var(--line)" strokeWidth="0.5" />
            <text x="305" y="439" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              11개 박물관 통합권 €10 · 월요일 휴관 (외부는 무료)
            </text>
          </g>

          {/* Point dots */}
          {(() => {
            const positions = {
              'exterior': { cx: 75, cy: 380 },
              'filarete': { cx: 305, cy: 385 },
              'cortile-armi': { cx: 300, cy: 335 },
              'pieta-museum': { cx: 147, cy: 175 },
              'sala-asse': { cx: 420, cy: 195 },
              'pinacoteca': { cx: 490, cy: 195 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        남쪽 필라레테 탑 입장 → 무기 정원 → 좌측 피에타 박물관 + 우측 코르테 두칼레 (살라 아세 + 피나코테카)
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 6점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// SantaCroceFloorPlan — 라틴 십자형 본당 + 무덤 + 지오토 예배당 + 파치 예배당
// ─────────────────────────────────────────────────────────
function SantaCroceFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'santa-croce-facade': 'facade',
    'michelangelo-tomb': 'mich-tomb',
    'machiavelli-tomb': 'mach-tomb',
    'galileo-tomb': 'gal-tomb',
    'giotto-bardi-chapel': 'bardi-chapel',
    'giotto-peruzzi-chapel': 'peruzzi-chapel',
    'pazzi-chapel': 'pazzi-chapel',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          산타 크로체 — 위대한 자들의 신전
        </div>
        <div className="dc-floor-label-sub">
          본당 115m · 라틴 십자 + 좌·우 무덤 + 후진 예배당 + 회랑 → 파치 예배당
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="sc-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#sc-grid)" />

          {/* North arrow — basilica oriented with apse to east (right) */}
          <g transform="translate(560, 30)">
            <circle r="14" fill="rgba(0,0,0,0.3)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <path d="M 0,-8 L 4,4 L 0,0 L -4,4 Z" fill="var(--gold)" transform="rotate(-90)" />
            <text y="-18" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="DM Sans">E</text>
          </g>

          {/* Piazza (south, bottom) */}
          <g>
            <rect x="80" y="395" width="280" height="60" rx="4" fill="rgba(201,169,97,0.03)" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="3 3" opacity="0.6" />
            <text x="220" y="418" textAnchor="middle" fontSize="9" fill="var(--text-faint)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Piazza Santa Croce
            </text>
            <text x="220" y="432" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              산타 크로체 광장 + 단테 동상 (1865)
            </text>
            <text x="220" y="446" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              ↓ 정면 — 1966 홍수 수위 표시
            </text>
          </g>

          {/* Facade (south wall) */}
          <g>
            <rect
              x="80" y="370" width="280" height="22" rx="2"
              fill="rgba(201,169,97,0.10)"
              stroke={pointsByArea['facade'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['facade'] ? 1.5 : 1}
            />
            <text x="220" y="385" textAnchor="middle" fontSize="9" fill="var(--accent)" fontFamily="Noto Sans KR" fontWeight="500">
              정면 파사드 (1853~1863)
            </text>
          </g>

          {/* Main nave (basilica body, 115m long pointing right/east) */}
          <g>
            <rect
              x="80" y="200" width="280" height="170" rx="3"
              fill="rgba(184,91,63,0.04)"
              stroke="var(--line)"
              strokeWidth="1"
            />
            
            {/* Transept (cross arms) */}
            <rect x="55" y="240" width="305" height="60" rx="3" fill="rgba(184,91,63,0.05)" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="2 2" opacity="0.7" />
            
            <text x="220" y="225" textAnchor="middle" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Navata Centrale
            </text>
            <text x="220" y="237" textAnchor="middle" fontSize="8.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              본당 (115m 길이, 38m 너비)
            </text>
            
            {/* Center floor markers (the famous "Tempio delle Glorie") */}
            <text x="220" y="335" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              ← 통로 사이 단테 가묘 (시신은 라벤나)
            </text>
            <text x="220" y="350" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
              로시니 무덤 (1900)
            </text>
          </g>

          {/* Tombs along right (south) wall — Michelangelo + Machiavelli */}
          {/* Michelangelo: 입구 들어가면 오른쪽 첫 번째 (south wall, near entrance) */}
          <g>
            <rect
              x="90" y="290" width="55" height="40" rx="3"
              fill="rgba(201,169,97,0.10)"
              stroke={pointsByArea['mich-tomb'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['mich-tomb'] ? 1.8 : 1.2}
            />
            <text x="117" y="305" textAnchor="middle" fontSize="8" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Michelangelo
            </text>
            <text x="117" y="317" textAnchor="middle" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              미켈란젤로
            </text>
            <text x="117" y="327" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              1564 (바사리 설계)
            </text>
          </g>

          {/* Machiavelli: 갈릴레오 옆 — 같은 남쪽 벽 더 깊숙이 */}
          <g>
            <rect
              x="160" y="290" width="55" height="40" rx="3"
              fill="rgba(201,169,97,0.10)"
              stroke={pointsByArea['mach-tomb'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['mach-tomb'] ? 1.8 : 1.2}
            />
            <text x="187" y="305" textAnchor="middle" fontSize="8" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Machiavelli
            </text>
            <text x="187" y="317" textAnchor="middle" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              마키아벨리
            </text>
            <text x="187" y="327" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              1787
            </text>
          </g>

          {/* Galileo: 미켈란젤로 마주보고 (북쪽 벽) */}
          <g>
            <rect
              x="90" y="210" width="55" height="40" rx="3"
              fill="rgba(201,169,97,0.10)"
              stroke={pointsByArea['gal-tomb'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['gal-tomb'] ? 1.8 : 1.2}
            />
            <text x="117" y="225" textAnchor="middle" fontSize="8" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Galileo
            </text>
            <text x="117" y="237" textAnchor="middle" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              갈릴레오
            </text>
            <text x="117" y="247" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              1737 (95년 후)
            </text>
          </g>

          {/* Visual line between Mich and Galileo tombs */}
          <line x1="117" y1="250" x2="117" y2="290" stroke="var(--gold)" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.5" />
          <text x="125" y="272" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
            예술 ↕ 과학
          </text>

          {/* Bardi + Peruzzi chapels — east end (apse area, right side) */}
          <g>
            <rect
              x="365" y="220" width="60" height="50" rx="3"
              fill="rgba(184,91,63,0.10)"
              stroke={pointsByArea['bardi-chapel'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['bardi-chapel'] ? 1.5 : 1}
            />
            <text x="395" y="240" textAnchor="middle" fontSize="8.5" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Bardi
            </text>
            <text x="395" y="252" textAnchor="middle" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              지오토
            </text>
            <text x="395" y="263" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              성 프란체스코
            </text>
          </g>

          <g>
            <rect
              x="365" y="275" width="60" height="50" rx="3"
              fill="rgba(184,91,63,0.10)"
              stroke={pointsByArea['peruzzi-chapel'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['peruzzi-chapel'] ? 1.5 : 1}
            />
            <text x="395" y="295" textAnchor="middle" fontSize="8.5" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Peruzzi
            </text>
            <text x="395" y="307" textAnchor="middle" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              지오토
            </text>
            <text x="395" y="318" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              두 요한
            </text>
          </g>

          {/* Main apse (semicircle at east end) */}
          <path
            d="M 360 240 Q 440 270, 360 300"
            fill="rgba(184,91,63,0.04)"
            stroke="var(--line)"
            strokeWidth="1"
            opacity="0.7"
          />

          {/* Cloister (北/north side) */}
          <g>
            <rect
              x="80" y="120" width="280" height="70" rx="3"
              fill="rgba(255,255,255,0.02)"
              stroke="var(--line)"
              strokeWidth="0.8"
              strokeDasharray="3 3"
              opacity="0.5"
            />
            <text x="220" y="142" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Chiostro
            </text>
            <text x="220" y="155" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              회랑 (북쪽 — 별도 입장)
            </text>
            <text x="220" y="172" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
              → 파치 예배당으로 연결
            </text>
          </g>

          {/* Pazzi Chapel — east of cloister */}
          <g>
            <rect
              x="430" y="115" width="120" height="75" rx="3"
              fill="rgba(201,169,97,0.08)"
              stroke={pointsByArea['pazzi-chapel'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['pazzi-chapel'] ? 1.8 : 1.2}
            />
            {/* Small dome circle */}
            <circle cx="490" cy="152" r="20" fill="none" stroke="var(--gold)" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.5" />
            <text x="490" y="135" textAnchor="middle" fontSize="9" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Pazzi
            </text>
            <text x="490" y="158" textAnchor="middle" fontSize="7" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              파치 예배당
            </text>
            <text x="490" y="172" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              브루넬레스키 (1429)
            </text>
            <text x="490" y="184" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              미완성 정면
            </text>
          </g>

          {/* Connector arrow */}
          <line x1="360" y1="155" x2="430" y2="155" stroke="var(--gold)" strokeWidth="1" strokeDasharray="3 2" opacity="0.6" />

          {/* East direction (apse) indicator */}
          <text x="555" y="265" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">→ 동</text>

          {/* Scale info */}
          <text x="220" y="475" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
            115m × 38m · 본당 + 파치 예배당 통합 €8
          </text>

          {/* Point dots */}
          {(() => {
            const positions = {
              'facade': { cx: 220, cy: 381 },
              'mich-tomb': { cx: 117, cy: 310 },
              'mach-tomb': { cx: 187, cy: 310 },
              'gal-tomb': { cx: 117, cy: 230 },
              'bardi-chapel': { cx: 395, cy: 245 },
              'peruzzi-chapel': { cx: 395, cy: 300 },
              'pazzi-chapel': { cx: 490, cy: 152 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 24;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        본당: 미켈란젤로(예술) ↕ 갈릴레오(과학) 마주봄 · 후진: 지오토 두 예배당 · 회랑 통해 파치 예배당
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 7점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BargelloFloorPlan — 2층 구조 (1층 미켈란젤로/첼리니, 2층 도나텔로)
// ─────────────────────────────────────────────────────────
function BargelloFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'bargello-exterior': 'exterior',
    'michelangelo-bacchus': 'mich-room',
    'cellini-bronzes': 'cellini-room',
    'donatello-bronze-david': 'donatello-room',
    'donatello-san-giorgio': 'donatello-room',
    'verrocchio-david': 'donatello-room',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          바르젤로 — 13세기 감옥 → 르네상스 조각 박물관
        </div>
        <div className="dc-floor-label-sub">
          2층 도나텔로 방 (다비드 3대) · 1층 미켈란젤로 + 첼리니 · 1865 이탈리아 첫 국립박물관
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="barg-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#barg-grid)" />

          {/* Vertical scale labels on left */}
          <text x="20" y="100" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">2층</text>
          <text x="20" y="280" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">1층</text>
          <text x="20" y="425" fontSize="9" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">외관</text>

          {/* Torre Volognana indicator (visual right side) */}
          <g>
            <rect x="540" y="55" width="22" height="380" rx="2" fill="rgba(184,91,63,0.08)" stroke="var(--line)" strokeWidth="0.8" />
            <text x="528" y="245" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" transform="rotate(-90, 530, 245)">
              Torre Volognana (57m)
            </text>
          </g>

          {/* === 2nd Floor (top half) === */}
          <g>
            <rect
              x="60" y="65" width="475" height="170" rx="6"
              fill="rgba(184,91,63,0.04)"
              stroke="var(--line)"
              strokeWidth="1.2"
            />
            <text x="80" y="85" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Piano Secondo (2층)
            </text>
            <text x="80" y="98" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              도나텔로의 방 (Salone di Donatello)
            </text>

            {/* Donatello room - huge central hall */}
            <rect
              x="100" y="115" width="380" height="105" rx="4"
              fill="rgba(201,169,97,0.08)"
              stroke={pointsByArea['donatello-room'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['donatello-room'] ? 1.8 : 1.2}
            />
            <text x="290" y="140" textAnchor="middle" fontSize="11" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Salone di Donatello
            </text>
            <text x="290" y="154" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              도나텔로의 방 — 다비드 3대 한 자리
            </text>
            
            {/* 3 statue indicators inside */}
            <g>
              <circle cx="170" cy="190" r="8" fill="rgba(184,91,63,0.15)" stroke="var(--text-faint)" strokeWidth="0.5" />
              <text x="170" y="194" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">조지</text>
              <text x="170" y="207" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">1416</text>
              
              <circle cx="290" cy="190" r="8" fill="rgba(184,91,63,0.15)" stroke="var(--text-faint)" strokeWidth="0.5" />
              <text x="290" y="194" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">다비드</text>
              <text x="290" y="207" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">도나텔로</text>
              
              <circle cx="410" cy="190" r="8" fill="rgba(184,91,63,0.15)" stroke="var(--text-faint)" strokeWidth="0.5" />
              <text x="410" y="194" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">다비드</text>
              <text x="410" y="207" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">베로키오</text>
            </g>
            
            {/* 30 years span between two Davids */}
            <line x1="298" y1="190" x2="402" y2="190" stroke="var(--text-faint)" strokeWidth="0.5" strokeDasharray="2 2" opacity="0.6" />
            <text x="350" y="186" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              30년 양식 변화 →
            </text>
          </g>

          {/* === Stairs (vertical connector) === */}
          <g>
            <rect x="285" y="237" width="30" height="20" rx="2" fill="rgba(255,255,255,0.03)" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="2 2" />
            <text x="300" y="250" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              계단 ↕
            </text>
          </g>

          {/* === 1st Floor (middle) === */}
          <g>
            <rect
              x="60" y="260" width="475" height="130" rx="6"
              fill="rgba(184,91,63,0.04)"
              stroke="var(--line)"
              strokeWidth="1.2"
            />
            <text x="80" y="280" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Piano Primo (1층)
            </text>

            {/* Michelangelo room (left) */}
            <rect
              x="100" y="295" width="180" height="80" rx="4"
              fill="rgba(201,169,97,0.08)"
              stroke={pointsByArea['mich-room'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['mich-room'] ? 1.8 : 1.2}
            />
            <text x="190" y="318" textAnchor="middle" fontSize="10" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Sala di Michelangelo
            </text>
            <text x="190" y="332" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              미켈란젤로의 방
            </text>
            <circle cx="190" cy="354" r="8" fill="rgba(184,91,63,0.15)" stroke="var(--text-faint)" strokeWidth="0.5" />
            <text x="190" y="358" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">바쿠스</text>
            <text x="190" y="370" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR">1497 (22세)</text>

            {/* Cellini corner (right) */}
            <rect
              x="295" y="295" width="180" height="80" rx="4"
              fill="rgba(201,169,97,0.06)"
              stroke={pointsByArea['cellini-room'] ? 'var(--accent)' : 'var(--gold)'}
              strokeWidth={pointsByArea['cellini-room'] ? 1.5 : 1}
            />
            <text x="385" y="318" textAnchor="middle" fontSize="10" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Cellini Bronzi
            </text>
            <text x="385" y="332" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              첼리니 청동 코너
            </text>
            <text x="385" y="354" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              페르세우스 받침대 진품
            </text>
            <text x="385" y="367" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              4 청동상 + 4 부조 (1554)
            </text>
          </g>

          {/* 56년 간격 표시 - between Mich Bacchus (1497) and Cellini Perseus (1554) */}
          <line x1="280" y1="335" x2="295" y2="335" stroke="var(--gold)" strokeWidth="0.7" strokeDasharray="2 2" opacity="0.5" />
          <text x="288" y="345" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
            56년
          </text>

          {/* === Ground floor (entrance/cortile) === */}
          <g>
            <rect
              x="60" y="415" width="475" height="55" rx="4"
              fill="rgba(255,255,255,0.02)"
              stroke={pointsByArea['exterior'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['exterior'] ? 1.5 : 0.8}
              strokeDasharray={pointsByArea['exterior'] ? 'none' : '3 3'}
              opacity={pointsByArea['exterior'] ? 1 : 0.6}
            />
            <text x="80" y="433" fontSize="9" fill="var(--text-soft)" fontFamily="Cormorant Garamond, serif" fontStyle="italic">
              Pianoterra + Cortile
            </text>
            <text x="80" y="446" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              외관 + 안뜰 — 비아 델 프로콘솔로 4번지 (두오모 도보 5분)
            </text>
            <text x="80" y="460" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              13세기 시청관저 → 16~18세기 감옥·처형장 → 1865 박물관 (이탈리아 첫 국립)
            </text>
          </g>

          {/* Point dots */}
          {(() => {
            const positions = {
              'donatello-room': { cx: 290, cy: 165 },
              'mich-room': { cx: 190, cy: 350 },
              'cellini-room': { cx: 385, cy: 350 },
              'exterior': { cx: 290, cy: 442 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 28;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        2층 도나텔로 방 = 다비드 3대 (도나텔로 1430s · 베로키오 1473 · 미켈란젤로 1504는 아카데미아) + 성 조지
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 6점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// BreraFloorPlan — 단층 갤러리 + 방번호 흐름 (6→9→24→29→38)
// ─────────────────────────────────────────────────────────
function BreraFloorPlan({ points, accent, onPointClick }) {
  const POINT_TO_AREA = {
    'brera-exterior': 'cortile',
    'mantegna-dead-christ': 'sala-6',
    'tintoretto-finding-mark': 'sala-9',
    'piero-brera-madonna': 'sala-24',
    'raphael-marriage-virgin': 'sala-24',
    'caravaggio-emmaus': 'sala-29',
    'hayez-kiss': 'sala-38',
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

  const [hoveredPoint, setHoveredPoint] = useState(null);

  return (
    <div className="dc-floorplan-svg" style={{ '--accent': accent }}>
      <div className="dc-floor-label">
        <div className="dc-floor-label-title">
          브레라 — 1층 안뜰 + 2층 갤러리 방번호 흐름
        </div>
        <div className="dc-floor-label-sub">
          나폴레옹 1809 설립 · 40여 방 · 핵심 5 방 (6 · 9 · 24 · 29 · 38)
        </div>
      </div>

      <div className="dc-svg-wrapper">
        <svg viewBox="0 0 600 500" className="dc-floor-svg" preserveAspectRatio="xMidYMid meet">
          <defs>
            <pattern id="brera-grid" width="20" height="20" patternUnits="userSpaceOnUse">
              <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="0.5"/>
            </pattern>
          </defs>
          <rect width="600" height="500" fill="url(#brera-grid)" />

          {/* === Ground floor: Cortile (top) === */}
          <g>
            <rect
              x="60" y="55" width="475" height="105" rx="6"
              fill="rgba(184,91,63,0.04)"
              stroke={pointsByArea['cortile'] ? 'var(--accent)' : 'var(--line)'}
              strokeWidth={pointsByArea['cortile'] ? 1.5 : 1}
            />
            <text x="80" y="78" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Pianoterra — Cortile (1층 안뜰)
            </text>
            <text x="80" y="92" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              17세기 예수회 학교 → 1809 나폴레옹의 국가 갤러리
            </text>

            {/* Napoleon statue (center) */}
            <g>
              <circle cx="297" cy="118" r="16" fill="rgba(201,169,97,0.15)" stroke="var(--gold)" strokeWidth="1.2" />
              <text x="297" y="123" textAnchor="middle" fontSize="7" fill="var(--gold)" fontFamily="Noto Sans KR" fontWeight="500">
                나폴레옹
              </text>
              <text x="297" y="145" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                Canova 1811 · 누드 청동상
              </text>
              <text x="297" y="155" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                (원본은 런던, 여긴 복제품)
              </text>
            </g>

            {/* Library + Observatory indicators */}
            <text x="105" y="125" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              · 도서관
            </text>
            <text x="105" y="137" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              · 천문대
            </text>
            <text x="480" y="125" textAnchor="end" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              미술 아카데미 ·
            </text>
            <text x="480" y="137" textAnchor="end" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              한 건물에 5 기관 ·
            </text>
          </g>

          {/* === Staircase connector === */}
          <g>
            <rect x="280" y="165" width="34" height="22" rx="2" fill="rgba(255,255,255,0.04)" stroke="var(--line)" strokeWidth="0.8" strokeDasharray="3 2" />
            <text x="297" y="180" textAnchor="middle" fontSize="7.5" fill="var(--text-soft)" fontFamily="Noto Sans KR">
              ↓ 계단 (2층 진입)
            </text>
          </g>

          {/* === 2nd floor: Pinacoteca === */}
          <g>
            <rect
              x="60" y="195" width="475" height="245" rx="6"
              fill="rgba(184,91,63,0.04)"
              stroke="var(--line)"
              strokeWidth="1.2"
            />
            <text x="80" y="216" fontSize="10" fill="var(--accent)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
              Piano Primo — Pinacoteca (2층 갤러리)
            </text>
            <text x="80" y="228" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
              40여 방 · 핵심 5 방만 표시 · 화살표 = 관람 순서
            </text>

            {/* Sala 6 — Mantegna */}
            <g>
              <rect
                x="80" y="245" width="135" height="80" rx="4"
                fill="rgba(201,169,97,0.10)"
                stroke={pointsByArea['sala-6'] ? 'var(--accent)' : 'var(--gold)'}
                strokeWidth={pointsByArea['sala-6'] ? 1.8 : 1.2}
              />
              <text x="147" y="262" textAnchor="middle" fontSize="11" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Sala 6
              </text>
              <text x="147" y="278" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                만테냐 (1480)
              </text>
              <text x="147" y="293" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                〈죽은 그리스도〉
              </text>
              <text x="147" y="306" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                극단적 단축법
              </text>
              <text x="147" y="318" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                66×81cm 소형
              </text>
            </g>

            {/* Arrow */}
            <line x1="220" y1="285" x2="245" y2="285" stroke="var(--gold)" strokeWidth="1.2" markerEnd="url(#brera-arr)" />

            {/* Sala 9 — Tintoretto */}
            <g>
              <rect
                x="250" y="245" width="135" height="80" rx="4"
                fill="rgba(201,169,97,0.08)"
                stroke={pointsByArea['sala-9'] ? 'var(--accent)' : 'var(--gold)'}
                strokeWidth={pointsByArea['sala-9'] ? 1.8 : 1.2}
              />
              <text x="317" y="262" textAnchor="middle" fontSize="11" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Sala 9
              </text>
              <text x="317" y="278" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                틴토레토 (1562)
              </text>
              <text x="317" y="293" textAnchor="middle" fontSize="7.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                〈성 마르코 시신 발견〉
              </text>
              <text x="317" y="306" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                극단적 단축법 회랑
              </text>
              <text x="317" y="318" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                매너리즘 정점
              </text>
            </g>

            {/* Arrow */}
            <line x1="390" y1="285" x2="415" y2="285" stroke="var(--gold)" strokeWidth="1.2" markerEnd="url(#brera-arr)" />

            {/* Sala 24 — Piero + Raphael */}
            <g>
              <rect
                x="420" y="245" width="110" height="80" rx="4"
                fill="rgba(201,169,97,0.12)"
                stroke={pointsByArea['sala-24'] ? 'var(--accent)' : 'var(--gold)'}
                strokeWidth={pointsByArea['sala-24'] ? 2 : 1.4}
              />
              <text x="475" y="262" textAnchor="middle" fontSize="11" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Sala 24
              </text>
              <text x="475" y="276" textAnchor="middle" fontSize="8" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                피에로 + 라파엘로
              </text>
              <text x="475" y="289" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                〈브레라 마돈나〉 (1472)
              </text>
              <text x="475" y="301" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                〈성모의 결혼〉 (1504)
              </text>
              <text x="475" y="316" textAnchor="middle" fontSize="6" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                ★ 두 거장 한 방
              </text>
            </g>

            {/* Arrow going down */}
            <line x1="475" y1="330" x2="475" y2="355" stroke="var(--gold)" strokeWidth="1.2" markerEnd="url(#brera-arr)" />
            <text x="490" y="345" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
              ↓
            </text>

            {/* Sala 29 — Caravaggio */}
            <g>
              <rect
                x="240" y="360" width="135" height="70" rx="4"
                fill="rgba(201,169,97,0.10)"
                stroke={pointsByArea['sala-29'] ? 'var(--accent)' : 'var(--gold)'}
                strokeWidth={pointsByArea['sala-29'] ? 1.8 : 1.2}
              />
              <text x="307" y="377" textAnchor="middle" fontSize="11" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Sala 29
              </text>
              <text x="307" y="392" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                카라바조 (1606)
              </text>
              <text x="307" y="406" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                〈엠마오의 저녁〉
              </text>
              <text x="307" y="418" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                살인 직후 작품
              </text>
            </g>

            {/* Arrow */}
            <line x1="240" y1="395" x2="225" y2="395" stroke="var(--gold)" strokeWidth="1.2" />
            <line x1="225" y1="395" x2="225" y2="395" stroke="var(--gold)" strokeWidth="1.2" markerEnd="url(#brera-arr)" />
            <line x1="380" y1="395" x2="405" y2="395" stroke="var(--gold)" strokeWidth="1.2" markerEnd="url(#brera-arr)" />

            {/* Sala 38 — Hayez (the climax) */}
            <g>
              <rect
                x="410" y="360" width="120" height="70" rx="4"
                fill="rgba(184,91,63,0.15)"
                stroke={pointsByArea['sala-38'] ? 'var(--accent)' : 'var(--gold)'}
                strokeWidth={pointsByArea['sala-38'] ? 2.2 : 1.5}
              />
              <text x="470" y="377" textAnchor="middle" fontSize="11" fill="var(--gold)" fontFamily="Cormorant Garamond, serif" fontStyle="italic" fontWeight="500">
                Sala 38
              </text>
              <text x="470" y="392" textAnchor="middle" fontSize="9" fill="var(--text-soft)" fontFamily="Noto Sans KR">
                하이에즈 (1859)
              </text>
              <text x="470" y="406" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR">
                〈키스 — Il Bacio〉
              </text>
              <text x="470" y="418" textAnchor="middle" fontSize="6.5" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.8">
                통일 이탈리아 시각화
              </text>
            </g>

            {/* "기타 방들" indicator */}
            <g>
              <rect x="80" y="360" width="135" height="70" rx="3" fill="rgba(255,255,255,0.02)" stroke="var(--line)" strokeWidth="0.6" strokeDasharray="3 3" opacity="0.5" />
              <text x="147" y="385" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.7">
                Sale 10~23
              </text>
              <text x="147" y="400" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
                벨리니·티치아노
              </text>
              <text x="147" y="412" textAnchor="middle" fontSize="7" fill="var(--text-faint)" fontFamily="Noto Sans KR" opacity="0.6">
                베네치아 거장 다수
              </text>
            </g>

            {/* Arrow marker definition */}
            <defs>
              <marker id="brera-arr" markerWidth="6" markerHeight="6" refX="5" refY="3" orient="auto">
                <path d="M 0 0 L 6 3 L 0 6 z" fill="var(--gold)" />
              </marker>
            </defs>
          </g>

          {/* Bottom info */}
          <text x="300" y="465" textAnchor="middle" fontSize="8" fill="var(--text-faint)" fontFamily="DM Sans" opacity="0.7">
            €15 · 매월 첫 일요일 무료 · 월요일 휴관 · 평균 2~3시간
          </text>

          {/* Point dots */}
          {(() => {
            const positions = {
              'cortile': { cx: 297, cy: 118 },
              'sala-6': { cx: 147, cy: 285 },
              'sala-9': { cx: 317, cy: 285 },
              'sala-24': { cx: 475, cy: 285 },
              'sala-29': { cx: 307, cy: 395 },
              'sala-38': { cx: 470, cy: 395 },
            };
            return Object.entries(pointsByArea).flatMap(([area, pts]) => {
              const pos = positions[area];
              if (!pos) return [];
              return pts.map((p, i) => {
                const offset = pts.length === 1 ? 0 : (i - (pts.length - 1) / 2) * 26;
                return (
                  <g
                    key={p.id}
                    style={{ cursor: 'pointer' }}
                    onClick={() => onPointClick(p.id)}
                    onMouseEnter={() => setHoveredPoint(p.id)}
                    onMouseLeave={() => setHoveredPoint(null)}
                  >
                    <circle
                      cx={pos.cx + offset} cy={pos.cy}
                      r={hoveredPoint === p.id ? 14 : 11}
                      fill="var(--accent)" stroke="var(--bg)" strokeWidth="2"
                      style={{ transition: 'all 0.15s' }}
                    />
                    <text
                      x={pos.cx + offset} y={pos.cy + 4}
                      fontSize="10" fill="var(--bg)"
                      fontFamily="DM Sans" fontWeight="600"
                      textAnchor="middle" pointerEvents="none"
                    >
                      {String(p.idx).padStart(2, '0')}
                    </text>
                  </g>
                );
              });
            });
          })()}
        </svg>
      </div>

      <div className="dc-floorplan-note">
        2층 시간순 흐름: 6(15c) → 9(16c) → 24(15~16c) → 29(17c) → 38(19c) · Sala 24는 두 거장 한 방
      </div>

      <div className="dc-floor-pointlist">
        <div className="dc-floor-pointlist-title">전체 7점:</div>
        {points.map((p, i) => (
          <button
            key={p.id}
            className="dc-floor-room-list-point"
            onClick={() => onPointClick(p.id)}
          >
            <span className="dc-floor-room-list-num">{String(i + 1).padStart(2, '0')}</span>
            <span className="dc-floor-room-list-name-text">{p.name}</span>
            <span className="dc-floor-room-list-artist">{p.artist || ''}</span>
          </button>
        ))}
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
      <div>도슨트 · Docent v0.67</div>
      <div>이미지: Wikimedia Commons (Public Domain)</div>
      <div>오디오: Microsoft Edge TTS · ko-KR-SunHi Neural</div>
      <div>오프라인 지원 · 카메라 인식 (Claude Vision)</div>
    </footer>
  );
}
