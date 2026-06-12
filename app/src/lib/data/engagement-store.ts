// Persistencia de Engagement & Cultura (eventos + participación).
//
// Igual que los usuarios, estos datos NO viven en Airtable: provienen de una
// planilla operativa. Por eso se persisten en Upstash Redis (Vercel KV) cuando
// está disponible, y caen a un store en memoria (singleton global) en dev local
// sin KV configurado. En ambos casos se siembran con los datos de la planilla.
//
// Estructura en Redis:
//   engagement:events:index            -> set de ids de eventos
//   engagement:event:{id}              -> JSON del evento
//   engagement:participants:index      -> set de ids de participantes
//   engagement:participant:{id}        -> JSON del participante
//   engagement:bootstrapped            -> flag de seed inicial

import { Redis } from '@upstash/redis';
import type {
  CatalogItem,
  EngagementEvent,
  EngagementParticipant,
  ParticipationStatus,
} from '@/lib/types';
import { ENGAGEMENT_AREAS } from '@/lib/types';
import { SEED_EVENTS, SEED_PARTICIPANTS } from './engagement-seed';

// Reusa las mismas vars que el store de usuarios.
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

const K_EVENTS_INDEX = 'engagement:events:index';
const K_EVENT = (id: string) => `engagement:event:${id}`;
const K_PARTS_INDEX = 'engagement:participants:index';
const K_PART = (id: string) => `engagement:participant:${id}`;
const K_AREAS_INDEX = 'engagement:areas:index';
const K_AREA = (id: string) => `engagement:area:${id}`;
// Versionado: al cambiar el dataset semilla, sube el sufijo para re-sembrar
// el KV con la planilla completa (idempotente — sobreescribe por id).
const K_BOOTSTRAP = 'engagement:bootstrapped:v2';
// Flag independiente para sembrar las áreas sin re-tocar eventos/participantes.
const K_AREAS_BOOTSTRAP = 'engagement:areas:bootstrapped:v1';

// ---------------------------------------------------------------------------
// Store en memoria (fallback). Singleton global para sobrevivir HMR en dev.
// ---------------------------------------------------------------------------
interface MemStore {
  events: EngagementEvent[];
  participants: EngagementParticipant[];
  areas: CatalogItem[];
}

function seedAreas(): CatalogItem[] {
  return ENGAGEMENT_AREAS.map((name, i) => {
    const id = `AR${String(i + 1).padStart(4, '0')}`;
    return { id, recordId: id, name };
  });
}

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_engagement: MemStore | undefined;
}

function mem(): MemStore {
  if (!globalThis.__baldecash_engagement) {
    globalThis.__baldecash_engagement = {
      events: SEED_EVENTS.map((e) => ({ ...e })),
      participants: SEED_PARTICIPANTS.map((p) => ({
        ...p,
        participation: { ...p.participation },
      })),
      areas: seedAreas(),
    };
  }
  // Guard: si el singleton se creó antes de existir `areas` (HMR / versión vieja
  // en memoria), lo sembramos para no romper la lectura.
  if (!globalThis.__baldecash_engagement.areas) {
    globalThis.__baldecash_engagement.areas = seedAreas();
  }
  return globalThis.__baldecash_engagement;
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

// ---------------------------------------------------------------------------
// Bootstrap del KV (siembra una sola vez por instancia).
// ---------------------------------------------------------------------------
let _bootstrapped = false;
async function ensureBootstrap(): Promise<void> {
  if (_bootstrapped) return;
  try {
    const done = await kv().get(K_BOOTSTRAP);
    if (!done) {
      for (const e of SEED_EVENTS) {
        await kv().set(K_EVENT(e.id), e);
        await kv().sadd(K_EVENTS_INDEX, e.id);
      }
      for (const p of SEED_PARTICIPANTS) {
        await kv().set(K_PART(p.id), p);
        await kv().sadd(K_PARTS_INDEX, p.id);
      }
      await kv().set(K_BOOTSTRAP, '1');
    }
    // Áreas: flag independiente para no re-sembrar eventos/participantes.
    const areasDone = await kv().get(K_AREAS_BOOTSTRAP);
    if (!areasDone) {
      for (const a of seedAreas()) {
        await kv().set(K_AREA(a.id), a);
        await kv().sadd(K_AREAS_INDEX, a.id);
      }
      await kv().set(K_AREAS_BOOTSTRAP, '1');
    }
    _bootstrapped = true;
  } catch (err) {
    console.error('[engagement-store] bootstrap fallo', err);
  }
}

// ---------------------------------------------------------------------------
// Eventos
// ---------------------------------------------------------------------------
export async function listEvents(): Promise<EngagementEvent[]> {
  if (!isKvAvailable()) {
    return [...mem().events];
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_EVENTS_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_EVENT))) as (EngagementEvent | null)[];
  return rows
    .filter((e): e is EngagementEvent => !!e)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createEvent(
  data: Omit<EngagementEvent, 'id'>,
): Promise<EngagementEvent> {
  if (!isKvAvailable()) {
    const store = mem();
    const event: EngagementEvent = {
      ...data,
      id: nextId('EV', store.events.map((e) => e.id)),
    };
    store.events.push(event);
    return event;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_EVENTS_INDEX)) as string[];
  const event: EngagementEvent = { ...data, id: nextId('EV', ids) };
  await kv().set(K_EVENT(event.id), event);
  await kv().sadd(K_EVENTS_INDEX, event.id);
  return event;
}

