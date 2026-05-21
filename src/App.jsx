import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import {
  Camera, MapPin, Languages, Volume2, VolumeX, Loader2,
  ArrowLeft, X, Sparkles, Compass, Image as ImageIcon,
  Navigation, ChevronRight, BookOpen, Star, AlertCircle,
  Utensils, FolderHeart, Trash2, Check, Bookmark, AlertTriangle,
  Receipt, Heart, Bell, BellRing, RefreshCw, Info, Layers,
  Mic, MicOff, Route, Clock, Footprints, Download, Share2,
  Database, ChevronDown, ChevronUp, Wand2, Sun, UtensilsCrossed,
  CalendarDays, BookmarkCheck, BookmarkX,
  Phone, ExternalLink, Users, TrendingUp, Filter
} from 'lucide-react';

// ─────────────────────────────────────────────────────────
// Landmark database (63 곳)
// ─────────────────────────────────────────────────────────
const LANDMARKS = [
  { id: 'colosseum',       name: '콜로세움',                    nameLocal: 'Colosseo',                            city: '로마',      region: 'Lazio',          lat: 41.8902, lng: 12.4922, emoji: '🏛️' },
  { id: 'vatican',         name: '바티칸 박물관',                 nameLocal: 'Musei Vaticani',                      city: '바티칸',    region: 'Vaticano',       lat: 41.9065, lng: 12.4536, emoji: '🎨' },
  { id: 'stpeters',        name: '성 베드로 대성당',              nameLocal: 'Basilica di San Pietro',              city: '바티칸',    region: 'Vaticano',       lat: 41.9022, lng: 12.4533, emoji: '⛪' },
  { id: 'sistine',         name: '시스티나 예배당',                nameLocal: 'Cappella Sistina',                    city: '바티칸',    region: 'Vaticano',       lat: 41.9029, lng: 12.4545, emoji: '🖌️' },
  { id: 'pantheon',        name: '판테온',                      nameLocal: 'Pantheon',                            city: '로마',      region: 'Lazio',          lat: 41.8986, lng: 12.4769, emoji: '🏛️' },
  { id: 'trevi',           name: '트레비 분수',                   nameLocal: 'Fontana di Trevi',                    city: '로마',      region: 'Lazio',          lat: 41.9009, lng: 12.4833, emoji: '⛲' },
  { id: 'spanishsteps',    name: '스페인 광장 계단',              nameLocal: 'Scalinata di Trinità dei Monti',      city: '로마',      region: 'Lazio',          lat: 41.9059, lng: 12.4823, emoji: '🪜' },
  { id: 'romanforum',      name: '로마 포룸',                    nameLocal: 'Foro Romano',                         city: '로마',      region: 'Lazio',          lat: 41.8925, lng: 12.4853, emoji: '🏺' },
  { id: 'piazzanavona',    name: '나보나 광장',                   nameLocal: 'Piazza Navona',                       city: '로마',      region: 'Lazio',          lat: 41.8992, lng: 12.4731, emoji: '⛲' },
  { id: 'castelsantangelo',name: '산탄젤로 성',                  nameLocal: "Castel Sant'Angelo",                  city: '로마',      region: 'Lazio',          lat: 41.9031, lng: 12.4663, emoji: '🏰' },
  { id: 'borghese',        name: '보르게세 미술관',                nameLocal: 'Galleria Borghese',                   city: '로마',      region: 'Lazio',          lat: 41.9142, lng: 12.4922, emoji: '🖼️' },
  { id: 'catacombs',       name: '산 칼리스토 카타콤베',          nameLocal: 'Catacombe di San Callisto',           city: '로마',      region: 'Lazio',          lat: 41.8584, lng: 12.5104, emoji: '⚰️' },
  { id: 'piazzapopolo',    name: '포폴로 광장',                   nameLocal: 'Piazza del Popolo',                   city: '로마',      region: 'Lazio',          lat: 41.9108, lng: 12.4767, emoji: '⛲' },
  { id: 'uffizi',          name: '우피치 미술관',                  nameLocal: 'Galleria degli Uffizi',               city: '피렌체',    region: 'Toscana',        lat: 43.7677, lng: 11.2553, emoji: '🖼️' },
  { id: 'duomofi',         name: '피렌체 두오모',                  nameLocal: 'Cattedrale di Santa Maria del Fiore', city: '피렌체',    region: 'Toscana',        lat: 43.7731, lng: 11.2560, emoji: '⛪' },
  { id: 'pontevecchio',    name: '베키오 다리',                    nameLocal: 'Ponte Vecchio',                       city: '피렌체',    region: 'Toscana',        lat: 43.7679, lng: 11.2531, emoji: '🌉' },
  { id: 'accademia',       name: '아카데미아 (다비드상)',          nameLocal: "Galleria dell'Accademia",             city: '피렌체',    region: 'Toscana',        lat: 43.7768, lng: 11.2589, emoji: '🗿' },
  { id: 'palazzovecchio',  name: '베키오 궁전',                    nameLocal: 'Palazzo Vecchio',                     city: '피렌체',    region: 'Toscana',        lat: 43.7696, lng: 11.2558, emoji: '🏛️' },
  { id: 'pittipalace',     name: '피티 궁전',                      nameLocal: 'Palazzo Pitti',                       city: '피렌체',    region: 'Toscana',        lat: 43.7651, lng: 11.2500, emoji: '🏰' },
  { id: 'piazzaleMA',      name: '미켈란젤로 광장',                 nameLocal: 'Piazzale Michelangelo',               city: '피렌체',    region: 'Toscana',        lat: 43.7629, lng: 11.2649, emoji: '🌆' },
  { id: 'piazzacampo',     name: '캄포 광장',                     nameLocal: 'Piazza del Campo',                    city: '시에나',    region: 'Toscana',        lat: 43.3186, lng: 11.3320, emoji: '🏟️' },
  { id: 'duomosi',         name: '시에나 대성당',                  nameLocal: 'Duomo di Siena',                      city: '시에나',    region: 'Toscana',        lat: 43.3175, lng: 11.3289, emoji: '⛪' },
  { id: 'leaningtower',    name: '피사의 사탑',                    nameLocal: 'Torre di Pisa',                       city: '피사',      region: 'Toscana',        lat: 43.7230, lng: 10.3966, emoji: '🗼' },
  { id: 'pisabaptistery',  name: '피사 세례당',                    nameLocal: 'Battistero di Pisa',                  city: '피사',      region: 'Toscana',        lat: 43.7232, lng: 10.3946, emoji: '⛪' },
  { id: 'sanmarco',        name: '산 마르코 대성당',                nameLocal: 'Basilica di San Marco',               city: '베네치아',  region: 'Veneto',         lat: 45.4345, lng: 12.3397, emoji: '⛪' },
  { id: 'piazzasanmarco',  name: '산 마르코 광장',                 nameLocal: 'Piazza San Marco',                    city: '베네치아',  region: 'Veneto',         lat: 45.4341, lng: 12.3388, emoji: '🕊️' },
  { id: 'ducale',          name: '두칼레 궁전',                    nameLocal: 'Palazzo Ducale',                      city: '베네치아',  region: 'Veneto',         lat: 45.4337, lng: 12.3402, emoji: '🏰' },
  { id: 'rialto',          name: '리알토 다리',                    nameLocal: 'Ponte di Rialto',                     city: '베네치아',  region: 'Veneto',         lat: 45.4380, lng: 12.3358, emoji: '🌉' },
  { id: 'bridgesighs',     name: '탄식의 다리',                    nameLocal: 'Ponte dei Sospiri',                   city: '베네치아',  region: 'Veneto',         lat: 45.4339, lng: 12.3409, emoji: '🌉' },
  { id: 'guggenheim',      name: '페기 구겐하임 미술관',            nameLocal: 'Collezione Peggy Guggenheim',         city: '베네치아',  region: 'Veneto',         lat: 45.4308, lng: 12.3311, emoji: '🖼️' },
  { id: 'arenaverona',     name: '베로나 원형극장',                nameLocal: 'Arena di Verona',                     city: '베로나',    region: 'Veneto',         lat: 45.4390, lng: 10.9943, emoji: '🎭' },
  { id: 'giulietta',       name: '줄리엣의 집',                    nameLocal: 'Casa di Giulietta',                   city: '베로나',    region: 'Veneto',         lat: 45.4419, lng: 10.9982, emoji: '🌹' },
  { id: 'duomomi',         name: '밀라노 두오모',                  nameLocal: 'Duomo di Milano',                     city: '밀라노',    region: 'Lombardia',      lat: 45.4642, lng:  9.1900, emoji: '⛪' },
  { id: 'galleria',        name: '비토리오 에마누엘레 갤러리아',     nameLocal: 'Galleria Vittorio Emanuele II',       city: '밀라노',    region: 'Lombardia',      lat: 45.4659, lng:  9.1898, emoji: '🛍️' },
  { id: 'lascala',         name: '라 스칼라 극장',                 nameLocal: 'Teatro alla Scala',                   city: '밀라노',    region: 'Lombardia',      lat: 45.4674, lng:  9.1895, emoji: '🎭' },
  { id: 'sforza',          name: '스포르체스코 성',                nameLocal: 'Castello Sforzesco',                  city: '밀라노',    region: 'Lombardia',      lat: 45.4708, lng:  9.1796, emoji: '🏰' },
  { id: 'lastsupper',      name: '최후의 만찬',                   nameLocal: 'Cenacolo Vinciano',                   city: '밀라노',    region: 'Lombardia',      lat: 45.4659, lng:  9.1709, emoji: '🎨' },
  { id: 'brera',           name: '브레라 미술관',                  nameLocal: 'Pinacoteca di Brera',                 city: '밀라노',    region: 'Lombardia',      lat: 45.4720, lng:  9.1881, emoji: '🖼️' },
  { id: 'bellagio',        name: '벨라조',                       nameLocal: 'Bellagio',                            city: '코모 호수', region: 'Lombardia',      lat: 45.9858, lng:  9.2618, emoji: '🏞️' },
  { id: 'comolake',        name: '코모 시내',                    nameLocal: 'Como',                                city: '코모',     region: 'Lombardia',      lat: 45.8081, lng:  9.0852, emoji: '🌊' },
  { id: 'palazzomantova',  name: '만토바 두칼레 궁전',             nameLocal: 'Palazzo Ducale di Mantova',           city: '만토바',    region: 'Lombardia',      lat: 45.1620, lng: 10.8019, emoji: '🏰' },
  { id: 'mole',            name: '몰레 안토넬리아나',              nameLocal: 'Mole Antonelliana',                   city: '토리노',    region: 'Piemonte',       lat: 45.0691, lng:  7.6932, emoji: '🗼' },
  { id: 'museoegizio',     name: '이집트 박물관',                  nameLocal: 'Museo Egizio',                        city: '토리노',    region: 'Piemonte',       lat: 45.0681, lng:  7.6841, emoji: '🏺' },
  { id: 'duetorri',        name: '두 탑',                         nameLocal: 'Le due torri',                        city: '볼로냐',    region: 'Emilia-Romagna', lat: 44.4946, lng: 11.3466, emoji: '🗼' },
  { id: 'piazzamaggiore',  name: '마조레 광장',                    nameLocal: 'Piazza Maggiore',                     city: '볼로냐',    region: 'Emilia-Romagna', lat: 44.4938, lng: 11.3430, emoji: '🏛️' },
  { id: 'sanvitale',       name: '산 비탈레 성당 (모자이크)',       nameLocal: 'Basilica di San Vitale',              city: '라벤나',    region: 'Emilia-Romagna', lat: 44.4204, lng: 12.1958, emoji: '⛪' },
  { id: 'cinqueterre',     name: '친퀘 테레',                     nameLocal: 'Cinque Terre',                        city: '리구리아',   region: 'Liguria',        lat: 44.1271, lng:  9.7089, emoji: '🌊' },
  { id: 'monterosso',      name: '몬테로소',                       nameLocal: 'Monterosso al Mare',                  city: '친퀘 테레', region: 'Liguria',        lat: 44.1457, lng:  9.6552, emoji: '🌊' },
  { id: 'vernazza',        name: '베르나차',                       nameLocal: 'Vernazza',                            city: '친퀘 테레', region: 'Liguria',        lat: 44.1352, lng:  9.6845, emoji: '🌊' },
  { id: 'manarola',        name: '마나롤라',                       nameLocal: 'Manarola',                            city: '친퀘 테레', region: 'Liguria',        lat: 44.1066, lng:  9.7274, emoji: '🌊' },
  { id: 'genovaaquarium',  name: '제노바 수족관',                  nameLocal: 'Acquario di Genova',                  city: '제노바',    region: 'Liguria',        lat: 44.4099, lng:  8.9264, emoji: '🐠' },
  { id: 'pompeii',         name: '폼페이 유적',                    nameLocal: 'Scavi archeologici di Pompei',        city: '폼페이',    region: 'Campania',       lat: 40.7484, lng: 14.4849, emoji: '🏺' },
  { id: 'naplesmuseum',    name: '나폴리 국립 고고학 박물관',        nameLocal: 'Museo Archeologico Nazionale di Napoli', city: '나폴리', region: 'Campania',     lat: 40.8534, lng: 14.2502, emoji: '🏛️' },
  { id: 'bluegrotto',      name: '푸른 동굴',                     nameLocal: 'Grotta Azzurra',                      city: '카프리',    region: 'Campania',       lat: 40.5605, lng: 14.2059, emoji: '🌊' },
  { id: 'positano',        name: '포지타노',                       nameLocal: 'Positano',                            city: '아말피',    region: 'Campania',       lat: 40.6280, lng: 14.4847, emoji: '🏖️' },
  { id: 'amalfi',          name: '아말피 대성당',                  nameLocal: 'Duomo di Amalfi',                     city: '아말피',    region: 'Campania',       lat: 40.6340, lng: 14.6027, emoji: '⛪' },
  { id: 'valleditempli',   name: '신전의 계곡',                    nameLocal: 'Valle dei Templi',                    city: '아그리젠토', region: 'Sicilia',        lat: 37.2902, lng: 13.5868, emoji: '🏛️' },
  { id: 'taormina',        name: '타오르미나 그리스 극장',           nameLocal: 'Teatro antico di Taormina',           city: '타오르미나', region: 'Sicilia',        lat: 37.8523, lng: 15.2917, emoji: '🎭' },
  { id: 'etna',            name: '에트나 화산',                    nameLocal: 'Etna',                                city: '시칠리아',  region: 'Sicilia',        lat: 37.7510, lng: 14.9934, emoji: '🌋' },
  { id: 'monrealecath',    name: '몬레알레 대성당',                 nameLocal: 'Duomo di Monreale',                   city: '몬레알레',  region: 'Sicilia',        lat: 38.0816, lng: 13.2924, emoji: '⛪' },
  { id: 'palermocath',     name: '팔레르모 대성당',                 nameLocal: 'Cattedrale di Palermo',               city: '팔레르모',  region: 'Sicilia',        lat: 38.1145, lng: 13.3563, emoji: '⛪' },
];

const DEMO_LOCATIONS = [
  { label: '🏛️  로마 — 콜로세움 옆',     lat: 41.8902, lng: 12.4922 },
  { label: '🎨  바티칸 — 박물관 입구',     lat: 41.9065, lng: 12.4536 },
  { label: '🖼️  피렌체 — 우피치 광장',    lat: 43.7677, lng: 11.2553 },
  { label: '🕊️  베네치아 — 산 마르코',    lat: 45.4341, lng: 12.3388 },
  { label: '⛪  밀라노 — 두오모 앞',       lat: 45.4642, lng:  9.1900 },
  { label: '🌹  베로나 — 줄리엣의 집',     lat: 45.4419, lng: 10.9982 },
  { label: '🏟️  시에나 — 캄포 광장',      lat: 43.3186, lng: 11.3320 },
  { label: '🌋  시칠리아 — 에트나',       lat: 37.7510, lng: 14.9934 },
];

// ─────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

function formatDistance(m) {
  if (m == null) return '—';
  if (m < 1000) return `${Math.round(m)} m`;
  return `${(m / 1000).toFixed(1)} km`;
}

// Walking time estimate. 5km/h base, ×1.3 detour factor for city walking
function walkingMinutes(meters) {
  return Math.round((meters * 1.3) / 83.3);
}

function compressImage(file, maxDim = 1280) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let { width, height } = img;
        if (width > maxDim || height > maxDim) {
          if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
          else { width = Math.round((width * maxDim) / height); height = maxDim; }
        }
        canvas.width = width; canvas.height = height;
        canvas.getContext('2d').drawImage(img, 0, 0, width, height);
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85);
        resolve({ dataUrl, base64: dataUrl.split(',')[1], mimeType: 'image/jpeg' });
      };
      img.onerror = reject; img.src = e.target.result;
    };
    reader.onerror = reject;
    reader.readAsDataURL(file);
  });
}

function compressThumbnail(dataUrl, maxDim = 320) {
  return new Promise((resolve) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');
      let { width, height } = img;
      if (width > maxDim || height > maxDim) {
        if (width > height) { height = Math.round((height * maxDim) / width); width = maxDim; }
        else { width = Math.round((width * maxDim) / height); height = maxDim; }
      }
      canvas.width = width; canvas.height = height;
      canvas.getContext('2d').drawImage(img, 0, 0, width, height);
      resolve(canvas.toDataURL('image/jpeg', 0.75));
    };
    img.src = dataUrl;
  });
}

async function callClaude(messages, maxTokens = 1500) {
  const response = await fetch('/api/claude', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: 'claude-sonnet-4-20250514', max_tokens: maxTokens, messages }),
  });
  if (!response.ok) throw new Error(`API error ${response.status}`);
  const data = await response.json();
  return data.content?.filter((b) => b.type === 'text').map((b) => b.text).join('\n') || '';
}

function safeParseJSON(text) {
  const cleaned = text.replace(/```json\s*|\s*```/g, '').trim();
  const start = cleaned.indexOf('{');
  const end = cleaned.lastIndexOf('}');
  if (start === -1 || end === -1) throw new Error('No JSON found');
  return JSON.parse(cleaned.slice(start, end + 1));
}

function openInMaps(lat, lng, name) {
  const ua = navigator.userAgent;
  const isApple = /iPhone|iPad|iPod|Mac/.test(ua);
  const url = isApple
    ? `https://maps.apple.com/?ll=${lat},${lng}&q=${encodeURIComponent(name || '')}`
    : `geo:${lat},${lng}?q=${lat},${lng}(${encodeURIComponent(name || '')})`;
  // For Android, geo: URI opens Google Maps app directly
  window.location.href = url;
}

function openMultiStopMaps(stops) {
  // Build Google Maps directions URL with multiple waypoints
  if (stops.length === 0) return;
  const origin = `${stops[0].lat},${stops[0].lng}`;
  const destination = `${stops[stops.length - 1].lat},${stops[stops.length - 1].lng}`;
  const waypoints = stops.slice(1, -1).map(s => `${s.lat},${s.lng}`).join('|');
  let url = `https://www.google.com/maps/dir/?api=1&origin=${origin}&destination=${destination}&travelmode=walking`;
  if (waypoints) url += `&waypoints=${encodeURIComponent(waypoints)}`;
  window.open(url, '_blank', 'noopener,noreferrer');
}

function categoryStyle(cat) {
  const c = (cat || '').toLowerCase();
  if (c.includes('antipast') || c.includes('contorn')) return { bg: '#6B8F65', fg: '#fff8ec' };
  if (c.includes('prim')) return { bg: '#C9A961', fg: '#2B221E' };
  if (c.includes('second') || c.includes('pizz') || c.includes('carne') || c.includes('pesce')) return { bg: '#B8553A', fg: '#fff8ec' };
  if (c.includes('dolc') || c.includes('gelat')) return { bg: '#D58CA6', fg: '#2B221E' };
  if (c.includes('bevand') || c.includes('vino') || c.includes('drink')) return { bg: '#5C7AAB', fg: '#fff8ec' };
  return { bg: '#9A7A3A', fg: '#fff8ec' };
}

function formatKRW(n) {
  if (n == null || !isFinite(n)) return '—';
  return '₩' + Math.round(n).toLocaleString('ko-KR');
}

function formatEUR(n) {
  if (n == null || !isFinite(n)) return '—';
  return '€' + n.toFixed(2);
}

// ─────────────────────────────────────────────────────────
// IndexedDB (gracefully degrades to in-memory in artifact env)
// ─────────────────────────────────────────────────────────
const DB_NAME = 'belviaggio';
const DB_VERSION = 3;  // v0.6: added 'restaurants' store for Places API cache
const STORES = ['collection', 'favorites', 'photos', 'details', 'restaurants'];

let dbPromise = null;
let dbAvailable = null; // null = unknown, true/false = checked

function openDB() {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve, reject) => {
    if (typeof indexedDB === 'undefined') {
      dbAvailable = false;
      return reject(new Error('IndexedDB unavailable'));
    }
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => { dbAvailable = false; reject(req.error); };
      req.onblocked = () => { dbAvailable = false; reject(new Error('DB blocked')); };
      req.onsuccess = () => { dbAvailable = true; resolve(req.result); };
      req.onupgradeneeded = (e) => {
        const db = e.target.result;
        STORES.forEach(name => {
          if (!db.objectStoreNames.contains(name)) {
            db.createObjectStore(name, { keyPath: 'id' });
          }
        });
      };
    } catch (err) {
      dbAvailable = false;
      reject(err);
    }
  });
  return dbPromise.catch((e) => { dbPromise = null; throw e; });
}

async function dbAll(storeName) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).getAll();
      req.onsuccess = () => resolve(req.result || []);
      req.onerror = () => reject(req.error);
    });
  } catch { return []; }
}

async function dbGet(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readonly');
      const req = tx.objectStore(storeName).get(key);
      req.onsuccess = () => resolve(req.result || null);
      req.onerror = () => reject(req.error);
    });
  } catch { return null; }
}

async function dbPut(storeName, item) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).put(item);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* in-memory fallback */ }
}

