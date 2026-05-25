// ─────────────────────────────────────────────────────────
// trip.js — 예약·이동 메타데이터 (attractions.js와 분리하여 가벼움 유지)
// ─────────────────────────────────────────────────────────

// 긴급도: 'critical' (지금 예약) | 'high' (1개월 전) | 'medium' (2주 전) | 'low' (1주 전 OK) | 'none' (예약 불필요)

export const RESERVATION_INFO = {
  cenacolo: {
    urgency: 'critical',
    leadTimeDays: 75,
    notes: '15분 슬롯, 25명 배치 — 2~3개월 전 예약 필수, 풀시즌 매진 흔함',
    sites: [
      { name: 'Cenacolo Vinciano 공식', url: 'https://cenacolovinciano.org/en/', official: true },
      { name: 'Vivaticket (공식 위탁)', url: 'https://www.vivaticket.com/en/biglietto/cenacolo-vinciano', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/last-supper-l3760/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/milan-attractions-c70770/tickets-for-last-supper-by-leonardo-da-vinci-p972937/', official: false },
    ],
  },
  borghese: {
    urgency: 'high',
    leadTimeDays: 30,
    notes: '2시간 슬롯 시간제 입장 — 1개월 전 예약 권장, 9월은 1주 전 잡기 어려움',
    sites: [
      { name: 'Galleria Borghese 공식', url: 'https://galleriaborghese.beniculturali.it/en/', official: true },
      { name: 'Tosc (공식 위탁)', url: 'https://www.tosc.it', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/galleria-borghese-l2745/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/rome-attractions-c66857/galleria-borghese-c66854/', official: false },
    ],
  },
  vatican: {
    urgency: 'high',
    leadTimeDays: 30,
    notes: '시스티나 성당 포함 — 1개월 전 예약 권장. 수요일 오전은 교황 알현 일정 확인',
    sites: [
      { name: 'Musei Vaticani 공식', url: 'https://www.museivaticani.va/content/museivaticani/en/visita-i-musei/scegli-la-visita.html', official: true },
      { name: 'Vatican.com (가이드 투어)', url: 'https://www.vatican.com/tickets/vatican-museums-tickets', official: false },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/vatican-museums-l2829/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/rome-attractions-c66857/vatican-museums-c66848/', official: false },
    ],
  },
  uffizi: {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '2~3주 전 예약 권장. Uffizi+Pitti+Boboli 통합권 〈Passepartout〉 가능',
    sites: [
      { name: 'Uffizi 공식', url: 'https://www.uffizi.it/biglietteria-online', official: true },
      { name: 'B-Ticket (공식)', url: 'https://www.b-ticket.com/B-Ticket/uffizi/Default.aspx', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/uffizi-galleries-l2780/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/florence-attractions-c66837/uffizi-c66836/', official: false },
    ],
  },
  accademia: {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '다비드 한 점 보러 가는 곳. 2~3주 전 예약 권장',
    sites: [
      { name: 'Accademia 공식', url: 'https://www.galleriaaccademiafirenze.it/en/', official: true },
      { name: 'B-Ticket (공식)', url: 'https://www.b-ticket.com/B-Ticket/accademia/Default.aspx', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/accademia-l3779/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/florence-attractions-c66837/accademia-c66833/', official: false },
    ],
  },
  colosseum: {
    urgency: 'medium',
    leadTimeDays: 10,
    notes: '콜로세움+포로+팔라티노 통합권. 〈Arena Floor〉 옵션은 별도. 1~2주 전 예약 권장',
    sites: [
      { name: 'CoopCulture 공식', url: 'https://www.coopculture.it/en/colosseo-e-shop.cfm', official: true },
      { name: 'PArCo 공식', url: 'https://parcocolosseo.it/en/tickets/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/colosseum-l2728/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/rome-attractions-c66857/colosseum-c66850/', official: false },
    ],
  },
  'duomo-milan': {
    urgency: 'medium',
    leadTimeDays: 10,
    notes: '〈Duomo + Roof + Archaeological Area〉 통합권. 옥상 엘리베이터 vs 계단 선택. 1~2주 전 예약 권장',
    sites: [
      { name: 'Duomo Milano 공식', url: 'https://www.duomomilano.it/en/info-tickets/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/milan-cathedral-l3713/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/milan-attractions-c70770/milan-cathedral-c66866/', official: false },
    ],
  },
  duomo: {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '5건물 통합권 €30+. 브루넬레스키 돔 + 조토 종탑 등반은 슬롯 예약 별도 필수',
    sites: [
      { name: 'Duomo Firenze 공식', url: 'https://duomo.firenze.it/en/biglietteria/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/florence-cathedral-l3722/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/florence-attractions-c66837/florence-cathedral-c66835/', official: false },
    ],
  },
  // 나머지는 예약 불필요/권장
  pantheon: { urgency: 'none', notes: '무료 입장 (예약 없음). 2023년부터 €5 옵션 가능' },
  trevi: { urgency: 'none', notes: '야외 분수 — 예약 불필요' },
  navona: { urgency: 'none', notes: '야외 광장 — 예약 불필요' },
  spagna: { urgency: 'none', notes: '야외 광장 — 예약 불필요' },
  popolo: { urgency: 'none', notes: '광장 + 산타 마리아 델 포폴로 (입장 무료)' },
  foro: { urgency: 'none', notes: '콜로세움 통합권에 포함 — 별도 예약 불필요' },
  vincoli: { urgency: 'none', notes: '작은 교회 — 워크인 OK, 입장 무료' },
  capitolini: { urgency: 'low', leadTimeDays: 3, notes: '평시 워크인 OK. 매월 첫 일요일 무료', 
    sites: [{ name: 'Musei Capitolini 공식', url: 'https://www.museicapitolini.org/en', official: true }] },
  castel: { urgency: 'low', leadTimeDays: 3, notes: '평시 워크인 OK, 9월 피크엔 줄 길어질 수 있음',
    sites: [{ name: 'Castel Sant\'Angelo 공식', url: 'https://castelsantangelo.beniculturali.it/en/', official: true }] },
  vecchio: { urgency: 'low', leadTimeDays: 3, notes: '워크인 OK. 500인의 방 + 스튜디올로 입장료 별도',
    sites: [{ name: 'Palazzo Vecchio 공식', url: 'https://cultura.comune.fi.it/en/page/palazzo-vecchio', official: true }] },
  bargello: { urgency: 'none', notes: '워크인 OK. 매월 첫 일요일 무료, 월요일·매월 둘째·넷째 일요일 휴관' },
  santacroce: { urgency: 'none', notes: '본당 + 파치 예배당 통합 €8 — 워크인 OK' },
  sforzesco: { urgency: 'none', notes: '11개 박물관 통합권 €10 — 워크인 OK. 외부 광장은 무료' },
  brera: { urgency: 'none', notes: '워크인 OK. 매월 셋째 목요일 저녁 무료' },
  'galleria-scala': { urgency: 'low', leadTimeDays: 3, notes: '갤러리아 자체는 무료. 라 스칼라 박물관 €12 — 워크인 OK',
    sites: [{ name: 'Museo Teatrale alla Scala 공식', url: 'https://www.museoscala.org/en/', official: true }] },
};

// ─────────────────────────────────────────────────────────
// 도시간 이동 정보 — 로마/피렌체/밀라노 3각형
// ─────────────────────────────────────────────────────────

export const TRANSIT_INFO = {
  // 도시 키 페어로 검색 (city1-city2 알파벳 순 정렬)
  'florence-rome': {
    name: '로마 ↔ 피렌체',
    distance: '275km',
    options: [
      {
        type: 'train-highspeed',
        provider: 'Trenitalia Frecciarossa',
        duration: '1시간 32분',
        priceRange: '€19~95',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: '60일 전 〈Super Economy〉 €19부터, 1주 전 €60~95. 매시 1~2회',
        bookingSites: [
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/en.html', official: true },
        ],
      },
      {
        type: 'train-highspeed',
        provider: 'Italo',
        duration: '1시간 28분',
        priceRange: '€15~85',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: '사설 운영. Trenitalia보다 약간 더 쌀 때 있음. 〈Low Cost〉 요금이 가장 저렴',
        bookingSites: [
          { name: 'Italo 공식', url: 'https://www.italotreno.com/en', official: true },
        ],
      },
      {
        type: 'aggregator',
        provider: '비교 사이트',
        duration: '-',
        priceRange: '-',
        urgency: 'none',
        notes: 'Trenitalia + Italo 한 화면에서 비교',
        bookingSites: [
          { name: 'Trainline', url: 'https://www.thetrainline.com', official: false },
          { name: 'Omio', url: 'https://www.omio.com', official: false },
        ],
      },
    ],
  },
  'florence-milan': {
    name: '피렌체 ↔ 밀라노',
    distance: '300km',
    options: [
      {
        type: 'train-highspeed',
        provider: 'Trenitalia Frecciarossa',
        duration: '1시간 45분',
        priceRange: '€25~100',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: '매시 1~2회. 60일 전 예약 시 €25부터',
        bookingSites: [
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/en.html', official: true },
        ],
      },
      {
        type: 'train-highspeed',
        provider: 'Italo',
        duration: '1시간 45분',
        priceRange: '€20~90',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: 'Italo도 매시 1~2회 운행',
        bookingSites: [
          { name: 'Italo 공식', url: 'https://www.italotreno.com/en', official: true },
        ],
      },
      {
        type: 'aggregator',
        provider: '비교 사이트',
        duration: '-',
        priceRange: '-',
        urgency: 'none',
        notes: '두 운영사 가격 + 시간 비교',
        bookingSites: [
          { name: 'Trainline', url: 'https://www.thetrainline.com', official: false },
          { name: 'Omio', url: 'https://www.omio.com', official: false },
        ],
      },
    ],
  },
  'milan-rome': {
    name: '로마 ↔ 밀라노',
    distance: '575km',
    options: [
      {
        type: 'train-highspeed',
        provider: 'Trenitalia Frecciarossa',
        duration: '3시간',
        priceRange: '€30~130',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: 'Frecciarossa 1000 직행. 매시 1~2회',
        bookingSites: [
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/en.html', official: true },
        ],
      },
      {
        type: 'train-highspeed',
        provider: 'Italo',
        duration: '2시간 55분',
        priceRange: '€25~120',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: 'Italo가 약간 더 빠를 때 있음. 〈Smart〉 요금 가장 쌈',
        bookingSites: [
          { name: 'Italo 공식', url: 'https://www.italotreno.com/en', official: true },
        ],
      },
      {
        type: 'flight',
        provider: '국내선 (대부분 불필요)',
        duration: '1시간 15분 + 공항 2시간',
        priceRange: '€60~200',
        urgency: 'low',
        notes: '기차가 보통 더 빠름/저렴. 비행기는 시간 절약 안 됨',
        bookingSites: [
          { name: 'ITA Airways', url: 'https://www.ita-airways.com', official: true },
          { name: 'Ryanair', url: 'https://www.ryanair.com', official: true },
        ],
      },
      {
        type: 'aggregator',
        provider: '비교 사이트',
        duration: '-',
        priceRange: '-',
        urgency: 'none',
        notes: '기차 + 비행기 한 화면에서 비교',
        bookingSites: [
          { name: 'Trainline', url: 'https://www.thetrainline.com', official: false },
          { name: 'Omio', url: 'https://www.omio.com', official: false },
        ],
      },
    ],
  },
};

// 도시 페어를 정렬된 키로 변환
export function getTransitKey(city1, city2) {
  if (city1 === city2) return null;
  return [city1, city2].sort().join('-');
}

// 명소 ID로 예약 정보 가져오기
export function getReservationInfo(attractionId) {
  return RESERVATION_INFO[attractionId] || { urgency: 'none' };
}

// 두 도시 사이 이동 정보
export function getTransitInfo(city1, city2) {
  const key = getTransitKey(city1, city2);
  if (!key) return null;
  return TRANSIT_INFO[key] || null;
}

// ─────────────────────────────────────────────────────────
// Google Calendar URL 생성기
// ─────────────────────────────────────────────────────────

// YYYYMMDD 또는 YYYYMMDDTHHMMSS 형식으로 변환
function fmtDate(dateStr, allDay = true) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  if (allDay) return `${y}${m}${day}`;
  return `${y}${m}${day}T100000`; // 오전 10시 기본
}

// 캘린더 이벤트 URL 생성 (Google Calendar)
export function buildCalendarUrl({ title, date, endDate, details, location, allDay = true }) {
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: title,
  });
  // 종일 이벤트는 dates=YYYYMMDD/YYYYMMDD (종료일 = 다음날)
  if (allDay) {
    const start = fmtDate(date, true);
    const endD = new Date(endDate || date);
    endD.setDate(endD.getDate() + 1); // Google Calendar all-day 종료는 다음날 00:00
    const end = fmtDate(endD.toISOString().slice(0, 10), true);
    params.set('dates', `${start}/${end}`);
  } else {
    params.set('dates', `${fmtDate(date, false)}/${fmtDate(endDate || date, false)}`);
  }
  if (details) params.set('details', details);
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// 명소 예약 알림 캘린더 URL
export function attractionReminderUrl(attractionName, tripStartDate, reservationInfo, primaryBookingUrl) {
  if (!reservationInfo || reservationInfo.urgency === 'none') return null;
  const leadDays = reservationInfo.leadTimeDays || 7;
  const remindDate = new Date(tripStartDate);
  remindDate.setDate(remindDate.getDate() - leadDays);
  const isoDate = remindDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  // 이미 지난 날짜면 오늘로
  const useDate = isoDate < today ? today : isoDate;
  return buildCalendarUrl({
    title: `🎫 예약: ${attractionName}`,
    date: useDate,
    details: `${reservationInfo.notes || ''}\n\n예약 사이트: ${primaryBookingUrl || ''}`,
    location: primaryBookingUrl || '',
  });
}

// 교통 예약 알림 URL
export function transitReminderUrl(transitName, transitDate, leadDays, notes, bookingUrl) {
  const remindDate = new Date(transitDate);
  remindDate.setDate(remindDate.getDate() - leadDays);
  const isoDate = remindDate.toISOString().slice(0, 10);
  const today = new Date().toISOString().slice(0, 10);
  const useDate = isoDate < today ? today : isoDate;
  return buildCalendarUrl({
    title: `🚆 예약: ${transitName}`,
    date: useDate,
    details: `${notes || ''}\n\n예약: ${bookingUrl || ''}`,
    location: bookingUrl || '',
  });
}

// ─────────────────────────────────────────────────────────
// localStorage 헬퍼 (트립 상태 저장)
// ─────────────────────────────────────────────────────────
const TRIP_KEY = 'docent:trip';

export function loadTrip() {
  try {
    const raw = localStorage.getItem(TRIP_KEY);
    if (!raw) return null;
    const trip = JSON.parse(raw);
    if (trip && trip.startDate && Array.isArray(trip.days)) return trip;
    return null;
  } catch (e) {
    return null;
  }
}

export function saveTrip(trip) {
  try {
    localStorage.setItem(TRIP_KEY, JSON.stringify(trip));
    return true;
  } catch (e) {
    return false;
  }
}

export function clearTrip() {
  try {
    localStorage.removeItem(TRIP_KEY);
  } catch (e) {}
}

// 새 트립 만들기 — 빈 일정으로 출발/복귀 날짜만
export function createEmptyTrip(startDate, endDate) {
  const days = [];
  const cur = new Date(startDate);
  const end = new Date(endDate);
  while (cur <= end) {
    days.push({
      date: cur.toISOString().slice(0, 10),
      attractionIds: [],
    });
    cur.setDate(cur.getDate() + 1);
  }
  return { startDate, endDate, days };
}

// ─────────────────────────────────────────────────────────
// 휴관일 룰 — 날짜 받아 휴관 상태 반환
// 반환값: null (정상 개방) | { status: 'closed' | 'partial', notes: string }
// ─────────────────────────────────────────────────────────
const CLOSURE_RULES = {
  // 월요일 휴관 (대부분의 이탈리아 국립 박물관)
  borghese: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 휴관' } : null,
  uffizi: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 휴관' } : null,
  accademia: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 휴관' } : null,
  cenacolo: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 휴관' } : null,
  brera: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 휴관' } : null,
  sforzesco: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 박물관 휴관 (광장은 개방)' } : null,
  castel: (d) => new Date(d).getDay() === 1 ? { status: 'closed', notes: '월요일 휴관' } : null,
  capitolini: () => null, // 캐피톨리니는 매월 첫 일요일 무료 + 평시 매일 개방

  // 일요일 휴관 (Vatican은 독립국이라 룰이 다름)
  vatican: (d) => {
    const dd = new Date(d);
    if (dd.getDay() !== 0) return null;
    // 마지막 일요일은 9:00~14:00 무료
    const last = new Date(dd.getFullYear(), dd.getMonth() + 1, 0);
    const lastSunday = last.getDate() - ((last.getDay() + 7) % 7);
    if (dd.getDate() === lastSunday) {
      return { status: 'partial', notes: '마지막 일요일 — 무료, 9시~14시 (혼잡)' };
    }
    return { status: 'closed', notes: '일요일 휴관 (마지막 일요일 제외)' };
  },

  // 바르젤로: 월요일 + 매월 둘째·넷째 일요일 휴관
  bargello: (d) => {
    const dd = new Date(d);
    const wd = dd.getDay();
    if (wd === 1) return { status: 'closed', notes: '월요일 휴관' };
    if (wd === 0) {
      const sundayIdx = Math.ceil(dd.getDate() / 7); // 그 달의 몇 번째 일요일인지
      if (sundayIdx === 2 || sundayIdx === 4) {
        return { status: 'closed', notes: '둘째·넷째 일요일 휴관' };
      }
    }
    return null;
  },

  // 일요일 오전 미사 시간 제한 (성당)
  santacroce: (d) => new Date(d).getDay() === 0 ? { status: 'partial', notes: '일요일 오전 미사 시간 입장 제한 (오후 OK)' } : null,
  duomo: (d) => new Date(d).getDay() === 0 ? { status: 'partial', notes: '일요일 세례당 오전 미사 제한 (본당 OK)' } : null,
  'duomo-milan': (d) => new Date(d).getDay() === 0 ? { status: 'partial', notes: '일요일 오전 미사 (옥상·박물관 OK)' } : null,

  // 콜로세움·포로·판테온 등은 매일 개방
};

export function getClosureStatus(attractionId, dateStr) {
  const rule = CLOSURE_RULES[attractionId];
  if (!rule) return null;
  return rule(dateStr);
}

// ─────────────────────────────────────────────────────────
// 추천 코스 — 도시별 미리 짠 동선
// ─────────────────────────────────────────────────────────
export const RECOMMENDED_COURSES = {
  rome: [
    {
      id: 'rome-ancient',
      name: '로마 — 고대 로마 풀데이',
      summary: '콜로세움 + 포로 통합권 → 카피톨리니 → 빈콜리 모세상',
      attractionIds: ['colosseum', 'foro', 'capitolini', 'vincoli'],
      durationHint: '약 7~8시간',
    },
    {
      id: 'rome-squares',
      name: '로마 — 5 광장 + 분수 도보',
      summary: '판테온 → 나보나 → 트레비 → 스페인 → 포폴로 (도보 코스)',
      attractionIds: ['pantheon', 'navona', 'trevi', 'spagna', 'popolo'],
      durationHint: '약 5~6시간',
    },
    {
      id: 'rome-vatican',
      name: '로마 — 바티칸 풀데이',
      summary: '바티칸 + 시스티나 (오전 4시간) → 산탄젤로 (오후) → 산탄젤로 다리',
      attractionIds: ['vatican', 'castel'],
      durationHint: '약 6~7시간',
    },
    {
      id: 'rome-borghese',
      name: '로마 — 보르게세 + 북부',
      summary: '보르게세 (슬롯 예약) → 포폴로 광장 + 카라바조 → 스페인 광장',
      attractionIds: ['borghese', 'popolo', 'spagna'],
      durationHint: '약 4~5시간',
    },
  ],
  florence: [
    {
      id: 'florence-duomo-day',
      name: '피렌체 — 두오모 풀데이',
      summary: '두오모 (5건물 통합권) → 베키오 + 시뇨리아 광장',
      attractionIds: ['duomo', 'vecchio'],
      durationHint: '약 6~7시간',
    },
    {
      id: 'florence-art-day',
      name: '피렌체 — 우피치 + 르네상스 조각',
      summary: '우피치 (오전) → 베키오 → 바르젤로 (이탈리아 첫 박물관)',
      attractionIds: ['uffizi', 'vecchio', 'bargello'],
      durationHint: '약 7~8시간',
    },
    {
      id: 'florence-david-tombs',
      name: '피렌체 — 다비드 + 위인들 무덤',
      summary: '아카데미아 다비드 → 산타 크로체 (미켈란젤로·갈릴레오·마키아벨리)',
      attractionIds: ['accademia', 'santacroce'],
      durationHint: '약 4~5시간',
    },
  ],
  milan: [
    {
      id: 'milan-duomo-day',
      name: '밀라노 — 두오모 + 도심',
      summary: '두오모 + 옥상 → 갤러리아 + 라 스칼라 → 스포르체스코 성',
      attractionIds: ['duomo-milan', 'galleria-scala', 'sforzesco'],
      durationHint: '약 6~7시간',
    },
    {
      id: 'milan-art-day',
      name: '밀라노 — 미술 코스',
      summary: '체나콜로 (슬롯 예약) → 브레라 미술관',
      attractionIds: ['cenacolo', 'brera'],
      durationHint: '약 3~4시간 (체나콜로 15분 + 이동 + 브레라)',
    },
  ],
};

export function getRecommendedCourses(city) {
  return RECOMMENDED_COURSES[city] || [];
}

// ─────────────────────────────────────────────────────────
// 인접 일정 기반 도시 추론
// ─────────────────────────────────────────────────────────
// attractions 모듈을 import 하지 않고 외부에서 도시 정보를 받음
// (trip.js가 attractions.js를 import하지 않도록 의존성 깨끗하게 유지)

// 인접 일정 보고 빈 날의 도시 추론
export function inferCityForDay(trip, dayIdx, getDayCity) {
  if (!trip || !trip.days || dayIdx < 0 || dayIdx >= trip.days.length) return null;
  const day = trip.days[dayIdx];
  if (day.attractionIds.length > 0) {
    // 이미 명소 있으면 그 도시
    return getDayCity(day);
  }

  // 양쪽 인접 일 검색 (가까운 거부터)
  for (let dist = 1; dist < trip.days.length; dist++) {
    const prev = dayIdx - dist >= 0 ? trip.days[dayIdx - dist] : null;
    const next = dayIdx + dist < trip.days.length ? trip.days[dayIdx + dist] : null;
    const prevCity = prev ? getDayCity(prev) : null;
    const nextCity = next ? getDayCity(next) : null;

    // 양쪽 같은 도시 → 확정
    if (prevCity && nextCity && prevCity === nextCity) return prevCity;
    // 한쪽만 있음 → 그 도시
    if (prevCity && !nextCity) return prevCity;
    if (!prevCity && nextCity) return nextCity;
    // 양쪽 다른 도시 → 일단 이전 도시 (보통 일정 흐름이 그쪽)
    if (prevCity && nextCity && prevCity !== nextCity) return prevCity;
  }
  return null;
}

// 다른 날에 이미 배정된 명소 ID 집합
export function getAssignedAttractionIds(trip, excludeDayIdx) {
  if (!trip || !trip.days) return new Set();
  const set = new Set();
  trip.days.forEach((day, idx) => {
    if (idx === excludeDayIdx) return;
    day.attractionIds.forEach((aid) => set.add(aid));
  });
  return set;
}