export async function updateEvent(
  id: string,
  patch: Partial<Omit<EngagementEvent, 'id'>>,
): Promise<EngagementEvent> {
  if (!isKvAvailable()) {
    const ev = mem().events.find((e) => e.id === id);
    if (!ev) throw new Error('Evento no encontrado');
    Object.assign(ev, patch);
    return ev;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_EVENT(id))) as EngagementEvent | null;
  if (!current) throw new Error('Evento no encontrado');
  const updated: EngagementEvent = { ...current, ...patch, id };
  await kv().set(K_EVENT(id), updated);
  return updated;
}

export async function deleteEvent(id: string): Promise<void> {
  if (!isKvAvailable()) {
    const store = mem();
    store.events = store.events.filter((e) => e.id !== id);
    // Limpia la participación huérfana de este evento.
    store.participants.forEach((p) => {
      delete p.participation[id];
    });
    return;
  }
  await ensureBootstrap();
  await kv().del(K_EVENT(id));
  await kv().srem(K_EVENTS_INDEX, id);
  // Limpia la participación huérfana en cada participante.
  const partIds = (await kv().smembers(K_PARTS_INDEX)) as string[];
  for (const pid of partIds) {
    const p = (await kv().get(K_PART(pid))) as EngagementParticipant | null;
    if (p && p.participation[id] !== undefined) {
      delete p.participation[id];
      await kv().set(K_PART(pid), p);
    }
  }
}

// ---------------------------------------------------------------------------
// Participantes
// ---------------------------------------------------------------------------
export async function listParticipants(): Promise<EngagementParticipant[]> {
  if (!isKvAvailable()) {
    return [...mem().participants];
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_PARTS_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_PART))) as (EngagementParticipant | null)[];
  return rows
    .filter((p): p is EngagementParticipant => !!p)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createParticipant(
  data: Omit<EngagementParticipant, 'id'>,
): Promise<EngagementParticipant> {
  if (!isKvAvailable()) {
    const store = mem();
    const participant: EngagementParticipant = {
      ...data,
      participation: { ...data.participation },
      id: nextId('EP', store.participants.map((p) => p.id)),
    };
    store.participants.push(participant);
    return participant;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_PARTS_INDEX)) as string[];
  const participant: EngagementParticipant = {
    ...data,
    participation: { ...data.participation },
    id: nextId('EP', ids),
  };
  await kv().set(K_PART(participant.id), participant);
  await kv().sadd(K_PARTS_INDEX, participant.id);
  return participant;
}

