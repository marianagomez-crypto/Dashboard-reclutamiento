// Sesion JWT firmada con HMAC, almacenada en cookie httpOnly.

import { SignJWT, jwtVerify } from 'jose';
import { cookies } from 'next/headers';
import { env } from '@/lib/env';
import type { Role } from '@/lib/types';

const ALG = 'HS256';
export const COOKIE = 'bcrt_session';

const secret = () => new TextEncoder().encode(env.auth.secret);

export interface SessionPayload {
  sub: string; // userId
  email: string;
  name: string;
  role: Role;
}

export async function signSession(payload: SessionPayload) {
  return new SignJWT(payload as unknown as Record<string, unknown>)
    .setProtectedHeader({ alg: ALG })
    .setSubject(payload.sub)
    .setIssuedAt()
    .setExpirationTime(`${env.auth.sessionTtl}s`)
    .sign(secret());
}

export async function verifySession(token: string): Promise<SessionPayload | null> {
  try {
    const { payload } = await jwtVerify(token, secret(), { algorithms: [ALG] });
    return {
      sub: String(payload.sub),
      email: String(payload.email),
      name: String(payload.name),
      role: payload.role as Role,
    };
  } catch {
    return null;
  }
}

export async function setSessionCookie(token: string) {
  cookies().set(COOKIE, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    path: '/',
    maxAge: env.auth.sessionTtl,
  });
}

export async function clearSessionCookie() {
  cookies().set(COOKIE, '', { path: '/', maxAge: 0 });
}

export async function getSession(): Promise<SessionPayload | null> {
  const token = cookies().get(COOKIE)?.value;
  if (!token) return null;
  return verifySession(token);
}

export async function requireSession(): Promise<SessionPayload> {
  const s = await getSession();
  if (!s) throw new Error('UNAUTHORIZED');
  return s;
}

export async function requireRole(role: Role | Role[]) {
  const s = await requireSession();
  const allowed = Array.isArray(role) ? role : [role];
  if (!allowed.includes(s.role)) throw new Error('FORBIDDEN');
  return s;
}