async function dbDelete(storeName, key) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).delete(key);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

async function dbClear(storeName) {
  try {
    const db = await openDB();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(storeName, 'readwrite');
      const req = tx.objectStore(storeName).clear();
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
  } catch { /* ignore */ }
}

// ─────────────────────────────────────────────────────────
// Exchange rate — multi-provider fallback chain
// (api.frankfurter.app moved to frankfurter.dev in early 2026,
//  old URL returns 301 redirect which some browsers don't follow)
// ─────────────────────────────────────────────────────────
const FX_PROVIDERS = [
  {
    name: 'ECB',
    url: 'https://api.frankfurter.dev/v1/latest?base=EUR&symbols=KRW',
    parse: (d) => ({ rate: d.rates?.KRW, date: d.date, source: 'ECB' }),
  },
  {
    name: 'open.er-api',
    url: 'https://open.er-api.com/v6/latest/EUR',
    parse: (d) => ({
      rate: d.rates?.KRW,
      date: d.time_last_update_utc ? new Date(d.time_last_update_utc).toISOString().slice(0, 10) : '',
      source: 'open.er-api',
    }),
  },
  {
    name: 'exchangerate-api',
    url: 'https://api.exchangerate-api.com/v4/latest/EUR',
    parse: (d) => ({ rate: d.rates?.KRW, date: d.date, source: 'exchangerate-api' }),
  },
];