export async function updateParticipant(
  id: string,
  patch: Partial<Omit<EngagementParticipant, 'id'>>,
): Promise<EngagementParticipant> {
  if (!isKvAvailable()) {
    const p = mem().participants.find((x) => x.id === id);
    if (!p) throw new Error('Colaborador no encontrado');
    if (patch.name !== undefined) p.name = patch.name;
    if (patch.status !== undefined) p.status = patch.status;
    if (patch.area !== undefined) p.area = patch.area;
    if (patch.hireDate !== undefined) p.hireDate = patch.hireDate;
    if (patch.birthDate !== undefined) p.birthDate = patch.birthDate;
    if (patch.dni !== undefined) p.dni = patch.dni;
    if (patch.position !== undefined) p.position = patch.position;
    if (patch.participation !== undefined) {
      p.participation = { ...p.participation, ...patch.participation };
    }
    return p;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_PART(id))) as EngagementParticipant | null;
  if (!current) throw new Error('Colaborador no encontrado');
  const updated: EngagementParticipant = {
    ...current,
    name: patch.name ?? current.name,
    status: patch.status ?? current.status,
    area: patch.area !== undefined ? patch.area : current.area,
    hireDate: patch.hireDate !== undefined ? patch.hireDate : current.hireDate,
    birthDate: patch.birthDate !== undefined ? patch.birthDate : current.birthDate,
    dni: patch.dni !== undefined ? patch.dni : current.dni,
    position: patch.position !== undefined ? patch.position : current.position,
    participation: patch.participation
      ? { ...current.participation, ...patch.participation }
      : current.participation,
    id,
  };
  await kv().set(K_PART(id), updated);
  return updated;
}

export async function deleteParticipant(id: string): Promise<void> {
  if (!isKvAvailable()) {
    const store = mem();
    store.participants = store.participants.filter((p) => p.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_PART(id));
  await kv().srem(K_PARTS_INDEX, id);
}

// ---------------------------------------------------------------------------
// Áreas (catálogo editable — alimenta el select de la matriz)
// ---------------------------------------------------------------------------
export async function listAreas(): Promise<CatalogItem[]> {
  if (!isKvAvailable()) {
    return [...mem().areas];
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_AREAS_INDEX)) as string[];
  if (ids.length === 0) return [];
  const rows = (await kv().mget(...ids.map(K_AREA))) as (CatalogItem | null)[];
  return rows
    .filter((a): a is CatalogItem => !!a)
    .sort((a, b) => a.id.localeCompare(b.id));
}

export async function createArea(name: string): Promise<CatalogItem> {
  if (!isKvAvailable()) {
    const store = mem();
    const id = nextId('AR', store.areas.map((a) => a.id));
    const item: CatalogItem = { id, recordId: id, name };
    store.areas.push(item);
    return item;
  }
  await ensureBootstrap();
  const ids = (await kv().smembers(K_AREAS_INDEX)) as string[];
  const id = nextId('AR', ids);
  const item: CatalogItem = { id, recordId: id, name };
  await kv().set(K_AREA(id), item);
  await kv().sadd(K_AREAS_INDEX, id);
  return item;
}

export async function updateArea(id: string, name: string): Promise<CatalogItem> {
  if (!isKvAvailable()) {
    const a = mem().areas.find((x) => x.id === id);
    if (!a) throw new Error('Área no encontrada');
    a.name = name;
    return a;
  }
  await ensureBootstrap();
  const current = (await kv().get(K_AREA(id))) as CatalogItem | null;
  if (!current) throw new Error('Área no encontrada');
  const updated: CatalogItem = { ...current, name, id };
  await kv().set(K_AREA(id), updated);
  return updated;
}

export async function deleteArea(id: string): Promise<void> {
  if (!isKvAvailable()) {
    const store = mem();
    store.areas = store.areas.filter((a) => a.id !== id);
    return;
  }
  await ensureBootstrap();
  await kv().del(K_AREA(id));
  await kv().srem(K_AREAS_INDEX, id);
}

export type { ParticipationStatus };
