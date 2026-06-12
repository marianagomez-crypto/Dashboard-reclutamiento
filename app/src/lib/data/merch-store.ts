// Persistencia de MERCH — órdenes de compra + usos.
//
// Igual que Engagement, estos datos NO viven en Airtable: provienen de una
// planilla operativa. Se persisten en Upstash Redis (Vercel KV) cuando está
// disponible, y caen a un store en memoria (singleton global) en dev local.
//
// Estructura en Redis:
//   merch:orders:index / merch:order:{id}
//   merch:usages:index / merch:usage:{id}
//   merch:bootstrapped:v1 (órdenes) · merch:usages:bootstrapped:v1 (usos)

import { Redis } from '@upstash/redis';
import type { MerchExtraExpense, MerchUsage, PurchaseOrder } from '@/lib/types';
import { SEED_PURCHASE_ORDERS, SEED_USAGES } from './merch-seed';

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
  if (!_kv) {
    _kv = new Redis({ url: kvUrl()!, token: kvToken()! });
  }
  return _kv;
}

const K_ORDERS_INDEX = 'merch:orders:index';
const K_ORDER = (id: string) => `merch:order:${id}`;
const K_ORDERS_BOOTSTRAP = 'merch:bootstrapped:v1';
const K_USAGES_INDEX = 'merch:usages:index';
const K_USAGE = (id: string) => `merch:usage:${id}`;
const K_USAGES_BOOTSTRAP = 'merch:usages:bootstrapped:v1';
const K_EXPENSES_INDEX = 'merch:expenses:index';
const K_EXPENSE = (id: string) => `merch:expense:${id}`;

// ---------------------------------------------------------------------------
// Store en memoria (fallback). Singleton global para sobrevivir HMR en dev.
// ---------------------------------------------------------------------------
interface MemStore {
  orders: PurchaseOrder[];
  usages: MerchUsage[];
  expenses: MerchExtraExpense[];
}

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_merch: MemStore | undefined;
}

function seedOrders(): PurchaseOrder[] {
  return SEED_PURCHASE_ORDERS.map((o, i) => ({
    ...o,
    id: `MO${String(i + 1).padStart(4, '0')}`,
  }));
}

function seedUsages(): MerchUsage[] {
  return SEED_USAGES.map((u, i) => ({
    ...u,
    id: `US${String(i + 1).padStart(4, '0')}`,
  }));
}

function mem(): MemStore {
  const existing = globalThis.__baldecash_merch as any;
  // Reconstruye si no existe o si quedó con una forma vieja (ej. un array de
  // órdenes de una versión anterior del store) — evita "orders is not iterable".
  if (!existing || Array.isArray(existing) || !Array.isArray(existing.orders)) {
    globalThis.__baldecash_merch = {
      orders: Array.isArray(existing) ? (existing as PurchaseOrder[]) : seedOrders(),
      usages: seedUsages(),
      expenses: [],
    };
  }
  const store = globalThis.__baldecash_merch!;
  if (!Array.isArray(store.usages)) store.usages = seedUsages();
  if (!Array.isArray(store.expenses)) store.expenses = [];
  return store;
}

function nextId(prefix: string, existing: string[]): string {
  const re = new RegExp(`^${prefix}(\\d{1,})$`);
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(re);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `${prefix}${String(maxN + 1).padStart(4, '0')}`;
}

