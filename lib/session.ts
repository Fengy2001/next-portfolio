import crypto from 'crypto';

const SECRET = process.env.SESSION_SECRET;
if (!SECRET) {
  throw new Error('SESSION_SECRET is not set. Add it to .env.local.');
}

const SESSION_DURATION_MS = 1000 * 60 * 60 * 24; // 1 day

function sign(value: string): string {
  return crypto.createHmac('sha256', SECRET!).update(value).digest('hex');
}

export function createSessionToken(username: string): string {
  const expires = Date.now() + SESSION_DURATION_MS;
  const payload = `${username}.${expires}`;
  const signature = sign(payload);
  return `${payload}.${signature}`;
}

export function verifySessionToken(token: string | undefined): string | null {
  if (!token) return null;

  const parts = token.split('.');
  if (parts.length !== 3) return null;

  const [username, expiresStr, signature] = parts;
  const payload = `${username}.${expiresStr}`;
  const expectedSignature = sign(payload);

  // timing-safe comparison — prevents an attacker from guessing the
  // signature one byte at a time via response-time differences
  const sigBuffer = Buffer.from(signature);
  const expectedBuffer = Buffer.from(expectedSignature);
  if (sigBuffer.length !== expectedBuffer.length) return null;
  if (!crypto.timingSafeEqual(sigBuffer, expectedBuffer)) return null;

  const expires = parseInt(expiresStr, 10);
  if (Date.now() > expires) return null; // expired

  return username;
}