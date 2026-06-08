const PROVIDERS = {
  qwen: {
    envKey: 'OPENROUTER_API_KEY',
    url: 'https://openrouter.ai/api/v1/chat/completions',
    model: 'qwen/qwen3-235b-a22b-2507',
    title: 'Mora Quiz Januda Ayya'
  },
  groq: {
    envKey: 'GROQ_API_KEY',
    url: 'https://api.groq.com/openai/v1/chat/completions',
    model: 'openai/gpt-oss-120b',
    title: 'Mora Quiz Januda Ayya'
  }
};

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  const body = typeof req.body === 'string' ? JSON.parse(req.body || '{}') : (req.body || {});
  const providerKey = body.provider === 'groq' ? 'groq' : 'qwen';
  const provider = PROVIDERS[providerKey];
  const apiKey = process.env[provider.envKey];

  if (!apiKey) {
    return sendJson(res, 500, { error: `${provider.envKey} is not configured in Vercel.` });
  }

  const systemPrompt = String(body.systemPrompt || '').trim();
  const userPrompt = String(body.userPrompt || '').trim();

  if (!systemPrompt || !userPrompt) {
    return sendJson(res, 400, { error: 'Missing prompt.' });
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${apiKey}`
  };

  if (providerKey === 'qwen') {
    headers['HTTP-Referer'] = req.headers.origin || 'https://moraquiz.app';
    headers['X-Title'] = provider.title;
  }

  const upstream = await fetch(provider.url, {
    method: 'POST',
    headers,
    body: JSON.stringify({
      model: provider.model,
      max_tokens: 1600,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: userPrompt }
      ]
    })
  });

  const data = await upstream.json().catch(() => ({}));

  if (!upstream.ok) {
    return sendJson(res, upstream.status, {
      error: data?.error?.message || data?.message || 'AI provider request failed.'
    });
  }

  return sendJson(res, 200, {
    text: data?.choices?.[0]?.message?.content || ''
  });
};
