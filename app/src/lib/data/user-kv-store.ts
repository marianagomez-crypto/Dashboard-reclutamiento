// Persistencia de usuarios en Upstash Redis (lo que Vercel ahora ofrece via
// Marketplace en lugar del antiguo Vercel KV).
//
// Estructura en Redis:
//   users:byId:{id}      -> JSON del usuario
//   users:byEmail:{email lower} -> id (lookup rapido por email)
//   users:index          -> set de todos los ids
//
// Detecta disponibilidad via env vars UPSTASH_REDIS_REST_URL/TOKEN
// (las que Vercel inyecta automaticamente al conectar Upstash al proyecto).
// Si no estan, este modulo no se debe usar (el caller cae al store en memoria).

import bcrypt from 'bcryptjs';
import { Redis } from '@upstash/redis';
import { env } from '@/lib/env';
import type { Role, User } from '@/lib/types';

// Vercel cuando conecta Upstash del Marketplace inyecta vars con prefijo KV_*.
// Si en otro entorno se usan los nombres nativos de Upstash, tambien funcionan.
function kvUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function kvToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}

let _kv: Redis | null = null;
function kv(): Redis {
  if (!_kv) {
    const url = kvUrl();
    const token = kvToken();
    if (!url || !token) {
      throw new Error('Vercel KV / Upstash Redis no esta configurado');
    }
    _kv = new Redis({ url, token });
  }
  return _kv;
}

export function isKvAvailable(): boolean {
  return Boolean(kvUrl() && kvToken());
}

const K_BY_ID = (id: string) => `users:byId:${id}`;
const K_BY_EMAIL = (email: string) => `users:byEmail:${email.toLowerCase()}`;
const K_INDEX = 'users:index';

function publicUser(u: User): User {
  // Limpia el passwordHash al devolver el usuario al cliente / caller
  const { passwordHash: _p, ...rest } = u;
  return rest as User;
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

let _bootstrapped = false;

/**
 * Crea el usuario admin inicial si el KV esta vacio.
 * Se ejecuta una sola vez por instancia (cache local de la flag).
 */
async function ensureBootstrap(): Promise<void> {
  if (_bootstrapped) return;
  try {
    const existing = await kv().sismember(K_INDEX, '__bootstrapped');
    if (existing) {
      _bootstrapped = true;
      return;
    }
    // Crear admin inicial desde env vars
    const adminEmail = env.admin.email;
    const adminPass = env.admin.password;
    const adminId = uid('usr');
    const admin: User = {
      id: adminId,
      email: adminEmail,
      name: 'Administrador',
      role: 'admin',
      active: true,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync(adminPass, 10),
    };
    await kv().set(K_BY_ID(adminId), admin);
    await kv().set(K_BY_EMAIL(adminEmail), adminId);
    await kv().sadd(K_INDEX, adminId);
    await kv().sadd(K_INDEX, '__bootstrapped');
    _bootstrapped = true;
  } catch (err) {
    console.error('[user-kv-store] bootstrap fallo', err);
  }
}

export async function kvListUsers(): Promise<User[]> {
  await ensureBootstrap();
  const ids = (await kv().smembers(K_INDEX)) as string[];
  const realIds = ids.filter((id) => id !== '__bootstrapped');
  if (realIds.length === 0) return [];
  const users = (await kv().mget(...realIds.map(K_BY_ID))) as (User | null)[];
  return users
    .filter((u): u is User => !!u)
    .map(publicUser)
    .sort((a, b) => a.email.localeCompare(b.email));
}

export async function kvGetUserById(id: string): Promise<User | null> {
  await ensureBootstrap();
  const u = (await kv().get(K_BY_ID(id))) as User | null;
  return u ? publicUser(u) : null;
}

// Devuelve el usuario COMPLETO (incluye passwordHash) — se usa en login.
export async function kvGetUserByEmailFull(email: string): Promise<User | null> {
  await ensureBootstrap();
  const id = (await kv().get(K_BY_EMAIL(email))) as string | null;
  if (!id) return null;
  return (await kv().get(K_BY_ID(id))) as User | null;
}

export async function kvCreateUser(
  data: Omit<User, 'id' | 'createdAt'> & { password: string },
): Promise<User> {
  await ensureBootstrap();
  const existingId = (await kv().get(K_BY_EMAIL(data.email))) as string | null;
  if (existingId) {
    throw new Error('Ya existe un usuario con ese correo.');
  }
  const id = uid('usr');
  const user: User = {
    id,
    email: data.email,
    name: data.name,
    role: data.role,
    avatarUrl: data.avatarUrl,
    active: data.active ?? true,
    createdAt: new Date().toISOString(),
    passwordHash: bcrypt.hashSync(data.password, 10),
  };
  await kv().set(K_BY_ID(id), user);
  await kv().set(K_BY_EMAIL(data.email), id);
  await kv().sadd(K_INDEX, id);
  return publicUser(user);
}

export async function kvUpdateUser(
  id: string,
  patch: Partial<User> & { password?: string },
): Promise<User> {
  await ensureBootstrap();
  const current = (await kv().get(K_BY_ID(id))) as User | null;
  if (!current) throw new Error('Usuario no encontrado');

  // Si cambia el email, reasignar el indice byEmail
  if (patch.email && patch.email.toLowerCase() !== current.email.toLowerCase()) {
    // Verificar que el nuevo email no este en uso
    const existing = (await kv().get(K_BY_EMAIL(patch.email))) as string | null;
    if (existing && existing !== id) {
      throw new Error('Ya existe un usuario con ese correo.');
    }
    await kv().del(K_BY_EMAIL(current.email));
    await kv().set(K_BY_EMAIL(patch.email), id);
  }

  const updated: User = {
    ...current,
    email: patch.email ?? current.email,
    name: patch.name ?? current.name,
    role: (patch.role as Role) ?? current.role,
    avatarUrl: patch.avatarUrl !== undefined ? patch.avatarUrl : current.avatarUrl,
    active: typeof patch.active === 'boolean' ? patch.active : current.active,
    passwordHash: patch.password
      ? bcrypt.hashSync(patch.password, 10)
      : current.passwordHash,
  };
  await kv().set(K_BY_ID(id), updated);
  return publicUser(updated);
}

export async function kvDeleteUser(id: string): Promise<void> {
  await ensureBootstrap();
  const current = (await kv().get(K_BY_ID(id))) as User | null;
  if (!current) return;
  await kv().del(K_BY_ID(id));
  await kv().del(K_BY_EMAIL(current.email));
  await kv().srem(K_INDEX, id);
}

export async function kvRecordLogin(id: string): Promise<void> {
  await ensureBootstrap();
  const current = (await kv().get(K_BY_ID(id))) as User | null;
  if (!current) return;
  await kv().set(K_BY_ID(id), {
    ...current,
    lastLoginAt: new Date().toISOString(),
  });
}
