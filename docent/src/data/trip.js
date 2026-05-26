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
      { name: 'Cenacolo Vinciano 공식', url: 'https://cenacolovinciano.org/', official: true },
      { name: 'Vivaticket (공식 위탁)', url: 'https://www.lastsupper.shop/it/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/last-supper-l3760/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=last+supper+milan', official: false },
    ],
    tips: [
      '입장 15분 단위 슬롯 — 도착 30분 전 처리 필수 (늦으면 입장 불가)',
      '티켓에 이름 인쇄 — 양도 불가, 여권 ID 확인',
      '공식 €15/인 · max 5장/체크아웃 · 연 2회/인 제한',
      '매주 수요일 정오 다음 주 추가 분량 (백업)',
      '단체 10+ → cenacologruppi@adartem.art',
      '오전 첫 타임 (8:15) 추천 — 아이 동반 시 점심 전 마무리',
    ],
  },
  borghese: {
    urgency: 'high',
    leadTimeDays: 30,
    notes: '2시간 슬롯 시간제 입장 — 1개월 전 예약 권장, 9월은 1주 전 잡기 어려움',
    sites: [
      { name: 'Galleria Borghese 공식', url: 'https://galleriaborghese.cultura.gov.it/en/', official: true },
      { name: 'Tosc (공식 위탁)', url: 'https://www.tosc.it/en/artist/galleria-borghese/galleria-borghese-2253937/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/galleria-borghese-l2745/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=galleria+borghese', official: false },
    ],
    tips: [
      '입장 슬롯 9:00, 11:00, 13:00, 15:00, 17:00 (2시간 단위)',
      '시간 정각에 입장 — 다음 슬롯 시 비워야 함',
      '공식 €13 + 예약비 €2 = €15/인',
      '카라바조 + 베르니니 중심 — 첫 슬롯 9:00이 가장 한산',
      '소지품 의무 보관 (가방·우산), 사진 ✓',
      '취소·환불 7일 전까지',
    ],
  },
  vatican: {
    urgency: 'high',
    leadTimeDays: 30,
    notes: '시스티나 성당 포함 — 1개월 전 예약 권장. 수요일 오전은 교황 알현 일정 확인',
    sites: [
      { name: 'Musei Vaticani 공식', url: 'https://tickets.museivaticani.va', official: true },
      { name: 'Vatican.com (가이드 투어)', url: 'https://www.museivaticani.va/', official: false },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/vatican-museums-l2829/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=vatican+museums', official: false },
    ],
    tips: [
      '공식 €25 + 예약비 €5 = €30/인 (Sistine 포함)',
      '얼리버드 7:30 입장 옵션 (€50) — 시스티나 거의 비어 있음',
      '수요일 오전 교황 알현 (주 1회, 광장 따로 무료 신청)',
      '복장 규정: 어깨·무릎 가리는 옷 (위반 시 입장 거부)',
      '시스티나 안에서 사진 금지, 정숙',
      '관람 동선 4~5시간 풀데이 — 점심 전 시스티나 도달 권장',
      '백팩·큰 가방 의무 보관',
    ],
  },
  uffizi: {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '2~3주 전 예약 권장. Uffizi+Pitti+Boboli 통합권 〈Passepartout〉 가능',
    sites: [
      { name: 'Uffizi 공식', url: 'https://www.uffizi.it/en/tickets', official: true },
      { name: 'B-Ticket (공식)', url: 'https://www.uffizi.it/en/tickets', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/uffizi-galleries-l2780/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=uffizi', official: false },
    ],
    tips: [
      '공식 €25 (성수기) / €13 (비수기 11~3월) + 예약비 €4',
      'Passepartout: 우피치 + 피티 + 보볼리 통합 €38, 5일 유효 (시간 여유 있을 때 가성비 ✓)',
      '입장은 30분 단위 슬롯 — 첫 8:15 슬롯이 가장 한산',
      '관람 동선 3~4시간, 보티첼리·다빈치·카라바조 핵심',
      '아이 동반 시 우피치 + 광장 휴식 끼워 넣기',
      '매월 첫 일요일 무료 (예약 안 됨, 줄 길음)',
    ],
  },
  accademia: {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '다비드 한 점 보러 가는 곳. 2~3주 전 예약 권장',
    sites: [
      { name: 'Accademia 공식', url: 'https://www.galleriaaccademiafirenze.it/', official: true },
      { name: 'B-Ticket (공식)', url: 'https://www.galleriaaccademiafirenze.it/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/accademia-l3779/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=accademia+florence', official: false },
    ],
    tips: [
      '공식 €16 + 예약비 €4 = €20/인',
      '관람 동선 1~1.5시간 (다비드 한 점이 메인)',
      '미완성 〈노예들〉(Schiavi) 시리즈도 강력 추천 — 다비드 가는 길에',
      '8:15 첫 슬롯이 가장 좋음 (다비드 앞 빈 공간)',
      '매월 첫 일요일 무료',
    ],
  },
  colosseum: {
    urgency: 'medium',
    leadTimeDays: 10,
    notes: '콜로세움+포로+팔라티노 통합권. 〈Arena Floor〉 옵션은 별도. 1~2주 전 예약 권장',
    sites: [
      { name: 'CoopCulture 공식', url: 'https://ticketing.colosseo.it/en/', official: true },
      { name: 'PArCo 공식', url: 'https://parcocolosseo.it/en/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/colosseum-l2728/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=colosseum', official: false },
    ],
    tips: [
      '〈Standard〉 €18 (콜로세움+포로+팔라티노, 24시간 유효)',
      '〈Full Experience Arena〉 €24 (지하 + 아레나 바닥, 가이드 필수)',
      '〈Full Experience Underground〉 €27 (지하 단독, 가장 깊이)',
      '오전 첫 8:30 슬롯이 가장 한산',
      '포로+팔라티노는 다음 날 가도 OK (24시간 유효)',
      '복장 규정 없음, 큰 가방 보관소 없음 (작은 가방만)',
      '아이 동반: Arena Floor 옵션이 〈검투사 자리에 선다〉 경험 — 추천',
    ],
  },
  'duomo-milan': {
    urgency: 'medium',
    leadTimeDays: 10,
    notes: '〈Duomo + Roof + Archaeological Area〉 통합권. 옥상 엘리베이터 vs 계단 선택. 1~2주 전 예약 권장',
    sites: [
      { name: 'Duomo Milano 공식', url: 'https://www.duomomilano.it/en/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/milan-cathedral-l3713/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=duomo+milano', official: false },
    ],
    tips: [
      'Duomo Pass A: 본당 + 옥상 (엘리베이터) + 박물관 = €22',
      'Duomo Pass B: 본당 + 옥상 (계단 251단) + 박물관 = €16',
      'C 옵션: 본당만 = €7',
      '옥상 일몰 시간 슬롯이 가장 인기 (예약 빨리 차됨)',
      '아이 동반: 계단 251단은 10세도 OK, 엘리베이터 옵션이 안전',
      '복장 규정: 어깨·무릎 가리는 옷 (성당 본당)',
    ],
  },
  duomo: {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '5건물 통합권 €30+. 브루넬레스키 돔 + 조토 종탑 등반은 슬롯 예약 별도 필수',
    sites: [
      { name: 'Duomo Firenze 공식', url: 'https://duomo.firenze.it/en/tickets', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/florence-cathedral-l3722/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=duomo+firenze', official: false },
    ],
    tips: [
      'Ghiberti €30: 5건물 (본당 + 돔 + 종탑 + 세례당 + 박물관) 3일 유효',
      'Giotto €20: 본당 + 종탑 + 박물관 (돔·세례당 제외)',
      'Brunelleschi €30: 본당 + 돔 + 박물관 + 세례당 (종탑 제외)',
      '돔 등반 463단 — 슬롯 빨리 매진 (가장 인기), 2~3주 전 예약 필수',
      '종탑 등반 414단 — 슬롯 있지만 돔보다 여유',
      '아이 동반: 돔 등반은 좁고 가파름, 10세도 가능하지만 폐소공포 주의',
      '본당 입장은 무료지만 줄 길음 (티켓 + 슬롯이 더 빠름)',
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
    sites: [{ name: 'Palazzo Vecchio 공식', url: 'https://musefirenze.it/en/museum/palazzo-vecchio/', official: true }] },
  bargello: { urgency: 'none', notes: '워크인 OK. 매월 첫 일요일 무료, 월요일·매월 둘째·넷째 일요일 휴관' },
  santacroce: { urgency: 'none', notes: '본당 + 파치 예배당 통합 €8 — 워크인 OK' },
  sforzesco: { urgency: 'none', notes: '11개 박물관 통합권 €10 — 워크인 OK. 외부 광장은 무료' },
  brera: { urgency: 'none', notes: '워크인 OK. 매월 셋째 목요일 저녁 무료' },
  'galleria-scala': { urgency: 'low', leadTimeDays: 3, notes: '갤러리아 자체는 무료. 라 스칼라 박물관 €12 — 워크인 OK',
    sites: [{ name: 'Museo Teatrale alla Scala 공식', url: 'https://www.museoscala.org/en/', official: true }] },

  // ─── Venice ───
  'san-marco': {
    urgency: 'low',
    leadTimeDays: 3,
    notes: '바실리카 자체 입장 무료. Skip-line €5 권장 (성수기 줄 1시간+). Pala d\'Oro + 4두 청동마 옵션 €5씩',
    sites: [
      { name: 'San Marco 공식', url: 'https://www.basilicasanmarco.it/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/venice-l35/', official: false },
    ],
    tips: [
      '바실리카 본당 무료 (5분 줄 평균)',
      'Skip-line €5 추천 (성수기 줄 60분+)',
      'Pala d\'Oro 황금 제단 €5 (강력 추천)',
      'Loggia dei Cavalli (4두 청동마) €5 — 진품 박물관',
      '일요일 오전 미사 시간 입장 제한',
      '복장 규정 — 어깨/무릎 가리는 옷 필수',
    ],
  },
  'palazzo-ducale': {
    urgency: 'medium',
    leadTimeDays: 7,
    notes: '두칼레 궁 — 성수기 매진 흔함, 1주 전 예약 권장. Itinerari Segreti(비밀 투어) 별도',
    sites: [
      { name: 'Palazzo Ducale 공식', url: 'https://palazzoducale.visitmuve.it/', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/doges-palace-l2799/', official: false },
    ],
    tips: [
      '공식 €30 (성인) + 예약비 €2',
      'St. Mark\'s Square Museums Pass €40 (4관: 두칼레+코레르+고고학+마르차나)',
      'Itinerari Segreti (비밀 투어) €32 — 사형장·고문실 등 일반 코스 외 영역',
      '내부 사진 가능 (플래시 금지)',
      '큰 가방 의무 보관',
      '오전 첫 9:00 슬롯이 가장 한산',
    ],
  },
  rialto: {
    urgency: 'none',
    notes: '야외 다리·시장 — 예약 불필요',
  },
  'murano-burano': {
    urgency: 'none',
    notes: '수상버스(Vaporetto) ACTV 데이 패스 €25 (24시간 무제한). 당일 매표 가능',
    tips: [
      'ACTV 24시간 패스 €25 (75분권 €9.50 비싸짐)',
      'Line 4.1 → 무라노 (15분)',
      'Line 12 → 부라노 (40분)',
      '오전 9시 출발 권장 — 부라노까지 도착 11시',
      '무라노 유리공방 무료 시연 일부 공방',
    ],
  },
  gondola: {
    urgency: 'low',
    leadTimeDays: 2,
    notes: '공식 요금 30분 €90(낮)/€110(저녁 7시 이후). 6인 한 척. 워크인 가능',
    sites: [
      { name: 'Venezia Unica 공식', url: 'https://www.veneziaunica.it/en', official: true },
    ],
    tips: [
      '공식 €90(낮)/€110(저녁) — 30분 6인',
      '예약 불필요, San Marco·Rialto 곤돌라 스탠드에서',
      '저녁 일몰 시간(18:30~19:30) 가장 인기 — 일찍 가기',
      '노래 옵션 추가 €40 (보통)',
      'Traghetto €2 — 〈서서 타는 곤돌라〉 1분 대운하 횡단 (현지인 일상)',
    ],
  },
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
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/', official: true },
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
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/', official: true },
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
  'florence-venice': {
    name: '피렌체 ↔ 베네치아',
    distance: '255km',
    options: [
      {
        type: 'train-highspeed',
        provider: 'Trenitalia Frecciarossa',
        duration: '2시간 5분',
        priceRange: '€25~95',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: '직행, 매시 1회 정도. 60일 전 〈Super Economy〉 €25부터',
        bookingSites: [
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/', official: true },
        ],
      },
      {
        type: 'train-highspeed',
        provider: 'Italo',
        duration: '2시간 5분',
        priceRange: '€20~85',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: 'Italo도 직행 운행. 〈Low Cost〉 요금이 가장 저렴',
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
  'milan-venice': {
    name: '베네치아 ↔ 밀라노',
    distance: '270km',
    options: [
      {
        type: 'train-highspeed',
        provider: 'Trenitalia Frecciarossa',
        duration: '2시간 15분',
        priceRange: '€20~90',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: '직행 매시 1~2회. 60일 전 〈Super Economy〉 €20부터',
        bookingSites: [
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/', official: true },
        ],
      },
      {
        type: 'train-highspeed',
        provider: 'Italo',
        duration: '2시간 10분',
        priceRange: '€18~85',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: 'Italo도 매시 1회 정도. Frecciarossa보다 약간 더 빠를 때 있음',
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
        notes: '두 운영사 비교',
        bookingSites: [
          { name: 'Trainline', url: 'https://www.thetrainline.com', official: false },
          { name: 'Omio', url: 'https://www.omio.com', official: false },
        ],
      },
    ],
  },
  'rome-venice': {
    name: '로마 ↔ 베네치아',
    distance: '525km',
    options: [
      {
        type: 'train-highspeed',
        provider: 'Trenitalia Frecciarossa',
        duration: '3시간 45분',
        priceRange: '€30~130',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: '직행 매시 1회. 60일 전 〈Super Economy〉 €30부터',
        bookingSites: [
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/', official: true },
        ],
      },
      {
        type: 'train-highspeed',
        provider: 'Italo',
        duration: '3시간 45분',
        priceRange: '€28~120',
        urgency: 'medium',
        leadTimeDays: 60,
        notes: 'Italo도 직행 운행',
        bookingSites: [
          { name: 'Italo 공식', url: 'https://www.italotreno.com/en', official: true },
        ],
      },
      {
        type: 'flight',
        provider: '국내선 (보통 불필요)',
        duration: '1시간 15분 + 공항 2시간',
        priceRange: '€60~200',
        notes: '기차가 보통 더 빠름/편리. 비행기는 시간 절약 안 됨',
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
        notes: '기차 + 비행기 한 화면 비교',
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
          { name: 'Trenitalia 공식', url: 'https://www.trenitalia.com/', official: true },
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
  'medici-chapels': {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '미켈란젤로 4 알레고리 — 2주 전 예약 권장. 화요일 + 매월 둘째·넷째 일요일 휴관',
    sites: [
      { name: 'Bargello Museum 공식 (예약)', url: 'https://www.museodelbargello.it/', official: true },
      { name: 'B-Ticket (공식 위탁)', url: 'https://www.museodelbargello.it/', official: true },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=medici+chapels', official: false },
    ],
    tips: [
      '공식 €10 + 예약비 €3 = €13/인',
      '관람 동선 60~90분 (대공의 채플 + 신성구실)',
      '산 로렌초 마켓 점심과 묶기 — 도보 30초',
      '8:15 또는 9:00 슬롯이 한산',
      '매월 첫 일요일 무료 (예약 안 됨, 줄 길음)',
      '아카데미아 다비드 본 후 같은 날 추천 — 미켈란젤로 작품 연속',
    ],
  },
  'pitti-boboli': {
    urgency: 'medium',
    leadTimeDays: 14,
    notes: '통합권 €22 (피티 + 보볼리 + 가르덴, 3일 유효). 매월 첫째·마지막 월요일 휴관',
    sites: [
      { name: 'Uffizi Galleries 공식', url: 'https://www.uffizi.it/en/pitti-palace', official: true },
      { name: 'B-Ticket (공식 위탁)', url: 'https://www.uffizi.it/en/tickets', official: true },
      { name: 'GetYourGuide', url: 'https://www.getyourguide.com/florence-l44/', official: false },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=pitti+palace', official: false },
    ],
    tips: [
      '통합권 PassePartout €38 = Uffizi + Pitti + Boboli (5일 유효, 시간 여유 있을 때 가성비 ✓)',
      'Pitti 단독 €16 / Boboli 단독 €10 / 통합 €22',
      '팔라티나 갤러리 + 보볼리 정원 합쳐 3~4시간',
      '보볼리는 6만평 — 아이가 뛰어다닐 수 있는 유일한 박물관',
      '카발리에레 정원 일몰 시간(18~19시) 도시 전경 추천',
      '월요일은 첫째·마지막만 휴관 — 9/21은 셋째 월요일 = 개방 ✓',
    ],
  },
  brancacci: {
    urgency: 'high',
    leadTimeDays: 21,
    notes: '45분 시간 슬롯, 30명 제한 — 빠르게 매진. 화요일 휴관',
    sites: [
      { name: 'Cappella Brancacci 공식', url: 'https://musefirenze.it/en/museum/cappella-brancacci/', official: true },
      { name: 'Musei Civici Fiorentini', url: 'https://musefirenze.it/en/museum/cappella-brancacci/', official: true },
      { name: 'Tiqets', url: 'https://www.tiqets.com/en/search?q=brancacci', official: false },
    ],
    tips: [
      '공식 €10 — 45분 시간 슬롯 필수 예약',
      '한 슬롯 30명 제한 — 인기 시간 빨리 매진',
      '마사초 〈낙원 추방〉 + 〈세금 동전〉 = 르네상스 회화 시작점',
      '관람 동선 짧음 (45분 슬롯이면 충분)',
      '플래시 금지, 사진 가능',
      'Ponte Vecchio에서 도보 12분 — Oltrarno 깊은 곳',
      '미켈란젤로·다빈치·라파엘로가 청년 시기 〈수업〉했던 곳 — 미술사적 의미 큼',
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
// 이동 시간 추천 (앞뒤 일정 기반)
// ─────────────────────────────────────────────────────────

function parseTrainDurationMin(str) {
  // "1시간 32분" → 92, "2시간 5분" → 125
  const h = (str.match(/(\d+)\s*시간/) || [0, 0])[1];
  const m = (str.match(/(\d+)\s*분/) || [0, 0])[1];
  return parseInt(h) * 60 + parseInt(m);
}

function fmtTimeOfDay(totalMin) {
  // totalMin in minutes since 00:00 → "HH:MM"
  let m = Math.round(totalMin);
  // Handle next-day overflow
  if (m >= 24 * 60) m -= 24 * 60;
  if (m < 0) m += 24 * 60;
  const h = Math.floor(m / 60);
  const mm = m % 60;
  return `${String(h).padStart(2, '0')}:${String(mm).padStart(2, '0')}`;
}

function estimateDayEndMin(day, findAttraction) {
  // Returns minutes since 00:00 for estimated end of day's activities
  if (!day.attractionIds.length) return 9 * 60; // empty day → 09:00
  const startMin = 9 * 60; // default day start
  let total = 0;
  day.attractionIds.forEach((aid, i) => {
    const a = findAttraction(aid);
    const dur = a?.overview?.duration_min ?? 90;
    total += dur;
    if (i > 0) total += 30; // transit/break between attractions
  });
  // Lunch break if > 4h activities
  if (total > 240) total += 60;
  return Math.min(20 * 60, startMin + total);
}

function estimateDayStartMin(day, findAttraction) {
  // Default 09:00 (most museums open 08:15~10:00, default to 09:00)
  return 9 * 60;
}

// Returns suggested departure timing for transit between consecutive days
// Handles 3 cases:
// 1. same-day-during: transitDay has activities in BOTH cities (transit happens midday on transitDay)
// 2. same-day-evening: prevDay ends early (<=16:00), travel evening of prevDay
// 3. overnight-morning: prevDay ends late, travel next morning
export function getTransitTiming(prevDay, transitDay, transitInfo, findAttraction) {
  if (!transitInfo) return null;

  // Identify dominant cities
  const dominantCity = (day) => {
    if (!day.attractionIds.length) return null;
    const counts = {};
    day.attractionIds.forEach((id) => {
      const c = findAttraction(id)?.city;
      if (c) counts[c] = (counts[c] || 0) + 1;
    });
    return Object.entries(counts).sort((a, b) => b[1] - a[1])[0]?.[0] || null;
  };
  const prevCity = dominantCity(prevDay);
  const newCity = dominantCity(transitDay);
  if (!prevCity || !newCity || prevCity === newCity) return null;

  // Fastest train duration
  const trainOpts = transitInfo.options.filter(o =>
    (o.type || '').includes('train') ||
    /Trenitalia|Italo/.test(o.provider || '')
  );
  if (!trainOpts.length) return null;
  const trainMin = Math.min(...trainOpts.map(o => parseTrainDurationMin(o.duration)));

  const checkoutBuffer = 60; // 1h: hotel checkout + station transfer
  const arrivalBuffer = 60;  // 1h: station + check-in + transit to first attraction

  // Case 1: SAME-DAY-DURING transit on transitDay (mixed cities)
  const prevCityAttrsOnTransitDay = transitDay.attractionIds.filter(
    id => findAttraction(id)?.city === prevCity
  );
  if (prevCityAttrsOnTransitDay.length > 0) {
    let morningMin = 0;
    prevCityAttrsOnTransitDay.forEach((aid, i) => {
      const a = findAttraction(aid);
      morningMin += a?.overview?.duration_min ?? 90;
      if (i > 0) morningMin += 30;
    });
    const morningEnd = 9 * 60 + morningMin;
    const earliestDep = morningEnd + checkoutBuffer;
    const recDep = Math.max(earliestDep, 11 * 60); // not before 11
    const recArr = recDep + trainMin;
    return {
      feasible: 'ok',
      mode: '같은 날 오전→오후',
      morningEndStr: fmtTimeOfDay(morningEnd),
      trainMin,
      depRecommended: fmtTimeOfDay(recDep),
      arrRecommended: fmtTimeOfDay(recArr),
      message: `오전 일정 ${fmtTimeOfDay(morningEnd)} 종료 후 1시간 여유로 ${fmtTimeOfDay(recDep)} 열차 권장`,
      warning: morningEnd >= 14 * 60 ? '오전 일정이 길어 오후 일정 시간 빠듯' : null,
    };
  }

  // Case 2 or 3: transitDay has only newCity attractions
  // Decide: same-day evening of prevDay OR next-morning of transitDay
  const prevEnd = estimateDayEndMin(prevDay, findAttraction);
  const nextStart = 9 * 60; // default 09:00

  if (prevEnd > 16 * 60) {
    // Prev day ends late → overnight, travel next morning
    const morningDep = Math.max(7 * 60, nextStart - arrivalBuffer - trainMin);
    return {
      feasible: 'overnight',
      mode: '다음 날 아침',
      prevEndStr: fmtTimeOfDay(prevEnd),
      trainMin,
      depRecommended: fmtTimeOfDay(morningDep),
      arrRecommended: fmtTimeOfDay(morningDep + trainMin),
      message: `이전 일정 ${fmtTimeOfDay(prevEnd)} 종료 → 호텔 1박 → 다음 날 ${fmtTimeOfDay(morningDep)} 열차`,
      warning: prevEnd > 19 * 60 ? '이전 일정 매우 늦게 종료' : null,
    };
  }

  // Prev ends early afternoon → travel same evening (more time on prev day to do final things)
  const eveningDep = Math.max(prevEnd + checkoutBuffer, 13 * 60);
  return {
    feasible: 'ok',
    mode: '이전 일정 후 오후',
    prevEndStr: fmtTimeOfDay(prevEnd),
    trainMin,
    depRecommended: fmtTimeOfDay(eveningDep),
    arrRecommended: fmtTimeOfDay(eveningDep + trainMin),
    message: `이전 일정 ${fmtTimeOfDay(prevEnd)} 종료 → ${fmtTimeOfDay(eveningDep)} 열차 → ${fmtTimeOfDay(eveningDep + trainMin)} 도착`,
    warning: null,
  };
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

  // 메디치 채플: 화요일 + 둘째·넷째 일요일 휴관
  'medici-chapels': (d) => {
    const dd = new Date(d);
    const wd = dd.getDay();
    if (wd === 2) return { status: 'closed', notes: '화요일 휴관' };
    if (wd === 0) {
      const sundayIdx = Math.ceil(dd.getDate() / 7);
      if (sundayIdx === 2 || sundayIdx === 4) {
        return { status: 'closed', notes: '둘째·넷째 일요일 휴관' };
      }
    }
    return null;
  },

  // 피티/보볼리: 매월 첫째·마지막 월요일 휴관
  'pitti-boboli': (d) => {
    const dd = new Date(d);
    if (dd.getDay() !== 1) return null;
    // 첫째 월요일
    const firstDayWeekday = new Date(dd.getFullYear(), dd.getMonth(), 1).getDay();
    const firstMonday = firstDayWeekday <= 1 ? 1 + (1 - firstDayWeekday) : 1 + (8 - firstDayWeekday);
    if (dd.getDate() === firstMonday) return { status: 'closed', notes: '첫째 월요일 휴관' };
    // 마지막 월요일
    const lastDay = new Date(dd.getFullYear(), dd.getMonth() + 1, 0);
    const lastDayWeekday = lastDay.getDay();
    const lastMonday = lastDay.getDate() - ((lastDayWeekday - 1 + 7) % 7);
    if (dd.getDate() === lastMonday) return { status: 'closed', notes: '마지막 월요일 휴관' };
    return null;
  },

  // 브란카치: 화요일 휴관
  brancacci: (d) => new Date(d).getDay() === 2 ? { status: 'closed', notes: '화요일 휴관' } : null,

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

// ─────────────────────────────────────────────────────────
// 명소 지역 클러스터 — 도시 안 보행 거리 그룹
// ─────────────────────────────────────────────────────────
const CLUSTERS = {
  // 로마
  'rome-centro': { name: '로마 중심부', ids: ['pantheon', 'navona', 'trevi', 'spagna', 'popolo'] },
  'rome-colosseo': { name: '콜로세움 권역', ids: ['colosseum', 'foro', 'capitolini', 'vincoli'] },
  'rome-vaticano': { name: '바티칸 권역', ids: ['vatican', 'castel'] },
  'rome-borghese': { name: '보르게세 권역', ids: ['borghese'] },
  // 피렌체 (모두 도보 20분 이내)
  'flo-duomo': { name: '두오모 권역', ids: ['duomo', 'bargello'] },
  'flo-signoria': { name: '시뇨리아 권역', ids: ['vecchio', 'uffizi'] },
  'flo-accademia': { name: '아카데미아 권역', ids: ['accademia'] },
  'flo-croce': { name: '산타 크로체 권역', ids: ['santacroce'] },
  'flo-san-lorenzo': { name: '산 로렌초 권역', ids: ['medici-chapels', 'san-lorenzo-market'] },
  'flo-oltrarno': { name: 'Oltrarno 권역', ids: ['pitti-boboli', 'brancacci', 'oltrarno', 'ponte-vecchio'] },
  // 밀라노
  'mil-centro': { name: '두오모 권역', ids: ['duomo-milan', 'galleria-scala', 'sforzesco'] },
  'mil-brera': { name: '브레라 권역', ids: ['brera'] },
  'mil-cenacolo': { name: '체나콜로 권역', ids: ['cenacolo'] },
  // 베네치아
  'ven-san-marco': { name: '산마르코 권역', ids: ['san-marco', 'palazzo-ducale'] },
  'ven-rialto': { name: '리알토 권역', ids: ['rialto'] },
  'ven-islands': { name: '무라노·부라노 (섬)', ids: ['murano-burano'] },
  'ven-gondola': { name: '곤돌라 (대운하)', ids: ['gondola'] },
};

export function getCluster(attractionId) {
  for (const [key, info] of Object.entries(CLUSTERS)) {
    if (info.ids.includes(attractionId)) return { key, ...info };
  }
  return null;
}

// ─────────────────────────────────────────────────────────
// 일별 분석 — issues + score
// ─────────────────────────────────────────────────────────
// severity: 'error' (-30), 'warning' (-15), 'info' (-5)
export function analyzeDay(day, getAttraction) {
  const issues = [];
  const attractions = day.attractionIds.map(getAttraction).filter(Boolean);
  
  if (!attractions.length) {
    return { score: null, issues: [], totalMin: 0, clusterCount: 0 };
  }

  // 1. 휴관 충돌 (error)
  attractions.forEach((a) => {
    const closure = getClosureStatus(a.id, day.date);
    if (closure?.status === 'closed') {
      issues.push({ severity: 'error', type: 'closed', text: `${a.name} 휴관일에 배정됨 — ${closure.notes}` });
    }
  });

  // 2. 시간 배분
  const totalMin = attractions.reduce((s, a) => s + (a.overview?.duration_min || 60), 0);
  if (totalMin > 480) {
    issues.push({ severity: 'warning', type: 'time-over', text: `예상 ${Math.round(totalMin / 60)}시간 — 너무 빡빡함, 일부 다른 날로 옮기는 게 좋음` });
  } else if (totalMin > 360 && attractions.length >= 4) {
    issues.push({ severity: 'info', type: 'time-tight', text: `예상 ${Math.round(totalMin / 60)}시간 — 적당히 빡빡함` });
  } else if (totalMin < 120) {
    issues.push({ severity: 'info', type: 'time-under', text: `예상 ${Math.round(totalMin / 60)}시간 — 추가 명소 여유 있음` });
  }

  // 3. 도시 혼합 (warning)
  const cityCounts = {};
  attractions.forEach((a) => { cityCounts[a.city] = (cityCounts[a.city] || 0) + 1; });
  if (Object.keys(cityCounts).length > 1) {
    const cities = Object.keys(cityCounts).map((c) => ({ rome: '로마', florence: '피렌체', milan: '밀라노' }[c] || c)).join(' + ');
    issues.push({ severity: 'warning', type: 'city-mix', text: `한 날에 두 도시 (${cities}) — 도시간 이동 시간 별도 계산 필요` });
  }

  // 4. 클러스터 분산
  const clusters = new Set();
  attractions.forEach((a) => {
    const c = getCluster(a.id);
    if (c) clusters.add(c.key);
  });
  if (clusters.size >= 3) {
    const names = Array.from(clusters).map((k) => {
      for (const [key, info] of Object.entries(CLUSTERS)) if (key === k) return info.name;
      return k;
    }).join(' · ');
    issues.push({ severity: 'warning', type: 'spread', text: `${clusters.size}개 지역 분산 (${names}) — 이동 시간 많이 잡힘` });
  } else if (clusters.size === 2 && attractions.length >= 3) {
    issues.push({ severity: 'info', type: 'two-clusters', text: '2개 지역 — 적당한 분배' });
  }

  // 5. 예약 부담
  const critical = attractions.filter((a) => {
    const r = getReservationInfo(a.id);
    return r.urgency === 'critical' || r.urgency === 'high';
  });
  if (critical.length >= 2) {
    issues.push({ severity: 'info', type: 'multi-booking', text: `예약 필수 ${critical.length}곳 (${critical.map((a) => a.name).join(', ')}) — 시간 슬롯 겹치지 않게` });
  }

  // 점수 계산
  let score = 100;
  issues.forEach((i) => {
    if (i.severity === 'error') score -= 30;
    else if (i.severity === 'warning') score -= 15;
    else if (i.severity === 'info') score -= 3;
  });
  score = Math.max(0, score);

  return { score, issues, totalMin, clusterCount: clusters.size, attractionCount: attractions.length };
}

// 전체 트립 분석
export function analyzeTrip(trip, getAttraction) {
  if (!trip || !trip.days) return null;
  const dayAnalyses = trip.days.map((d) => analyzeDay(d, getAttraction));
  const validScores = dayAnalyses.filter((d) => d.score !== null).map((d) => d.score);
  const avgScore = validScores.length ? Math.round(validScores.reduce((s, n) => s + n, 0) / validScores.length) : null;
  
  const emptyDays = dayAnalyses.filter((d) => d.score === null).length;
  const totalIssues = dayAnalyses.reduce((s, d) => s + d.issues.length, 0);
  const errorCount = dayAnalyses.reduce((s, d) => s + d.issues.filter((i) => i.severity === 'error').length, 0);
  const warningCount = dayAnalyses.reduce((s, d) => s + d.issues.filter((i) => i.severity === 'warning').length, 0);
  
  return {
    score: avgScore,
    dayAnalyses,
    emptyDays,
    totalIssues,
    errorCount,
    warningCount,
  };
}

// ─────────────────────────────────────────────────────────
// 어린이 동반 모드 — 명소별 아이 친화도 (1=힘듦 ~ 5=즐김)
// ─────────────────────────────────────────────────────────
export const KID_FRIENDLY = {
  // 로마
  colosseum: 5, foro: 4, capitolini: 4, vincoli: 3,
  vatican: 4, castel: 5,
  borghese: 3,
  pantheon: 4, trevi: 5, navona: 5, spagna: 4, popolo: 3,
  // 피렌체
  uffizi: 2, accademia: 3, vecchio: 4, bargello: 3, santacroce: 3, duomo: 4,
  'medici-chapels': 3, 'pitti-boboli': 5, brancacci: 2,
  'ponte-vecchio': 5, 'san-lorenzo-market': 5, oltrarno: 4,
  // 밀라노
  cenacolo: 3, 'duomo-milan': 5, sforzesco: 4, 'galleria-scala': 4, brera: 2,
  // 베네치아
  'san-marco': 5, 'palazzo-ducale': 4, rialto: 4, 'murano-burano': 5, gondola: 5,
};

export function getKidFriendly(attractionId) {
  return KID_FRIENDLY[attractionId] ?? 3;
}

// "큰 박물관" — 한 날에 여러 개 있으면 아이 부담 가중
export const MAJOR_MUSEUM = new Set([
  'vatican', 'uffizi', 'borghese', 'accademia', 'brera',
  'capitolini', 'bargello', 'cenacolo',
  'medici-chapels', 'pitti-boboli',  // 피렌체 추가
  'palazzo-ducale',  // 베네치아
]);

// 어린이 모드 일별 분석 — analyzeDay 결과 위에 추가 이슈 + 점수 조정
export function analyzeDayKidMode(day, getAttraction, baseAnalysis) {
  const attractions = day.attractionIds.map(getAttraction).filter(Boolean);
  if (!attractions.length) return baseAnalysis;

  const extraIssues = [];
  let extraPenalty = 0;

  // 1. 큰 박물관 개수 — 아이는 박물관 하루 1개가 이상적, 2개도 빡빡
  const majors = attractions.filter((a) => MAJOR_MUSEUM.has(a.id));
  if (majors.length >= 3) {
    extraIssues.push({
      severity: 'error',
      type: 'kid-too-many-museums',
      text: `🧒 주요 박물관 ${majors.length}곳 (${majors.map((a) => a.name).join('·')}) — 아이 동반 시 박물관 하루 1곳이 이상적`,
    });
    extraPenalty += 35;
  } else if (majors.length === 2) {
    extraIssues.push({
      severity: 'warning',
      type: 'kid-two-museums',
      text: `🧒 주요 박물관 2곳 (${majors.map((a) => a.name).join('·')}) — 사이에 광장·분수 같은 가벼운 곳 끼워 넣으면 아이가 덜 지침`,
    });
    extraPenalty += 18;
  }

  // 2. 총 시간 — 아이는 6시간 이상부터 무리
  const totalMin = baseAnalysis.totalMin || 0;
  if (totalMin > 420) {
    extraIssues.push({
      severity: 'warning',
      type: 'kid-time-over',
      text: `🧒 ${Math.round(totalMin / 60)}시간 — 아이 동반 시 6시간 이하 권장. 점심 + 휴식 시간 별도 확보`,
    });
    extraPenalty += 18;
  } else if (totalMin > 330 && majors.length >= 2) {
    extraIssues.push({
      severity: 'info',
      type: 'kid-time-museum',
      text: `🧒 박물관 위주로 ${Math.round(totalMin / 60)}시간 — 중간 1시간 점심 + 아이스크림 휴식 꼭`,
    });
    extraPenalty += 5;
  }

  // 3. 평균 아이 친화도 — 다 지루한 거만 모인 날
  const avgKid = attractions.reduce((s, a) => s + getKidFriendly(a.id), 0) / attractions.length;
  if (avgKid < 2.5) {
    extraIssues.push({
      severity: 'warning',
      type: 'kid-friendliness',
      text: `🧒 평균 친화도 ${avgKid.toFixed(1)}/5 — 아이가 지루해할 일정. 트레비·나보나·옥상 같은 즐길 거 추가`,
    });
    extraPenalty += 15;
  } else if (avgKid >= 4) {
    extraIssues.push({
      severity: 'info',
      type: 'kid-friendly',
      text: `🧒 평균 친화도 ${avgKid.toFixed(1)}/5 — 아이가 좋아할 일정 ✨`,
    });
    // 보너스 (음의 페널티)
    extraPenalty -= 5;
  }

  // 4. 클러스터 분산 — 아이는 도보 이동 부담 큼
  const clusters = baseAnalysis.clusterCount || 0;
  if (clusters >= 3) {
    extraIssues.push({
      severity: 'warning',
      type: 'kid-spread',
      text: `🧒 ${clusters}개 지역 분산 — 아이는 긴 도보·지하철 이동에 빨리 지침`,
    });
    extraPenalty += 12;
  }

  // 5. 체나콜로 + 다른 박물관 같은 날 — 15분 슬롯 시간 압박
  if (day.attractionIds.includes('cenacolo') && majors.length >= 2) {
    extraIssues.push({
      severity: 'warning',
      type: 'kid-cenacolo-tight',
      text: `🧒 체나콜로(15분 슬롯) + 다른 큰 박물관 — 슬롯 시간 늦으면 아이 점심이 늦어짐. 슬롯을 오전 첫 타임으로 잡기`,
    });
    extraPenalty += 10;
  }

  // 새 점수 = 기존 점수 - 추가 페널티 (보너스는 더하기)
  const newScore = Math.max(0, Math.min(100, (baseAnalysis.score ?? 100) - extraPenalty));

  return {
    ...baseAnalysis,
    score: newScore,
    issues: [...baseAnalysis.issues, ...extraIssues],
    avgKidFriendly: Math.round(avgKid * 10) / 10,
    majorMuseumCount: majors.length,
  };
}

// kidMode 옵션 받는 analyzeTrip
export function analyzeTripWithMode(trip, getAttraction, { kidMode = false } = {}) {
  if (!trip || !trip.days) return null;
  const dayAnalyses = trip.days.map((d) => {
    const base = analyzeDay(d, getAttraction);
    return kidMode ? analyzeDayKidMode(d, getAttraction, base) : base;
  });
  const validScores = dayAnalyses.filter((d) => d.score !== null).map((d) => d.score);
  const avgScore = validScores.length ? Math.round(validScores.reduce((s, n) => s + n, 0) / validScores.length) : null;

  const emptyDays = dayAnalyses.filter((d) => d.score === null).length;
  const errorCount = dayAnalyses.reduce((s, d) => s + d.issues.filter((i) => i.severity === 'error').length, 0);
  const warningCount = dayAnalyses.reduce((s, d) => s + d.issues.filter((i) => i.severity === 'warning').length, 0);

  return { score: avgScore, dayAnalyses, emptyDays, errorCount, warningCount, kidMode };
}

const KID_MODE_KEY = 'docent:kid-mode';

export function loadKidMode() {
  try {
    return localStorage.getItem(KID_MODE_KEY) === '1';
  } catch (e) { return false; }
}

export function saveKidMode(v) {
  try {
    if (v) localStorage.setItem(KID_MODE_KEY, '1');
    else localStorage.removeItem(KID_MODE_KEY);
  } catch (e) {}
}

// ─────────────────────────────────────────────────────────
// 정확한 예약 오픈 일정
// ─────────────────────────────────────────────────────────

// 체나콜로 분기별 출시 (이탈리아 시간 화요일 정오)
const CENACOLO_RELEASES = [
  { date: '2026-03-24', covers: { startMonth: 5, endMonth: 8, year: 2026 }, notes: '5~8월 분량 (3/24 정오 이탈리아 시간 출시 — 이미 풀림)' },
  { date: '2026-06-23', covers: { startMonth: 9, endMonth: 12, year: 2026 }, notes: '9~12월 분량 — 6/23(화) 추정, 정확한 날짜는 6/20 즈음 공식 사이트 재확인' },
  { date: '2026-09-22', covers: { startMonth: 1, endMonth: 4, year: 2027 }, notes: '2027년 1~4월 분량 (추정)' },
  { date: '2026-12-22', covers: { startMonth: 5, endMonth: 8, year: 2027 }, notes: '2027년 5~8월 분량 (추정)' },
];

// 예약 오픈 시점 반환: { date, type, notes }
export function getBookingOpenInfo(attractionId, visitDateStr) {
  if (!visitDateStr) return null;
  const visitDate = new Date(visitDateStr);
  const visitMonth = visitDate.getMonth() + 1;
  const visitYear = visitDate.getFullYear();
  const today = new Date(); today.setHours(0, 0, 0, 0);

  // 체나콜로 특수 패턴
  if (attractionId === 'cenacolo') {
    const release = CENACOLO_RELEASES.find((r) =>
      r.covers.year === visitYear &&
      visitMonth >= r.covers.startMonth &&
      visitMonth <= r.covers.endMonth
    );
    if (release) {
      const releaseDate = new Date(release.date);
      if (releaseDate < today) {
        // 출시일 지남 → 즉시 예매 권장
        return { date: today.toISOString().slice(0, 10), type: 'past-now', notes: '출시일 지남 — 즉시 공식 사이트 확인 + 백업으로 매주 수요일 정오 추가 분량' };
      }
      return { date: release.date, type: 'quarterly', notes: release.notes };
    }
    return null;
  }

  // 그 외: leadTimeDays 기반
  const info = RESERVATION_INFO[attractionId];
  if (!info || !info.leadTimeDays) return null;
  const open = new Date(visitDate);
  open.setDate(open.getDate() - info.leadTimeDays);
  if (open < today) {
    return { date: today.toISOString().slice(0, 10), type: 'today', notes: `방문 ${info.leadTimeDays}일 전 권장 시점이 이미 지남 — 즉시 예약` };
  }
  return { date: open.toISOString().slice(0, 10), type: 'lead-time', notes: `방문 ${info.leadTimeDays}일 전 권장 예약 시점` };
}

// 새 attractionReminderUrl — 정확한 출시 일정 사용
export function attractionReminderUrlV2(attractionName, visitDate, attractionId, primaryBookingUrl) {
  const open = getBookingOpenInfo(attractionId, visitDate);
  if (!open) return null;
  return buildCalendarUrl({
    title: `🎫 예약: ${attractionName}`,
    date: open.date,
    details: `${open.notes}\n\n예약 사이트: ${primaryBookingUrl || ''}`,
    location: primaryBookingUrl || '',
  });
}

// 방문 시간 캘린더 이벤트 (실제 입장 슬롯)
export function visitCalendarUrl(attractionName, visitDate, visitTime, durationMin, confirmation, location) {
  if (!visitDate || !visitTime) return null;
  // 종일이 아닌 시간 지정 이벤트
  const [hh, mm] = visitTime.split(':');
  const start = new Date(visitDate);
  start.setHours(parseInt(hh), parseInt(mm), 0, 0);
  const end = new Date(start.getTime() + (durationMin || 60) * 60 * 1000);
  const fmt = (d) => {
    const y = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, '0');
    const da = String(d.getDate()).padStart(2, '0');
    const h = String(d.getHours()).padStart(2, '0');
    const mi = String(d.getMinutes()).padStart(2, '0');
    return `${y}${mo}${da}T${h}${mi}00`;
  };
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `🎫 ${attractionName} 입장`,
    dates: `${fmt(start)}/${fmt(end)}`,
  });
  const details = [
    confirmation ? `확인번호: ${confirmation}` : '',
    durationMin ? `소요 시간: ${durationMin}분` : '',
    '도착 30분 전 처리 권장',
  ].filter(Boolean).join('\n');
  if (details) params.set('details', details);
  if (location) params.set('location', location);
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
}

// ─────────────────────────────────────────────────────────
// 예약 상태 추적
// ─────────────────────────────────────────────────────────
// 상태: 'unbooked' | 'reminder-set' | 'booked' | 'cancelled'
// trip.bookings[attractionId] = { status, ... }

export function getBookingStatus(trip, attractionId) {
  if (!trip || !trip.bookings) return 'unbooked';
  return trip.bookings[attractionId]?.status || 'unbooked';
}

export function getBookingData(trip, attractionId) {
  if (!trip || !trip.bookings) return null;
  return trip.bookings[attractionId] || null;
}

export function updateBooking(trip, attractionId, patch) {
  const newBookings = { ...(trip.bookings || {}) };
  if (patch === null) {
    delete newBookings[attractionId];
  } else {
    newBookings[attractionId] = { ...(newBookings[attractionId] || {}), ...patch };
  }
  return { ...trip, bookings: newBookings };
}

// ─────────────────────────────────────────────────────────
// 트립 공유 URL (base64 인코딩, 개인 정보 제외)
// ─────────────────────────────────────────────────────────
// 공유 시 booking 정보 (확인번호 등) 제외 → 일정 + 명소만
export function encodeTripForShare(trip) {
  if (!trip) return '';
  const shareable = {
    startDate: trip.startDate,
    endDate: trip.endDate,
    days: trip.days.map((d) => ({ date: d.date, attractionIds: d.attractionIds })),
  };
  const json = JSON.stringify(shareable);
  // URL-safe base64
  return btoa(unescape(encodeURIComponent(json)))
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '');
}

export function decodeTripFromShare(encoded) {
  try {
    const padded = encoded.replace(/-/g, '+').replace(/_/g, '/');
    const json = decodeURIComponent(escape(atob(padded)));
    const data = JSON.parse(json);
    if (!data.startDate || !Array.isArray(data.days)) return null;
    return { ...data, bookings: {} };
  } catch (e) {
    return null;
  }
}

export function buildShareUrl(trip) {
  const encoded = encodeTripForShare(trip);
  const base = window.location.origin + window.location.pathname;
  return `${base}?trip=${encoded}`;
}

// ─────────────────────────────────────────────────────────
// .ics 내보내기 (iCalendar RFC 5545)
// ─────────────────────────────────────────────────────────
function icsEscape(s) {
  return String(s || '').replace(/[\\;,]/g, (m) => '\\' + m).replace(/\n/g, '\\n');
}

function icsDate(dateStr, allDay = true) {
  const d = new Date(dateStr);
  const y = d.getFullYear();
  const mo = String(d.getMonth() + 1).padStart(2, '0');
  const da = String(d.getDate()).padStart(2, '0');
  if (allDay) return `${y}${mo}${da}`;
  return `${y}${mo}${da}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
}

function icsEvent({ uid, summary, description, location, startDate, endDate, allDay, dtStart, dtEnd }) {
  const stamp = new Date().toISOString().replace(/[-:]/g, '').replace(/\.\d{3}/, '');
  const lines = [
    'BEGIN:VEVENT',
    `UID:${uid}@docent-tau.vercel.app`,
    `DTSTAMP:${stamp}`,
  ];
  if (allDay) {
    lines.push(`DTSTART;VALUE=DATE:${icsDate(startDate, true)}`);
    if (endDate) {
      const end = new Date(endDate);
      end.setDate(end.getDate() + 1);
      lines.push(`DTEND;VALUE=DATE:${icsDate(end.toISOString().slice(0, 10), true)}`);
    }
  } else if (dtStart) {
    lines.push(`DTSTART:${dtStart}`);
    if (dtEnd) lines.push(`DTEND:${dtEnd}`);
  }
  lines.push(`SUMMARY:${icsEscape(summary)}`);
  if (description) lines.push(`DESCRIPTION:${icsEscape(description)}`);
  if (location) lines.push(`LOCATION:${icsEscape(location)}`);
  lines.push('END:VEVENT');
  return lines.join('\r\n');
}

export function generateICS(trip, findAttraction) {
  if (!trip || !trip.days) return null;
  const events = [];
  let uid = 0;

  // 1. 일정 전체 (all-day, 도시 표시)
  trip.days.forEach((day) => {
    if (!day.attractionIds.length) return;
    const cityCounts = {};
    const attrs = day.attractionIds.map(findAttraction).filter(Boolean);
    attrs.forEach((a) => { cityCounts[a.city] = (cityCounts[a.city] || 0) + 1; });
    const dominantCity = Object.entries(cityCounts).sort((a, b) => b[1] - a[1])[0]?.[0];
    const cityLabel = { rome: '로마', florence: '피렌체', milan: '밀라노' }[dominantCity] || '';
    const summary = `🗺 도슨트: ${cityLabel} (${attrs.length}곳)`;
    const description = attrs.map((a) => `${a.emoji} ${a.name}`).join('\n');
    events.push(icsEvent({
      uid: `day-${day.date}-${uid++}`,
      summary,
      description,
      startDate: day.date,
      allDay: true,
    }));
  });

  // 2. 예약 알람 + 방문 시간 이벤트
  trip.days.forEach((day) => {
    day.attractionIds.forEach((aid) => {
      const attr = findAttraction(aid);
      if (!attr) return;
      const res = getReservationInfo(aid);
      if (!res || res.urgency === 'none') return;
      const open = getBookingOpenInfo(aid, day.date);
      if (open && open.date) {
        events.push(icsEvent({
          uid: `book-${aid}-${day.date}-${uid++}`,
          summary: `🎫 예약: ${attr.name}`,
          description: open.notes,
          location: res.sites?.[0]?.url || '',
          startDate: open.date,
          allDay: true,
        }));
      }
      // 예약 완료된 경우 방문 시간 이벤트
      const booking = getBookingData(trip, aid);
      if (booking && booking.status === 'booked' && booking.slotTime) {
        const [hh, mm] = booking.slotTime.split(':');
        const start = new Date(day.date);
        start.setHours(parseInt(hh), parseInt(mm), 0, 0);
        const end = new Date(start.getTime() + (attr.overview?.duration_min || 60) * 60 * 1000);
        const fmt = (d) => `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, '0')}${String(d.getDate()).padStart(2, '0')}T${String(d.getHours()).padStart(2, '0')}${String(d.getMinutes()).padStart(2, '0')}00`;
        events.push(icsEvent({
          uid: `visit-${aid}-${day.date}-${uid++}`,
          summary: `🎫 ${attr.name} 입장`,
          description: [
            booking.confirmation ? `확인번호: ${booking.confirmation}` : '',
            booking.notes || '',
            '도착 30분 전 처리 권장',
          ].filter(Boolean).join('\n'),
          location: res.sites?.[0]?.url || '',
          allDay: false,
          dtStart: fmt(start),
          dtEnd: fmt(end),
        }));
      }
    });
  });

  // 3. 도시간 이동 알람 (60일 전)
  for (let i = 1; i < trip.days.length; i++) {
    const day = trip.days[i];
    const prev = trip.days[i - 1];
    if (!day.attractionIds.length || !prev.attractionIds.length) continue;
    const dayCity = (day.attractionIds.map((aid) => findAttraction(aid)?.city).filter(Boolean)[0]);
    const prevCity = (prev.attractionIds.map((aid) => findAttraction(aid)?.city).filter(Boolean)[0]);
    if (!dayCity || !prevCity || dayCity === prevCity) continue;
    const transit = getTransitInfo(prevCity, dayCity);
    if (!transit) continue;
    const remind = new Date(day.date);
    remind.setDate(remind.getDate() - 60);
    const today = new Date(); today.setHours(0, 0, 0, 0);
    if (remind < today) remind.setTime(today.getTime());
    events.push(icsEvent({
      uid: `transit-${i}-${uid++}`,
      summary: `🚆 예약: ${transit.name} (60일 전 권장)`,
      description: `${transit.distance} · 최저 ${transit.options[0]?.priceRange}\nTrenitalia/Italo 가격 비교: Trainline·Omio`,
      location: 'https://www.trenitalia.com/',
      startDate: remind.toISOString().slice(0, 10),
      allDay: true,
    }));
  }

  // 4. ICS 파일 wrapper
  const calendar = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//Docent//Italy Trip//KO',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:도슨트 이탈리아 여행 (${trip.startDate} ~ ${trip.endDate})`,
    'X-WR-TIMEZONE:Europe/Rome',
    ...events,
    'END:VCALENDAR',
  ].join('\r\n');

  return calendar;
}

export function downloadICS(trip, findAttraction) {
  const ics = generateICS(trip, findAttraction);
  if (!ics) return false;
  const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `docent-trip-${trip.startDate}.ics`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  setTimeout(() => URL.revokeObjectURL(url), 1000);
  return true;
}

// Web Share API (있으면 시스템 공유 시트, 없으면 클립보드)
export async function shareTrip(trip) {
  const url = buildShareUrl(trip);
  const text = `이탈리아 여행 일정 (${trip.startDate} ~ ${trip.endDate})`;
  try {
    if (navigator.share) {
      await navigator.share({ title: '도슨트 일정', text, url });
      return { method: 'share', url };
    }
    // 폴백: 클립보드
    await navigator.clipboard.writeText(url);
    return { method: 'clipboard', url };
  } catch (e) {
    // 사용자 취소 또는 실패
    return { method: 'failed', url, error: String(e) };
  }
}

// ─────────────────────────────────────────────────────────
// 체크리스트 모듈 — 예약 준비 추적
// ─────────────────────────────────────────────────────────
// trip.checklist = {
//   items: [{ id, label, category, dueDate, checked, notes, autoGenerated, sourceKey }],
//   lastAutoSyncAt: ISO string  // 마지막 자동 생성 시점
// }
//
// category: 'hotel' | 'train' | 'reservation' | 'custom'

export function getChecklist(trip) {
  if (!trip || !trip.checklist) return { items: [], lastAutoSyncAt: null };
  return trip.checklist;
}

export function generateChecklistItems(trip, findAttraction) {
  if (!trip || !trip.days) return [];
  const items = [];

  // 1. 호텔 — 도시 변화 감지 (체크인/체크아웃 블록 자동 추출)
  let currentCity = null;
  let blockStart = null;
  const cityLabel = (c) => ({ rome: '로마', florence: '피렌체', venice: '베네치아', milan: '밀라노' }[c] || c);
  const hotelBlocks = [];
  trip.days.forEach((day, idx) => {
    const cities = day.attractionIds.map((aid) => findAttraction(aid)?.city).filter(Boolean);
    const dominantCity = cities[0] || currentCity;
    if (dominantCity !== currentCity) {
      // 도시 전환 — 이전 블록 마감
      if (currentCity && blockStart !== null) {
        hotelBlocks.push({ city: currentCity, checkIn: trip.days[blockStart].date, checkOut: day.date });
      }
      currentCity = dominantCity;
      blockStart = idx;
    }
    // 마지막 일
    if (idx === trip.days.length - 1 && currentCity) {
      const checkOutDate = new Date(day.date);
      checkOutDate.setDate(checkOutDate.getDate() + 1);
      hotelBlocks.push({ city: currentCity, checkIn: trip.days[blockStart].date, checkOut: checkOutDate.toISOString().slice(0, 10) });
    }
  });

  hotelBlocks.forEach((hb, idx) => {
    items.push({
      id: `auto-hotel-${hb.city}-${idx}`,
      label: `호텔 — ${cityLabel(hb.city)}`,
      category: 'hotel',
      dueDate: null,
      checked: false,
      notes: `${hb.checkIn} 체크인 ~ ${hb.checkOut} 체크아웃`,
      autoGenerated: true,
      sourceKey: `hotel:${hb.city}:${hb.checkIn}`,
    });
  });

  // 2. 도시간 기차 (transit)
  for (let i = 1; i < trip.days.length; i++) {
    const prev = trip.days[i - 1];
    const day = trip.days[i];
    const prevCity = prev.attractionIds.map((aid) => findAttraction(aid)?.city).filter(Boolean)[0];
    const dayCity = day.attractionIds.map((aid) => findAttraction(aid)?.city).filter(Boolean)[0];
    if (!prevCity || !dayCity || prevCity === dayCity) continue;
    const dueDate = new Date(day.date);
    dueDate.setDate(dueDate.getDate() - 60);
    items.push({
      id: `auto-train-${i}`,
      label: `기차 — ${cityLabel(prevCity)} → ${cityLabel(dayCity)}`,
      category: 'train',
      dueDate: dueDate.toISOString().slice(0, 10),
      checked: false,
      notes: `${day.date} 출발 (60일 전 예약 권장 — Super Economy €20부터)`,
      autoGenerated: true,
      sourceKey: `train:${prevCity}-${dayCity}:${day.date}`,
    });
  }

  // 3. 예약 필수 명소 (RESERVATION_INFO 기반)
  const seenAttractions = new Set();
  trip.days.forEach((day) => {
    day.attractionIds.forEach((aid) => {
      if (seenAttractions.has(aid)) return;
      seenAttractions.add(aid);
      const res = getReservationInfo(aid);
      if (!res || res.urgency === 'none') return;
      const attr = findAttraction(aid);
      if (!attr) return;
      const open = getBookingOpenInfo(aid, day.date);
      const urgencyLabel = {
        critical: '🔴 필수',
        high: '🟠 강력 권장',
        medium: '🟡 권장',
        low: '🟢 가벼움',
      }[res.urgency] || '';
      items.push({
        id: `auto-res-${aid}`,
        label: `${attr.emoji} ${attr.name} ${urgencyLabel}`,
        category: 'reservation',
        dueDate: open?.date || null,
        checked: false,
        notes: open?.notes || res.notes || '',
        autoGenerated: true,
        sourceKey: `reservation:${aid}`,
        attractionId: aid,
      });
    });
  });

  return items;
}

// 자동 항목 머지: 기존 user-customized 상태(checked, notes) 보존하면서 새로운 자동 항목 추가
export function mergeAutoChecklist(trip, findAttraction) {
  const current = getChecklist(trip);
  const autoItems = generateChecklistItems(trip, findAttraction);
  const oldByKey = new Map();
  current.items.forEach((item) => {
    if (item.autoGenerated && item.sourceKey) {
      oldByKey.set(item.sourceKey, item);
    }
  });
  const merged = [];
  // 새로운 자동 항목 (기존 상태 보존)
  autoItems.forEach((auto) => {
    const old = oldByKey.get(auto.sourceKey);
    if (old) {
      merged.push({ ...auto, checked: old.checked, notes: old.notes || auto.notes });
    } else {
      merged.push(auto);
    }
  });
  // 커스텀 항목 (autoGenerated=false) 그대로 유지
  current.items.forEach((item) => {
    if (!item.autoGenerated) merged.push(item);
  });
  return {
    ...trip,
    checklist: {
      items: merged,
      lastAutoSyncAt: new Date().toISOString(),
    },
  };
}

export function updateChecklistItem(trip, itemId, patch) {
  const current = getChecklist(trip);
  const newItems = current.items.map((item) =>
    item.id === itemId ? { ...item, ...patch } : item
  );
  return { ...trip, checklist: { ...current, items: newItems } };
}

export function addChecklistItem(trip, item) {
  const current = getChecklist(trip);
  const newItem = {
    id: `custom-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`,
    label: '',
    category: 'custom',
    dueDate: null,
    checked: false,
    notes: '',
    autoGenerated: false,
    ...item,
  };
  return { ...trip, checklist: { ...current, items: [...current.items, newItem] } };
}

export function removeChecklistItem(trip, itemId) {
  const current = getChecklist(trip);
  return { ...trip, checklist: { ...current, items: current.items.filter((i) => i.id !== itemId) } };
}

// 카테고리별 그룹화
export function groupChecklistByCategory(items) {
  const groups = { hotel: [], train: [], reservation: [], custom: [] };
  items.forEach((item) => {
    const cat = item.category || 'custom';
    if (!groups[cat]) groups[cat] = [];
    groups[cat].push(item);
  });
  // 카테고리 내부 정렬: 미체크 먼저, 그 다음 dueDate 오름차순
  Object.keys(groups).forEach((cat) => {
    groups[cat].sort((a, b) => {
      if (a.checked !== b.checked) return a.checked ? 1 : -1;
      if (a.dueDate && b.dueDate) return a.dueDate.localeCompare(b.dueDate);
      if (a.dueDate) return -1;
      if (b.dueDate) return 1;
      return 0;
    });
  });
  return groups;
}

// 완료율 계산
export function getChecklistProgress(items) {
  if (!items.length) return { total: 0, done: 0, pct: 0 };
  const done = items.filter((i) => i.checked).length;
  return { total: items.length, done, pct: Math.round((done / items.length) * 100) };
}
