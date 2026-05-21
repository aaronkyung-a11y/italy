// Vercel Serverless Function: /api/hotels
// Google Places API (New) — 숙소 검색 + 베이지안 가중 정렬.
// /api/places의 호텔 버전 (구조 동일, 검색어와 매핑만 다름).

export const config = { maxDuration: 30 };

const HOTEL_QUERIES = {
  all: 'hotel',
  luxury: 'luxury hotel 5 star',
  midrange: 'hotel 4 star',
  budget: 'budget hotel hostel',
  bnb: 'bed and breakfast guesthouse',
  apartment: 'apartment hotel residence',
};

const HOTEL_LABELS = {
  all: '전체', luxury: '럭셔리', midrange: '중급', budget: '저렴',
  bnb: 'B&B', apartment: '아파트',
};

export default async function handler(req, res) {
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    return res.status(200).end();
  }
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY env var not set' });

  const { lat, lng, type = 'all', radius = 3000 } = req.body || {};
  if (typeof lat !== 'number' || typeof lng !== 'number') {
    return res.status(400).json({ error: 'lat and lng (numbers) are required' });
  }

  const query = HOTEL_QUERIES[type] || HOTEL_QUERIES.all;

  try {
    const placesRes = await fetch('https://places.googleapis.com/v1/places:searchText', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Goog-Api-Key': apiKey,
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
      return res.status(placesRes.status).json({
        error: data.error?.message || 'Google Places API error',
        details: data,
      });
    }

    const rawPlaces = Array.isArray(data.places) ? data.places : [];
    const valid = rawPlaces.filter((p) => p.rating && p.userRatingCount);

    if (valid.length === 0) {
      return res.status(200).json({
        results: [],
        meta: { count: 0, type, typeLabel: HOTEL_LABELS[type] || type },
      });
    }

    // 베이지안 가중평균 (호텔은 리뷰 더 많아서 M을 200으로 — 신뢰도 임계값 높임)
    const M = 200;
    const C = valid.reduce((s, p) => s + p.rating, 0) / valid.length;

    const ranked = valid
      .map((p) => {
        const R = p.rating;
        const v = p.userRatingCount;
        const weightedScore = (R * v + C * M) / (v + M);
        const distance = haversineDistance(lat, lng, p.location.latitude, p.location.longitude);
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
          photos: (p.photos || []).slice(0, 5).map((ph) => ph.name),
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
        type,
        typeLabel: HOTEL_LABELS[type] || type,
        meanRating: Math.round(C * 100) / 100,
        threshold: M,
      },
    });
  } catch (err) {
    console.error('[api/hotels] error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}

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
