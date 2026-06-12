// Persistencia de PAGOS FIJOS (mensuales).
//
// Igual que Merch/Engagement, en mock vive en Upstash Redis (Vercel KV) cuando
// está disponible, o en un store en memoria (singleton global) en dev local.
// En modo airtable, el repositorio lee/escribe directo en Airtable.
//
// Estructura en Redis:
//   pagos:index / pago:{id} · pagos:bootstrapped:v1

import { Redis } from '@upstash/redis';
import type { FixedPayment, RheEntry } from '@/lib/types';

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

const K_INDEX = 'pagos:index';
const K_ITEM = (id: string) => `pago:${id}`;
const K_BOOTSTRAP = 'pagos:bootstrapped:v1';

// Seed tomado de la planilla operativa de pagos fijos (estados vacíos = Pendiente).
type SeedPayment = Omit<FixedPayment, 'id' | 'status'>;
const SEED: SeedPayment[] = [
  { name: 'LINEA DE TELEFONOS CLARO (2 facturas)', provider: 'AMERICA MOVIL PERU SAC', partida: 'Servicio de Telefonía', sender: 'Consuelo', paymentDate: '12' },
  { name: 'SUSCRIPCION BUK', provider: 'BUK SAC', partida: 'Licencia', sender: 'Jorge', paymentDate: '6-10' },
  { name: 'ALQUILER 404', provider: 'NOCKER NN ALAN THOMAS', partida: 'Alquiler de oficina', sender: 'Automatico', paymentDate: '20-22' },
  { name: 'LUZ 202', provider: 'LUZ DEL SUR SAA', partida: 'Luz', sender: 'Llega a portería', paymentDate: '19-21' },
  { name: 'LUZ 404', provider: 'LUZ DEL SUR SAA', partida: 'Luz', sender: 'Llega a portería', paymentDate: '19-21' },
  { name: 'ALQUILER ESTACIONAMIENTO', provider: 'JULIO RICARDO OJEDA RODRIGUEZ', partida: 'Alquiler de oficina', sender: 'Tu', paymentDate: '30 de abril 2026 y 30 octubre 2026' },
  { name: 'ALQUILER DEPOSITO', provider: 'KATYA LEON RABINES ONEEGLIO DE ROCHELLE', partida: 'Deposito', sender: 'Tu', paymentDate: '25-30' },
  { name: 'PACIFICO SEGUROS EPS BK', provider: 'PacíficoSalud EPS S.A.', partida: 'Seguros del personal', sender: 'Mayra, Anto', paymentDate: 'Primeros días del mes (1-10)' },
  { name: 'RIMAC FOLA', provider: 'RIMAC SEGUROS Y REASEGUROS', partida: 'Seguros del personal', sender: 'Beatriz, Mayra, Anto', paymentDate: 'Primeros dias del mes (1-3)' },
  { name: 'ALQUILER 202', provider: 'María Lucía Avendaño', partida: 'Alquiler de oficina', sender: 'Automatico', paymentDate: 'Primeros días del mes (1-3)' },
  { name: 'MANTENIMIENTO 202', provider: 'JUNTA DE PROPIETARIOS EDIFICIO EMPRESARIAL', partida: 'Mantenimiento de oficina', sender: 'Consuelo', paymentDate: 'Primeros días del mes (1-3)' },
  { name: 'MANTENIMIENTO 404', provider: 'JUNTA DE PROPIETARIOS EDIFICIO EMPRESARIAL', partida: 'Mantenimiento de oficina', sender: 'Consuelo', paymentDate: 'Primeros días del mes (1-3)' },
  { name: 'MANTENIMIENTO ESTACIONAMIENTO', provider: 'JUNTA DE PROPIETARIOS EDIFICIO EMPRESARIAL', partida: 'Mantenimiento de oficina', sender: 'Consuelo', paymentDate: 'Primeros días del mes (1-3)' },
  { name: 'CABIFY (Pago con Tarjeta)', provider: 'MAXI MOBILITY PERU SAC', partida: 'Movilidad del personal', sender: 'Mayra', paymentDate: 'Primeros dias del mes (1-3)' },
  { name: 'ALQUILER AGUA 404', provider: 'AQUATEC VENTURES SAC', partida: 'Gastos de Oficina', sender: 'Consuelo', paymentDate: 'Primeros días del mes (1-3)' },
  { name: 'CONSULTORIA LEGAL', provider: 'CCO INVESTMENT & LEGAL ADVISORS SAC', partida: 'Legal Retainer', sender: 'Mayra', paymentDate: 'Ultimos días del mes (23-30)' },
  { name: 'LINEA DE TELEFONOS + EXCEL CON NUM', provider: 'ENTEL PERU SA', partida: 'Servicio de Telefonía', sender: 'Consuelo', paymentDate: 'Quincena (15-16)' },
];

