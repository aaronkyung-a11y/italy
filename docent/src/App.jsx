import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ChevronRight, ArrowLeft, Play, Pause, Volume2, VolumeX,
  Clock, Info, MapPin, Star, Headphones, BookOpen, Eye, Sparkles, Quote,
} from 'lucide-react';
import { ATTRACTIONS, findAttraction, findPoint, TOTAL_POINTS } from './data/attractions.js';

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
// TTS player (Web Speech API — v0.1 임시. v0.2에서 OpenAI MP3로 교체)
// ─────────────────────────────────────────────────────────
function useTTS() {
  const [playing, setPlaying] = useState(null); // pointId currently playing
  const utterRef = useRef(null);

  // Stop on unmount
  useEffect(() => () => stop(), []);

  function stop() {
    try { window.speechSynthesis?.cancel(); } catch { /* ignore */ }
    setPlaying(null);
    utterRef.current = null;
  }

  function play(pointId, text) {
    if (!('speechSynthesis' in window)) return;
    stop();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = 'ko-KR';
    u.rate = 0.95;
    u.pitch = 1.0;
    u.onend = () => { setPlaying(null); utterRef.current = null; };
    u.onerror = () => { setPlaying(null); utterRef.current = null; };
    utterRef.current = u;
    setPlaying(pointId);
    window.speechSynthesis.speak(u);
  }

  function toggle(pointId, text) {
    if (playing === pointId) stop();
    else play(pointId, text);
  }

  return { playing, play, stop, toggle };
}

// ─────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────
export default function App() {
  const view = useViewStack();
  const tts = useTTS();

  // Stop audio on view change
  useEffect(() => { tts.stop(); }, [view.current.name]);

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
          tts={tts}
        />
      )}

      <Footer />
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Home — list of 5 attractions
// ─────────────────────────────────────────────────────────
function HomeView({ push }) {
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
        </div>
      </header>

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
function PointView({ attractionId, pointId, pop, tts }) {
  const point = findPoint(attractionId, pointId);
  const attraction = findAttraction(attractionId);
  const isPlaying = tts.playing === pointId;

  if (!point) return <div>포인트를 찾을 수 없습니다.</div>;

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

      <button
        className={`dc-audio-btn ${isPlaying ? 'on' : ''}`}
        onClick={() => tts.toggle(point.id, point.ttsScript)}
      >
        {isPlaying ? <Pause size={20} /> : <Play size={20} />}
        <span>{isPlaying ? '재생 중...' : '오디오 도슨트 듣기'}</span>
        <span className="dc-audio-meta">약 {Math.ceil(point.ttsScript.length / 250)}분</span>
      </button>

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
// Footer
// ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="dc-footer">
      <div>도슨트 · Docent v0.1</div>
      <div>이미지: Wikimedia Commons (Public Domain)</div>
      <div>오디오: Web Speech TTS · v0.2에서 OpenAI MP3로 교체 예정</div>
    </footer>
  );
}
