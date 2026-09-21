// In-memory rate limiter — resets if the server restarts, and only works
// correctly for a single-instance deployment (fine for your Docker setup,
// not for a multi-instance/serverless deployment without a shared store
// like Redis).
const attempts = new Map<string, { count: number; windowStart: number }>();

const MAX_ATTEMPTS = 5;
const WINDOW_MS = 5 * 60 * 1000; // 5 minutes

export function checkRateLimit(key: string): boolean {
  const now = Date.now();
  const entry = attempts.get(key);

  if (!entry || now - entry.windowStart > WINDOW_MS) {
    attempts.set(key, { count: 1, windowStart: now });
    return true;
  }

  if (entry.count >= MAX_ATTEMPTS) {
    return false;
  }

  entry.count++;
  return true;
}