// Persistencia de Bienestar & Salud — exámenes médicos.
// Arranca vacío (sin seed). Upstash Redis si está disponible; si no, memoria.

import { Redis } from '@upstash/redis';
import type { MedicalExam } from '@/lib/types';

function kvUrl(): string | undefined {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function kvToken(): string | undefined {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}
function isKvAvailable(): boolean {
  return Boolean(kvUrl() && kvToken());
}

let _kv: Redis | null = null;
function kv(): Redis {
  if (!_kv) _kv = new Redis({ url: kvUrl()!, token: kvToken()! });
  return _kv;
}

const K_INDEX = 'bienestar:examenes:index';
const K_EXAM = (id: string) => `bienestar:examen:${id}`;

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_bienestar: MedicalExam[] | undefined;
}
function mem(): MedicalExam[] {
  if (!globalThis.__baldecash_bienestar) globalThis.__baldecash_bienestar = [];
  return globalThis.__baldecash_bienestar;
}

function nextId(existing: string[]): string {
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(/^EM(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `EM${String(maxN + 1).padStart(4, '0')}`;
}

export async function listExams(): Promise<MedicalExam[]> {
  if (!isKvAvailable()) return [...mem()];
  const ids = (await kv().smembers(K_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_EXAM))) as (MedicalExam | null)[];
  return rows.filter((e): e is MedicalExam => !!e).sort((a, b) => a.id.localeCompare(b.id));
}

export async function createExam(data: Omit<MedicalExam, 'id'>): Promise<MedicalExam> {
  if (!isKvAvailable()) {
    const store = mem();
    const exam: MedicalExam = { ...data, id: nextId(store.map((e) => e.id)) };
    store.push(exam);
    return exam;
  }
  const ids = (await kv().smembers(K_INDEX)) as string[];
  const exam: MedicalExam = { ...data, id: nextId(ids) };
  await kv().set(K_EXAM(exam.id), exam);
  await kv().sadd(K_INDEX, exam.id);
  return exam;
}

export async function updateExam(
  id: string,
  patch: Partial<Omit<MedicalExam, 'id'>>,
): Promise<MedicalExam> {
  if (!isKvAvailable()) {
    const e = mem().find((x) => x.id === id);
    if (!e) throw new Error('Examen no encontrado');
    Object.assign(e, patch);
    return e;
  }
  const current = (await kv().get(K_EXAM(id))) as MedicalExam | null;
  if (!current) throw new Error('Examen no encontrado');
  const updated: MedicalExam = { ...current, ...patch, id };
  await kv().set(K_EXAM(id), updated);
  return updated;
}

export async function deleteExam(id: string): Promise<void> {
  if (!isKvAvailable()) {
    globalThis.__baldecash_bienestar = mem().filter((e) => e.id !== id);
    return;
  }
  await kv().del(K_EXAM(id));
  await kv().srem(K_INDEX, id);
}
