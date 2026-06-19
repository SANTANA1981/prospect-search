function createRateLimit({ windowMs = 60_000, max = 30 } = {}) {
  const hits = new Map();

  return function rateLimit(req, res, next) {
    const key = `${req.ip}:${req.baseUrl || ''}:${req.path || ''}`;
    const now = Date.now();
    const entry = hits.get(key);

    if (!entry || entry.expiresAt <= now) {
      hits.set(key, { count: 1, expiresAt: now + windowMs });
      return next();
    }

    if (entry.count >= max) {
      return res.status(429).json({ error: 'Too many requests' });
    }

    entry.count += 1;
    return next();
  };
}

module.exports = createRateLimit;
