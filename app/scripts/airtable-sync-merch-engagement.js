// Crea (si no existen) y puebla las tablas de Engagement y Merch en Airtable.
// Idempotente por nombre de tabla: si ya existe, no la recrea ni la repuebla.
//
// Toma los datos actuales desde la API en vivo del dev server (localhost:3000)
// para reflejar exactamente lo que la app tiene cargado.
//
// Uso:  node scripts/airtable-sync-merch-engagement.js

const fs = require('fs');
const path = require('path');

const ENV = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const getEnv = (k) => {
  const m = ENV.match(new RegExp(k + '="?([^"\\n]*)'));
  return m ? m[1] : '';
};

const TOKEN = getEnv('AIRTABLE_TOKEN');
const BASE = getEnv('AIRTABLE_BASE_ID');
const ADMIN_EMAIL = getEnv('ADMIN_EMAIL') || 'admin@baldecash.com';
const ADMIN_PASS = getEnv('ADMIN_PASSWORD') || 'Baldecash2026!';
const APP = 'http://localhost:3000';

const META = `https://api.airtable.com/v0/meta/bases/${BASE}/tables`;
const authHeaders = { Authorization: `Bearer ${TOKEN}`, 'Content-Type': 'application/json' };

const PARTICIPATION = ['Participo', 'No Participo', 'No Aplica', 'Aun No Participa'];
const choices = (names) => names.map((n) => ({ name: n }));

async function jfetch(url, opts) {
  const r = await fetch(url, opts);
  const text = await r.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  return { ok: r.ok, status: r.status, json };
}

// ---- 1) Datos actuales desde la API en vivo ----
async function loginCookie() {
  const r = await fetch(`${APP}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const sc = r.headers.get('set-cookie') || '';
  const m = sc.match(/bcrt_session=[^;]+/);
  if (!m) throw new Error('No se pudo loguear para leer la API (cookie no recibida)');
  return m[0];
}

async function fetchData(cookie) {
  const get = async (p) => {
    const r = await fetch(`${APP}${p}`, { headers: { Cookie: cookie } });
    const j = await r.json();
    return j.data || [];
  };
  const [areas, events, participants, orders, usages] = await Promise.all([
    get('/api/engagement/areas'),
    get('/api/engagement/events'),
    get('/api/engagement/participants'),
    get('/api/merch/orders'),
    get('/api/merch/usages'),
  ]);
  return { areas, events, participants, orders, usages };
}

// ---- 2) Helpers de schema ----
async function listTables() {
  const { ok, json, status } = await jfetch(META, { headers: authHeaders });
  if (!ok) throw new Error(`No se pudo leer el esquema (status ${status}): ${JSON.stringify(json).slice(0, 200)}`);
  return json.tables;
}

async function createTable(name, fields) {
  const { ok, json, status } = await jfetch(META, {
    method: 'POST',
    headers: authHeaders,
    body: JSON.stringify({ name, fields }),
  });
  if (!ok) {
    throw new Error(`CREATE TABLE "${name}" fallo (status ${status}): ${JSON.stringify(json).slice(0, 300)}`);
  }
  return json; // {id, name, fields:[{id,name,...}]}
}

async function addRecords(tableId, records) {
  // En lotes de 10, con typecast para crear opciones de singleSelect al vuelo.
  for (let i = 0; i < records.length; i += 10) {
    const batch = records.slice(i, i + 10);
    const { ok, json, status } = await jfetch(`https://api.airtable.com/v0/${BASE}/${tableId}`, {
      method: 'POST',
      headers: authHeaders,
      body: JSON.stringify({ records: batch.map((fields) => ({ fields })), typecast: true }),
    });
    if (!ok) throw new Error(`INSERT en ${tableId} fallo (status ${status}): ${JSON.stringify(json).slice(0, 300)}`);
  }
}

function isoDate(s) {
  if (!s) return undefined;
  const m = String(s).match(/^(\d{4})-(\d{2})-(\d{2})/);
  return m ? `${m[1]}-${m[2]}-${m[3]}` : undefined;
}

