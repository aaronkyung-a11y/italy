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
// Footer
// ─────────────────────────────────────────────────────────
function Footer() {
  return (
    <footer className="dc-footer">
      <div>도슨트 · Docent v0.3</div>
      <div>이미지: Wikimedia Commons (Public Domain)</div>
      <div>오디오: Microsoft Edge TTS · ko-KR-SunHi Neural</div>
    </footer>
  );
}