function seedPayments(): FixedPayment[] {
  return SEED.map((p, i) => ({
    ...p,
    id: `PG${String(i + 1).padStart(4, '0')}`,
    status: {},
  }));
}

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_pagos: FixedPayment[] | undefined;
}

function mem(): FixedPayment[] {
  if (!Array.isArray(globalThis.__baldecash_pagos)) {
    globalThis.__baldecash_pagos = seedPayments();
  }
  return globalThis.__baldecash_pagos!;
}

function nextId(existing: string[]): string {
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(/^PG(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `PG${String(maxN + 1).padStart(4, '0')}`;
}

let _bootstrapped = false;
async function ensureBootstrap(): Promise<void> {
  if (_bootstrapped) return;
  try {
    const done = await kv().get(K_BOOTSTRAP);
    if (!done) {
      for (const p of seedPayments()) {
        await kv().set(K_ITEM(p.id), p);
        await kv().sadd(K_INDEX, p.id);
      }
      await kv().set(K_BOOTSTRAP, '1');
    }
    _bootstrapped = true;
  } catch (err) {
    console.error('[payments-store] bootstrap fallo', err);
  }
}

export async function listPayments(): Promise<FixedPayment[]> {
  if (!isKvAvailable()) return [...mem()];
  await ensureBootstrap();
  const ids = (await kv().smembers(K_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_ITEM))) as (FixedPayment | null)[];
  return rows
    .filter((p): p is FixedPayment => !!p)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createPayment(
  data: Omit<FixedPayment, 'id'>,
): Promise<FixedPayment> {
  if (!isKvAvailable()) {
    const store = mem();
    const item: FixedPayment = {
      ...data,
      status: data.status || {},
      id: nextId(store.map((p) => p.id)),
    };
    store.push(item);
    return item;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_INDEX)) as string[];
  const item: FixedPayment = { ...data, status: data.status || {}, id: nextId(ids) };
  await kv().set(K_ITEM(item.id), item);
  await kv().sadd(K_INDEX, item.id);
  return item;
}

export async function updatePayment(
  id: string,
  patch: Partial<Omit<FixedPayment, 'id'>>,
): Promise<FixedPayment> {
  if (!isKvAvailable()) {
    const item = mem().find((p) => p.id === id);
    if (!item) throw new Error('Pago no encontrado');
    // El estado por mes se mergea (no se reemplaza todo el objeto).
    if (patch.status) item.status = { ...item.status, ...patch.status };
    const { status, ...rest } = patch;
    Object.assign(item, rest);
    return item;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_ITEM(id))) as FixedPayment | null;
  if (!current) throw new Error('Pago no encontrado');
  const { status, ...rest } = patch;
  const updated: FixedPayment = {
    ...current,
    ...rest,
    status: { ...current.status, ...(status || {}) },
    id,
  };
  await kv().set(K_ITEM(id), updated);
  return updated;
}

