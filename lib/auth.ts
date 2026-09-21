import { db } from './db';
import bcrypt from 'bcryptjs';
import { verifySessionToken } from './session';

export function verifyLogin(username: string, password: string): boolean {
  const row = db.prepare('SELECT password_hash FROM users WHERE username = ?').get(username) as
    | { password_hash: string }
    | undefined;
  if (!row) return false;
  return bcrypt.compareSync(password, row.password_hash);
}

export function isAuthed(req: Request): boolean {
  const cookieHeader = req.headers.get('cookie') ?? '';
  const match = cookieHeader.match(/admin_session=([^;]+)/);
  const token = match?.[1];
  return verifySessionToken(token) !== null;
}