// orderId autoincremental con formato C-001, C-002, ...
function nextOrderId(orders: { orderId?: string }[]): string {
  let maxN = 0;
  for (const o of orders) {
    const m = (o.orderId || '').match(/^C-(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `C-${String(maxN + 1).padStart(3, '0')}`;
}

let _bootstrapped = false;
async function ensureBootstrap(): Promise<void> {
  if (_bootstrapped) return;
  try {
    const ordersDone = await kv().get(K_ORDERS_BOOTSTRAP);
    if (!ordersDone) {
      for (const o of seedOrders()) {
        await kv().set(K_ORDER(o.id), o);
        await kv().sadd(K_ORDERS_INDEX, o.id);
      }
      await kv().set(K_ORDERS_BOOTSTRAP, '1');
    }
    const usagesDone = await kv().get(K_USAGES_BOOTSTRAP);
    if (!usagesDone) {
      for (const u of seedUsages()) {
        await kv().set(K_USAGE(u.id), u);
        await kv().sadd(K_USAGES_INDEX, u.id);
      }
      await kv().set(K_USAGES_BOOTSTRAP, '1');
    }
    _bootstrapped = true;
  } catch (err) {
    console.error('[merch-store] bootstrap fallo', err);
  }
}

// ---------------------------------------------------------------------------
// Órdenes de compra
// ---------------------------------------------------------------------------
export async function listOrders(): Promise<PurchaseOrder[]> {
  if (!isKvAvailable()) return [...mem().orders];
  await ensureBootstrap();
  const ids = (await kv().smembers(K_ORDERS_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_ORDER))) as (PurchaseOrder | null)[];
  return rows
    .filter((o): o is PurchaseOrder => !!o)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createOrder(
  data: Omit<PurchaseOrder, 'id'>,
): Promise<PurchaseOrder> {
  if (!isKvAvailable()) {
    const store = mem();
    const order: PurchaseOrder = {
      ...data,
      id: nextId('MO', store.orders.map((o) => o.id)),
      orderId: data.orderId || nextOrderId(store.orders),
    };
    store.orders.push(order);
    return order;
  }
  await ensureBootstrap();
  const all = await listOrders();
  const order: PurchaseOrder = {
    ...data,
    id: nextId('MO', all.map((o) => o.id)),
    orderId: data.orderId || nextOrderId(all),
  };
  await kv().set(K_ORDER(order.id), order);
  await kv().sadd(K_ORDERS_INDEX, order.id);
  return order;
}

export async function updateOrder(
  id: string,
  patch: Partial<Omit<PurchaseOrder, 'id'>>,
): Promise<PurchaseOrder> {
  if (!isKvAvailable()) {
    const order = mem().orders.find((o) => o.id === id);
    if (!order) throw new Error('Orden no encontrada');
    Object.assign(order, patch);
    return order;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_ORDER(id))) as PurchaseOrder | null;
  if (!current) throw new Error('Orden no encontrada');
  const updated: PurchaseOrder = { ...current, ...patch, id };
  await kv().set(K_ORDER(id), updated);
  return updated;
}

export async function deleteOrder(id: string): Promise<void> {
  if (!isKvAvailable()) {
    mem().orders = mem().orders.filter((o) => o.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_ORDER(id));
  await kv().srem(K_ORDERS_INDEX, id);
}

// ---------------------------------------------------------------------------
// Usos
// ---------------------------------------------------------------------------
export async function listUsages(): Promise<MerchUsage[]> {
  if (!isKvAvailable()) return [...mem().usages];
  await ensureBootstrap();
  const ids = (await kv().smembers(K_USAGES_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_USAGE))) as (MerchUsage | null)[];
  return rows
    .filter((u): u is MerchUsage => !!u)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createUsage(
  data: Omit<MerchUsage, 'id'>,
): Promise<MerchUsage> {
  if (!isKvAvailable()) {
    const store = mem();
    const usage: MerchUsage = {
      ...data,
      id: nextId('US', store.usages.map((u) => u.id)),
    };
    store.usages.push(usage);
    return usage;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_USAGES_INDEX)) as string[];
  const usage: MerchUsage = { ...data, id: nextId('US', ids) };
  await kv().set(K_USAGE(usage.id), usage);
  await kv().sadd(K_USAGES_INDEX, usage.id);
  return usage;
}

export async function updateUsage(
  id: string,
  patch: Partial<Omit<MerchUsage, 'id'>>,
): Promise<MerchUsage> {
  if (!isKvAvailable()) {
    const usage = mem().usages.find((u) => u.id === id);
    if (!usage) throw new Error('Uso no encontrado');
    Object.assign(usage, patch);
    return usage;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_USAGE(id))) as MerchUsage | null;
  if (!current) throw new Error('Uso no encontrado');
  const updated: MerchUsage = { ...current, ...patch, id };
  await kv().set(K_USAGE(id), updated);
  return updated;
}

export async function deleteUsage(id: string): Promise<void> {
  if (!isKvAvailable()) {
    mem().usages = mem().usages.filter((u) => u.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_USAGE(id));
  await kv().srem(K_USAGES_INDEX, id);
}

// ---------------------------------------------------------------------------
// Gastos extra (no consumen stock)
// ---------------------------------------------------------------------------
export async function listExpenses(): Promise<MerchExtraExpense[]> {
  if (!isKvAvailable()) return [...mem().expenses];
  await ensureBootstrap();
  const ids = (await kv().smembers(K_EXPENSES_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_EXPENSE))) as (MerchExtraExpense | null)[];
  return rows
    .filter((e): e is MerchExtraExpense => !!e)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createExpense(
  data: Omit<MerchExtraExpense, 'id'>,
): Promise<MerchExtraExpense> {
  if (!isKvAvailable()) {
    const store = mem();
    const expense: MerchExtraExpense = {
      ...data,
      id: nextId('GX', store.expenses.map((e) => e.id)),
    };
    store.expenses.push(expense);
    return expense;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_EXPENSES_INDEX)) as string[];
  const expense: MerchExtraExpense = { ...data, id: nextId('GX', ids) };
  await kv().set(K_EXPENSE(expense.id), expense);
  await kv().sadd(K_EXPENSES_INDEX, expense.id);
  return expense;
}

export async function updateExpense(
  id: string,
  patch: Partial<Omit<MerchExtraExpense, 'id'>>,
): Promise<MerchExtraExpense> {
  if (!isKvAvailable()) {
    const expense = mem().expenses.find((e) => e.id === id);
    if (!expense) throw new Error('Gasto no encontrado');
    Object.assign(expense, patch);
    return expense;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_EXPENSE(id))) as MerchExtraExpense | null;
  if (!current) throw new Error('Gasto no encontrado');
  const updated: MerchExtraExpense = { ...current, ...patch, id };
  await kv().set(K_EXPENSE(id), updated);
  return updated;
}

export async function deleteExpense(id: string): Promise<void> {
  if (!isKvAvailable()) {
    mem().expenses = mem().expenses.filter((e) => e.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_EXPENSE(id));
  await kv().srem(K_EXPENSES_INDEX, id);
}
