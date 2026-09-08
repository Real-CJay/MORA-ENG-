const crypto = require('crypto');

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

const RATE_LIMIT_WINDOW_MS = readPositiveIntegerEnv('JANUDA_RATE_LIMIT_WINDOW_MS', 60 * 1000);
const RATE_LIMIT_AUTH_MAX = readPositiveIntegerEnv('JANUDA_RATE_LIMIT_AUTH_MAX', 30);
const RATE_LIMIT_IP_MAX = readPositiveIntegerEnv('JANUDA_RATE_LIMIT_IP_MAX', 10);
const MAX_BODY_BYTES = 96 * 1024;
const MAX_SYSTEM_CHARS = 16000;
const MAX_USER_CHARS = 32000;

function readPositiveIntegerEnv(name, fallback) {
  const value = Number.parseInt(process.env[name] || '', 10);
  return Number.isFinite(value) && value > 0 ? value : fallback;
}

function sendJson(res, status, payload) {
  res.statusCode = status;
  res.setHeader('Content-Type', 'application/json; charset=utf-8');
  res.end(JSON.stringify(payload));
}

function getHeader(req, name) {
  const value = req.headers[name.toLowerCase()];
  return Array.isArray(value) ? value[0] : value;
}

function hashKey(value) {
  return crypto.createHash('sha256').update(String(value || 'unknown')).digest('hex');
}

async function getVerifiedSupabaseUserId(req) {
  const authorization = getHeader(req, 'authorization');
  if (!authorization || !/^Bearer\s+\S+$/i.test(authorization)) return null;
  const response = await fetch(process.env.SUPABASE_URL + '/auth/v1/user', {
    headers: { apikey: process.env.SUPABASE_SERVICE_ROLE_KEY, Authorization: authorization },
    signal: AbortSignal.timeout(5000)
  });
  if (response.status === 401 || response.status === 403) return null;
  if (!response.ok) throw new Error('Authentication service unavailable');
  const user = await response.json();
  return typeof user.id === 'string' ? user.id : null;
}

function getClientIp(req) {
  // Vercel overwrites forwarded headers. Outside Vercel trust only the socket.
  if (process.env.VERCEL === '1') {
    const ip = getHeader(req, 'x-vercel-forwarded-for') || getHeader(req, 'x-forwarded-for');
    if (ip) return ip.split(',')[0].trim();
  }
  return req.socket?.remoteAddress || 'unknown';
}

async function checkRateLimit(req) {
  if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) throw new Error('Rate limiter not configured');
  const userId = await getVerifiedSupabaseUserId(req);
  const limit = userId ? RATE_LIMIT_AUTH_MAX : RATE_LIMIT_IP_MAX;
  const response = await fetch(process.env.SUPABASE_URL + '/rest/v1/rpc/consume_rate_limit', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      apikey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      Authorization: 'Bearer ' + process.env.SUPABASE_SERVICE_ROLE_KEY
    },
    body: JSON.stringify({
      bucket_key: (userId ? 'user:' : 'ip:') + hashKey(userId || getClientIp(req)),
      window_ms: RATE_LIMIT_WINDOW_MS, max_requests: limit
    }),
    signal: AbortSignal.timeout(5000)
  });
  if (!response.ok) throw new Error('Rate limiter unavailable');
  const data = await response.json();
  if (typeof data.limited !== 'boolean' || !Number.isFinite(data.resetAt)) throw new Error('Invalid rate limiter response');
  return { ...data, retryAfterSeconds: Math.max(1, Math.ceil((data.resetAt - Date.now()) / 1000)) };
}

function setRateLimitHeaders(res, rateLimit) {
  res.setHeader('X-RateLimit-Limit', String(rateLimit.limit));
  res.setHeader('X-RateLimit-Remaining', String(rateLimit.remaining));
  res.setHeader('X-RateLimit-Reset', String(Math.ceil(rateLimit.resetAt / 1000)));
  if (rateLimit.limited) {
    res.setHeader('Retry-After', String(rateLimit.retryAfterSeconds));
  }
}

module.exports = async function handler(req, res) {
  if (req.method !== 'POST') {
    res.setHeader('Allow', 'POST');
    return sendJson(res, 405, { error: 'Method not allowed' });
  }

  let body;
  try {
    const raw = typeof req.body === 'string' ? req.body : JSON.stringify(req.body || {});
    if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) return sendJson(res, 413, { error: 'Request is too large.' });
    body = JSON.parse(raw);
  } catch {
    return sendJson(res, 400, { error: 'Invalid JSON body.' });
  }
  if (!body || typeof body !== 'object' || Array.isArray(body) ||
      typeof body.systemPrompt !== 'string' || typeof body.userPrompt !== 'string') {
    return sendJson(res, 400, { error: 'Prompts must be strings.' });
  }
  if (body.systemPrompt.length > MAX_SYSTEM_CHARS || body.userPrompt.length > MAX_USER_CHARS) {
    return sendJson(res, 413, { error: 'Prompt is too long.' });
  }
  if (!body.systemPrompt.trim() || !body.userPrompt.trim()) return sendJson(res, 400, { error: 'Missing prompt.' });
  let rateLimit;
  try { rateLimit = await checkRateLimit(req); }
  catch { return sendJson(res, 503, { error: 'AI is temporarily unavailable. Please retry later.' }); }
  setRateLimitHeaders(res, rateLimit);
  if (rateLimit.limited) {
    return sendJson(res, 429, {
      error: 'Januda Ayya is getting too many requests right now. Please wait and try again.',
      code: 'rate_limited',
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
  }

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
    headers['HTTP-Referer'] = 'https://moraquiz.app';
    headers['X-Title'] = provider.title;
  }

  try {
  const upstream = await fetch(provider.url, {
    signal: AbortSignal.timeout(30000),
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
      error: 'AI provider request failed. Please retry later.'
    });
  }

  return sendJson(res, 200, {
    text: data?.choices?.[0]?.message?.content || ''
  });
  } catch (error) {
    return sendJson(res, error.name === 'TimeoutError' || error.name === 'AbortError' ? 504 : 502, { error: 'AI provider did not respond. Please retry later.' });
  }
};
