// Vercel serverless function — Anthropic Claude API proxy
// Hides ANTHROPIC_API_KEY from client, used for content gen + Vision + Q&A

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return res.status(500).json({ error: 'API key not configured' });
  }

  try {
    const { messages, max_tokens = 1500, system } = req.body;

    const payload = {
      model: 'claude-sonnet-4-5-20250929',
      max_tokens,
      messages,
    };
    if (system) payload.system = system;

    const r = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json();
    if (!r.ok) {
      return res.status(r.status).json(data);
    }
    res.status(200).json(data);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
}
