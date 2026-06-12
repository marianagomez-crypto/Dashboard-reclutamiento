// Persistencia de GASTOS POR EVENTO de engagement.
// KV (Upstash) cuando está disponible; fallback a memoria (singleton global).
// En modo airtable, el repositorio lee/escribe directo en Airtable.

import { Redis } from '@upstash/redis';
import type { CatalogItem, EngagementExpense } from '@/lib/types';

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

const K_INDEX = 'engagement:gastos:index';
const K_ITEM = (id: string) => `engagement:gasto:${id}`;

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_eng_gastos: EngagementExpense[] | undefined;
}

function mem(): EngagementExpense[] {
  if (!Array.isArray(globalThis.__baldecash_eng_gastos)) {
    globalThis.__baldecash_eng_gastos = [];
  }
  return globalThis.__baldecash_eng_gastos!;
}

function nextId(existing: string[]): string {
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(/^EG(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `EG${String(maxN + 1).padStart(4, '0')}`;
}

export async function listEngExpenses(): Promise<EngagementExpense[]> {
  if (!isKvAvailable()) return [...mem()];
  const ids = (await kv().smembers(K_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_ITEM))) as (EngagementExpense | null)[];
  return rows
    .filter((e): e is EngagementExpense => !!e)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createEngExpense(
  data: Omit<EngagementExpense, 'id'>,
): Promise<EngagementExpense> {
  if (!isKvAvailable()) {
    const store = mem();
    const item: EngagementExpense = { ...data, id: nextId(store.map((e) => e.id)) };
    store.push(item);
    return item;
  }
  const ids = (await kv().smembers(K_INDEX)) as string[];
  const item: EngagementExpense = { ...data, id: nextId(ids) };
  await kv().set(K_ITEM(item.id), item);
  await kv().sadd(K_INDEX, item.id);
  return item;
}

export async function updateEngExpense(
  id: string,
  patch: Partial<Omit<EngagementExpense, 'id'>>,
): Promise<EngagementExpense> {
  if (!isKvAvailable()) {
    const item = mem().find((e) => e.id === id);
    if (!item) throw new Error('Gasto no encontrado');
    Object.assign(item, patch);
    return item;
  }
  const current = (await kv().get(K_ITEM(id))) as EngagementExpense | null;
  if (!current) throw new Error('Gasto no encontrado');
  const updated: EngagementExpense = { ...current, ...patch, id };
  await kv().set(K_ITEM(id), updated);
  return updated;
}

export async function deleteEngExpense(id: string): Promise<void> {
  if (!isKvAvailable()) {
    globalThis.__baldecash_eng_gastos = mem().filter((e) => e.id !== id);
    return;
  }
  await kv().del(K_ITEM(id));
  await kv().srem(K_INDEX, id);
}

// ---------------------------------------------------------------------------
// Eventos propios del módulo de gastos (catálogo, arranca vacío).
// ---------------------------------------------------------------------------
const K_EV_INDEX = 'engagement:gasto-eventos:index';
const K_EV = (id: string) => `engagement:gasto-evento:${id}`;

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_eng_gasto_eventos: CatalogItem[] | undefined;
}
function memEv(): CatalogItem[] {
  if (!Array.isArray(globalThis.__baldecash_eng_gasto_eventos)) {
    globalThis.__baldecash_eng_gasto_eventos = [];
  }
  return globalThis.__baldecash_eng_gasto_eventos!;
}
function nextEvId(existing: string[]): string {
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(/^GE(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `GE${String(maxN + 1).padStart(4, '0')}`;
}

export async function listGastoEventos(): Promise<CatalogItem[]> {
  if (!isKvAvailable()) return [...memEv()];
  const ids = (await kv().smembers(K_EV_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_EV))) as (CatalogItem | null)[];
  return rows
    .filter((e): e is CatalogItem => !!e)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createGastoEvento(name: string): Promise<CatalogItem> {
  if (!isKvAvailable()) {
    const store = memEv();
    const id = nextEvId(store.map((e) => e.id));
    const item: CatalogItem = { id, recordId: id, name };
    store.push(item);
    return item;
  }
  const ids = (await kv().smembers(K_EV_INDEX)) as string[];
  const id = nextEvId(ids);
  const item: CatalogItem = { id, recordId: id, name };
  await kv().set(K_EV(id), item);
  await kv().sadd(K_EV_INDEX, id);
  return item;
}

export async function deleteGastoEvento(id: string): Promise<void> {
  if (!isKvAvailable()) {
    globalThis.__baldecash_eng_gasto_eventos = memEv().filter((e) => e.id !== id);
    return;
  }
  await kv().del(K_EV(id));
  await kv().srem(K_EV_INDEX, id);
}