export async function deletePayment(id: string): Promise<void> {
  if (!isKvAvailable()) {
    globalThis.__baldecash_pagos = mem().filter((p) => p.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_ITEM(id));
  await kv().srem(K_INDEX, id);
}

// ===========================================================================
// RHE — Recibos por Honorarios (misma mecánica de estado por mes)
// ===========================================================================
const K_RHE_INDEX = 'rhe:index';
const K_RHE = (id: string) => `rhe:${id}`;
const K_RHE_BOOTSTRAP = 'rhe:bootstrapped:v1';

type SeedRhe = Omit<RheEntry, 'id' | 'status'>;
const SEED_RHE: SeedRhe[] = [
  { personStatus: 'Activo', person: 'ALBORNOZ CORAL MAYUMI SHIRLEY', contact: 'preadmisionma@baldecash.com', area: 'PRE ADMISIÓN', partida: 'Servicios de Admisión', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'ALBORNOZ CORAL MAYUMI SHIRLEY', contact: 'preadmisionma@baldecash.com', area: 'PRE ADMISIÓN/COMISION', partida: 'Servicios de Admisión', entity: 'BK', paymentDate: 'Primera semana' },
  { personStatus: 'Activo', person: 'CARRITO DE SENATI LUIS', contact: 'Wha: 903 393 215', area: 'PROYECTO', partida: 'Gastos Imprevistos', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'CARRITO DE UCV ANA', contact: 'Wha: 986 742 768', area: 'PROYECTO', partida: 'Gastos Imprevistos', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'CARRITO DE UCV MARICRUZ', contact: 'Wha: 992 028 330', area: 'PROYECTO', partida: 'Gastos Imprevistos', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'CONDEZO NAIRA ROSA MARIELA', contact: 'rcondezo.consultores@gmail.com', area: 'CONTABILIDAD', partida: 'Outsourcing Contabilidad', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'DIANA CAROLINA', contact: 'santamariadcsl@gmail.com', area: 'COBRANZAS', partida: 'Outsourcing Cobranzas', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'DIANA CAROLINA', contact: 'santamariadcsl@gmail.com', area: 'COBRANZAS/COMISION', partida: 'Outsourcing Cobranzas', entity: 'BK', paymentDate: 'Primera semana' },
  { personStatus: 'Activo', person: 'EDWAR TAFUR', contact: 'Wha: 900945862', area: 'LOGISTICA', partida: 'Soporte Tecnico', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'FARFAN CALDERON LUIS ENRIQUE', contact: 'JEFA: yadira.yovera@baldecash.com', area: 'COBRANZAS', partida: 'Outsourcing Cobranzas', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'GARCIA BECERRA FERNANDO CHRISTIAN', contact: 'fernandogarciabecerra@gmail.com', area: 'RIESGOS', partida: 'Comité de Riesgos', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'MALCA GOMES ELIZABETH', contact: 'Wha: 912525430', area: 'LIMPIEZA', partida: 'Limpieza', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'PATINO MORAN CRISTIAN ALEXIS', contact: 'cristian_alexis37@hotmail.com', area: 'RIESGOS', partida: 'Comité de Riesgos', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
  { personStatus: 'Activo', person: 'YANPIER', contact: 'p.proyectos@baldecash.com', area: 'PROYECTO', partida: 'Servicios de programacion', entity: 'BK', paymentDate: 'Ultimo lunes del mes' },
];

function seedRhe(): RheEntry[] {
  return SEED_RHE.map((r, i) => ({
    ...r,
    id: `RH${String(i + 1).padStart(4, '0')}`,
    status: {},
  }));
}

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_rhe: RheEntry[] | undefined;
}

function memRhe(): RheEntry[] {
  if (!Array.isArray(globalThis.__baldecash_rhe)) {
    globalThis.__baldecash_rhe = seedRhe();
  }
  return globalThis.__baldecash_rhe!;
}

function nextRheId(existing: string[]): string {
  let maxN = 0;
  for (const id of existing) {
    const m = id.match(/^RH(\d{1,})$/);
    if (m) {
      const n = parseInt(m[1], 10);
      if (Number.isFinite(n) && n > maxN) maxN = n;
    }
  }
  return `RH${String(maxN + 1).padStart(4, '0')}`;
}

let _rheBootstrapped = false;
async function ensureRheBootstrap(): Promise<void> {
  if (_rheBootstrapped) return;
  try {
    const done = await kv().get(K_RHE_BOOTSTRAP);
    if (!done) {
      for (const e of seedRhe()) {
        await kv().set(K_RHE(e.id), e);
        await kv().sadd(K_RHE_INDEX, e.id);
      }
      await kv().set(K_RHE_BOOTSTRAP, '1');
    }
    _rheBootstrapped = true;
  } catch (err) {
    console.error('[payments-store] RHE bootstrap fallo', err);
  }
}

export async function listRhe(): Promise<RheEntry[]> {
  if (!isKvAvailable()) return [...memRhe()];
  await ensureRheBootstrap();
  const ids = (await kv().smembers(K_RHE_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_RHE))) as (RheEntry | null)[];
  return rows
    .filter((e): e is RheEntry => !!e)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createRhe(data: Omit<RheEntry, 'id'>): Promise<RheEntry> {
  if (!isKvAvailable()) {
    const store = memRhe();
    const item: RheEntry = {
      ...data,
      status: data.status || {},
      id: nextRheId(store.map((e) => e.id)),
    };
    store.push(item);
    return item;
  }
  await ensureRheBootstrap();
  const ids = (await kv().smembers(K_RHE_INDEX)) as string[];
  const item: RheEntry = { ...data, status: data.status || {}, id: nextRheId(ids) };
  await kv().set(K_RHE(item.id), item);
  await kv().sadd(K_RHE_INDEX, item.id);
  return item;
}

export async function updateRhe(
  id: string,
  patch: Partial<Omit<RheEntry, 'id'>>,
): Promise<RheEntry> {
  if (!isKvAvailable()) {
    const item = memRhe().find((e) => e.id === id);
    if (!item) throw new Error('RHE no encontrado');
    if (patch.status) item.status = { ...item.status, ...patch.status };
    const { status, ...rest } = patch;
    Object.assign(item, rest);
    return item;
  }
  await ensureRheBootstrap();
  const current = (await kv().get(K_RHE(id))) as RheEntry | null;
  if (!current) throw new Error('RHE no encontrado');
  const { status, ...rest } = patch;
  const updated: RheEntry = {
    ...current,
    ...rest,
    status: { ...current.status, ...(status || {}) },
    id,
  };
  await kv().set(K_RHE(id), updated);
  return updated;
}

export async function deleteRhe(id: string): Promise<void> {
  if (!isKvAvailable()) {
    globalThis.__baldecash_rhe = memRhe().filter((e) => e.id !== id);
    return;
  }
  await ensureRheBootstrap();
  await kv().del(K_RHE(id));
  await kv().srem(K_RHE_INDEX, id);
}
