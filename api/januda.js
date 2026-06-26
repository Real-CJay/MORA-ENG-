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
const RATE_LIMIT_MAX_BUCKETS = readPositiveIntegerEnv('JANUDA_RATE_LIMIT_MAX_BUCKETS', 5000);
const rateLimitBuckets = new Map();

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

function toBase64Url(buffer) {
  return buffer.toString('base64').replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_');
}

function decodeBase64UrlJson(value) {
  const normalized = value.replace(/-/g, '+').replace(/_/g, '/');
  const padded = normalized + '='.repeat((4 - (normalized.length % 4)) % 4);
  return JSON.parse(Buffer.from(padded, 'base64').toString('utf8'));
}

function safeEqual(a, b) {
  const left = Buffer.from(String(a));
  const right = Buffer.from(String(b));
  return left.length === right.length && crypto.timingSafeEqual(left, right);
}

function getVerifiedSupabaseUserId(req) {
  const secret = process.env.SUPABASE_JWT_SECRET;
  if (!secret) return null;

  const authHeader = getHeader(req, 'authorization') || '';
  const match = authHeader.match(/^Bearer\s+(.+)$/i);
  if (!match) return null;

  const token = match[1].trim();
  const parts = token.split('.');
  if (parts.length !== 3) return null;

  try {
    const header = decodeBase64UrlJson(parts[0]);
    const payload = decodeBase64UrlJson(parts[1]);
    if (header.alg !== 'HS256') return null;

    const expectedSignature = toBase64Url(
      crypto.createHmac('sha256', secret).update(`${parts[0]}.${parts[1]}`).digest()
    );
    if (!safeEqual(expectedSignature, parts[2])) return null;
    if (payload.exp && Date.now() >= payload.exp * 1000) return null;
    return payload.sub ? String(payload.sub) : null;
  } catch {
    return null;
  }
}

function getClientIp(req) {
  const forwardedFor = getHeader(req, 'x-forwarded-for');
  if (forwardedFor) return forwardedFor.split(',')[0].trim();
  return getHeader(req, 'x-real-ip') || req.socket?.remoteAddress || 'unknown';
}

function getRateLimitIdentity(req) {
  const userId = getVerifiedSupabaseUserId(req);
  if (userId) {
    return {
      key: `user:${hashKey(userId)}`,
      limit: RATE_LIMIT_AUTH_MAX
    };
  }

  return {
    key: `ip:${hashKey(getClientIp(req))}`,
    limit: RATE_LIMIT_IP_MAX
  };
}

function cleanupRateLimitBuckets(now) {
  if (rateLimitBuckets.size <= RATE_LIMIT_MAX_BUCKETS) return;
  for (const [key, bucket] of rateLimitBuckets.entries()) {
    if (bucket.resetAt <= now) rateLimitBuckets.delete(key);
  }
}

function checkRateLimit(req) {
  const now = Date.now();
  cleanupRateLimitBuckets(now);

  const identity = getRateLimitIdentity(req);
  let bucket = rateLimitBuckets.get(identity.key);
  if (!bucket || bucket.resetAt <= now) {
    bucket = { count: 0, resetAt: now + RATE_LIMIT_WINDOW_MS };
    rateLimitBuckets.set(identity.key, bucket);
  }

  bucket.count += 1;
  const retryAfterSeconds = Math.max(1, Math.ceil((bucket.resetAt - now) / 1000));
  const remaining = Math.max(0, identity.limit - bucket.count);

  return {
    limited: bucket.count > identity.limit,
    limit: identity.limit,
    remaining,
    retryAfterSeconds,
    resetAt: bucket.resetAt
  };
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

  const rateLimit = checkRateLimit(req);
  setRateLimitHeaders(res, rateLimit);
  if (rateLimit.limited) {
    return sendJson(res, 429, {
      error: 'Januda Ayya is getting too many requests right now. Please wait and try again.',
      code: 'rate_limited',
      retryAfterSeconds: rateLimit.retryAfterSeconds
    });
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
