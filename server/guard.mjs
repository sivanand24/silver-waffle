/**
 * Request guards shared by every API route: same-origin check and a small
 * fixed-window rate limiter. Kept dependency-free so it runs on Vercel
 * functions and in the local server alike.
 */

/** True when the request is not a cross-site browser request. */
export function isSameOrigin(req) {
  const origin = req.headers.origin;
  if (!origin) return true; // non-browser clients; the rate limiter still applies
  try {
    return new URL(origin).host === req.headers.host;
  } catch {
    return false;
  }
}

/**
 * Best-effort client key. On Vercel the platform overwrites x-forwarded-for,
 * so its first entry is the real client; locally the socket address is used.
 */
export function clientKey(req, env = process.env) {
  const forwarded = env.VERCEL
    ? String(req.headers["x-forwarded-for"] || "")
        .split(",")[0]
        .trim()
    : "";
  return forwarded || req.socket?.remoteAddress || "local";
}

/**
 * Fixed-window limiter held in instance memory (documented limitation: a
 * multi-instance deployment needs a shared store). Expired entries are swept
 * at most once per second, and each entry also checks its own expiry, so the
 * cost per request stays constant.
 */
export function createRateLimiter({ max, windowMs = 60000, maxKeys = 1000 }) {
  const buckets = new Map();
  let lastSweep = 0;
  return function allow(key, now = Date.now()) {
    if (now - lastSweep >= 1000) {
      lastSweep = now;
      for (const [id, bucket] of buckets) if (now - bucket.started >= windowMs) buckets.delete(id);
    }
    let bucket = buckets.get(key);
    if (!bucket || now - bucket.started >= windowMs) bucket = { started: now, count: 0 };
    bucket.count += 1;
    buckets.set(key, bucket);
    // Refuse everyone rather than grow without bound under a flood of keys.
    return bucket.count <= max && buckets.size <= maxKeys;
  };
}