async function main() {
  if (!TOKEN || !BASE) throw new Error('Faltan AIRTABLE_TOKEN / AIRTABLE_BASE_ID en .env.local');

  console.log('→ Leyendo datos actuales desde la API…');
  const cookie = await loginCookie();
  const data = await fetchData(cookie);
  console.log(`  áreas=${data.areas.length} eventos=${data.events.length} colaboradores=${data.participants.length} órdenes=${data.orders.length} usos=${data.usages.length}`);

  const existing = await listTables();
  const byName = new Map(existing.map((t) => [t.name, t]));
  const eventNames = data.events.map((e) => e.name);

  // Definición de tablas (orden importa: Áreas/Eventos antes de Colaboradores).
  const defs = [
    {
      name: 'Engagement Áreas',
      fields: [{ name: 'Área', type: 'singleLineText' }],
    },
    {
      name: 'Engagement Eventos',
      fields: [
        { name: 'Evento', type: 'singleLineText' },
        { name: 'Fecha', type: 'date', options: { dateFormat: { name: 'iso' } } },
      ],
    },
    {
      name: 'Engagement Colaboradores',
      fields: [
        { name: 'Nombre', type: 'singleLineText' },
        { name: 'Status', type: 'singleSelect', options: { choices: choices(['Activo', 'Cese']) } },
        { name: 'Área', type: 'singleSelect', options: { choices: choices(data.areas.map((a) => a.name)) } },
        ...eventNames.map((n) => ({
          name: n,
          type: 'singleSelect',
          options: { choices: choices(PARTICIPATION) },
        })),
      ],
    },
    {
      name: 'Merch Órdenes de compra',
      fields: [
        { name: 'ID Compra', type: 'singleLineText' },
        { name: 'Fecha de Compra', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Tipo de producto', type: 'singleSelect', options: { choices: choices(['Merch', 'Snacks']) } },
        { name: 'Artículo', type: 'singleLineText' },
        { name: 'Precio unit', type: 'number', options: { precision: 2 } },
        { name: 'Cantidad Comprada', type: 'number', options: { precision: 0 } },
        { name: 'Precio Total', type: 'number', options: { precision: 2 } },
        { name: 'Cantidad Llegada', type: 'number', options: { precision: 0 } },
        { name: 'Fecha de Termino', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Proveedor', type: 'singleLineText' },
        { name: 'Contacto', type: 'singleLineText' },
        { name: 'Comentarios', type: 'multilineText' },
      ],
    },
    {
      name: 'Merch Usos',
      fields: [
        { name: 'ID Compra Usado', type: 'singleLineText' },
        { name: 'Fecha', type: 'date', options: { dateFormat: { name: 'iso' } } },
        { name: 'Cantidad', type: 'number', options: { precision: 0 } },
        { name: 'Precio Unit', type: 'number', options: { precision: 2 } },
        { name: 'Monto total', type: 'number', options: { precision: 2 } },
        { name: 'Ocasion', type: 'singleSelect', options: { choices: choices(['Focus Group', 'Regalo', 'Prestamos a Comercial']) } },
      ],
    },
  ];

  const ids = {};
  for (const def of defs) {
    if (byName.has(def.name)) {
      console.log(`= Ya existe: "${def.name}" (no se recrea)`);
      ids[def.name] = { id: byName.get(def.name).id, created: false };
      continue;
    }
    console.log(`+ Creando tabla: "${def.name}"…`);
    const t = await createTable(def.name, def.fields);
    ids[def.name] = { id: t.id, created: true };
    console.log(`  ✓ ${t.id}`);
  }

  // ---- Poblar (solo tablas recién creadas) ----
  const pop = async (name, records) => {
    if (!ids[name].created) {
      console.log(`= "${name}" ya existía: no se repuebla (evita duplicados).`);
      return;
    }
    if (!records.length) return;
    console.log(`→ Poblando "${name}" con ${records.length} registros…`);
    await addRecords(ids[name].id, records);
    console.log(`  ✓ ${name} poblada`);
  };

  await pop('Engagement Áreas', data.areas.map((a) => ({ 'Área': a.name })));
  await pop('Engagement Eventos', data.events.map((e) => ({ Evento: e.name, Fecha: isoDate(e.date) })));

  const eventById = new Map(data.events.map((e) => [e.id, e.name]));
  await pop(
    'Engagement Colaboradores',
    data.participants.map((p) => {
      const f = { Nombre: p.name, Status: p.status };
      if (p.area) f['Área'] = p.area;
      for (const [eid, status] of Object.entries(p.participation || {})) {
        const col = eventById.get(eid);
        if (col) f[col] = status;
      }
      return f;
    }),
  );

  await pop(
    'Merch Órdenes de compra',
    data.orders.map((o) => ({
      'ID Compra': o.orderId,
      'Fecha de Compra': isoDate(o.purchaseDate),
      'Tipo de producto': o.productType,
      'Artículo': o.article,
      'Precio unit': o.unitPrice,
      'Cantidad Comprada': o.qtyOrdered,
      'Precio Total': o.totalPrice,
      'Cantidad Llegada': o.qtyArrived,
      'Fecha de Termino': isoDate(o.endDate),
      Proveedor: o.supplier,
      Contacto: o.contact,
      Comentarios: o.comments,
    })),
  );

  await pop(
    'Merch Usos',
    data.usages.map((u) => ({
      'ID Compra Usado': u.orderId,
      Fecha: isoDate(u.usageDate),
      Cantidad: u.quantity,
      'Precio Unit': u.unitPrice,
      'Monto total': u.totalAmount,
      Ocasion: u.occasion,
    })),
  );

  console.log('\n✅ Listo. Tablas y datos sincronizados en Airtable.');
}

main().catch((e) => {
  console.error('\n❌ ERROR:', e.message);
  process.exit(1);
});