async function fetchFxWithFallback() {
  for (const provider of FX_PROVIDERS) {
    try {
      const r = await fetch(provider.url, { headers: { Accept: 'application/json' } });
      if (!r.ok) continue;
      const data = await r.json();
      const parsed = provider.parse(data);
      if (parsed.rate && isFinite(parsed.rate)) return parsed;
    } catch { /* try next */ }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Wikipedia / Wikimedia hero photo fetcher
// ─────────────────────────────────────────────────────────
async function fetchLandmarkPhoto(nameLocal) {
  // Try Italian Wikipedia REST summary endpoint first
  for (const lang of ['it', 'en']) {
    try {
      const title = nameLocal.replace(/\s+/g, '_');
      const url = `https://${lang}.wikipedia.org/api/rest_v1/page/summary/${encodeURIComponent(title)}`;
      const r = await fetch(url, { headers: { 'Accept': 'application/json' } });
      if (!r.ok) continue;
      const data = await r.json();
      const photo = data.originalimage?.source || data.thumbnail?.source;
      if (photo) {
        return {
          url: photo,
          credit: `Wikipedia (${lang})`,
          extract: data.extract || null,
        };
      }
    } catch { /* try next */ }
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// Route planning (nearest neighbor TSP heuristic)
// ─────────────────────────────────────────────────────────
function planRoute(places, startLocation) {
  if (places.length === 0) return [];

  const remaining = places.map(p => ({ ...p }));
  const route = [];
  let current = startLocation;

  if (!current) {
    // Start from first place if no start location
    const first = remaining.shift();
    route.push({ ...first, distanceFromPrev: 0, walkMinutes: 0, isStart: true });
    current = first;
  }

  while (remaining.length > 0) {
    let nearestIdx = 0;
    let nearestDist = haversineDistance(current.lat, current.lng, remaining[0].lat, remaining[0].lng);
    for (let i = 1; i < remaining.length; i++) {
      const d = haversineDistance(current.lat, current.lng, remaining[i].lat, remaining[i].lng);
      if (d < nearestDist) { nearestDist = d; nearestIdx = i; }
    }
    const next = remaining.splice(nearestIdx, 1)[0];
    route.push({
      ...next,
      distanceFromPrev: nearestDist,
      walkMinutes: walkingMinutes(nearestDist),
    });
    current = next;
  }
  return route;
}

// Group favorites by city for separate routes
function groupByCity(places) {
  const groups = {};
  places.forEach(p => {
    const key = p.city;
    if (!groups[key]) groups[key] = [];
    groups[key].push(p);
  });
  return groups;
}

// ─────────────────────────────────────────────────────────
// Main App
// ─────────────────────────────────────────────────────────
export default function BelViaggio() {
  // View stack pattern — supports Android hardware back button via History API
  const [viewStack, setViewStack] = useState(['home']);
  const view = viewStack[viewStack.length - 1];
  const [location, setLocation] = useState(null);
  const [locationStatus, setLocationStatus] = useState('idle');
  const [demoMode, setDemoMode] = useState(false);
  const [demoCoord, setDemoCoord] = useState(null);

  // Photo
  const [imageData, setImageData] = useState(null);
  const [analysis, setAnalysis] = useState(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [analyzeError, setAnalyzeError] = useState(null);

  // Menu (multi)
  const [menuImages, setMenuImages] = useState([]);
  const [menuAnalysis, setMenuAnalysis] = useState(null);
  const [menuAnalyzing, setMenuAnalyzing] = useState(false);
  const [menuError, setMenuError] = useState(null);

  // Receipt
  const [receiptImage, setReceiptImage] = useState(null);
  const [receiptAnalysis, setReceiptAnalysis] = useState(null);
  const [receiptAnalyzing, setReceiptAnalyzing] = useState(false);
  const [receiptError, setReceiptError] = useState(null);

  // Translate
  const [translateInput, setTranslateInput] = useState('');
  const [translateDir, setTranslateDir] = useState('ko-it');
  const [translation, setTranslation] = useState(null);
  const [translating, setTranslating] = useState(false);
  const [translateError, setTranslateError] = useState(null);

  // Detail
  const [detail, setDetail] = useState(null);
  const [detailLoading, setDetailLoading] = useState(false);

  // Shared
  const [speakingId, setSpeakingId] = useState(null);
  const [proximityAlert, setProximityAlert] = useState(null);
  const [dismissedAlerts, setDismissedAlerts] = useState(() => new Set());

  // Persistent data (loaded from IDB on mount)
  const [collection, setCollection] = useState([]);
  const [favorites, setFavorites] = useState(new Set());
  const [savedFlash, setSavedFlash] = useState(null);
  const [storageReady, setStorageReady] = useState(false);

  // Detail caching (v0.5) - load from IDB, fall back to API
  const [detailCache, setDetailCache] = useState({});

  // Currently displayed item IDs for save toggle (v0.5)
  const [photoItemId, setPhotoItemId] = useState(null);
  const [menuItemId, setMenuItemId] = useState(null);
  const [receiptItemId, setReceiptItemId] = useState(null);

  // AI Itinerary (v0.5)
  const [itinerary, setItinerary] = useState(null);
  const [itineraryLoading, setItineraryLoading] = useState(false);
  const [itineraryError, setItineraryError] = useState(null);

  // v0.6: Restaurants (Google Places API)
  const [restaurants, setRestaurants] = useState([]);
  const [restaurantsLoading, setRestaurantsLoading] = useState(false);
  const [restaurantsError, setRestaurantsError] = useState(null);
  const [restaurantsMeta, setRestaurantsMeta] = useState(null);
  const [restaurantCuisine, setRestaurantCuisine] = useState('all');
  const [selectedRestaurant, setSelectedRestaurant] = useState(null);
  const [restaurantSearchOrigin, setRestaurantSearchOrigin] = useState(null); // {lat, lng}

  // Photo cache (in-memory only — re-fetched on session start)
  const [photoCache, setPhotoCache] = useState({}); // id -> {url, credit, extract}
  const [photoLoading, setPhotoLoading] = useState({}); // id -> boolean

  // Exchange rate
  const [fx, setFx] = useState(null);
  const [fxLoading, setFxLoading] = useState(false);

  // PWA / Notifications / Install
  const [swStatus, setSwStatus] = useState('checking');
  const [notifPermission, setNotifPermission] = useState(
    typeof Notification !== 'undefined' ? Notification.permission : 'unsupported'
  );
  const [installPrompt, setInstallPrompt] = useState(null);
  const [isStandalone, setIsStandalone] = useState(false);

  // Route view
  const [routeData, setRouteData] = useState(null); // { city, stops, totalMeters, totalMinutes }

  const photoInputRef = useRef(null);
  const menuInputRef = useRef(null);
  const receiptInputRef = useRef(null);

  // v0.6 hotfix: scroll position tracking across view navigation
  const scrollStackRef = useRef([]);  // synced with viewStack: scroll Y at each depth before leaving
  const prevDepthRef = useRef(1);     // viewStack.length on previous render

  const effectiveLocation = demoMode ? demoCoord : location;

  // ─── Navigation: view stack + browser history sync ─────
  // setView(newView) pushes to stack and adds to browser history.
  // Android hardware back button (popstate) pops the stack.
  // History.back() in our onBack handlers fires popstate, no double-pop.

  // On mount, replace initial history entry with depth 0
  useEffect(() => {
    try {
      window.history.replaceState({ bvDepth: 0 }, '');
    } catch { /* ignore */ }
  }, []);

  function setView(newView) {
    // v0.6 hotfix: save current scroll before view change (restored on back)
    scrollStackRef.current.push(window.scrollY);
    setViewStack((s) => {
      const newStack = [...s, newView];
      try {
        window.history.pushState({ bvDepth: newStack.length - 1 }, '');
      } catch { /* ignore */ }
      return newStack;
    });
  }

  function goBack() {
    if (viewStack.length > 1) {
      try { window.history.back(); } catch { setViewStack((s) => s.slice(0, -1)); }
    }
  }

  function goHome() {
    // Go back to home (clear stack)
    if (viewStack.length > 1) {
      try {
        window.history.go(-(viewStack.length - 1));
      } catch {
        setViewStack(['home']);
      }
    }
  }

  // Listen for popstate (Android back button or browser back)
  useEffect(() => {
    function handlePopState(e) {
      const targetDepth = e.state?.bvDepth ?? 0;
      setViewStack((s) => s.slice(0, targetDepth + 1));
    }
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  // ─── v0.6 fix: scroll management on view change ──────────
  // Forward navigation (depth increases) → scroll new view to top.
  // Back navigation (depth decreases) → restore previously saved scroll for that depth.
  // Without this, the previous view's scrollY persists into the new view's window scroll,
  // making the new view appear "scrolled in" (e.g. restaurants opening at #4 instead of #1).
  useEffect(() => {
    const currentDepth = viewStack.length;
    const prevDepth = prevDepthRef.current;

    if (currentDepth > prevDepth) {
      // Forward — new view starts at top
      window.scrollTo(0, 0);
    } else if (currentDepth < prevDepth) {
      // Back — restore saved scroll (last one popped corresponds to target depth)
      const popCount = prevDepth - currentDepth;
      let restoreY = 0;
      for (let i = 0; i < popCount; i++) {
        const popped = scrollStackRef.current.pop();
        if (i === popCount - 1 && popped !== undefined) restoreY = popped;
      }
      // Defer until after DOM commits the new view
      requestAnimationFrame(() => window.scrollTo(0, restoreY));
    }
    // currentDepth === prevDepth: same view, do nothing (avoids fighting user scroll on re-renders)

    prevDepthRef.current = currentDepth;
  }, [viewStack]);

  // ─── Load persistent data on mount ──────────────────────
  useEffect(() => {
    (async () => {
      try {
        const [savedItems, favItems, detailItems] = await Promise.all([
          dbAll('collection'),
          dbAll('favorites'),
          dbAll('details'),
        ]);
        setCollection(savedItems.sort((a, b) => (b.addedAt || '').localeCompare(a.addedAt || '')));
        setFavorites(new Set(favItems.map((f) => f.id)));
        // Build detail cache from IDB
        const cache = {};
        detailItems.forEach((d) => { cache[d.id] = d.data; });
        setDetailCache(cache);
      } catch { /* fallback to empty */ }
      setStorageReady(true);
    })();
  }, []);

  // ─── Geolocation ────────────────────────────────────────
  useEffect(() => {
    if (demoMode) return;
    if (!('geolocation' in navigator)) { setLocationStatus('unsupported'); return; }
    setLocationStatus('requesting');
    const watchId = navigator.geolocation.watchPosition(
      (pos) => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocationStatus('granted'); },
      () => setLocationStatus('denied'),
      { enableHighAccuracy: true, maximumAge: 30000, timeout: 15000 }
    );
    return () => navigator.geolocation.clearWatch(watchId);
  }, [demoMode]);

  // ─── Exchange rate ──────────────────────────────────────
  useEffect(() => {
    setFxLoading(true);
    fetchFxWithFallback()
      .then((result) => setFx(result))
      .finally(() => setFxLoading(false));
  }, []);

  function refreshFx() {
    setFxLoading(true);
    fetchFxWithFallback()
      .then((result) => { if (result) setFx(result); })
      .finally(() => setFxLoading(false));
  }

  // ─── Service Worker registration ────────────────────────
  useEffect(() => {
    if (!('serviceWorker' in navigator)) { setSwStatus('unsupported'); return; }
    navigator.serviceWorker.register('/sw.js')
      .then(() => setSwStatus('registered'))
      .catch(() => setSwStatus('sandbox'));
  }, []);

  // ─── Detect standalone (installed PWA) mode ─────────────
  useEffect(() => {
    const check = () => {
      const standalone = window.matchMedia?.('(display-mode: standalone)').matches
        || window.navigator?.standalone === true;
      setIsStandalone(standalone);
    };
    check();
    const mql = window.matchMedia?.('(display-mode: standalone)');
    mql?.addEventListener?.('change', check);
    return () => mql?.removeEventListener?.('change', check);
  }, []);

  // ─── beforeinstallprompt (Android Chrome PWA install) ───
  useEffect(() => {
    const handler = (e) => {
      e.preventDefault();
      setInstallPrompt(e);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, []);

  async function triggerInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    try {
      await installPrompt.userChoice;
    } catch { /* ignore */ }
    setInstallPrompt(null);
  }

  // ─── Nearby + proximity ─────────────────────────────────
  const nearby = useMemo(() => {
    if (!effectiveLocation) return [];
    return LANDMARKS
      .map((l) => ({ ...l, distance: haversineDistance(effectiveLocation.lat, effectiveLocation.lng, l.lat, l.lng) }))
      .sort((a, b) => a.distance - b.distance)
      .slice(0, 8);
  }, [effectiveLocation]);

  useEffect(() => {
    if (!effectiveLocation) return;
    const closest = nearby[0];
    if (closest && closest.distance < 300 && !dismissedAlerts.has(closest.id)) {
      if (!proximityAlert || proximityAlert.id !== closest.id) {
        setProximityAlert(closest);
        if (typeof Notification !== 'undefined' && Notification.permission === 'granted' && document.hidden) {
          try {
            new Notification(`근처: ${closest.name}`, {
              body: `${closest.nameLocal} · ${formatDistance(closest.distance)}`,
              tag: `bv-prox-${closest.id}`,
              icon: '/icon-192.png',
              vibrate: [100, 50, 100],
            });
          } catch { /* ignore */ }
        }
      }
    } else if (proximityAlert) {
      setProximityAlert(null);
    }
  }, [effectiveLocation, nearby, dismissedAlerts, proximityAlert]);

  function speak(text, lang, id) {
    if (!('speechSynthesis' in window)) return;
    if (speakingId === id) { window.speechSynthesis.cancel(); setSpeakingId(null); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = lang.startsWith('ko') ? 1.0 : 0.92;
    u.onstart = () => setSpeakingId(id);
    u.onend = () => setSpeakingId(null);
    u.onerror = () => setSpeakingId(null);
    window.speechSynthesis.speak(u);
  }

  function requestNotificationPermission() {
    if (typeof Notification === 'undefined') return;
    Notification.requestPermission().then((p) => setNotifPermission(p));
  }

  // ─── Favorites (persistent) ─────────────────────────────
  async function toggleFavorite(id) {
    const isCurrentlyFav = favorites.has(id);
    setFavorites((s) => {
      const n = new Set(s);
      if (n.has(id)) n.delete(id); else n.add(id);
      return n;
    });
    if (isCurrentlyFav) {
      await dbDelete('favorites', id);
    } else {
      await dbPut('favorites', { id, addedAt: new Date().toISOString() });
    }
  }

  // ─── Wikipedia photo fetch ──────────────────────────────
  const fetchPhoto = useCallback(async (landmark) => {
    if (photoCache[landmark.id] !== undefined) return photoCache[landmark.id];
    if (photoLoading[landmark.id]) return null;
    setPhotoLoading((p) => ({ ...p, [landmark.id]: true }));
    const result = await fetchLandmarkPhoto(landmark.nameLocal);
    setPhotoCache((c) => ({ ...c, [landmark.id]: result }));
    setPhotoLoading((p) => ({ ...p, [landmark.id]: false }));
    return result;
  }, [photoCache, photoLoading]);

  // ─── Photo analysis (camera) ────────────────────────────
  async function handlePhotoPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setView('photo');
    setPhotoItemId(null);  // Reset save tracking for new analysis
    setAnalyzing(true); setAnalyzeError(null); setAnalysis(null);
    try {
      const { dataUrl, base64, mimeType } = await compressImage(file);
      setImageData(dataUrl);
      const text = await callClaude([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: `당신은 이탈리아 여행 전문 도슨트입니다. 이 사진에 담긴 것을 식별하고 한국어로 다음 JSON 형식만 출력하세요 (코드블록·다른 텍스트 금지):

{
  "name": "한국어 이름",
  "nameLocal": "이탈리아어/현지어 이름",
  "category": "건축·회화·조각·유적·풍경·기타 중 하나",
  "confidence": "high|medium|low",
  "summary": "한 문장 핵심 설명",
  "history": "역사와 배경 3-5문장",
  "viewingPoints": [
    { "title": "포인트 1 제목 (간결)", "detail": "왜 봐야 하는지·어디서 보면 좋은지 1-2문장" },
    { "title": "포인트 2 제목", "detail": "1-2문장 설명" },
    { "title": "포인트 3 제목", "detail": "1-2문장 설명" },
    { "title": "포인트 4 제목", "detail": "1-2문장 설명" }
  ],
  "tip": "여행자에게 주는 실용적 팁 한 줄",
  "phrase": { "it": "현지에서 쓸 만한 이탈리아어 한 문장", "pronunciation": "한글 발음", "ko": "한국어 뜻" }
}

식별 불가하거나 이탈리아 관련이 아니면 {"error": "이유"} 만 출력하세요.` },
        ],
      }], 1800);
      const parsed = safeParseJSON(text);
      if (parsed.error) setAnalyzeError(parsed.error);
      else setAnalysis(parsed);
    } catch (err) {
      setAnalyzeError(`분석 중 오류: ${err.message}`);
    } finally {
      setAnalyzing(false);
    }
  }

  // ─── Menu (multi-image) ─────────────────────────────────
  async function handleMenuPick(e) {
    const files = Array.from(e.target.files || []).slice(0, 4);
    if (files.length === 0) return;
    e.target.value = '';
    setView('menu');
    setMenuItemId(null);  // Reset save tracking
    setMenuAnalyzing(true); setMenuError(null); setMenuAnalysis(null);
    try {
      const compressed = await Promise.all(files.map((f) => compressImage(f)));
      setMenuImages(compressed.map((c) => c.dataUrl));
      const content = [
        ...compressed.map((c) => ({ type: 'image', source: { type: 'base64', media_type: c.mimeType, data: c.base64 } })),
        { type: 'text', text: `당신은 이탈리아 음식 전문가입니다. ${files.length > 1 ? `메뉴판 ${files.length}장을 통합 분석` : '메뉴판/음식 사진을 분석'}하고 한국어로 다음 JSON 형식만 출력하세요 (코드블록·다른 텍스트 금지):

{
  "type": "메뉴판|단일음식|영수증",
  "venue": "트라토리아|피자리아|리스토란테|젤라테리아|에노테카|카페|기타",
  "summary": "이 가게/메뉴의 전체 인상 1-2문장",
  "items": [
    {
      "name": "한국어 요리명", "nameLocal": "이탈리아어 원문", "pronunciation": "한글 발음",
      "category": "Antipasto|Primo|Secondo|Contorno|Pizza|Dolce|Bevanda|기타",
      "description": "한국어로 이 요리가 뭔지 1-2문장",
      "ingredients": ["주재료1", "주재료2", "주재료3"],
      "allergens": ["글루텐", "유제품", "달걀", "견과류", "해산물", "갑각류" 같은 해당 항목만],
      "price": "€숫자 또는 빈 문자열",
      "vegetarian": true/false, "spicy": true/false, "recommended": true/false,
      "note": "특이사항 한 줄, 없으면 빈 문자열"
    }
  ],
  "tip": "주문할 때 알아두면 좋을 한 줄 팁",
  "phrase": { "it": "주문할 때 쓸 만한 이탈리아어 한 문장", "pronunciation": "한글 발음", "ko": "한국어 뜻" }
}

메뉴/음식이 아니면 {"error": "이유"} 만 출력. 메뉴 항목이 많으면 가장 대표적인 12개까지만 추려서 출력.` },
      ];
      const text = await callClaude([{ role: 'user', content }], 4500);
      const parsed = safeParseJSON(text);
      if (parsed.error) setMenuError(parsed.error);
      else setMenuAnalysis(parsed);
    } catch (err) {
      setMenuError(`분석 중 오류: ${err.message}`);
    } finally {
      setMenuAnalyzing(false);
    }
  }

  // ─── Receipt ────────────────────────────────────────────
  async function handleReceiptPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    e.target.value = '';
    setView('receipt');
    setReceiptItemId(null);  // Reset save tracking
    setReceiptAnalyzing(true); setReceiptError(null); setReceiptAnalysis(null);
    try {
      const { dataUrl, base64, mimeType } = await compressImage(file);
      setReceiptImage(dataUrl);
      const text = await callClaude([{
        role: 'user',
        content: [
          { type: 'image', source: { type: 'base64', media_type: mimeType, data: base64 } },
          { type: 'text', text: `당신은 이탈리아 영수증(scontrino, ricevuta) 분석 전문가입니다. 이 영수증을 분석하고 한국어로 다음 JSON 형식만 출력하세요. 모든 가격은 숫자만 (€ 기호 제외).

{
  "venue": "가게명 (없으면 빈 문자열)",
  "venueType": "리스토란테|트라토리아|피자리아|바|카페|상점|기타",
  "date": "YYYY-MM-DD 또는 빈 문자열",
  "currency": "EUR",
  "items": [
    { "name": "한국어 항목명", "nameLocal": "이탈리아어 원문", "qty": 1, "unitPrice": 12.50, "total": 12.50 }
  ],
  "subtotal": null,
  "coperto": 0,
  "service": 0,
  "tax": 0,
  "total": 49.50,
  "note": "이탈리아 영수증 용어 짧은 설명, 없으면 빈 문자열"
}

영수증이 아니면 {"error": "이유"} 만 출력.` },
        ],
      }], 2500);
      const parsed = safeParseJSON(text);
      if (parsed.error) setReceiptError(parsed.error);
      else setReceiptAnalysis(parsed);
    } catch (err) {
      setReceiptError(`분석 중 오류: ${err.message}`);
    } finally {
      setReceiptAnalyzing(false);
    }
  }

  // ─── Translate ──────────────────────────────────────────
  async function handleTranslate() {
    if (!translateInput.trim()) return;
    setTranslating(true); setTranslateError(null); setTranslation(null);
    try {
      const dir = translateDir === 'ko-it' ? '한국어→이탈리아어' : '이탈리아어→한국어';
      const text = await callClaude([{
        role: 'user',
        content: `${dir} 번역을 해주세요. 다음 JSON 형식만 출력:

{
  "translation": "번역문",
  "pronunciation": "${translateDir === 'ko-it' ? '한글 발음' : '빈 문자열'}",
  "note": "문맥·문화적 주의사항이 있으면 한 줄, 없으면 빈 문자열"
}

원문: ${translateInput}`,
      }], 600);
      setTranslation(safeParseJSON(text));
    } catch (err) {
      setTranslateError(`번역 오류: ${err.message}`);
    } finally {
      setTranslating(false);
    }
  }

  async function openDetail(landmark, forceRefresh = false) {
    setView('detail');
    setDetail({ ...landmark, loading: true });
    setDetailLoading(true);
    fetchPhoto(landmark);

    // ─ v0.5: Check cache first (instant load, no API call) ─
    if (!forceRefresh && detailCache[landmark.id]) {
      const cached = detailCache[landmark.id];
      setDetail({ ...landmark, ...cached, loading: false, fromCache: true });
      setDetailLoading(false);
      return;
    }

    try {
      const text = await callClaude([{
        role: 'user',
        content: `당신은 이탈리아 여행 전문 도슨트입니다. "${landmark.name}" (${landmark.nameLocal}, ${landmark.city})에 대해 한국어로 다음 JSON 형식만 출력:

{
  "summary": "한 문장 핵심 설명",
  "history": "역사와 배경 3-5문장",
  "viewingPoints": [
    { "title": "포인트 1 제목 (간결)", "detail": "왜 봐야 하는지·어디서 보면 좋은지 1-2문장" },
    { "title": "포인트 2 제목", "detail": "1-2문장 설명" },
    { "title": "포인트 3 제목", "detail": "1-2문장 설명" },
    { "title": "포인트 4 제목", "detail": "1-2문장 설명" }
  ],
  "tip": "여행자에게 주는 실용적 팁 한 줄",
  "phrase": { "it": "현지에서 쓸 만한 이탈리아어 한 문장", "pronunciation": "한글 발음", "ko": "한국어 뜻" }
}`,
      }], 1500);
      const parsed = safeParseJSON(text);
      setDetail({ ...landmark, ...parsed, loading: false });

      // ─ v0.5: Save to cache (memory + IDB) ─
      setDetailCache((c) => ({ ...c, [landmark.id]: parsed }));
      await dbPut('details', { id: landmark.id, data: parsed, fetchedAt: new Date().toISOString() });
    } catch (err) {
      setDetail({ ...landmark, loading: false, error: err.message });
    } finally {
      setDetailLoading(false);
    }
  }

  async function clearDetailCache(landmarkId) {
    setDetailCache((c) => {
      const next = { ...c };
      delete next[landmarkId];
      return next;
    });
    await dbDelete('details', landmarkId);
  }

  function dismissAlert(id) { setDismissedAlerts((s) => new Set([...s, id])); setProximityAlert(null); }

  async function saveCurrent(type) {
    const ts = new Date().toISOString();
    const id = `${type}-${Date.now()}`;
    let item = null;
    if (type === 'photo' && analysis) {
      const thumb = imageData ? await compressThumbnail(imageData) : null;
      item = { id, type, addedAt: ts, thumbnail: thumb, fullImage: imageData, title: analysis.name, subtitle: analysis.nameLocal, data: analysis };
    } else if (type === 'menu' && menuAnalysis) {
      const thumb = menuImages[0] ? await compressThumbnail(menuImages[0]) : null;
      item = { id, type, addedAt: ts, thumbnail: thumb, fullImage: menuImages, title: menuAnalysis.venue || '메뉴', subtitle: `${menuAnalysis.items?.length || 0}개 항목 · ${menuImages.length}장`, data: menuAnalysis };
    } else if (type === 'receipt' && receiptAnalysis) {
      const thumb = receiptImage ? await compressThumbnail(receiptImage) : null;
      item = { id, type, addedAt: ts, thumbnail: thumb, fullImage: receiptImage, title: receiptAnalysis.venue || '영수증', subtitle: `${formatEUR(receiptAnalysis.total)} · ${receiptAnalysis.items?.length || 0}항목`, data: receiptAnalysis };
    } else if (type === 'landmark' && detail && !detail.loading) {
      // For landmarks use stable landmark id (allows toggle check)
      item = { id: `landmark-${detail.id}`, type, addedAt: ts, thumbnail: null, emoji: detail.emoji, title: detail.name, subtitle: `${detail.nameLocal} · ${detail.city}`, data: { ...detail, loading: false } };
    }
    if (item) {
      setCollection((c) => [item, ...c.filter((x) => x.id !== item.id)]);
      await dbPut('collection', item);
      // Track ID for save toggle UI
      if (type === 'photo') setPhotoItemId(item.id);
      else if (type === 'menu') setMenuItemId(item.id);
      else if (type === 'receipt') setReceiptItemId(item.id);
      setSavedFlash(type);
      setTimeout(() => setSavedFlash(null), 1800);
    }
  }

  // v0.5: Remove currently displayed item from collection (un-save)
  async function unsaveCurrent(type) {
    let idToRemove = null;
    if (type === 'photo') idToRemove = photoItemId;
    else if (type === 'menu') idToRemove = menuItemId;
    else if (type === 'receipt') idToRemove = receiptItemId;
    else if (type === 'landmark' && detail) idToRemove = `landmark-${detail.id}`;
    if (!idToRemove) return;
    setCollection((c) => c.filter((x) => x.id !== idToRemove));
    await dbDelete('collection', idToRemove);
    if (type === 'photo') setPhotoItemId(null);
    else if (type === 'menu') setMenuItemId(null);
    else if (type === 'receipt') setReceiptItemId(null);
  }

  async function removeFromCollection(id) {
    setCollection((c) => c.filter((x) => x.id !== id));
    await dbDelete('collection', id);
  }

  function openFromCollection(item) {
    if (item.type === 'photo') {
      setImageData(item.fullImage); setAnalysis(item.data);
      setPhotoItemId(item.id);
      setAnalyzing(false); setAnalyzeError(null); setView('photo');
    } else if (item.type === 'menu') {
      setMenuImages(Array.isArray(item.fullImage) ? item.fullImage : [item.fullImage]);
      setMenuAnalysis(item.data);
      setMenuItemId(item.id);
      setMenuAnalyzing(false); setMenuError(null); setView('menu');
    } else if (item.type === 'receipt') {
      setReceiptImage(item.fullImage); setReceiptAnalysis(item.data);
      setReceiptItemId(item.id);
      setReceiptAnalyzing(false); setReceiptError(null); setView('receipt');
    } else if (item.type === 'landmark') {
      setDetail(item.data); setDetailLoading(false); setView('detail');
    }
  }

  const favoriteLandmarks = useMemo(
    () => LANDMARKS.filter((l) => favorites.has(l.id))
      .map((l) => ({
        ...l,
        distance: effectiveLocation
          ? haversineDistance(effectiveLocation.lat, effectiveLocation.lng, l.lat, l.lng)
          : null,
      }))
      .sort((a, b) => (a.distance ?? Infinity) - (b.distance ?? Infinity)),
    [favorites, effectiveLocation]
  );

  // ─── Build a route from favorites ───────────────────────
  function buildRoute(cityFilter) {
    const places = cityFilter
      ? favoriteLandmarks.filter(l => l.city === cityFilter)
      : favoriteLandmarks;
    if (places.length === 0) return;
    const startLoc = effectiveLocation && cityFilter
      ? favoriteLandmarks.some(l => l.city === cityFilter && haversineDistance(effectiveLocation.lat, effectiveLocation.lng, l.lat, l.lng) < 50000)
        ? effectiveLocation : null
      : effectiveLocation;
    const stops = planRoute(places, startLoc);
    const totalMeters = stops.reduce((s, x) => s + (x.distanceFromPrev || 0), 0);
    const totalMinutes = stops.reduce((s, x) => s + (x.walkMinutes || 0), 0);
    setRouteData({
      city: cityFilter || '전체',
      stops,
      startLocation: startLoc,
      totalMeters,
      totalMinutes,
    });
    setView('route');
  }

  // ─── v0.5: AI-recommended itinerary ─────────────────────
  async function generateItinerary(cityFilter) {
    const places = cityFilter
      ? favoriteLandmarks.filter((l) => l.city === cityFilter)
      : favoriteLandmarks;
    if (places.length === 0) return;

    setView('ai-itinerary');
    setItineraryLoading(true);
    setItineraryError(null);
    setItinerary(null);

    try {
      const placesList = places.map((p) => `- ${p.name} (${p.nameLocal}, ${p.city}) [id: ${p.id}]`).join('\n');
      const text = await callClaude([{
        role: 'user',
        content: `당신은 이탈리아 여행 전문가입니다. 다음 즐겨찾기 명소들을 효율적으로 방문할 수 있는 동선을 한국어로 제안해주세요.

명소 목록 (총 ${places.length}곳):
${placesList}

고려할 사항:
- 각 명소의 평균 관람 시간 (콜로세움 90분, 우피치 120분, 분수·광장 20분 등)
- 개관 시간대와 휴관일 (월요일 박물관 휴무, 일요일 미사 등)
- 인파 패턴 (콜로세움·우피치는 오전 추천, 트레비 분수는 야경)
- 명소 간 도보 거리 (같은 도시는 도보, 다른 도시는 별도 일정)
- 식사 시간: 점심 12:30~14:00, 저녁 19:30~
- 너무 빡빡하지 않게 (하루 5~7곳, 4~6시간 활동)

JSON 형식만 출력 (코드블록 금지):
{
  "title": "동선 제목 (예: '로마 핵심 1일 코스')",
  "totalDays": 1,
  "summary": "전체 한 줄 요약",
  "days": [
    {
      "day": 1,
      "theme": "이 날의 테마 (예: '고대 로마의 영광')",
      "city": "도시명",
      "stops": [
        {
          "id": "원본 명소 id (변경 금지)",
          "arrivalTime": "09:00",
          "duration": 90,
          "reason": "이 시간에 가는 이유 (간결한 한 줄)",
          "tip": "현장 팁 (한 줄, 사전예약·복장 등)"
        }
      ],
      "meals": [
        { "time": "13:00", "type": "점심", "suggestion": "추천 식당이나 구역 (한 줄)" }
      ],
      "walkingNote": "도보 이동 종합 코멘트 (한 줄)"
    }
  ],
  "overallTips": ["전체 일정에 대한 팁 1", "팁 2", "팁 3"]
}

명소 수가 많으면 여러 날로 나누세요. 명소 id는 반드시 원본 그대로 출력하세요.`,
      }], 3500);
      const parsed = safeParseJSON(text);

      // v0.7: 각 날짜에 그 동선 중심 근처의 추천 맛집 5곳 붙이기 (Bayesian 정렬)
      // Claude는 명소 동선만 짜고, 맛집은 Google Places + 우리의 Bayesian 가중 정렬로
      // 신뢰도 높은 곳을 자동 선정.
      if (parsed?.days?.length > 0) {
        const dayPromises = parsed.days.map(async (day, dIdx) => {
          // 그날 stops의 평균 좌표 (중심점) 계산
          const stopCoords = (day.stops || [])
            .map((s) => LANDMARKS.find((l) => l.id === s.id))
            .filter(Boolean);
          if (stopCoords.length === 0) return;

          const centerLat = stopCoords.reduce((s, c) => s + c.lat, 0) / stopCoords.length;
          const centerLng = stopCoords.reduce((s, c) => s + c.lng, 0) / stopCoords.length;

          try {
            // 1km 격자 캐시 적용 (restaurants view와 동일 키 체계)
            const cacheKey = `places_${centerLat.toFixed(2)}_${centerLng.toFixed(2)}_all`;
            const cached = await dbGet('restaurants', cacheKey);

            let results = null;
            if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000) {
              results = cached.results;
            } else {
              const r = await fetch('/api/places', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ lat: centerLat, lng: centerLng, cuisine: 'all', radius: 1500 }),
              });
              if (r.ok) {
                const data = await r.json();
                results = data.results || [];
                // 캐시 저장 (restaurants view와 공유)
                await dbPut('restaurants', {
                  id: cacheKey, results, meta: data.meta, fetchedAt: Date.now(),
                });
              }
            }

            if (results) {
              day.restaurantPicks = results.slice(0, 5);
              day.restaurantCenter = { lat: centerLat, lng: centerLng };
            }
          } catch (e) {
            // 맛집 조회 실패해도 동선 자체는 표시
            console.warn(`[itinerary] day ${dIdx + 1} restaurants fetch failed:`, e);
          }
        });
        await Promise.all(dayPromises);
      }

      setItinerary(parsed);
    } catch (err) {
      setItineraryError(`동선 생성 실패: ${err.message}`);
    } finally {
      setItineraryLoading(false);
    }
  }

  // ─── v0.6: Restaurants via Google Places API ───────────
  // Returns ranked list using Bayesian weighted score (server-side).
  // Caches results in IDB for 24h to avoid repeat API calls.
  async function fetchNearbyRestaurants(cuisine = 'all', forceRefresh = false) {
    if (!effectiveLocation) {
      setRestaurantsError('위치 정보가 없어요. 위치 권한을 허용하거나 데모 모드로 전환해주세요.');
      return;
    }

    setRestaurantsLoading(true);
    setRestaurantsError(null);
    const origin = { lat: effectiveLocation.lat, lng: effectiveLocation.lng };
    setRestaurantSearchOrigin(origin);

    // 1km 격자로 캐시 키 (위치가 미세하게 달라도 같은 결과 재사용)
    const cacheKey = `places_${origin.lat.toFixed(2)}_${origin.lng.toFixed(2)}_${cuisine}`;

    try {
      if (!forceRefresh) {
        const cached = await dbGet('restaurants', cacheKey);
        if (cached && Date.now() - cached.fetchedAt < 24 * 60 * 60 * 1000) {
          setRestaurants(cached.results || []);
          setRestaurantsMeta({ ...cached.meta, fromCache: true });
          setRestaurantsLoading(false);
          return;
        }
      }

      const res = await fetch('/api/places', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ lat: origin.lat, lng: origin.lng, cuisine, radius: 1500 }),
      });

      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || `Places API error ${res.status}`);
      }

      setRestaurants(data.results || []);
      setRestaurantsMeta({ ...data.meta, fromCache: false });

      // 캐시 저장
      await dbPut('restaurants', {
        id: cacheKey,
        results: data.results,
        meta: data.meta,
        fetchedAt: Date.now(),
      });
    } catch (err) {
      setRestaurantsError(`맛집 검색 실패: ${err.message}`);
    } finally {
      setRestaurantsLoading(false);
    }
  }

  function openRestaurants() {
    setView('restaurants');
    // 자동 검색 (현재 cuisine으로)
    if (restaurants.length === 0 && effectiveLocation) {
      fetchNearbyRestaurants(restaurantCuisine);
    }
  }

  function selectRestaurant(restaurant) {
    setSelectedRestaurant(restaurant);
    setView('restaurant-detail');
  }

  return (
    <div className="bv-root">
      <BelViaggioStyles />
      <div className="bv-content">
        <div className="bv-flag"><span /><span /><span /></div>

        {view === 'home' && (
          <HomeView
            location={effectiveLocation} locationStatus={locationStatus}
            demoMode={demoMode} demoCoord={demoCoord} setDemoMode={setDemoMode} setDemoCoord={setDemoCoord}
            nearby={nearby} proximityAlert={proximityAlert} dismissAlert={dismissAlert}
            onOpenDetail={openDetail}
            onPhotoClick={() => photoInputRef.current?.click()}
            onMenuClick={() => menuInputRef.current?.click()}
            onReceiptClick={() => receiptInputRef.current?.click()}
            onTranslateClick={() => setView('translate')}
            onCollectionClick={() => setView('collection')}
            onFavoritesClick={() => setView('favorites')}
            onRestaurantsClick={openRestaurants}
            collectionCount={collection.length}
            favoritesCount={favorites.size}
            favorites={favorites} toggleFavorite={toggleFavorite}
            fx={fx} fxLoading={fxLoading} refreshFx={refreshFx}
            swStatus={swStatus} notifPermission={notifPermission}
            requestNotificationPermission={requestNotificationPermission}
            installPrompt={installPrompt} triggerInstall={triggerInstall}
            isStandalone={isStandalone} storageReady={storageReady}
          />
        )}

        {view === 'photo' && (
          <PhotoView
            imageData={imageData} analyzing={analyzing} analysis={analysis} error={analyzeError}
            onBack={goBack} speak={speak} speakingId={speakingId}
            onRetake={() => photoInputRef.current?.click()}
            onSave={() => saveCurrent('photo')} onUnsave={() => unsaveCurrent('photo')}
            saved={savedFlash === 'photo'}
            isSaved={!!photoItemId && collection.some((c) => c.id === photoItemId)}
          />
        )}

        {view === 'menu' && (
          <MenuView images={menuImages} analyzing={menuAnalyzing} analysis={menuAnalysis} error={menuError}
            onBack={goBack} speak={speak} speakingId={speakingId}
            onRetake={() => menuInputRef.current?.click()}
            onSave={() => saveCurrent('menu')} onUnsave={() => unsaveCurrent('menu')}
            saved={savedFlash === 'menu'}
            isSaved={!!menuItemId && collection.some((c) => c.id === menuItemId)} />
        )}

        {view === 'receipt' && (
          <ReceiptView imageData={receiptImage} analyzing={receiptAnalyzing} analysis={receiptAnalysis} error={receiptError}
            fx={fx} onBack={goBack} speak={speak} speakingId={speakingId}
            onRetake={() => receiptInputRef.current?.click()}
            onSave={() => saveCurrent('receipt')} onUnsave={() => unsaveCurrent('receipt')}
            saved={savedFlash === 'receipt'}
            isSaved={!!receiptItemId && collection.some((c) => c.id === receiptItemId)} />
        )}

        {view === 'translate' && (
          <TranslateView
            input={translateInput} setInput={setTranslateInput}
            direction={translateDir} setDirection={setTranslateDir}
            translation={translation} translating={translating} error={translateError}
            onTranslate={handleTranslate} onBack={goBack}
            speak={speak} speakingId={speakingId}
          />
        )}

        {view === 'detail' && detail && (
          <DetailView
            detail={detail} loading={detailLoading}
            onBack={goBack} speak={speak} speakingId={speakingId}
            onSave={() => saveCurrent('landmark')} onUnsave={() => unsaveCurrent('landmark')}
            saved={savedFlash === 'landmark'}
            isSaved={collection.some((c) => c.id === `landmark-${detail.id}`)}
            onDirections={() => openInMaps(detail.lat, detail.lng, detail.nameLocal)}
            isFavorite={favorites.has(detail.id)} toggleFavorite={() => toggleFavorite(detail.id)}
            photo={photoCache[detail.id]} photoLoading={photoLoading[detail.id]}
            onRefresh={() => openDetail(detail, true)}
          />
        )}

        {view === 'collection' && (
          <CollectionView items={collection} onBack={goBack} onOpen={openFromCollection} onRemove={removeFromCollection} dbAvailable={dbAvailable} />
        )}

        {view === 'favorites' && (
          <FavoritesView
            items={favoriteLandmarks} hasLocation={!!effectiveLocation}
            onBack={goBack} onOpen={openDetail}
            onRemove={toggleFavorite}
            onDirections={(l) => openInMaps(l.lat, l.lng, l.nameLocal)}
            onPlanRoute={buildRoute}
            onAiItinerary={generateItinerary}
            photoCache={photoCache} fetchPhoto={fetchPhoto}
          />
        )}

        {view === 'route' && routeData && (
          <RouteView route={routeData} onBack={goBack}
            onOpenLandmark={openDetail}
            onOpenMaps={() => openMultiStopMaps(routeData.stops)} />
        )}

        {view === 'ai-itinerary' && (
          <AiItineraryView
            itinerary={itinerary} loading={itineraryLoading} error={itineraryError}
            onBack={goBack}
            onOpenLandmark={(id) => {
              const landmark = LANDMARKS.find((l) => l.id === id);
              if (landmark) openDetail(landmark);
            }}
            onSelectRestaurant={selectRestaurant}
            landmarks={LANDMARKS}
          />
        )}

        {view === 'restaurants' && (
          <RestaurantsView
            restaurants={restaurants}
            loading={restaurantsLoading}
            error={restaurantsError}
            meta={restaurantsMeta}
            cuisine={restaurantCuisine}
            setCuisine={(c) => { setRestaurantCuisine(c); fetchNearbyRestaurants(c); }}
            origin={restaurantSearchOrigin}
            location={effectiveLocation}
            onBack={goBack}
            onSelect={selectRestaurant}
            onRefresh={() => fetchNearbyRestaurants(restaurantCuisine, true)}
          />
        )}

        {view === 'restaurant-detail' && selectedRestaurant && (
          <RestaurantDetailView
            restaurant={selectedRestaurant}
            onBack={goBack}
            onDirections={() => openInMaps(
              selectedRestaurant.location.latitude,
              selectedRestaurant.location.longitude,
              selectedRestaurant.name
            )}
          />
        )}

        <input ref={photoInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handlePhotoPick} />
        <input ref={menuInputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleMenuPick} />
        <input ref={receiptInputRef} type="file" accept="image/*" capture="environment" style={{ display: 'none' }} onChange={handleReceiptPick} />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Big TTS button
// ─────────────────────────────────────────────────────────
function BigTTSButton({ active, onClick, label = '한국어로 전체 듣기' }) {
  return (
    <button className={`bv-tts-big ${active ? 'on' : ''}`} onClick={onClick}>
      <div className="ico">{active ? <VolumeX size={18} /> : <Volume2 size={18} />}</div>
      <div>
        <div className="lbl">{active ? '재생 중지' : label}</div>
        <div className="sub">{active ? 'tap to stop' : 'Ascolta'}</div>
      </div>
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Save toggle button (v0.5) - clear state + un-save support
// ─────────────────────────────────────────────────────────
function SaveToggleButton({ isSaved, saved, onSave, onUnsave }) {
  if (saved) {
    // Just-saved flash (1.8s)
    return (
      <button className="bv-row-btn saved-flash">
        <Check size={14} /> 저장됨!
      </button>
    );
  }
  if (isSaved) {
    return (
      <button className="bv-row-btn saved" onClick={onUnsave}>
        <BookmarkCheck size={14} /> 컬렉션에 있음 — 빼기
      </button>
    );
  }
  return (
    <button className="bv-row-btn" onClick={onSave}>
      <Bookmark size={14} /> 컬렉션에 저장
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Viewing points (v0.5) - object format with expandable detail
// Backward compat: handles both string[] and {title, detail}[] formats
// ─────────────────────────────────────────────────────────
function ViewingPointsCard({ points }) {
  const normalized = (points || []).map((p) =>
    typeof p === 'string' ? { title: p, detail: null } : p
  );
  const [expanded, setExpanded] = useState({});

  return (
    <div className="bv-card">
      <div className="label"><Star size={11} /> Da non perdere · 봐야 할 포인트</div>
      <ul className="bv-vp-list">
        {normalized.map((p, i) => {
          const isOpen = !!expanded[i];
          const hasDetail = !!p.detail;
          return (
            <li key={i} className={isOpen ? 'open' : ''}>
              <button
                className="vp-head"
                onClick={() => hasDetail && setExpanded((e) => ({ ...e, [i]: !e[i] }))}
                disabled={!hasDetail}
              >
                <span className="vp-title">{p.title}</span>
                {hasDetail && (
                  <span className="vp-chev">
                    {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                  </span>
                )}
              </button>
              {isOpen && p.detail && <div className="vp-detail">{p.detail}</div>}
            </li>
          );
        })}
      </ul>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Voice input button (Web Speech Recognition — Chrome Android)
// ─────────────────────────────────────────────────────────
function VoiceInputButton({ lang, onResult, onError }) {
  const [listening, setListening] = useState(false);
  const recognitionRef = useRef(null);

  const SR = typeof window !== 'undefined' ? (window.SpeechRecognition || window.webkitSpeechRecognition) : null;
  const supported = !!SR;

  function start() {
    if (!supported) return;
    try {
      const rec = new SR();
      rec.lang = lang;
      rec.continuous = false;
      rec.interimResults = false;
      rec.maxAlternatives = 1;
      rec.onstart = () => setListening(true);
      rec.onend = () => setListening(false);
      rec.onerror = (e) => { setListening(false); onError?.(e.error); };
      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript;
        onResult(transcript);
      };
      recognitionRef.current = rec;
      rec.start();
    } catch (err) {
      setListening(false);
      onError?.(err.message);
    }
  }

  function stop() {
    try { recognitionRef.current?.stop(); } catch { /* ignore */ }
    setListening(false);
  }

  if (!supported) {
    return (
      <div className="bv-voice-unsupported">
        <Info size={11} /> 이 브라우저는 음성 입력 미지원 (Chrome Android 권장)
      </div>
    );
  }

  return (
    <button className={`bv-voice-btn ${listening ? 'listening' : ''}`} onClick={listening ? stop : start}>
      {listening ? <MicOff size={14} /> : <Mic size={14} />}
      <span>{listening ? '듣는 중… (탭하여 중지)' : `음성으로 입력 (${lang.startsWith('ko') ? '한국어' : 'Italiano'})`}</span>
      {listening && <div className="pulse-dot" />}
    </button>
  );
}

// ─────────────────────────────────────────────────────────
// Home
// ─────────────────────────────────────────────────────────
function HomeView({
  location, locationStatus, demoMode, demoCoord, setDemoMode, setDemoCoord,
  nearby, proximityAlert, dismissAlert, onOpenDetail,
  onPhotoClick, onMenuClick, onReceiptClick, onTranslateClick,
  onCollectionClick, onFavoritesClick, onRestaurantsClick, collectionCount, favoritesCount,
  favorites, toggleFavorite, fx, fxLoading, refreshFx,
  swStatus, notifPermission, requestNotificationPermission,
  installPrompt, triggerInstall, isStandalone, storageReady,
}) {
  let locText = '위치 확인 중…';
  if (locationStatus === 'requesting') locText = '위치 정보를 요청하는 중…';
  else if (locationStatus === 'denied') locText = '위치 권한이 없어요 — 데모 사용';
  else if (locationStatus === 'unsupported') locText = '브라우저가 위치를 지원하지 않음';
  else if (demoMode && demoCoord) locText = `데모: ${demoCoord.label || '선택된 위치'}`;
  else if (location) {
    const nearest = LANDMARKS.map((l) => ({ l, d: haversineDistance(location.lat, location.lng, l.lat, l.lng) })).sort((a, b) => a.d - b.d)[0];
    locText = nearest ? `${nearest.l.city} 근처` : '이탈리아 어딘가';
  }

  const needsNotif = swStatus === 'registered' && (notifPermission === 'default');
  const notifDenied = notifPermission === 'denied';
  const canInstall = !!installPrompt && !isStandalone;
  const inArtifact = swStatus === 'sandbox';

  return (
    <>
      <header className="bv-header">
        <div className="bv-eyebrow">◆ Compagno di Viaggio ◆</div>
        <h1 className="bv-title bv-display">Bel Viaggio</h1>
        <div className="bv-tagline">당신의 이탈리아 동행 도슨트</div>
        {isStandalone && <div className="bv-tagline" style={{ color: 'var(--sage)', fontSize: 10, marginTop: 4 }}>● 설치된 앱 모드</div>}
      </header>

      <div className="bv-loc-card">
        <div className="ico"><MapPin size={18} /></div>
        <div className="txt">
          <div className="label">Posizione · 현재 위치</div>
          <div className="val">{locText}</div>
        </div>
        <button className="demo-btn" onClick={() => {
          if (demoMode) { setDemoMode(false); setDemoCoord(null); }
          else { setDemoMode(true); setDemoCoord(DEMO_LOCATIONS[0]); }
        }}>
          {demoMode ? '실제 위치' : '데모 모드'}
        </button>
      </div>

      {demoMode && (
        <div className="bv-demo-panel">
          <div className="head">◇ 데모 위치 선택</div>
          <div className="bv-demo-grid">
            {DEMO_LOCATIONS.map((d) => (
              <button key={d.label} className={demoCoord?.label === d.label ? 'active' : ''} onClick={() => setDemoCoord(d)}>
                {d.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {proximityAlert && (
        <div className="bv-alert">
          <button className="close" onClick={() => dismissAlert(proximityAlert.id)}><X size={14} /></button>
          <div className="head"><Sparkles size={11} /> 근접 알림 · Avviso</div>
          <div className="name">{proximityAlert.emoji} {proximityAlert.name}</div>
          <div className="meta">{proximityAlert.nameLocal} · {formatDistance(proximityAlert.distance)}</div>
          <button className="open" onClick={() => onOpenDetail(proximityAlert)}>안내 듣기 <ChevronRight size={14} /></button>
        </div>
      )}

      <div className="bv-actions-4">
        <button className="bv-action4 cam" onClick={onPhotoClick}>
          <div className="ico"><Camera size={20} /></div>
          <div className="ttl bv-display">명소 분석</div>
          <div className="sub">건축·작품</div>
        </button>
        <button className="bv-action4 menu" onClick={onMenuClick}>
          <div className="ico"><Utensils size={20} /></div>
          <div className="ttl bv-display">메뉴 분석</div>
          <div className="sub">여러 장 OK</div>
        </button>
        <button className="bv-action4 receipt" onClick={onReceiptClick}>
          <div className="ico"><Receipt size={20} /></div>
          <div className="ttl bv-display">영수증</div>
          <div className="sub">€ → ₩</div>
        </button>
        <button className="bv-action4 trans" onClick={onTranslateClick}>
          <div className="ico"><Languages size={20} /></div>
          <div className="ttl bv-display">번역</div>
          <div className="sub">음성 입력</div>
        </button>
      </div>

      {/* v0.6: Wide restaurant CTA card */}
      <button className="bv-action-wide" onClick={onRestaurantsClick}>
        <div className="ico"><UtensilsCrossed size={22} /></div>
        <div className="text">
          <div className="ttl bv-display">맛집 찾기</div>
          <div className="sub">평점 + 리뷰 수 가중 정렬 · Google Maps 데이터</div>
        </div>
        <div className="badge"><Sparkles size={10} /> NEW</div>
        <ChevronRight size={14} style={{ color: 'var(--ink-soft)' }} />
      </button>

      <div className="bv-pills">
        <button className="bv-pill fav" onClick={onFavoritesClick}>
          <Heart size={14} /><span>즐겨찾기</span>
          <span className="cnt">{favoritesCount}</span>
        </button>
        <button className="bv-pill coll" onClick={onCollectionClick}>
          <FolderHeart size={14} /><span>컬렉션</span>
          <span className="cnt">{collectionCount}</span>
        </button>
      </div>

      <div className="bv-fx-row">
        <div className="lbl">€ → ₩ 환율</div>
        {fxLoading ? (
          <div className="val muted"><Loader2 size={11} className="spin" /> 가져오는 중…</div>
        ) : fx ? (
          <div className="val">
            <strong>{Math.round(fx.rate).toLocaleString('ko-KR')}원</strong>
            <span className="date"> · ECB {fx.date}</span>
          </div>
        ) : (
          <div className="val muted">불러올 수 없음</div>
        )}
        <button className="refresh" onClick={refreshFx} disabled={fxLoading}><RefreshCw size={11} /></button>
      </div>

      {(canInstall || needsNotif || notifDenied || inArtifact) && (
        <div className="bv-pwa-panel">
          {canInstall && (
            <div className="row">
              <Download size={14} style={{ color: 'var(--sage)' }} />
              <div className="txt">
                <div className="tit">앱 설치</div>
                <div className="sub">홈 화면에 추가하고 전체 화면으로 사용하세요</div>
              </div>
              <button className="grant" onClick={triggerInstall}>설치</button>
            </div>
          )}
          {needsNotif && (
            <div className="row">
              <Bell size={14} style={{ color: 'var(--terracotta)' }} />
              <div className="txt">
                <div className="tit">백그라운드 알림</div>
                <div className="sub">다른 화면에서도 근접 알림을 받으려면 권한 허용</div>
              </div>
              <button className="grant" onClick={requestNotificationPermission}>허용</button>
            </div>
          )}
          {notifDenied && (
            <div className="row">
              <BellRing size={14} style={{ color: 'var(--gold-deep)' }} />
              <div className="txt">
                <div className="tit">알림 차단됨</div>
                <div className="sub">앱 정보 → 알림에서 활성화하면 백그라운드 알림 가능</div>
              </div>
            </div>
          )}
          {inArtifact && (
            <div className="row">
              <Info size={14} style={{ color: 'var(--gold-deep)' }} />
              <div className="txt">
                <div className="tit">PWA 미설치 (아티팩트 환경)</div>
                <div className="sub">IndexedDB·SW·홈 설치는 자체 배포 후 동작. <code>pwa-deploy/</code> 참고</div>
              </div>
            </div>
          )}
        </div>
      )}

      <div className="bv-section-head">
        <h2 className="bv-display">Vicino a te · 주변 명소</h2>
        <div className="rule" />
      </div>

      {nearby.length === 0 ? (
        <div className="bv-empty">위치를 가져오면 주변 이탈리아 명소가<br />여기에 자동으로 표시됩니다.</div>
      ) : (
        <div className="bv-nearby">
          {nearby.map((l) => (
            <div key={l.id} className="bv-nearby-item">
              <div className="emoji" onClick={() => onOpenDetail(l)}>{l.emoji}</div>
              <div className="body" onClick={() => onOpenDetail(l)}>
                <div className="name bv-display">{l.name}</div>
                <div className="sub">{l.nameLocal} · {l.city}</div>
              </div>
              <button className={`heart ${favorites.has(l.id) ? 'on' : ''}`} onClick={(e) => { e.stopPropagation(); toggleFavorite(l.id); }}>
                <Heart size={14} fill={favorites.has(l.id) ? 'currentColor' : 'none'} />
              </button>
              <div className="dist">{formatDistance(l.distance)}</div>
            </div>
          ))}
        </div>
      )}
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Photo View
// ─────────────────────────────────────────────────────────
function PhotoView({ imageData, analyzing, analysis, error, onBack, speak, speakingId, onRetake, onSave, onUnsave, saved, isSaved }) {
  const ttsText = analysis
    ? `${analysis.name}. ${analysis.summary} ${analysis.history} 봐야 할 포인트는, ${(analysis.viewingPoints || []).map(p => typeof p === 'string' ? p : `${p.title}. ${p.detail || ''}`).join(', ')}. ${analysis.tip}`
    : '';

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      {imageData && <img src={imageData} alt="" className="bv-img" />}
      {analyzing && (
        <div className="bv-loading">
          <Loader2 className="spin" size={22} style={{ color: 'var(--terracotta)' }} />
          <div style={{ marginTop: 8 }}>이미지 분석 중… <i>Un momento, per favore.</i></div>
        </div>
      )}
      {error && <div className="bv-error"><AlertCircle size={16} /><div>{error}</div></div>}
      {analysis && (
        <>
          <h2 className="bv-h1">{analysis.name}</h2>
          <div className="bv-h1-sub">{analysis.nameLocal} · {analysis.category}</div>
          <BigTTSButton active={speakingId === 'analysis'} onClick={() => speak(ttsText, 'ko-KR', 'analysis')} />
          <div className="bv-action-row">
            <SaveToggleButton isSaved={isSaved} saved={saved} onSave={onSave} onUnsave={onUnsave} />
            <button className="bv-row-btn" onClick={onRetake}><Camera size={14} /> 다른 사진</button>
          </div>
          <div className="bv-card"><div className="label"><BookOpen size={11} /> Sommario · 요약</div><p>{analysis.summary}</p></div>
          <div className="bv-card"><div className="label"><Sparkles size={11} /> Storia · 역사</div><p>{analysis.history}</p></div>
          {analysis.viewingPoints?.length > 0 && (
            <ViewingPointsCard points={analysis.viewingPoints} />
          )}
          {analysis.tip && <div className="bv-card"><div className="label"><Compass size={11} /> Consiglio · 팁</div><p>{analysis.tip}</p></div>}
          {analysis.phrase?.it && <PhraseCard phrase={analysis.phrase} speak={speak} speakingId={speakingId} id="phrase-photo" />}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Menu View
// ─────────────────────────────────────────────────────────
function MenuView({ images, analyzing, analysis, error, onBack, speak, speakingId, onRetake, onSave, onUnsave, saved, isSaved }) {
  const ttsText = analysis
    ? `${analysis.venue || '메뉴'}. ${analysis.summary || ''} ` +
      (analysis.items || []).map(i => `${i.name}, ${i.description || ''} ${i.allergens?.length ? '알레르기 주의, ' + i.allergens.join(', ') + '.' : ''}`).join(' ') +
      ` ${analysis.tip || ''}`
    : '';

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      {images?.length > 0 && (
        <div className={`bv-multi-img count-${Math.min(images.length, 4)}`}>
          {images.map((src, i) => <img key={i} src={src} alt="" />)}
        </div>
      )}
      {images?.length > 1 && (<div className="bv-multi-note"><Layers size={11} /> {images.length}장 통합 분석</div>)}
      {analyzing && (
        <div className="bv-loading">
          <Loader2 className="spin" size={22} style={{ color: 'var(--terracotta)' }} />
          <div style={{ marginTop: 8 }}>메뉴 분석 중… <i>Un attimo.</i></div>
        </div>
      )}
      {error && <div className="bv-error"><AlertCircle size={16} /><div>{error}</div></div>}
      {analysis && (
        <>
          <h2 className="bv-h1">{analysis.venue || '메뉴'}</h2>
          <div className="bv-h1-sub">{analysis.items?.length || 0}개 항목 · {analysis.type}</div>
          <BigTTSButton active={speakingId === 'menu'} onClick={() => speak(ttsText, 'ko-KR', 'menu')} label="메뉴 전체 듣기" />
          <div className="bv-action-row">
            <SaveToggleButton isSaved={isSaved} saved={saved} onSave={onSave} onUnsave={onUnsave} />
            <button className="bv-row-btn" onClick={onRetake}><Camera size={14} /> 다른 사진</button>
          </div>
          {analysis.summary && <div className="bv-card"><div className="label"><BookOpen size={11} /> 가게 인상</div><p>{analysis.summary}</p></div>}
          {analysis.tip && (
            <div className="bv-card" style={{ borderColor: 'rgba(201,169,97,0.3)', background: 'rgba(201,169,97,0.08)' }}>
              <div className="label"><Compass size={11} /> 주문 팁</div><p>{analysis.tip}</p>
            </div>
          )}
          {analysis.items?.length > 0 && (
            <div className="bv-section-head" style={{ padding: 0, marginTop: 18 }}>
              <h2 className="bv-display" style={{ fontSize: 18 }}>Piatti · 메뉴</h2>
              <div className="rule" />
            </div>
          )}
          {(analysis.items || []).map((dish, i) => {
            const cs = categoryStyle(dish.category);
            const phraseId = `dish-${i}`;
            return (
              <div key={i} className="bv-dish">
                <div className="head">
                  <div className="cat" style={{ background: cs.bg, color: cs.fg }}>{dish.category}</div>
                  {dish.price && <div className="price">{dish.price}</div>}
                </div>
                <div className="bv-display dish-name">{dish.name}</div>
                <div className="dish-local">
                  <span style={{ fontStyle: 'italic' }}>{dish.nameLocal}</span>
                  {dish.pronunciation && <span className="pron"> [{dish.pronunciation}]</span>}
                  <button className="mini-tts" onClick={() => speak(dish.nameLocal, 'it-IT', phraseId)}>
                    {speakingId === phraseId ? <VolumeX size={11} /> : <Volume2 size={11} />}
                  </button>
                </div>
                {dish.description && <div className="dish-desc">{dish.description}</div>}
                {dish.ingredients?.length > 0 && (<div className="chips">{dish.ingredients.map((ing, j) => <span key={j} className="chip">{ing}</span>)}</div>)}
                <div className="badges">
                  {dish.recommended && <span className="badge rec">⭐ 추천</span>}
                  {dish.vegetarian && <span className="badge veg">🌿 Veg</span>}
                  {dish.spicy && <span className="badge spi">🌶 매움</span>}
                  {dish.allergens?.length > 0 && dish.allergens.map((a, j) => (
                    <span key={j} className="badge alg"><AlertTriangle size={10} style={{ marginRight: 3 }} />{a}</span>
                  ))}
                </div>
                {dish.note && <div className="dish-note">{dish.note}</div>}
              </div>
            );
          })}
          {analysis.phrase?.it && <PhraseCard phrase={analysis.phrase} speak={speak} speakingId={speakingId} id="phrase-menu" label="주문 표현" />}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Receipt View
// ─────────────────────────────────────────────────────────
function ReceiptView({ imageData, analyzing, analysis, error, fx, onBack, speak, speakingId, onRetake, onSave, onUnsave, saved, isSaved }) {
  const itemsSum = analysis ? (analysis.items || []).reduce((s, it) => s + (it.total || 0), 0) : 0;
  const declaredTotal = analysis?.total ?? 0;
  const declaredCoperto = analysis?.coperto ?? 0;
  const declaredService = analysis?.service ?? 0;
  const declaredTax = analysis?.tax ?? 0;
  const expectedTotal = itemsSum + declaredCoperto + declaredService + declaredTax;
  const diff = declaredTotal - expectedTotal;
  const diffAbs = Math.abs(diff);
  const rate = fx?.rate;
  const krw = (eur) => rate ? Math.round((eur || 0) * rate) : null;

  const ttsText = analysis
    ? `${analysis.venue || '영수증'}. 총 ${(analysis.items || []).length}개 항목. ` +
      (analysis.items || []).map(i => `${i.name} ${formatEUR(i.total)}`).join(', ') +
      `. 합계 ${formatEUR(analysis.total)}` +
      (rate ? `, 한화로 약 ${formatKRW(krw(analysis.total))}` : '') +
      (analysis.note ? `. ${analysis.note}` : '')
    : '';

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      {imageData && <img src={imageData} alt="" className="bv-img" />}
      {analyzing && (
        <div className="bv-loading">
          <Loader2 className="spin" size={22} style={{ color: 'var(--terracotta)' }} />
          <div style={{ marginTop: 8 }}>영수증 분석 중… <i>Sto leggendo lo scontrino.</i></div>
        </div>
      )}
      {error && <div className="bv-error"><AlertCircle size={16} /><div>{error}</div></div>}
      {analysis && (
        <>
          <h2 className="bv-h1">{analysis.venue || '영수증'}</h2>
          <div className="bv-h1-sub">{analysis.venueType} {analysis.date && `· ${analysis.date}`}</div>
          <BigTTSButton active={speakingId === 'receipt'} onClick={() => speak(ttsText, 'ko-KR', 'receipt')} label="영수증 듣기" />
          <div className="bv-action-row">
            <SaveToggleButton isSaved={isSaved} saved={saved} onSave={onSave} onUnsave={onUnsave} />
            <button className="bv-row-btn" onClick={onRetake}><Camera size={14} /> 다른 영수증</button>
          </div>
          <div className="bv-receipt-tbl">
            <div className="head">
              <div className="c-name">항목</div>
              <div className="c-qty">수량</div>
              <div className="c-eur">€</div>
              <div className="c-krw">₩</div>
            </div>
            {(analysis.items || []).map((it, i) => (
              <div className="row" key={i}>
                <div className="c-name">
                  <div className="ko">{it.name}</div>
                  <div className="local">{it.nameLocal}</div>
                </div>
                <div className="c-qty">{it.qty || 1}</div>
                <div className="c-eur">{formatEUR(it.total)}</div>
                <div className="c-krw">{krw(it.total) != null ? formatKRW(krw(it.total)) : '—'}</div>
              </div>
            ))}
          </div>
          <div className="bv-receipt-sum">
            <div className="sum-row">
              <span>항목 소계</span>
              <span>{formatEUR(itemsSum)} {rate && <em>· {formatKRW(krw(itemsSum))}</em>}</span>
            </div>
            {declaredCoperto > 0 && (
              <div className="sum-row"><span>자릿세 (Coperto)</span><span>{formatEUR(declaredCoperto)} {rate && <em>· {formatKRW(krw(declaredCoperto))}</em>}</span></div>
            )}
            {declaredService > 0 && (
              <div className="sum-row"><span>봉사료 (Servizio)</span><span>{formatEUR(declaredService)} {rate && <em>· {formatKRW(krw(declaredService))}</em>}</span></div>
            )}
            {declaredTax > 0 && (
              <div className="sum-row"><span>부가세 (IVA)</span><span>{formatEUR(declaredTax)} {rate && <em>· {formatKRW(krw(declaredTax))}</em>}</span></div>
            )}
            <div className="sum-row total">
              <span>합계</span>
              <span><strong>{formatEUR(declaredTotal)}</strong>{rate && <em> · {formatKRW(krw(declaredTotal))}</em>}</span>
            </div>
            {analysis.items?.length > 0 && diffAbs > 0.02 && (
              <div className="sum-check warn">
                <AlertTriangle size={12} />
                <div>계산 차이 <strong>{formatEUR(diff)}</strong>. 영수증 항목 + Coperto/Servizio/IVA 합({formatEUR(expectedTotal)})이 합계({formatEUR(declaredTotal)})와 다릅니다. 인식 오류이거나 표기되지 않은 항목이 있을 수 있어요.</div>
              </div>
            )}
            {analysis.items?.length > 0 && diffAbs <= 0.02 && (
              <div className="sum-check ok"><Check size={12} /> 항목 합계와 총액이 일치합니다.</div>
            )}
          </div>
          {rate && (
            <div className="bv-fx-note">ⓘ 환율 EUR 1 = ₩{Math.round(rate).toLocaleString('ko-KR')} (ECB · {fx.date}) — 카드사 적용 환율과 다를 수 있어요.</div>
          )}
          {analysis.note && (
            <div className="bv-card" style={{ borderColor: 'rgba(201,169,97,0.3)', background: 'rgba(201,169,97,0.08)' }}>
              <div className="label"><Info size={11} /> 참고</div>
              <p>{analysis.note}</p>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Translate View (with voice input)
// ─────────────────────────────────────────────────────────
function TranslateView({ input, setInput, direction, setDirection, translation, translating, error, onTranslate, onBack, speak, speakingId }) {
  const placeholder = direction === 'ko-it'
    ? '한국어를 입력하세요 — 예: "이거 얼마예요?"'
    : 'Inserisci italiano — es: "Quanto costa?"';
  const voiceLang = direction === 'ko-it' ? 'ko-KR' : 'it-IT';
  const [voiceError, setVoiceError] = useState(null);

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      <h2 className="bv-h1">Traduzione</h2>
      <div className="bv-h1-sub">번역하기</div>

      <div className="bv-dir-toggle">
        <button className={direction === 'ko-it' ? 'active' : ''} onClick={() => setDirection('ko-it')}>한국어 → IT</button>
        <button className={direction === 'it-ko' ? 'active' : ''} onClick={() => setDirection('it-ko')}>IT → 한국어</button>
      </div>

      <VoiceInputButton lang={voiceLang} onResult={setInput} onError={setVoiceError} />
      {voiceError && (
        <div className="bv-voice-err">
          <AlertCircle size={11} /> 음성 입력 실패: {voiceError === 'not-allowed' ? '마이크 권한 없음 (브라우저 설정에서 허용)' : voiceError}
        </div>
      )}

      <textarea className="bv-textarea" value={input} onChange={(e) => setInput(e.target.value)} placeholder={placeholder} />

      <button className="bv-primary-btn" onClick={onTranslate} disabled={translating || !input.trim()}>
        {translating ? <><Loader2 className="spin" size={16} /> 번역 중…</> : <><Languages size={16} /> 번역하기</>}
      </button>

      {error && <div className="bv-error"><AlertCircle size={16} /><div>{error}</div></div>}

      {translation && (
        <div className="bv-card" style={{ marginTop: 18 }}>
          <div className="label"><Languages size={11} /> {direction === 'ko-it' ? 'In italiano' : '한국어로'}</div>
          <p style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: 22, lineHeight: 1.35, fontStyle: direction === 'ko-it' ? 'italic' : 'normal', color: 'var(--burgundy)' }}>
            {translation.translation}
          </p>
          {translation.pronunciation && <div style={{ fontSize: 12, color: 'var(--ink-soft)', marginTop: 6, letterSpacing: '0.04em' }}>[{translation.pronunciation}]</div>}
          {translation.note && <div style={{ fontSize: 12, color: 'var(--gold-deep)', marginTop: 10, fontStyle: 'italic' }}>ⓘ {translation.note}</div>}
          <button className={`bv-speak-btn ${speakingId === 'translation' ? 'on' : ''}`} onClick={() => speak(translation.translation, direction === 'ko-it' ? 'it-IT' : 'ko-KR', 'translation')}>
            {speakingId === 'translation' ? <VolumeX size={14} /> : <Volume2 size={14} />} 발음 듣기
          </button>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Detail View (with Wikipedia hero photo)
// ─────────────────────────────────────────────────────────
function DetailView({ detail, loading, onBack, speak, speakingId, onSave, onUnsave, saved, isSaved, onDirections, isFavorite, toggleFavorite, photo, photoLoading, onRefresh }) {
  const ttsText = detail && !detail.loading
    ? `${detail.name}. ${detail.summary || ''} ${detail.history || ''} 봐야 할 포인트는, ${(detail.viewingPoints || []).map(p => typeof p === 'string' ? p : `${p.title}. ${p.detail || ''}`).join(', ')}. ${detail.tip || ''}`
    : '';

  return (
    <div className="bv-subview">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
        <button className={`bv-heart-btn ${isFavorite ? 'on' : ''}`} onClick={toggleFavorite}>
          <Heart size={16} fill={isFavorite ? 'currentColor' : 'none'} />
          {isFavorite ? '즐겨찾기됨' : '즐겨찾기'}
        </button>
      </div>

      {photo?.url ? (
        <div className="bv-hero-photo">
          <img src={photo.url} alt={detail.nameLocal} />
          <div className="credit">📷 {photo.credit}</div>
        </div>
      ) : photoLoading ? (
        <div className="bv-hero-skeleton">
          <Loader2 className="spin" size={20} style={{ color: 'var(--terracotta)' }} />
          <span>위키피디아에서 사진을 가져오는 중…</span>
        </div>
      ) : (
        <div style={{ fontSize: 56, marginTop: 8, textAlign: 'center' }}>{detail.emoji}</div>
      )}

      <h2 className="bv-h1">{detail.name}</h2>
      <div className="bv-h1-sub">{detail.nameLocal} · {detail.city}, {detail.region}</div>

      {detail.fromCache && !detail.loading && (
        <div className="bv-cache-row">
          <Database size={10} />
          <span>저장된 가이드 표시 중</span>
          <button onClick={onRefresh} title="새로 가져오기"><RefreshCw size={10} /> 새로</button>
        </div>
      )}

      {detail.loading && (
        <div className="bv-loading">
          <Loader2 className="spin" size={22} style={{ color: 'var(--terracotta)' }} />
          <div style={{ marginTop: 8 }}>도슨트가 준비 중이에요…</div>
        </div>
      )}

      {detail.error && <div className="bv-error"><AlertCircle size={16} /><div>가이드를 불러오지 못했어요: {detail.error}</div></div>}

      {!detail.loading && !detail.error && (
        <>
          <BigTTSButton active={speakingId === 'detail'} onClick={() => speak(ttsText, 'ko-KR', 'detail')} />
          <div className="bv-action-row">
            <SaveToggleButton isSaved={isSaved} saved={saved} onSave={onSave} onUnsave={onUnsave} />
            <button className="bv-row-btn" onClick={onDirections}><Navigation size={14} /> 길찾기</button>
          </div>
          {detail.summary && <div className="bv-card"><div className="label"><BookOpen size={11} /> Sommario</div><p>{detail.summary}</p></div>}
          {detail.history && <div className="bv-card"><div className="label"><Sparkles size={11} /> Storia · 역사</div><p>{detail.history}</p></div>}
          {detail.viewingPoints?.length > 0 && <ViewingPointsCard points={detail.viewingPoints} />}
          {detail.tip && <div className="bv-card"><div className="label"><Compass size={11} /> Consiglio · 팁</div><p>{detail.tip}</p></div>}
          {detail.phrase?.it && <PhraseCard phrase={detail.phrase} speak={speak} speakingId={speakingId} id="detail-phrase" />}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Collection
// ─────────────────────────────────────────────────────────
function CollectionView({ items, onBack, onOpen, onRemove, dbAvailable }) {
  const grouped = {
    landmark: items.filter((i) => i.type === 'landmark'),
    photo: items.filter((i) => i.type === 'photo'),
    menu: items.filter((i) => i.type === 'menu'),
    receipt: items.filter((i) => i.type === 'receipt'),
  };

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      <h2 className="bv-h1">Il mio viaggio</h2>
      <div className="bv-h1-sub">내 여행 컬렉션 · {items.length}개</div>

      {items.length === 0 && (
        <div className="bv-empty" style={{ margin: '24px 0' }}>
          아직 저장된 항목이 없어요.<br />
          명소·메뉴·영수증·사진 분석 결과를 저장하면 여기에 모입니다.
        </div>
      )}

      {grouped.landmark.length > 0 && <CollectionGroup title="명소" emoji="🏛️" items={grouped.landmark} onOpen={onOpen} onRemove={onRemove} />}
      {grouped.photo.length > 0 && <CollectionGroup title="사진 분석" emoji="📷" items={grouped.photo} onOpen={onOpen} onRemove={onRemove} />}
      {grouped.menu.length > 0 && <CollectionGroup title="메뉴" emoji="🍽️" items={grouped.menu} onOpen={onOpen} onRemove={onRemove} />}
      {grouped.receipt.length > 0 && <CollectionGroup title="영수증" emoji="🧾" items={grouped.receipt} onOpen={onOpen} onRemove={onRemove} />}

      {items.length > 0 && (
        <div style={{ marginTop: 18, padding: '10px 14px', background: 'rgba(0,0,0,0.03)', borderRadius: 10, fontSize: 11, color: 'var(--ink-soft)', textAlign: 'center' }}>
          {dbAvailable === true ? (
            <><Database size={11} style={{ verticalAlign: 'middle' }} /> IndexedDB에 영구 저장됨</>
          ) : (
            <>ⓘ 컬렉션이 메모리에만 저장됩니다 (IndexedDB 미사용 환경)</>
          )}
        </div>
      )}
    </div>
  );
}

function CollectionGroup({ title, emoji, items, onOpen, onRemove }) {
  return (
    <>
      <div className="bv-section-head" style={{ padding: 0, marginTop: 18 }}>
        <h2 className="bv-display" style={{ fontSize: 18 }}>{emoji} {title} · {items.length}</h2>
        <div className="rule" />
      </div>
      <div className="bv-coll-grid">
        {items.map((item) => (
          <div key={item.id} className="bv-coll-card">
            <button className="open" onClick={() => onOpen(item)}>
              <div className="thumb">
                {item.thumbnail ? <img src={item.thumbnail} alt="" /> : <div className="emoji">{item.emoji || '🏛️'}</div>}
              </div>
              <div className="meta">
                <div className="ttl bv-display">{item.title}</div>
                <div className="sub">{item.subtitle}</div>
              </div>
            </button>
            <button className="rm" onClick={() => onRemove(item.id)}><Trash2 size={12} /></button>
          </div>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────
// Favorites View (with route planning)
// ─────────────────────────────────────────────────────────
function FavoritesView({ items, hasLocation, onBack, onOpen, onRemove, onDirections, onPlanRoute, onAiItinerary, photoCache, fetchPhoto }) {
  // Group by city for route options
  const cityGroups = useMemo(() => {
    const g = {};
    items.forEach(i => {
      if (!g[i.city]) g[i.city] = 0;
      g[i.city]++;
    });
    return Object.entries(g).filter(([, count]) => count >= 2).sort((a, b) => b[1] - a[1]);
  }, [items]);

  // Lazy-fetch first 5 photos
  useEffect(() => {
    items.slice(0, 5).forEach(l => {
      if (!photoCache[l.id]) fetchPhoto(l);
    });
  }, [items, photoCache, fetchPhoto]);

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      <h2 className="bv-h1">Preferiti</h2>
      <div className="bv-h1-sub">즐겨찾기 · {items.length}곳</div>

      {items.length === 0 ? (
        <div className="bv-empty" style={{ margin: '24px 0' }}>
          아직 즐겨찾기한 명소가 없어요.<br />
          명소 카드의 <Heart size={11} style={{ verticalAlign: 'middle', color: 'var(--terracotta)' }} /> 아이콘을 탭해서 추가하세요.
        </div>
      ) : (
        <>
          {/* AI Itinerary section (v0.5) */}
          {items.length >= 2 && (
            <div className="bv-ai-itinerary-cta">
              <div className="head"><Wand2 size={12} /> AI 추천 동선</div>
              <div className="sub">관람 시간, 인파 패턴, 식사 시간까지 고려한 일정을 AI가 짜드려요. 1회 약 $0.05~0.10 추정.</div>
              <div className="btns">
                <button className="primary" onClick={() => onAiItinerary(null)}>
                  <Wand2 size={14} /> 전체 일정 추천 ({items.length}곳)
                </button>
                {cityGroups.map(([city, count]) => (
                  <button key={city} onClick={() => onAiItinerary(city)}>
                    {city} 일정 ({count}곳)
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Simple route planner (existing) */}
          {items.length >= 2 && (
            <div className="bv-route-actions">
              <div className="head"><Route size={12} /> 최단 도보 코스</div>
              <div className="sub">즐겨찾기 명소의 최근접 이웃 순서. 도보 시간은 직선 거리 × 1.3 ÷ 시속 5km 추정.</div>
              <div className="btns">
                <button className="primary" onClick={() => onPlanRoute(null)}>
                  <Route size={14} /> 전체 코스
                </button>
                {cityGroups.map(([city, count]) => (
                  <button key={city} onClick={() => onPlanRoute(city)}>
                    {city} ({count}곳)
                  </button>
                ))}
              </div>
            </div>
          )}

          <div className="bv-nearby">
            {items.map((l) => {
              const ph = photoCache[l.id];
              return (
                <div key={l.id} className="bv-fav-item">
                  <div className="thumb" onClick={() => onOpen(l)}>
                    {ph?.url ? <img src={ph.url} alt="" /> : <div className="emoji-thumb">{l.emoji}</div>}
                  </div>
                  <div className="body" onClick={() => onOpen(l)}>
                    <div className="name bv-display">{l.name}</div>
                    <div className="sub">{l.nameLocal}</div>
                    <div className="meta">
                      <span>{l.city}</span>
                      {l.distance != null && <span className="dist">· {formatDistance(l.distance)}</span>}
                    </div>
                  </div>
                  <div className="actions">
                    <button className="act-btn rm" onClick={(e) => { e.stopPropagation(); onRemove(l.id); }} title="해제">
                      <Heart size={12} fill="currentColor" />
                    </button>
                    <button className="act-btn dir" onClick={(e) => { e.stopPropagation(); onDirections(l); }} title="길찾기">
                      <Navigation size={12} />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Route View (NEW)
// ─────────────────────────────────────────────────────────
function RouteView({ route, onBack, onOpenLandmark, onOpenMaps }) {
  const { city, stops, startLocation, totalMeters, totalMinutes } = route;
  const hours = Math.floor(totalMinutes / 60);
  const mins = totalMinutes % 60;
  const timeText = hours > 0 ? `${hours}시간 ${mins}분` : `${mins}분`;

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      <h2 className="bv-h1">Itinerario · 코스</h2>
      <div className="bv-h1-sub">{city} · {stops.length}곳</div>

      <div className="bv-route-summary">
        <div className="stat">
          <Footprints size={16} />
          <div>
            <div className="v">{formatDistance(totalMeters)}</div>
            <div className="l">총 도보 거리</div>
          </div>
        </div>
        <div className="stat">
          <Clock size={16} />
          <div>
            <div className="v">{timeText}</div>
            <div className="l">총 도보 시간</div>
          </div>
        </div>
      </div>

      <div className="bv-route-disclaimer">
        ⓘ <strong>최근접 이웃 알고리즘으로 계산된 추정치</strong>입니다. 도보 시간은 평균 시속 5km × 1.3배 우회 계수(추정)로 계산. 실제 거리는 지형·신호등·골목길에 따라 다를 수 있어요.
      </div>

      <button className="bv-primary-btn" onClick={onOpenMaps} style={{ marginTop: 12 }}>
        <Navigation size={16} /> 전체 코스 Google Maps에서 보기
      </button>

      <div className="bv-section-head" style={{ padding: 0, marginTop: 22 }}>
        <h2 className="bv-display" style={{ fontSize: 18 }}>방문 순서</h2>
        <div className="rule" />
      </div>

      <div className="bv-route-stops">
        {startLocation && !stops[0]?.isStart && (
          <div className="bv-route-start">
            <div className="num">📍</div>
            <div className="info">
              <div className="label">출발</div>
              <div className="title">현재 위치</div>
            </div>
          </div>
        )}

        {stops.map((stop, i) => (
          <React.Fragment key={stop.id}>
            {(i > 0 || (i === 0 && startLocation && !stop.isStart)) && stop.distanceFromPrev > 0 && (
              <div className="bv-route-link">
                <Footprints size={11} />
                <span>{formatDistance(stop.distanceFromPrev)} · 약 {stop.walkMinutes}분</span>
              </div>
            )}
            <div className="bv-route-stop" onClick={() => onOpenLandmark(stop)}>
              <div className="num">{i + 1}</div>
              <div className="emoji">{stop.emoji}</div>
              <div className="info">
                <div className="title bv-display">{stop.name}</div>
                <div className="local">{stop.nameLocal}</div>
              </div>
              <ChevronRight size={14} style={{ color: 'var(--ink-soft)' }} />
            </div>
          </React.Fragment>
        ))}
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Phrase card
// ─────────────────────────────────────────────────────────
// ─────────────────────────────────────────────────────────
// AI Itinerary View (v0.5)
// ─────────────────────────────────────────────────────────
function AiItineraryView({ itinerary, loading, error, onBack, onOpenLandmark, onSelectRestaurant, landmarks }) {
  const [expandedDay, setExpandedDay] = useState(0);

  const findLandmark = (id) => landmarks.find((l) => l.id === id);

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>
      <h2 className="bv-h1">Itinerario AI</h2>
      <div className="bv-h1-sub">AI 추천 동선</div>

      {loading && (
        <div className="bv-loading">
          <Loader2 className="spin" size={22} style={{ color: 'var(--terracotta)' }} />
          <div style={{ marginTop: 8 }}>일정을 생성하는 중…<br /><i>L'AI sta pianificando il tuo viaggio.</i></div>
        </div>
      )}

      {error && <div className="bv-error"><AlertCircle size={16} /><div>{error}</div></div>}

      {itinerary && (
        <>
          <div className="bv-ai-hero">
            <div className="title bv-display">{itinerary.title}</div>
            <div className="meta">
              <CalendarDays size={11} /> {itinerary.totalDays}일 일정
            </div>
            {itinerary.summary && <div className="summary">{itinerary.summary}</div>}
          </div>

          <div className="bv-route-disclaimer" style={{ marginTop: 12 }}>
            ⓘ <strong>AI 추정 일정</strong>입니다. 관람 시간·인파 패턴·식사 시간을 가정해서 계산했어요. 실제 개관 시간·휴관일은 현지에서 한 번 더 확인하세요.
          </div>

          {(itinerary.days || []).map((day, di) => (
            <div key={di} className="bv-day-card">
              <button className="bv-day-head" onClick={() => setExpandedDay(expandedDay === di ? -1 : di)}>
                <div className="day-num">Day {day.day}</div>
                <div className="day-info">
                  <div className="day-theme">{day.theme}</div>
                  <div className="day-city">{day.city} · {(day.stops || []).length}곳</div>
                </div>
                {expandedDay === di ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>

              {expandedDay === di && (
                <div className="bv-day-body">
                  {(day.stops || []).map((stop, si) => {
                    const landmark = findLandmark(stop.id);
                    return (
                      <div key={si} className="bv-ai-stop" onClick={() => landmark && onOpenLandmark(stop.id)}>
                        <div className="time">{stop.arrivalTime}</div>
                        <div className="content">
                          <div className="name bv-display">
                            {landmark?.emoji} {landmark?.name || stop.id}
                          </div>
                          <div className="dur">
                            <Clock size={10} /> 약 {stop.duration}분
                          </div>
                          {stop.reason && <div className="reason"><Sun size={10} /> {stop.reason}</div>}
                          {stop.tip && <div className="tip"><Sparkles size={10} /> {stop.tip}</div>}
                        </div>
                        {landmark && <ChevronRight size={12} style={{ color: 'var(--ink-soft)' }} />}
                      </div>
                    );
                  })}

                  {(day.meals || []).map((meal, mi) => (
                    <div key={`meal-${mi}`} className="bv-ai-meal">
                      <div className="time">{meal.time}</div>
                      <div className="content">
                        <div className="name"><UtensilsCrossed size={12} /> {meal.type}</div>
                        <div className="sug">{meal.suggestion}</div>
                      </div>
                    </div>
                  ))}

                  {/* v0.7: 그날 동선 근처 베이지안 가중 정렬 맛집 5곳 */}
                  {day.restaurantPicks?.length > 0 && (
                    <div className="bv-day-restaurants">
                      <div className="bv-day-section-title">
                        <UtensilsCrossed size={11} /> 이 동선의 추천 맛집
                        <span className="hint">평점 × 리뷰수 가중 정렬</span>
                      </div>
                      {day.restaurantPicks.map((r, ri) => (
                        <button key={r.id || ri} className="bv-day-restaurant" onClick={() => onSelectRestaurant?.(r)}>
                          <span className="rank">#{ri + 1}</span>
                          <div className="info">
                            <div className="name bv-display">{r.name}</div>
                            <div className="meta">
                              <Star size={9} fill="currentColor" style={{ color: 'var(--gold-deep)' }} />
                              <span>{r.rating?.toFixed(1)}</span>
                              <span className="muted">· {r.userRatingCount?.toLocaleString('ko-KR')}리뷰</span>
                              <span className="weighted">{r.weightedScore?.toFixed(2)}</span>
                            </div>
                          </div>
                          <ChevronRight size={11} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
                        </button>
                      ))}
                    </div>
                  )}

                  {day.walkingNote && (
                    <div className="bv-day-walk">
                      <Footprints size={11} /> {day.walkingNote}
                    </div>
                  )}
                </div>
              )}
            </div>
          ))}

          {(itinerary.overallTips || []).length > 0 && (
            <div className="bv-card" style={{ marginTop: 14, borderColor: 'rgba(201,169,97,0.3)', background: 'rgba(201,169,97,0.08)' }}>
              <div className="label"><Compass size={11} /> 전체 일정 팁</div>
              <ul>
                {itinerary.overallTips.map((tip, i) => <li key={i}>{tip}</li>)}
              </ul>
            </div>
          )}
        </>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Restaurants View (v0.6) — Google Places + Bayesian weighted ranking
// ─────────────────────────────────────────────────────────
const CUISINE_FILTERS = [
  { key: 'all',     label: '전체',    emoji: '🍽️' },
  { key: 'italian', label: '이탈리아', emoji: '🇮🇹' },
  { key: 'pasta',   label: '파스타',  emoji: '🍝' },
  { key: 'pizza',   label: '피자',    emoji: '🍕' },
  { key: 'seafood', label: '해산물',  emoji: '🐟' },
  { key: 'steak',   label: '스테이크', emoji: '🥩' },
  { key: 'gelato',  label: '젤라토',  emoji: '🍨' },
  { key: 'cafe',    label: '카페',    emoji: '☕' },
  { key: 'wine',    label: '와인바',   emoji: '🍷' },
];

function priceLevelToSign(level) {
  // Google API: PRICE_LEVEL_INEXPENSIVE / MODERATE / EXPENSIVE / VERY_EXPENSIVE / FREE
  const map = {
    'PRICE_LEVEL_FREE': '',
    'PRICE_LEVEL_INEXPENSIVE': '€',
    'PRICE_LEVEL_MODERATE': '€€',
    'PRICE_LEVEL_EXPENSIVE': '€€€',
    'PRICE_LEVEL_VERY_EXPENSIVE': '€€€€',
  };
  return map[level] || '';
}

function RestaurantsView({ restaurants, loading, error, meta, cuisine, setCuisine, origin, location, onBack, onSelect, onRefresh }) {
  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>

      <h2 className="bv-h1">Ristoranti</h2>
      <div className="bv-h1-sub">맛집 · 평점 × 리뷰 수 가중 정렬</div>

      {!location && (
        <div className="bv-error" style={{ marginTop: 12 }}>
          <AlertCircle size={16} />
          <div>위치 정보가 필요해요. 위치 권한을 허용하거나 데모 모드를 선택해주세요.</div>
        </div>
      )}

      {/* Cuisine filter pills */}
      <div className="bv-cuisine-row">
        {CUISINE_FILTERS.map((c) => (
          <button
            key={c.key}
            className={`bv-cuisine-pill ${cuisine === c.key ? 'on' : ''}`}
            onClick={() => setCuisine(c.key)}
            disabled={loading}
          >
            <span className="emoji">{c.emoji}</span>
            <span>{c.label}</span>
          </button>
        ))}
      </div>

      {/* Meta info row */}
      {meta && !loading && (
        <div className="bv-restaurants-meta">
          <div className="meta-line">
            <TrendingUp size={10} /> {meta.count}곳 · 평균 평점 {meta.meanRating}
            {meta.fromCache && <span style={{ marginLeft: 6 }}>· <Database size={9} /> 캐시</span>}
          </div>
          <button onClick={onRefresh} title="새로 검색"><RefreshCw size={10} /> 새로</button>
        </div>
      )}

      {loading && (
        <div className="bv-loading">
          <Loader2 className="spin" size={22} style={{ color: 'var(--terracotta)' }} />
          <div style={{ marginTop: 8 }}>맛집 검색 중…<br /><i>Sto cercando i migliori ristoranti.</i></div>
        </div>
      )}

      {error && (
        <div className="bv-error" style={{ marginTop: 12 }}>
          <AlertCircle size={16} /><div>{error}</div>
        </div>
      )}

      {!loading && !error && restaurants.length === 0 && location && (
        <div className="bv-empty" style={{ marginTop: 24 }}>
          이 카테고리에 해당하는 결과가 없어요.<br />다른 카테고리를 선택해보세요.
        </div>
      )}

      {/* Restaurant cards */}
      {!loading && restaurants.length > 0 && (
        <div className="bv-restaurant-list">
          {restaurants.map((r, i) => (
            <RestaurantCard key={r.id || i} restaurant={r} rank={i + 1} onClick={() => onSelect(r)} />
          ))}
        </div>
      )}

      {/* Footer caveat */}
      {restaurants.length > 0 && (
        <div className="bv-route-disclaimer" style={{ marginTop: 14 }}>
          ⓘ 정렬 기준: <strong>(평점 × 리뷰수 + 평균평점 × 100) ÷ (리뷰수 + 100)</strong>. 평점만 높고 리뷰 적은 곳을 자동 후순위로 밀어내요. 영업 시간·휴무는 현지에서 한 번 더 확인하세요.
        </div>
      )}
    </div>
  );
}

function RestaurantCard({ restaurant, rank, onClick }) {
  const r = restaurant;
  const photoName = r.photos?.[0];
  const photoUrl = photoName ? `/api/places-photo?name=${encodeURIComponent(photoName)}&max=240` : null;
  const priceSign = priceLevelToSign(r.priceLevel);
  const distance = formatDistance(r.distance);
  const walk = walkingMinutes(r.distance);

  return (
    <button className="bv-restaurant-card" onClick={onClick}>
      <div className="rank">#{rank}</div>
      {photoUrl ? (
        <img src={photoUrl} alt="" className="thumb" loading="lazy" />
      ) : (
        <div className="thumb placeholder"><UtensilsCrossed size={20} /></div>
      )}
      <div className="info">
        <div className="head">
          <div className="name bv-display">{r.name}</div>
          {priceSign && <div className="price">{priceSign}</div>}
        </div>
        <div className="rating-row">
          <Star size={11} fill="currentColor" style={{ color: 'var(--gold-deep)' }} />
          <span className="rating">{r.rating?.toFixed(1)}</span>
          <span className="count"><Users size={9} /> {r.userRatingCount?.toLocaleString('ko-KR')}</span>
          <span className="weighted">신뢰도 {r.weightedScore?.toFixed(2)}</span>
        </div>
        <div className="meta-row">
          <span><Footprints size={9} /> {distance} · 약 {walk}분</span>
          {r.openNow === true && <span className="open">영업 중</span>}
          {r.openNow === false && <span className="closed">영업 종료</span>}
        </div>
      </div>
      <ChevronRight size={14} style={{ color: 'var(--ink-soft)', flexShrink: 0 }} />
    </button>
  );
}

function RestaurantDetailView({ restaurant, onBack, onDirections }) {
  const r = restaurant;
  const [photoIdx, setPhotoIdx] = useState(0);
  const photoNames = r.photos || [];
  const heroPhoto = photoNames[photoIdx];
  const heroUrl = heroPhoto ? `/api/places-photo?name=${encodeURIComponent(heroPhoto)}&max=720` : null;
  const priceSign = priceLevelToSign(r.priceLevel);

  // Find today's hours
  const todayIdx = new Date().getDay(); // 0=Sun, 1=Mon...
  // Google Places weekdayDescriptions starts with Monday (or locale-dependent — but key is to display them all)
  const allHours = r.hours || [];

  return (
    <div className="bv-subview">
      <button className="bv-back" onClick={onBack}><ArrowLeft size={14} /> 뒤로</button>

      {heroUrl ? (
        <div className="bv-hero-photo">
          <img src={heroUrl} alt={r.name} />
          <div className="credit">📷 Google Maps</div>
          {photoNames.length > 1 && (
            <div className="bv-photo-dots">
              {photoNames.map((_, i) => (
                <button key={i} className={i === photoIdx ? 'on' : ''} onClick={() => setPhotoIdx(i)} aria-label={`사진 ${i + 1}`} />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div style={{ fontSize: 48, marginTop: 8, textAlign: 'center' }}>🍽️</div>
      )}

      <h2 className="bv-h1">{r.name}</h2>
      <div className="bv-h1-sub">
        {r.primaryTypeLabel && <>{r.primaryTypeLabel} · </>}
        {priceSign && <>{priceSign} · </>}
        신뢰도 점수 <strong>{r.weightedScore?.toFixed(2)}</strong>
      </div>

      <div className="bv-restaurant-stats">
        <div className="stat">
          <div className="val"><Star size={11} fill="currentColor" style={{ color: 'var(--gold-deep)' }} /> {r.rating?.toFixed(1)}</div>
          <div className="lbl">평점</div>
        </div>
        <div className="stat">
          <div className="val"><Users size={11} /> {r.userRatingCount?.toLocaleString('ko-KR')}</div>
          <div className="lbl">리뷰 수</div>
        </div>
        <div className="stat">
          <div className="val"><Footprints size={11} /> {formatDistance(r.distance)}</div>
          <div className="lbl">거리 · 약 {walkingMinutes(r.distance)}분</div>
        </div>
      </div>

      <div className="bv-action-row">
        <button className="bv-row-btn primary" onClick={onDirections}>
          <Navigation size={14} /> 길찾기
        </button>
        {r.googleMapsUri && (
          <a className="bv-row-btn" href={r.googleMapsUri} target="_blank" rel="noopener noreferrer">
            <ExternalLink size={14} /> Google Maps
          </a>
        )}
      </div>

      {r.editorialSummary && (
        <div className="bv-card">
          <div className="label"><BookOpen size={11} /> 소개</div>
          <p>{r.editorialSummary}</p>
        </div>
      )}

      {r.address && (
        <div className="bv-card">
          <div className="label"><MapPin size={11} /> 주소</div>
          <p>{r.address}</p>
        </div>
      )}

      {allHours.length > 0 && (
        <div className="bv-card">
          <div className="label">
            <Clock size={11} /> 영업 시간
            {r.openNow === true && <span className="bv-open-badge"> · 영업 중</span>}
            {r.openNow === false && <span className="bv-closed-badge"> · 영업 종료</span>}
          </div>
          <ul className="bv-hours-list">
            {allHours.map((line, i) => (
              <li key={i}>{line}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="bv-card">
        <div className="label"><Phone size={11} /> 연락처 · 웹사이트</div>
        {r.phone ? (
          <p><a href={`tel:${r.phone}`} className="bv-link">{r.phone}</a></p>
        ) : <p style={{ color: 'var(--ink-soft)', fontStyle: 'italic' }}>전화번호 정보 없음</p>}
        {r.websiteUri && (
          <p style={{ marginTop: 6 }}>
            <a href={r.websiteUri} target="_blank" rel="noopener noreferrer" className="bv-link">
              <ExternalLink size={10} /> 웹사이트
            </a>
          </p>
        )}
      </div>

      <div className="bv-route-disclaimer" style={{ marginTop: 12 }}>
        ⓘ 데이터: <strong>Google Maps Places API</strong>. 신뢰도 점수는 베이지안 가중평균 (평점이 같으면 리뷰 수 많은 곳이 위로). 영업 시간·휴무는 명절·임시 휴무로 다를 수 있어요.
      </div>
    </div>
  );
}

function PhraseCard({ phrase, speak, speakingId, id, label = '현지 표현' }) {
  return (
    <div className="bv-phrase">
      <div className="label">{label}</div>
      <div className="it">"{phrase.it}"</div>
      {phrase.pronunciation && <div className="pron">[{phrase.pronunciation}]</div>}
      {phrase.ko && <div className="ko">→ {phrase.ko}</div>}
      <button className={`bv-speak-btn ${speakingId === id ? 'on' : ''}`} onClick={() => speak(phrase.it, 'it-IT', id)} style={{ marginTop: 12, background: 'rgba(255,255,255,0.15)', color: '#fff8ec' }}>
        {speakingId === id ? <VolumeX size={14} /> : <Volume2 size={14} />} 이탈리아어로 듣기
      </button>
    </div>
  );
}

// ─────────────────────────────────────────────────────────
// Styles
// ─────────────────────────────────────────────────────────
function BelViaggioStyles() {
  return (
    <style>{`
      @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;500;600;700&family=DM+Sans:wght@400;500;600;700&display=swap');

      .bv-root {
        --cream: #F5EBDC; --paper: #EFE3CF; --paper-dark: #E5D5BD;
        --terracotta: #B8553A; --terracotta-deep: #8E3D2A;
        --burgundy: #5C1E2A; --sage: #6B8F65;
        --gold: #C9A961; --gold-deep: #9A7A3A;
        --ink: #2B221E; --ink-soft: #5A4A40;
        --it-green: #009246; --it-red: #CE2B37;
        font-family: 'DM Sans', system-ui, sans-serif; color: var(--ink);
        background: radial-gradient(at 20% 0%, rgba(184,85,58,0.06) 0%, transparent 50%),
                    radial-gradient(at 80% 100%, rgba(107,143,101,0.05) 0%, transparent 50%), var(--cream);
        min-height: 100vh; width: 100%; max-width: 480px;
        margin: 0 auto; padding-bottom: 40px; position: relative;
      }
      .bv-root::before {
        content: ''; position: absolute; inset: 0;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='2' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.5  0 0 0 0 0.35  0 0 0 0 0.2  0 0 0 0.04 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E");
        opacity: 0.5; pointer-events: none; z-index: 0;
      }
      .bv-display { font-family: 'Cormorant Garamond', serif; letter-spacing: -0.01em; }
      .bv-content { position: relative; z-index: 1; }

      .bv-flag { height: 3px; display: flex; }
      .bv-flag span { flex: 1; }
      .bv-flag span:nth-child(1) { background: var(--it-green); }
      .bv-flag span:nth-child(2) { background: #f4ecdb; }
      .bv-flag span:nth-child(3) { background: var(--it-red); }

      .bv-header { padding: 22px 22px 6px; text-align: center; }
      .bv-eyebrow { font-size: 10px; letter-spacing: 0.32em; text-transform: uppercase; color: var(--gold-deep); margin-bottom: 6px; }
      .bv-title { font-size: 42px; font-weight: 500; color: var(--burgundy); line-height: 1; margin: 0; }
      .bv-tagline { font-size: 12px; color: var(--ink-soft); margin-top: 6px; letter-spacing: 0.04em; }

      .bv-loc-card {
        margin: 16px 18px 14px; padding: 12px 16px;
        background: rgba(255, 252, 245, 0.55); border: 1px solid rgba(184, 85, 58, 0.18);
        border-radius: 14px; display: flex; align-items: center; gap: 10px; backdrop-filter: blur(4px);
      }
      .bv-loc-card .ico { width: 36px; height: 36px; border-radius: 50%; background: var(--terracotta); color: white; display: grid; place-items: center; flex-shrink: 0; }
      .bv-loc-card .txt { flex: 1; min-width: 0; }
      .bv-loc-card .label { font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; color: var(--ink-soft); }
      .bv-loc-card .val { font-family: 'Cormorant Garamond', serif; font-size: 18px; font-weight: 500; color: var(--burgundy); white-space: nowrap; overflow: hidden; text-overflow: ellipsis; }
      .bv-loc-card .demo-btn { font-size: 11px; padding: 5px 10px; border-radius: 999px; background: var(--paper-dark); color: var(--ink); border: 1px solid rgba(0,0,0,0.06); cursor: pointer; white-space: nowrap; }

      .bv-alert {
        margin: 0 18px 14px; padding: 14px 16px;
        background: linear-gradient(135deg, var(--terracotta) 0%, var(--terracotta-deep) 100%);
        border-radius: 14px; color: #fff7ed; position: relative;
        box-shadow: 0 8px 24px -8px rgba(184,85,58,0.5);
        animation: pulse-in 0.5s ease-out;
      }
      @keyframes pulse-in { from { transform: scale(0.96); opacity: 0; } to { transform: scale(1); opacity: 1; } }
      .bv-alert .head { display: flex; align-items: center; gap: 8px; font-size: 10px; letter-spacing: 0.2em; text-transform: uppercase; opacity: 0.85; margin-bottom: 4px; }
      .bv-alert .name { font-family: 'Cormorant Garamond', serif; font-size: 22px; font-weight: 500; }
      .bv-alert .meta { font-size: 12px; opacity: 0.85; margin-top: 2px; }
      .bv-alert .close { position: absolute; top: 10px; right: 10px; background: rgba(255,255,255,0.2); border: 0; width: 24px; height: 24px; border-radius: 50%; color: #fff; cursor: pointer; display: grid; place-items: center; }
      .bv-alert .open { margin-top: 10px; background: rgba(255,255,255,0.18); color: #fff; border: 1px solid rgba(255,255,255,0.25); padding: 8px 14px; border-radius: 999px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }

      .bv-actions-4 { padding: 0 18px; display: grid; gap: 10px; grid-template-columns: 1fr 1fr; margin: 4px 0 12px; }
      .bv-action4 {
        background: linear-gradient(160deg, #fff8ec 0%, var(--paper) 100%);
        border: 1px solid rgba(0,0,0,0.05); border-radius: 16px; padding: 14px 12px 12px;
        display: flex; flex-direction: column; align-items: flex-start; gap: 4px;
        cursor: pointer; transition: transform 0.2s ease, box-shadow 0.2s ease;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-action4:active { transform: scale(0.98); }
      .bv-action4 .ico { width: 36px; height: 36px; border-radius: 10px; display: grid; place-items: center; color: white; margin-bottom: 4px; }
      .bv-action4.cam .ico { background: var(--terracotta); }
      .bv-action4.menu .ico { background: var(--burgundy); }
      .bv-action4.receipt .ico { background: var(--gold-deep); }
      .bv-action4.trans .ico { background: var(--sage); }
      .bv-action4 .ttl { font-size: 17px; font-weight: 500; color: var(--burgundy); line-height: 1.05; }
      .bv-action4 .sub { font-size: 10px; color: var(--ink-soft); }

      .bv-pills { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin: 0 18px 14px; }
      .bv-pill { padding: 11px 14px; border-radius: 11px; display: flex; align-items: center; gap: 8px; cursor: pointer; font-size: 12px; font-weight: 500; font-family: 'DM Sans', sans-serif; border: 1px solid rgba(0,0,0,0.06); }
      .bv-pill > span:nth-child(2) { flex: 1; text-align: left; }
      .bv-pill .cnt { font-size: 10px; padding: 2px 8px; border-radius: 999px; min-width: 20px; text-align: center; font-weight: 600; }
      .bv-pill.fav { background: rgba(184,85,58,0.07); color: var(--terracotta-deep); border-color: rgba(184,85,58,0.15); }
      .bv-pill.fav .cnt { background: var(--terracotta); color: #fff8ec; }
      .bv-pill.coll { background: rgba(92,30,42,0.06); color: var(--burgundy); border-color: rgba(92,30,42,0.15); }
      .bv-pill.coll .cnt { background: var(--burgundy); color: #fff8ec; }

      .bv-fx-row { margin: 0 18px 12px; padding: 9px 14px; background: rgba(255, 252, 245, 0.5); border: 1px solid rgba(0,0,0,0.05); border-radius: 10px; display: flex; align-items: center; gap: 8px; font-size: 11px; }
      .bv-fx-row .lbl { color: var(--ink-soft); letter-spacing: 0.04em; }
      .bv-fx-row .val { color: var(--ink); flex: 1; display: flex; align-items: center; gap: 4px; }
      .bv-fx-row .val strong { font-weight: 600; color: var(--burgundy); }
      .bv-fx-row .val .date { color: var(--ink-soft); font-size: 10px; }
      .bv-fx-row .val.muted { color: var(--ink-soft); }
      .bv-fx-row .refresh { background: none; border: 0; cursor: pointer; color: var(--ink-soft); padding: 4px; display: grid; place-items: center; border-radius: 50%; }
      .bv-fx-row .spin { animation: spin 1s linear infinite; }

      .bv-pwa-panel { margin: 0 18px 14px; background: rgba(255, 252, 245, 0.65); border: 1px solid rgba(0,0,0,0.06); border-radius: 12px; padding: 10px; display: flex; flex-direction: column; gap: 8px; }
      .bv-pwa-panel .row { display: flex; gap: 10px; align-items: center; padding: 6px 8px; }
      .bv-pwa-panel .txt { flex: 1; }
      .bv-pwa-panel .tit { font-size: 12px; font-weight: 600; color: var(--ink); }
      .bv-pwa-panel .sub { font-size: 11px; color: var(--ink-soft); line-height: 1.4; margin-top: 1px; }
      .bv-pwa-panel .sub code { font-family: monospace; background: rgba(0,0,0,0.06); padding: 1px 4px; border-radius: 3px; font-size: 10px; }
      .bv-pwa-panel .grant { background: var(--terracotta); color: #fff8ec; border: 0; padding: 6px 12px; border-radius: 999px; font-size: 11px; cursor: pointer; font-family: 'DM Sans', sans-serif; font-weight: 500; }

      .bv-section-head { padding: 0 22px; display: flex; align-items: center; gap: 12px; margin: 6px 0 12px; }
      .bv-section-head h2 { font-size: 22px; font-weight: 500; margin: 0; color: var(--burgundy); }
      .bv-section-head .rule { flex: 1; height: 1px; background: linear-gradient(90deg, var(--gold) 0%, transparent 100%); opacity: 0.5; }

      .bv-nearby { padding: 0 18px; display: flex; flex-direction: column; gap: 8px; }
      .bv-nearby-item { background: rgba(255, 252, 245, 0.55); border: 1px solid rgba(0,0,0,0.05); border-radius: 12px; padding: 12px 14px; display: flex; align-items: center; gap: 10px; }
      .bv-nearby-item .emoji { width: 38px; height: 38px; border-radius: 10px; background: var(--paper-dark); display: grid; place-items: center; font-size: 20px; flex-shrink: 0; cursor: pointer; }
      .bv-nearby-item .body { flex: 1; min-width: 0; cursor: pointer; }
      .bv-nearby-item .name { font-size: 17px; font-weight: 500; color: var(--burgundy); line-height: 1.1; }
      .bv-nearby-item .sub { font-size: 11px; color: var(--ink-soft); margin-top: 2px; }
      .bv-nearby-item .dist { font-size: 12px; font-weight: 600; color: var(--terracotta); padding: 4px 10px; border-radius: 999px; background: rgba(184,85,58,0.08); }
      .bv-nearby-item .heart { background: none; border: 0; cursor: pointer; padding: 5px; color: rgba(184, 85, 58, 0.35); display: grid; place-items: center; border-radius: 50%; }
      .bv-nearby-item .heart.on { color: var(--terracotta); }

      .bv-empty { margin: 0 18px; padding: 24px 16px; text-align: center; background: rgba(255, 252, 245, 0.5); border: 1px dashed rgba(184,85,58,0.25); border-radius: 14px; color: var(--ink-soft); font-size: 13px; line-height: 1.55; }

      .bv-subview { padding: 14px 18px 22px; animation: slide-up 0.25s ease-out; }
      @keyframes slide-up { from { transform: translateY(8px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
      .bv-back { background: none; border: 0; color: var(--ink-soft); font-size: 13px; display: flex; align-items: center; gap: 4px; cursor: pointer; padding: 4px 0; font-family: 'DM Sans', sans-serif; }

      .bv-heart-btn { background: rgba(184,85,58,0.08); color: var(--terracotta-deep); border: 1px solid rgba(184,85,58,0.2); font-size: 11px; padding: 5px 11px; border-radius: 999px; cursor: pointer; display: inline-flex; align-items: center; gap: 4px; font-family: 'DM Sans', sans-serif; }
      .bv-heart-btn.on { background: var(--terracotta); color: #fff8ec; border-color: var(--terracotta); }

      .bv-h1 { font-family: 'Cormorant Garamond', serif; font-size: 32px; font-weight: 500; line-height: 1.05; margin: 14px 0 4px; color: var(--burgundy); }
      .bv-h1-sub { font-family: 'Cormorant Garamond', serif; font-style: italic; color: var(--ink-soft); font-size: 17px; }

      .bv-tts-big { margin-top: 16px; width: 100%; background: linear-gradient(135deg, var(--burgundy) 0%, #3A1018 100%); color: #fff8ec; border: 0; padding: 14px 18px; border-radius: 14px; font-family: 'DM Sans', sans-serif; display: flex; align-items: center; gap: 14px; cursor: pointer; box-shadow: 0 8px 20px -8px rgba(92,30,42,0.45); }
      .bv-tts-big.on { background: linear-gradient(135deg, var(--terracotta) 0%, var(--terracotta-deep) 100%); }
      .bv-tts-big .ico { width: 36px; height: 36px; border-radius: 50%; background: rgba(255,255,255,0.15); display: grid; place-items: center; flex-shrink: 0; }
      .bv-tts-big .lbl { font-size: 14px; font-weight: 600; letter-spacing: 0.01em; }
      .bv-tts-big .sub { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 12px; opacity: 0.65; margin-top: 1px; }

      .bv-action-row { display: flex; gap: 8px; margin-top: 10px; }
      .bv-row-btn { flex: 1; padding: 10px 12px; background: rgba(255, 252, 245, 0.65); border: 1px solid rgba(0,0,0,0.08); border-radius: 11px; font-family: 'DM Sans', sans-serif; font-size: 12px; color: var(--ink); cursor: pointer; display: inline-flex; align-items: center; justify-content: center; gap: 6px; }
      .bv-row-btn:disabled { opacity: 0.55; cursor: default; }

      .bv-card { background: rgba(255, 252, 245, 0.65); border: 1px solid rgba(0,0,0,0.05); border-radius: 14px; padding: 16px; margin-top: 14px; }
      .bv-card .label { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold-deep); margin-bottom: 8px; display: flex; align-items: center; gap: 6px; }
      .bv-card p { margin: 0; font-size: 14px; line-height: 1.65; color: var(--ink); }
      .bv-card ul { margin: 0; padding-left: 0; list-style: none; }
      .bv-card ul li { font-size: 14px; line-height: 1.6; color: var(--ink); padding: 8px 0 8px 20px; border-bottom: 1px dashed rgba(0,0,0,0.06); position: relative; }
      .bv-card ul li:last-child { border-bottom: 0; }
      .bv-card ul li::before { content: '◆'; position: absolute; left: 0; top: 9px; color: var(--terracotta); font-size: 10px; }

      .bv-img { width: 100%; aspect-ratio: 4 / 3; object-fit: cover; border-radius: 12px; margin-top: 14px; border: 1px solid rgba(0,0,0,0.06); }

      /* Hero photo (Wikipedia) */
      .bv-hero-photo { position: relative; margin-top: 14px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06); aspect-ratio: 4/3; }
      .bv-hero-photo img { width: 100%; height: 100%; object-fit: cover; }
      .bv-hero-photo .credit { position: absolute; bottom: 6px; right: 8px; font-size: 9px; color: rgba(255,255,255,0.95); background: rgba(0,0,0,0.4); padding: 2px 7px; border-radius: 999px; backdrop-filter: blur(4px); }
      .bv-hero-skeleton { margin-top: 14px; aspect-ratio: 4/3; background: var(--paper-dark); border-radius: 12px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 10px; color: var(--ink-soft); font-size: 11px; }
      .bv-hero-skeleton .spin { animation: spin 1s linear infinite; }

      /* Multi-image collage */
      .bv-multi-img { margin-top: 14px; border-radius: 12px; overflow: hidden; border: 1px solid rgba(0,0,0,0.06); display: grid; gap: 2px; aspect-ratio: 4 / 3; }
      .bv-multi-img.count-1 { grid-template-columns: 1fr; }
      .bv-multi-img.count-2 { grid-template-columns: 1fr 1fr; }
      .bv-multi-img.count-3 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
      .bv-multi-img.count-3 img:first-child { grid-column: 1 / -1; }
      .bv-multi-img.count-4 { grid-template-columns: 1fr 1fr; grid-template-rows: 1fr 1fr; }
      .bv-multi-img img { width: 100%; height: 100%; object-fit: cover; }
      .bv-multi-note { font-size: 10px; color: var(--gold-deep); margin-top: 6px; letter-spacing: 0.08em; display: flex; align-items: center; gap: 4px; }

      .bv-speak-btn { margin-top: 10px; background: var(--burgundy); color: #fff8ec; border: 0; padding: 9px 14px; border-radius: 999px; font-size: 12px; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; }
      .bv-speak-btn.on { background: var(--terracotta); }

      .bv-phrase { background: linear-gradient(135deg, #5C1E2A 0%, #3A1018 100%); color: #fff8ec; padding: 16px; border-radius: 14px; margin-top: 14px; }
      .bv-phrase .label { color: var(--gold); font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; }
      .bv-phrase .it { font-family: 'Cormorant Garamond', serif; font-style: italic; font-size: 22px; line-height: 1.25; margin: 4px 0 6px; }
      .bv-phrase .pron { font-size: 12px; opacity: 0.7; letter-spacing: 0.05em; }
      .bv-phrase .ko { font-size: 13px; opacity: 0.9; margin-top: 6px; }

      .bv-dir-toggle { display: flex; align-items: center; gap: 8px; margin-top: 14px; background: var(--paper); padding: 4px; border-radius: 999px; width: fit-content; }
      .bv-dir-toggle button { background: none; border: 0; cursor: pointer; padding: 6px 14px; border-radius: 999px; font-size: 12px; color: var(--ink-soft); font-family: 'DM Sans', sans-serif; }
      .bv-dir-toggle button.active { background: var(--burgundy); color: #fff8ec; }

      .bv-voice-btn {
        margin-top: 12px; width: 100%;
        background: rgba(107,143,101,0.12); color: #4a6b46;
        border: 1px solid rgba(107,143,101,0.3); border-radius: 12px;
        padding: 11px 14px; font-size: 13px; cursor: pointer;
        font-family: 'DM Sans', sans-serif;
        display: inline-flex; align-items: center; justify-content: center; gap: 8px;
      }
      .bv-voice-btn.listening { background: var(--terracotta); color: #fff8ec; border-color: var(--terracotta); animation: pulse-bg 1.5s ease-in-out infinite; }
      @keyframes pulse-bg { 0%,100% { box-shadow: 0 0 0 0 rgba(184,85,58,0.35); } 50% { box-shadow: 0 0 0 8px rgba(184,85,58,0); } }
      .bv-voice-btn .pulse-dot { width: 6px; height: 6px; border-radius: 50%; background: #fff8ec; animation: pulse-dot 1s ease-in-out infinite; }
      @keyframes pulse-dot { 0%,100% { opacity: 0.4; transform: scale(0.8); } 50% { opacity: 1; transform: scale(1.2); } }

      .bv-voice-unsupported { margin-top: 10px; font-size: 10px; color: var(--ink-soft); display: flex; align-items: center; gap: 4px; font-style: italic; }
      .bv-voice-err { margin-top: 6px; font-size: 11px; color: var(--terracotta-deep); display: flex; align-items: center; gap: 4px; }

      .bv-textarea { width: 100%; min-height: 110px; padding: 12px 14px; border: 1px solid rgba(0,0,0,0.1); border-radius: 12px; background: #fff8ec; font-family: 'DM Sans', sans-serif; font-size: 14px; line-height: 1.5; color: var(--ink); resize: vertical; margin-top: 12px; box-sizing: border-box; }

      .bv-primary-btn { margin-top: 12px; background: var(--terracotta); color: #fff8ec; border: 0; padding: 12px 18px; border-radius: 12px; font-size: 14px; font-weight: 500; cursor: pointer; width: 100%; display: inline-flex; align-items: center; justify-content: center; gap: 8px; font-family: 'DM Sans', sans-serif; }
      .bv-primary-btn:disabled { opacity: 0.5; cursor: not-allowed; }

      .bv-loading { padding: 32px 14px; text-align: center; color: var(--ink-soft); font-size: 13px; }
      .bv-loading .spin { animation: spin 1s linear infinite; }
      @keyframes spin { to { transform: rotate(360deg); } }
      .bv-error { margin-top: 14px; padding: 12px 14px; background: rgba(184,85,58,0.08); border: 1px solid rgba(184,85,58,0.2); border-radius: 12px; color: var(--terracotta-deep); font-size: 13px; display: flex; align-items: flex-start; gap: 8px; }

      .bv-demo-panel { margin: 0 18px 18px; background: rgba(255, 252, 245, 0.65); border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 12px; }
      .bv-demo-panel .head { font-size: 10px; letter-spacing: 0.22em; text-transform: uppercase; color: var(--gold-deep); margin-bottom: 8px; }
      .bv-demo-grid { display: grid; gap: 6px; }
      .bv-demo-grid button { text-align: left; background: var(--paper); border: 1px solid rgba(0,0,0,0.04); padding: 9px 12px; border-radius: 10px; font-size: 12px; color: var(--ink); cursor: pointer; font-family: 'DM Sans', sans-serif; }
      .bv-demo-grid button.active { background: var(--burgundy); color: #fff8ec; border-color: var(--burgundy); }

      .bv-dish { background: rgba(255, 252, 245, 0.7); border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 14px; margin-top: 10px; }
      .bv-dish .head { display: flex; align-items: center; gap: 8px; margin-bottom: 6px; }
      .bv-dish .cat { font-size: 10px; padding: 3px 9px; border-radius: 999px; letter-spacing: 0.06em; text-transform: uppercase; font-weight: 600; }
      .bv-dish .price { margin-left: auto; font-size: 13px; font-weight: 600; color: var(--burgundy); font-family: 'Cormorant Garamond', serif; }
      .bv-dish .dish-name { font-size: 22px; line-height: 1.1; color: var(--burgundy); font-weight: 500; }
      .bv-dish .dish-local { font-size: 12px; color: var(--ink-soft); margin-top: 2px; display: flex; align-items: center; gap: 6px; flex-wrap: wrap; }
      .bv-dish .dish-local .pron { opacity: 0.7; letter-spacing: 0.03em; }
      .bv-dish .mini-tts { background: var(--paper-dark); border: 0; cursor: pointer; width: 22px; height: 22px; border-radius: 50%; display: grid; place-items: center; color: var(--ink); }
      .bv-dish .dish-desc { font-size: 13px; line-height: 1.55; color: var(--ink); margin-top: 8px; }
      .bv-dish .chips { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 10px; }
      .bv-dish .chip { font-size: 10px; padding: 3px 8px; border-radius: 999px; background: var(--paper-dark); color: var(--ink-soft); }
      .bv-dish .badges { display: flex; flex-wrap: wrap; gap: 4px; margin-top: 8px; align-items: center; }
      .bv-dish .badge { font-size: 10px; padding: 3px 8px; border-radius: 999px; font-weight: 500; display: inline-flex; align-items: center; }
      .bv-dish .badge.rec { background: #C9A961; color: #2B221E; }
      .bv-dish .badge.veg { background: rgba(107,143,101,0.18); color: #4a6b46; }
      .bv-dish .badge.spi { background: rgba(184,85,58,0.18); color: var(--terracotta-deep); }
      .bv-dish .badge.alg { background: rgba(206,43,55,0.12); color: #a51b26; border: 1px solid rgba(206,43,55,0.2); }
      .bv-dish .dish-note { font-size: 11px; font-style: italic; color: var(--gold-deep); margin-top: 8px; padding-top: 8px; border-top: 1px dashed rgba(0,0,0,0.08); }

      .bv-receipt-tbl { margin-top: 14px; background: rgba(255, 252, 245, 0.7); border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; overflow: hidden; }
      .bv-receipt-tbl .head { display: grid; grid-template-columns: 1fr 36px 60px 78px; gap: 6px; padding: 9px 12px; background: rgba(92,30,42,0.06); font-size: 10px; letter-spacing: 0.12em; text-transform: uppercase; color: var(--ink-soft); font-weight: 600; }
      .bv-receipt-tbl .row { display: grid; grid-template-columns: 1fr 36px 60px 78px; gap: 6px; padding: 10px 12px; border-top: 1px dashed rgba(0,0,0,0.06); font-size: 12px; align-items: center; }
      .bv-receipt-tbl .row .c-name .ko { font-weight: 500; color: var(--ink); line-height: 1.2; }
      .bv-receipt-tbl .row .c-name .local { font-size: 10px; color: var(--ink-soft); font-style: italic; margin-top: 2px; }
      .bv-receipt-tbl .row .c-qty { text-align: center; color: var(--ink-soft); }
      .bv-receipt-tbl .row .c-eur { text-align: right; font-family: 'Cormorant Garamond', serif; font-weight: 600; color: var(--burgundy); font-size: 14px; }
      .bv-receipt-tbl .row .c-krw { text-align: right; font-size: 11px; color: var(--ink-soft); }

      .bv-receipt-sum { margin-top: 12px; background: rgba(255, 252, 245, 0.7); border: 1px solid rgba(0,0,0,0.06); border-radius: 14px; padding: 14px; }
      .bv-receipt-sum .sum-row { display: flex; justify-content: space-between; align-items: baseline; padding: 6px 0; font-size: 13px; }
      .bv-receipt-sum .sum-row em { font-style: normal; color: var(--ink-soft); font-size: 11px; font-weight: 400; }
      .bv-receipt-sum .sum-row.total { border-top: 1px solid rgba(0,0,0,0.1); margin-top: 4px; padding-top: 10px; font-size: 14px; }
      .bv-receipt-sum .sum-row.total strong { font-family: 'Cormorant Garamond', serif; font-size: 22px; color: var(--burgundy); }
      .bv-receipt-sum .sum-check { margin-top: 10px; padding: 8px 12px; border-radius: 10px; font-size: 11px; line-height: 1.5; display: flex; gap: 8px; align-items: flex-start; }
      .bv-receipt-sum .sum-check.ok { background: rgba(107,143,101,0.12); color: #4a6b46; align-items: center; }
      .bv-receipt-sum .sum-check.warn { background: rgba(201,169,97,0.12); color: var(--gold-deep); }
      .bv-fx-note { margin-top: 8px; font-size: 11px; color: var(--ink-soft); font-style: italic; line-height: 1.5; padding: 0 4px; }

      .bv-coll-grid { display: grid; gap: 8px; grid-template-columns: 1fr 1fr; }
      .bv-coll-card { background: rgba(255, 252, 245, 0.7); border: 1px solid rgba(0,0,0,0.06); border-radius: 12px; overflow: hidden; position: relative; }
      .bv-coll-card .open { width: 100%; border: 0; background: none; padding: 0; text-align: left; cursor: pointer; display: block; }
      .bv-coll-card .thumb { width: 100%; aspect-ratio: 4 / 3; overflow: hidden; background: var(--paper-dark); }
      .bv-coll-card .thumb img { width: 100%; height: 100%; object-fit: cover; }
      .bv-coll-card .thumb .emoji { width: 100%; height: 100%; display: grid; place-items: center; font-size: 44px; }
      .bv-coll-card .meta { padding: 8px 10px 10px; }
      .bv-coll-card .ttl { font-size: 14px; color: var(--burgundy); font-weight: 500; line-height: 1.15; }
      .bv-coll-card .sub { font-size: 10px; color: var(--ink-soft); margin-top: 3px; }
      .bv-coll-card .rm { position: absolute; top: 6px; right: 6px; background: rgba(0,0,0,0.5); border: 0; width: 22px; height: 22px; border-radius: 50%; color: white; cursor: pointer; display: grid; place-items: center; }

      /* Favorites item (with photo) */
      .bv-fav-item {
        background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.05);
        border-radius: 12px; overflow: hidden;
        display: flex; gap: 0;
      }
      .bv-fav-item .thumb {
        width: 80px; height: 80px; flex-shrink: 0;
        background: var(--paper-dark);
        cursor: pointer;
        overflow: hidden;
      }
      .bv-fav-item .thumb img { width: 100%; height: 100%; object-fit: cover; }
      .bv-fav-item .thumb .emoji-thumb { width: 100%; height: 100%; display: grid; place-items: center; font-size: 32px; }
      .bv-fav-item .body { flex: 1; min-width: 0; padding: 10px 12px; cursor: pointer; display: flex; flex-direction: column; justify-content: center; }
      .bv-fav-item .name { font-size: 16px; font-weight: 500; color: var(--burgundy); line-height: 1.15; }
      .bv-fav-item .sub { font-size: 11px; color: var(--ink-soft); font-style: italic; margin-top: 1px; }
      .bv-fav-item .meta { font-size: 11px; color: var(--ink-soft); margin-top: 4px; display: flex; gap: 4px; }
      .bv-fav-item .meta .dist { color: var(--terracotta); font-weight: 500; }
      .bv-fav-item .actions { display: flex; flex-direction: column; gap: 4px; padding: 8px; justify-content: center; }
      .bv-fav-item .act-btn { background: none; border: 0; cursor: pointer; width: 28px; height: 28px; border-radius: 50%; display: grid; place-items: center; color: var(--ink-soft); }
      .bv-fav-item .act-btn.rm { background: rgba(184,85,58,0.12); color: var(--terracotta); }
      .bv-fav-item .act-btn.dir { background: rgba(107,143,101,0.12); color: var(--sage); }

      /* Route planning */
      .bv-route-actions {
        margin: 14px 0; padding: 14px;
        background: linear-gradient(135deg, rgba(184,85,58,0.06) 0%, rgba(201,169,97,0.05) 100%);
        border: 1px solid rgba(184,85,58,0.15);
        border-radius: 14px;
      }
      .bv-route-actions .head {
        font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
        color: var(--terracotta-deep); font-weight: 600;
        display: flex; align-items: center; gap: 6px;
      }
      .bv-route-actions .sub {
        font-size: 11px; color: var(--ink-soft); line-height: 1.5;
        margin-top: 6px; font-style: italic;
      }
      .bv-route-actions .btns {
        display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
      }
      .bv-route-actions .btns button {
        background: rgba(255, 252, 245, 0.8);
        border: 1px solid rgba(0,0,0,0.06);
        padding: 7px 12px; border-radius: 999px;
        font-size: 11px; cursor: pointer; color: var(--ink);
        font-family: 'DM Sans', sans-serif;
      }
      .bv-route-actions .btns button.primary {
        background: var(--terracotta); color: #fff8ec; border-color: var(--terracotta);
        display: inline-flex; align-items: center; gap: 4px; font-weight: 500;
      }

      /* Route view */
      .bv-route-summary {
        display: grid; grid-template-columns: 1fr 1fr; gap: 8px;
        margin-top: 14px;
      }
      .bv-route-summary .stat {
        background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 12px; padding: 12px;
        display: flex; align-items: center; gap: 10px;
      }
      .bv-route-summary .stat > svg { color: var(--terracotta); }
      .bv-route-summary .stat .v {
        font-family: 'Cormorant Garamond', serif;
        font-size: 22px; font-weight: 500; color: var(--burgundy);
        line-height: 1;
      }
      .bv-route-summary .stat .l { font-size: 10px; color: var(--ink-soft); letter-spacing: 0.1em; text-transform: uppercase; margin-top: 4px; }

      .bv-route-disclaimer {
        margin-top: 10px; padding: 10px 12px;
        background: rgba(201,169,97,0.08);
        border-left: 3px solid var(--gold);
        border-radius: 6px;
        font-size: 11px; color: var(--ink-soft); line-height: 1.55;
      }
      .bv-route-disclaimer strong { color: var(--gold-deep); }

      .bv-route-stops {
        margin-top: 12px; display: flex; flex-direction: column; gap: 4px;
      }
      .bv-route-start, .bv-route-stop {
        background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 12px;
        padding: 10px 12px;
        display: flex; align-items: center; gap: 10px;
        cursor: pointer;
      }
      .bv-route-start { background: rgba(107,143,101,0.1); border-color: rgba(107,143,101,0.25); cursor: default; }
      .bv-route-stop:active { transform: scale(0.99); }
      .bv-route-start .num, .bv-route-stop .num {
        width: 28px; height: 28px; border-radius: 50%;
        background: var(--burgundy); color: #fff8ec;
        display: grid; place-items: center;
        font-size: 13px; font-weight: 600;
        font-family: 'Cormorant Garamond', serif;
        flex-shrink: 0;
      }
      .bv-route-start .num { background: var(--sage); }
      .bv-route-stop .emoji {
        width: 32px; height: 32px; border-radius: 8px;
        background: var(--paper-dark);
        display: grid; place-items: center;
        font-size: 18px; flex-shrink: 0;
      }
      .bv-route-start .info, .bv-route-stop .info { flex: 1; min-width: 0; }
      .bv-route-start .label, .bv-route-stop .label {
        font-size: 9px; letter-spacing: 0.2em; text-transform: uppercase;
        color: var(--ink-soft);
      }
      .bv-route-start .title, .bv-route-stop .title {
        font-size: 15px; font-weight: 500; color: var(--burgundy); line-height: 1.2;
      }
      .bv-route-stop .local {
        font-size: 11px; color: var(--ink-soft); font-style: italic;
        margin-top: 2px;
      }
      .bv-route-link {
        align-self: center; padding: 4px 12px;
        font-size: 10px; color: var(--ink-soft);
        background: rgba(0,0,0,0.04); border-radius: 999px;
        display: inline-flex; align-items: center; gap: 5px;
        margin: 2px 0;
      }

      /* v0.5: Save toggle states */
      .bv-row-btn.saved { background: rgba(107,143,101,0.15); color: #4a6b46; border-color: rgba(107,143,101,0.3); }
      .bv-row-btn.saved:hover { background: rgba(107,143,101,0.25); }
      .bv-row-btn.saved-flash { background: var(--sage); color: #fff8ec; border-color: var(--sage); animation: flash-saved 1.8s ease-out; }
      @keyframes flash-saved {
        0% { transform: scale(1); }
        15% { transform: scale(1.05); }
        100% { transform: scale(1); }
      }

      /* v0.5: Expandable viewing points */
      .bv-vp-list { margin: 0; padding: 0; list-style: none; }
      .bv-vp-list li { padding: 0; border-bottom: 1px dashed rgba(0,0,0,0.06); position: relative; }
      .bv-vp-list li:last-child { border-bottom: 0; }
      .bv-vp-list li::before { display: none; }
      .bv-vp-list .vp-head {
        width: 100%; background: none; border: 0; cursor: pointer;
        text-align: left; padding: 10px 0 10px 20px;
        font-size: 14px; line-height: 1.5; color: var(--ink);
        font-family: 'DM Sans', sans-serif;
        display: flex; align-items: center; gap: 10px;
        position: relative;
      }
      .bv-vp-list .vp-head::before {
        content: '◆'; position: absolute; left: 0; top: 11px;
        color: var(--terracotta); font-size: 10px;
      }
      .bv-vp-list .vp-head:disabled { cursor: default; }
      .bv-vp-list .vp-title { flex: 1; }
      .bv-vp-list .vp-chev { color: var(--ink-soft); flex-shrink: 0; }
      .bv-vp-list li.open .vp-chev { color: var(--terracotta); }
      .bv-vp-list .vp-detail {
        padding: 4px 0 14px 20px;
        font-size: 13px; line-height: 1.6;
        color: var(--ink-soft);
        animation: expand-down 0.2s ease-out;
      }
      @keyframes expand-down {
        from { opacity: 0; transform: translateY(-4px); }
        to { opacity: 1; transform: translateY(0); }
      }

      /* v0.5: Cache indicator row */
      .bv-cache-row {
        margin-top: 8px; padding: 6px 12px;
        background: rgba(107,143,101,0.08);
        border-radius: 8px;
        font-size: 10px; color: var(--ink-soft);
        display: flex; align-items: center; gap: 6px;
      }
      .bv-cache-row span { flex: 1; }
      .bv-cache-row button {
        background: rgba(184,85,58,0.1); border: 0;
        color: var(--terracotta-deep); padding: 3px 8px;
        border-radius: 999px; font-size: 10px; cursor: pointer;
        display: inline-flex; align-items: center; gap: 3px;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-cache-row button:hover { background: rgba(184,85,58,0.18); }

      /* v0.5: AI Itinerary CTA in Favorites */
      .bv-ai-itinerary-cta {
        margin: 14px 0; padding: 14px;
        background: linear-gradient(135deg, rgba(92,30,42,0.08) 0%, rgba(184,85,58,0.08) 100%);
        border: 1px solid rgba(184,85,58,0.2);
        border-radius: 14px;
      }
      .bv-ai-itinerary-cta .head {
        font-size: 11px; letter-spacing: 0.15em; text-transform: uppercase;
        color: var(--burgundy); font-weight: 600;
        display: flex; align-items: center; gap: 6px;
      }
      .bv-ai-itinerary-cta .sub {
        font-size: 11px; color: var(--ink-soft); line-height: 1.5;
        margin-top: 6px; font-style: italic;
      }
      .bv-ai-itinerary-cta .btns {
        display: flex; flex-wrap: wrap; gap: 6px; margin-top: 10px;
      }
      .bv-ai-itinerary-cta .btns button {
        background: rgba(255, 252, 245, 0.8); border: 1px solid rgba(0,0,0,0.06);
        padding: 7px 12px; border-radius: 999px;
        font-size: 11px; cursor: pointer; color: var(--ink);
        font-family: 'DM Sans', sans-serif;
      }
      .bv-ai-itinerary-cta .btns button.primary {
        background: var(--burgundy); color: #fff8ec; border-color: var(--burgundy);
        display: inline-flex; align-items: center; gap: 4px; font-weight: 500;
      }

      /* v0.5: AI Itinerary view */
      .bv-ai-hero {
        margin-top: 14px; padding: 16px;
        background: linear-gradient(135deg, var(--burgundy) 0%, #3A1018 100%);
        color: #fff8ec; border-radius: 14px;
        box-shadow: 0 8px 20px -8px rgba(92,30,42,0.45);
      }
      .bv-ai-hero .title {
        font-size: 26px; font-weight: 500; line-height: 1.15;
      }
      .bv-ai-hero .meta {
        font-size: 11px; color: var(--gold); margin-top: 4px;
        display: inline-flex; align-items: center; gap: 4px;
        letter-spacing: 0.1em; text-transform: uppercase;
      }
      .bv-ai-hero .summary {
        font-size: 13px; line-height: 1.6; margin-top: 10px;
        opacity: 0.92;
      }

      .bv-day-card {
        margin-top: 10px; background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.06); border-radius: 14px;
        overflow: hidden;
      }
      .bv-day-head {
        width: 100%; background: none; border: 0; padding: 12px 14px;
        display: flex; align-items: center; gap: 12px;
        cursor: pointer; text-align: left;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-day-head:hover { background: rgba(0,0,0,0.02); }
      .bv-day-head .day-num {
        width: 40px; height: 40px; border-radius: 10px;
        background: var(--burgundy); color: #fff8ec;
        display: grid; place-items: center;
        font-family: 'Cormorant Garamond', serif; font-size: 13px; font-weight: 600;
        flex-shrink: 0;
      }
      .bv-day-head .day-info { flex: 1; }
      .bv-day-head .day-theme {
        font-family: 'Cormorant Garamond', serif;
        font-size: 17px; font-weight: 500; color: var(--burgundy);
        line-height: 1.1;
      }
      .bv-day-head .day-city {
        font-size: 11px; color: var(--ink-soft); margin-top: 2px;
      }
      .bv-day-body {
        padding: 0 14px 14px; border-top: 1px dashed rgba(0,0,0,0.06);
      }
      .bv-ai-stop, .bv-ai-meal {
        display: flex; gap: 12px; padding: 10px 0;
        border-bottom: 1px dashed rgba(0,0,0,0.05);
        cursor: pointer;
      }
      .bv-ai-stop:last-child, .bv-ai-meal:last-child { border-bottom: 0; }
      .bv-ai-meal { cursor: default; }
      .bv-ai-stop .time, .bv-ai-meal .time {
        font-family: 'Cormorant Garamond', serif;
        font-size: 16px; font-weight: 600; color: var(--terracotta);
        flex-shrink: 0; width: 52px; padding-top: 2px;
      }
      .bv-ai-stop .content, .bv-ai-meal .content { flex: 1; min-width: 0; }
      .bv-ai-stop .name {
        font-size: 16px; font-weight: 500; color: var(--burgundy);
        line-height: 1.2;
      }
      .bv-ai-stop .dur {
        font-size: 10px; color: var(--ink-soft); margin-top: 3px;
        display: inline-flex; align-items: center; gap: 3px;
      }
      .bv-ai-stop .reason, .bv-ai-stop .tip {
        font-size: 11px; line-height: 1.5; margin-top: 5px;
        color: var(--ink); display: flex; align-items: flex-start; gap: 5px;
      }
      .bv-ai-stop .reason svg, .bv-ai-stop .tip svg {
        flex-shrink: 0; margin-top: 2px; color: var(--gold-deep);
      }
      .bv-ai-meal {
        background: rgba(201,169,97,0.06); border-radius: 8px;
        padding: 8px 10px; margin: 4px 0;
        border-bottom: 0;
      }
      .bv-ai-meal .name {
        font-size: 12px; font-weight: 600; color: var(--gold-deep);
        display: inline-flex; align-items: center; gap: 4px;
      }
      .bv-ai-meal .sug { font-size: 12px; color: var(--ink); margin-top: 3px; line-height: 1.5; }
      .bv-day-walk {
        margin-top: 10px; padding: 6px 10px;
        background: rgba(107,143,101,0.08);
        border-radius: 8px; font-size: 11px; color: var(--ink-soft);
        display: flex; align-items: center; gap: 6px;
        font-style: italic;
      }

      /* v0.7: Per-day restaurant picks (Bayesian-ranked) */
      .bv-day-restaurants {
        margin-top: 12px; padding: 10px;
        background: rgba(184,85,58,0.05);
        border: 1px dashed rgba(184,85,58,0.25);
        border-radius: 10px;
      }
      .bv-day-section-title {
        font-size: 11px; color: var(--terracotta-deep);
        font-weight: 600; letter-spacing: 0.02em;
        display: flex; align-items: center; gap: 5px;
        margin-bottom: 8px;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-day-section-title .hint {
        margin-left: auto; font-size: 9px;
        color: var(--ink-soft); font-weight: 400;
        font-style: italic;
      }
      .bv-day-restaurant {
        width: 100%; display: flex; align-items: center; gap: 8px;
        padding: 8px; margin-bottom: 4px;
        background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 8px; cursor: pointer; text-align: left;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-day-restaurant:last-child { margin-bottom: 0; }
      .bv-day-restaurant:hover { background: rgba(255, 252, 245, 0.95); }
      .bv-day-restaurant .rank {
        flex-shrink: 0; padding: 2px 6px; border-radius: 4px;
        background: var(--burgundy); color: #fff8ec;
        font-size: 9px; font-weight: 600;
      }
      .bv-day-restaurant .info { flex: 1; min-width: 0; }
      .bv-day-restaurant .name {
        font-size: 13px; font-weight: 500; color: var(--burgundy);
        line-height: 1.15; white-space: nowrap;
        overflow: hidden; text-overflow: ellipsis;
      }
      .bv-day-restaurant .meta {
        display: flex; align-items: center; gap: 4px;
        font-size: 10px; color: var(--ink); margin-top: 2px;
      }
      .bv-day-restaurant .meta .muted { color: var(--ink-soft); }
      .bv-day-restaurant .meta .weighted {
        margin-left: auto;
        background: rgba(92,30,42,0.1); color: var(--burgundy);
        padding: 1px 5px; border-radius: 999px;
        font-size: 9px; font-weight: 600;
      }

      /* v0.6: Wide restaurant CTA card on home */
      .bv-action-wide {
        margin: 12px 18px 4px; padding: 14px 16px;
        background: linear-gradient(135deg, var(--burgundy) 0%, var(--terracotta) 100%);
        color: #fff8ec; border: 0; border-radius: 14px;
        display: flex; align-items: center; gap: 12px;
        cursor: pointer; text-align: left;
        box-shadow: 0 6px 16px -8px rgba(92,30,42,0.4);
        position: relative;
      }
      .bv-action-wide .ico {
        width: 38px; height: 38px; border-radius: 10px;
        background: rgba(255,248,236,0.15); color: #fff8ec;
        display: grid; place-items: center; flex-shrink: 0;
      }
      .bv-action-wide .text { flex: 1; min-width: 0; }
      .bv-action-wide .ttl {
        font-size: 18px; font-weight: 500; line-height: 1.1;
        color: #fff8ec;
      }
      .bv-action-wide .sub {
        font-size: 11px; margin-top: 3px; opacity: 0.85;
        color: var(--gold);
      }
      .bv-action-wide .badge {
        position: absolute; top: 10px; right: 30px;
        background: var(--gold); color: var(--burgundy);
        padding: 2px 6px; border-radius: 4px;
        font-size: 9px; font-weight: 600; letter-spacing: 0.05em;
        display: inline-flex; align-items: center; gap: 2px;
        font-family: 'DM Sans', sans-serif;
      }

      /* v0.6: Cuisine filter row */
      .bv-cuisine-row {
        display: flex; gap: 6px; overflow-x: auto;
        padding: 4px 0 8px; margin-top: 10px;
        scrollbar-width: none;
      }
      .bv-cuisine-row::-webkit-scrollbar { display: none; }
      .bv-cuisine-pill {
        flex-shrink: 0; padding: 6px 12px;
        background: rgba(255, 252, 245, 0.8);
        border: 1px solid rgba(0,0,0,0.08);
        border-radius: 999px;
        font-size: 12px; cursor: pointer;
        display: inline-flex; align-items: center; gap: 4px;
        font-family: 'DM Sans', sans-serif;
        color: var(--ink);
      }
      .bv-cuisine-pill .emoji { font-size: 13px; }
      .bv-cuisine-pill.on {
        background: var(--burgundy); color: #fff8ec;
        border-color: var(--burgundy);
      }
      .bv-cuisine-pill:disabled { opacity: 0.5; cursor: default; }

      /* v0.6: Restaurants meta row */
      .bv-restaurants-meta {
        display: flex; justify-content: space-between; align-items: center;
        padding: 6px 10px; margin-bottom: 8px;
        background: rgba(0,0,0,0.03); border-radius: 8px;
        font-size: 10px; color: var(--ink-soft);
      }
      .bv-restaurants-meta .meta-line {
        display: inline-flex; align-items: center; gap: 4px;
      }
      .bv-restaurants-meta button {
        background: rgba(184,85,58,0.1); border: 0;
        color: var(--terracotta-deep); padding: 3px 8px;
        border-radius: 999px; font-size: 10px; cursor: pointer;
        display: inline-flex; align-items: center; gap: 3px;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-restaurants-meta button:hover { background: rgba(184,85,58,0.18); }

      /* v0.6: Restaurant list cards */
      .bv-restaurant-list { display: flex; flex-direction: column; gap: 10px; margin-top: 4px; }
      .bv-restaurant-card {
        position: relative;
        background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 14px; padding: 12px;
        display: flex; align-items: center; gap: 12px;
        cursor: pointer; text-align: left;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-restaurant-card:hover { background: rgba(255, 252, 245, 0.95); }
      .bv-restaurant-card .rank {
        position: absolute; top: 6px; left: 6px;
        background: var(--burgundy); color: #fff8ec;
        font-size: 9px; padding: 2px 5px; border-radius: 4px;
        font-weight: 600; letter-spacing: 0.02em;
      }
      .bv-restaurant-card .thumb {
        width: 72px; height: 72px; border-radius: 10px;
        object-fit: cover; background: rgba(0,0,0,0.05);
        flex-shrink: 0;
      }
      .bv-restaurant-card .thumb.placeholder {
        display: grid; place-items: center;
        color: var(--ink-soft);
      }
      .bv-restaurant-card .info { flex: 1; min-width: 0; }
      .bv-restaurant-card .head {
        display: flex; align-items: flex-start; gap: 6px; margin-bottom: 4px;
      }
      .bv-restaurant-card .name {
        flex: 1; font-size: 16px; font-weight: 500;
        color: var(--burgundy); line-height: 1.15;
      }
      .bv-restaurant-card .price {
        flex-shrink: 0; font-size: 11px; color: var(--gold-deep);
        font-weight: 600;
      }
      .bv-restaurant-card .rating-row {
        display: flex; align-items: center; gap: 6px;
        font-size: 11px; color: var(--ink); margin-top: 2px;
      }
      .bv-restaurant-card .rating { font-weight: 600; }
      .bv-restaurant-card .count {
        display: inline-flex; align-items: center; gap: 2px;
        color: var(--ink-soft);
      }
      .bv-restaurant-card .weighted {
        background: rgba(92,30,42,0.1); color: var(--burgundy);
        padding: 1px 6px; border-radius: 999px;
        font-size: 9px; font-weight: 600;
        margin-left: auto;
      }
      .bv-restaurant-card .meta-row {
        display: flex; align-items: center; gap: 6px;
        font-size: 10px; color: var(--ink-soft); margin-top: 4px;
      }
      .bv-restaurant-card .meta-row .open { color: var(--sage); font-weight: 600; }
      .bv-restaurant-card .meta-row .closed { color: var(--terracotta-deep); font-weight: 600; }

      /* v0.6: Restaurant detail */
      .bv-restaurant-stats {
        display: grid; grid-template-columns: repeat(3, 1fr);
        gap: 8px; margin: 12px 0;
      }
      .bv-restaurant-stats .stat {
        background: rgba(255, 252, 245, 0.7);
        border: 1px solid rgba(0,0,0,0.06);
        border-radius: 10px; padding: 10px 8px;
        text-align: center;
      }
      .bv-restaurant-stats .val {
        font-family: 'Cormorant Garamond', serif;
        font-size: 18px; font-weight: 600; color: var(--burgundy);
        display: inline-flex; align-items: center; gap: 4px;
      }
      .bv-restaurant-stats .lbl {
        font-size: 9px; color: var(--ink-soft); margin-top: 3px;
        text-transform: uppercase; letter-spacing: 0.1em;
        font-family: 'DM Sans', sans-serif;
      }
      .bv-hours-list { margin: 0; padding-left: 0; list-style: none; }
      .bv-hours-list li {
        padding: 4px 0; font-size: 12px;
        border-bottom: 1px dashed rgba(0,0,0,0.05);
      }
      .bv-hours-list li:last-child { border-bottom: 0; }
      .bv-hours-list li::before { display: none; }
      .bv-open-badge { color: var(--sage); font-weight: 600; }
      .bv-closed-badge { color: var(--terracotta-deep); font-weight: 600; }

      .bv-photo-dots {
        position: absolute; bottom: 8px; left: 50%; transform: translateX(-50%);
        display: flex; gap: 4px; padding: 4px 8px;
        background: rgba(0,0,0,0.4); border-radius: 999px;
      }
      .bv-photo-dots button {
        width: 6px; height: 6px; border-radius: 50%;
        background: rgba(255,255,255,0.5); border: 0;
        cursor: pointer; padding: 0;
      }
      .bv-photo-dots button.on { background: #fff8ec; }

      .bv-row-btn.primary {
        background: var(--burgundy); color: #fff8ec;
        border-color: var(--burgundy);
      }
      .bv-row-btn.primary:hover {
        background: #3a1118;
      }
      .bv-link {
        color: var(--terracotta-deep); text-decoration: underline;
        display: inline-flex; align-items: center; gap: 4px;
      }
    `}</style>
  );
}
