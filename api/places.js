// Vercel Serverless Function: /api/places
// Redeploy trigger: 2026-05-21T11:44:10Z (env var refresh)
// Google Places API (New) 프록시 + 베이지안 가중 정렬
//
// 평점만 보면 신뢰도 낮은 곳이 위로 올라옴 (5점인데 리뷰 10개 같은).
// 베이지안 가중평균을 적용: (R*v + C*m) / (v+m)
//   R = 해당 가게 평점
//   v = 해당 가게 리뷰 수
//   C = 전체 결과의 평균 평점
//   m = 신뢰 임계값 (리뷰 수 기준, 100으로 설정)
// → 리뷰 수가 충분히 많아질수록 R에 가까워지고,
//   적을수록 전체 평균 C쪽으로 회귀해서 위로 못 올라옴.

export const config = { maxDuration: 30 };

// 한국어 검색어 → 영어/이탈리아어 매핑 (Google Places는 영어/이탈리아어 결과가 정확)
const CUISINE_QUERIES = {
  all: 'restaurant',
  italian: 'italian restaurant trattoria',
  pasta: 'pasta restaurant',
  pizza: 'pizzeria',
  seafood: 'seafood restaurant pesce',
  gelato: 'gelateria',
  cafe: 'cafe coffee bar',
  wine: 'enoteca wine bar',
  steak: 'steakhouse bistecca',
};

const CUISINE_LABELS = {
  all: '전체', italian: '이탈리아', pasta: '파스타', pizza: '피자',
  seafood: '해산물', gelato: '젤라토', cafe: '카페', wine: '와인바', steak: '스테이크',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({
      error: 'GOOGLE_PLACES_API_KEY environment variable not set in Vercel',
    });
  }

  const { lat, lng, cuisine = 'all', radius = 1500 } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng (numbers) are required' });
  }

  const query = CUISINE_QUERIES[cuisine] || CUISINE_QUERIES.all;

  try {
    // Places API (New) — Text Search
    // Docs: https://developers.google.com/maps/documentation/places/web-service/text-search
    const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
        // 필요한 필드만 요청해서 비용 절감 (Field-Mask billing)
        'X-Goog-FieldMask': [
          'places.id',
          'places.displayName',
          'places.formattedAddress',
          'places.location',
          'places.rating',
          'places.userRatingCount',
          'places.priceLevel',
          'places.types',
          'places.primaryType',
          'places.primaryTypeDisplayName',
          'places.regularOpeningHours.openNow',
          'places.regularOpeningHours.weekdayDescriptions',
          'places.photos',
          'places.googleMapsUri',
          'places.websiteUri',
          'places.nationalPhoneNumber',
          'places.editorialSummary',
        ].join(','),
      },
      body: JSON.stringify({
        textQuery: query,
        locationBias: {
          circle: {
            center: { latitude: lat, longitude: lng },
            radius: Math.min(radius, 50000),
          },
        },
        maxResultCount: 20,
        languageCode: 'ko',
        rankPreference: 'RELEVANCE',
      }),
    });

    const data = await placesRes.json();

    if (!placesRes.ok) {
      console.error('[api/places] Google error:', placesRes.status, data);
      return res.status(placesRes.status).json({
        error: data.error?.message || 'Google Places API error',
        details: data,
      });
    }

    const rawPlaces = Array.isArray(data.places) ? data.places : [];

    // 평점·리뷰수 없는 항목 제외 (신뢰성 부족)
    const valid = rawPlaces.filter((p) => p.rating && p.userRatingCount);

    if (valid.length === 0) {
      return res.status(200).json({
        results: [],
        meta: { count: 0, cuisine, cuisineLabel: CUISINE_LABELS[cuisine] || cuisine },
      });
    }

    // 베이지안 가중평균 계산
    const M = 100; // 신뢰 임계값: 리뷰 100개 정도면 평점이 진짜에 가깝다고 가정
    const C = valid.reduce((s, p) => s + p.rating, 0) / valid.length;

    const ranked = valid
      .map((p) => {
        const R = p.rating;
        const v = p.userRatingCount;
        const weightedScore = (R * v + C * M) / (v + M);
        // 거리 계산 (haversine)
        const distance = haversineDistance(
          lat, lng,
          p.location.latitude, p.location.longitude
        );
        return {
          id: p.id,
          name: p.displayName?.text || '',
          address: p.formattedAddress || '',
          location: p.location,
          rating: R,
          userRatingCount: v,
          weightedScore: Math.round(weightedScore * 100) / 100,
          priceLevel: p.priceLevel || null,
          types: p.types || [],
          primaryType: p.primaryType || null,
          primaryTypeLabel: p.primaryTypeDisplayName?.text || null,
          openNow: p.regularOpeningHours?.openNow ?? null,
          hours: p.regularOpeningHours?.weekdayDescriptions || null,
          photos: (p.photos || []).slice(0, 3).map((ph) => ph.name),
          googleMapsUri: p.googleMapsUri || null,
          websiteUri: p.websiteUri || null,
          phone: p.nationalPhoneNumber || null,
          editorialSummary: p.editorialSummary?.text || null,
          distance,
        };
      })
      .sort((a, b) => b.weightedScore - a.weightedScore);

    res.status(200).json({
      results: ranked,
      meta: {
        count: ranked.length,
        cuisine,
        cuisineLabel: CUISINE_LABELS[cuisine] || cuisine,
        meanRating: Math.round(C * 100) / 100,
        threshold: M,
      },
    });
  } catch (err) {
    console.error('[api/places] error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

// haversine 거리 (m)
function haversineDistance(lat1, lng1, lat2, lng2) {
  const R = 6371000;
  const toRad = (d) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLng = toRad(lng2 - lng1);
  const a = Math.sin(dLat / 2) ** 2 +
            Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) *
            Math.sin(dLng / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}
