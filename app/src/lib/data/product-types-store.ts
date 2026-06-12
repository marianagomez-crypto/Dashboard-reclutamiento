// Catálogo editable de "Tipo de producto" para órdenes de compra (Merch).
// KV (Upstash) si está disponible; si no, memoria. Sembrado con Merch / Snacks.

import { Redis } from '@upstash/redis';
import type { CatalogItem } from '@/lib/types';
import { PRODUCT_TYPES } from '@/lib/types';

function kvUrl() {
  return process.env.KV_REST_API_URL || process.env.UPSTASH_REDIS_REST_URL;
}
function kvToken() {
  return process.env.KV_REST_API_TOKEN || process.env.UPSTASH_REDIS_REST_TOKEN;
}
function isKvAvailable() {
  return Boolean(kvUrl() && kvToken());
}
let _kv: Redis | null = null;
function kv(): Redis {
  if (!_kv) _kv = new Redis({ url: kvUrl()!, token: kvToken()! });
  return _kv;
}

const K_INDEX = 'merch:producttypes:index';
const K_PT = (id: string) => `merch:producttype:${id}`;
const K_BOOTSTRAP = 'merch:producttypes:bootstrapped:v1';

function seed(): CatalogItem[] {
  return PRODUCT_TYPES.map((name, i) => {
    const id = `PT${String(i + 1).padStart(4, '0')}`;
    return { id, recordId: id, name };
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_producttypes: CatalogItem[] | undefined;
}
function mem(): CatalogItem[] {
  if (!globalThis.__baldecash_producttypes) globalThis.__baldecash_producttypes = seed();
  return globalThis.__baldecash_producttypes;
}

function nextId(existing: string[]): string {
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(/^PT(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `PT${String(maxN + 1).padStart(4, '0')}`;
}

let _bootstrapped = false;
async function ensureBootstrap() {
  if (_bootstrapped) return;
  try {
    const done = await kv().get(K_BOOTSTRAP);
    if (!done) {
      for (const pt of seed()) {
        await kv().set(K_PT(pt.id), pt);
        await kv().sadd(K_INDEX, pt.id);
      }
      await kv().set(K_BOOTSTRAP, '1');
    }
    _bootstrapped = true;
  } catch (err) {
    console.error('[product-types-store] bootstrap fallo', err);
  }
}

export async function listProductTypes(): Promise<CatalogItem[]> {
  if (!isKvAvailable()) return [...mem()];
  await ensureBootstrap();
  const ids = (await kv().smembers(K_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_PT))) as (CatalogItem | null)[];
  return rows.filter((p): p is CatalogItem => !!p).sort((a, b) => a.id.localeCompare(b.id));
}

export async function createProductType(name: string): Promise<CatalogItem> {
  if (!isKvAvailable()) {
    const store = mem();
    const id = nextId(store.map((p) => p.id));
    const item: CatalogItem = { id, recordId: id, name };
    store.push(item);
    return item;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_INDEX)) as string[];
  const id = nextId(ids);
  const item: CatalogItem = { id, recordId: id, name };
  await kv().set(K_PT(id), item);
  await kv().sadd(K_INDEX, id);
  return item;
}

export async function updateProductType(id: string, name: string): Promise<CatalogItem> {
  if (!isKvAvailable()) {
    const p = mem().find((x) => x.id === id);
    if (!p) throw new Error('Tipo de producto no encontrado');
    p.name = name;
    return p;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_PT(id))) as CatalogItem | null;
  if (!current) throw new Error('Tipo de producto no encontrado');
  const updated: CatalogItem = { ...current, name, id };
  await kv().set(K_PT(id), updated);
  return updated;
}

export async function deleteProductType(id: string): Promise<void> {
  if (!isKvAvailable()) {
    globalThis.__baldecash_producttypes = mem().filter((p) => p.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_PT(id));
  await kv().srem(K_INDEX, id);
}
