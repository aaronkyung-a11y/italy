// Vercel Serverless Function: /api/places-photo
// Google Places API 사진 URL 프록시.
// 사진 URL에 API 키가 필요한데 클라이언트에 노출하지 않기 위해 서버에서 프록시.
//
// Vercel CDN 캐시 (Cache-Control)로 같은 사진 반복 호출 시 빠르고 비용 절감.

export const config = { maxDuration: 30 };

export default async function handler(req, res) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'GOOGLE_PLACES_API_KEY not set' });
  }

  const { name, max = '400' } = req.query;
  if (!name || typeof name !== 'string') {
    return res.status(400).json({ error: 'name parameter required' });
  }

  // 안전: name 형식은 "places/{place_id}/photos/{photo_reference}" 형태여야 함
  if (!name.startsWith('places/') || !name.includes('/photos/')) {
    return res.status(400).json({ error: 'invalid photo name format' });
  }

  const maxPx = Math.min(parseInt(max, 10) || 400, 1600);

  try {
    const url = `https://places.googleapis.com/v1/${name}/media?key=${apiKey}&maxHeightPx=${maxPx}&maxWidthPx=${maxPx}&skipHttpRedirect=true`;
    const r = await fetch(url);

    if (!r.ok) {
      const errText = await r.text().catch(() => '');
      return res.status(r.status).json({ error: `Photo fetch failed: ${r.status}`, details: errText.slice(0, 200) });
    }

    const data = await r.json();
    const photoUri = data.photoUri;
    if (!photoUri) {
      return res.status(404).json({ error: 'no photoUri in response' });
    }

    // photoUri는 lh3.googleusercontent.com 같은 실제 이미지 URL이라 그대로 리다이렉트
    res.setHeader('Cache-Control', 'public, max-age=86400, s-maxage=604800'); // 1d browser, 7d CDN
    res.redirect(302, photoUri);
  } catch (err) {
    console.error('[api/places-photo] error:', err);
    res.status(500).json({ error: err.message || 'Internal server error' });
  }
}
