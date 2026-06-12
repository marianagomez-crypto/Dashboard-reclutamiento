// Carga exámenes médicos (de la planilla). Matchea colaborador por nombre.
const fs = require('fs');
const path = require('path');
const ENV = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const g = (k) => (ENV.match(new RegExp(k + '="?([^"\\n]*)')) || [])[1] || '';
const APP = 'http://localhost:3000';

// [nombre, fecha examen d/m/yyyy, sede, resultado]
const DATA = [
  ['Palacios Paulet, Rita Elizabeth', '11/5/2026', 'Callao', 'Con observaciones'],
  ['Cadenas Jimenez, Yosmar Mailin', '12/5/2026', 'Lima Norte', 'Con observaciones'],
  ['Garcia Quiroz, Milena Dayan', '12/5/2026', 'Lima Sur', 'Apto'],
  ['Ramos Quispe, Elisban Alberto', '12/5/2026', 'Lima Centro', 'Apto'],
  ['Dellan Bravo, Lidymar Aiskel', '13/5/2026', 'Lima Norte', 'Apto'],
  ['Morales Alayo, Jorge', '13/5/2026', 'Lima Centro', 'Apto'],
  ['Atanacio Flores, Sergio Sebastian Alessandro', '13/5/2026', 'Lima Centro', 'Apto'],
  ['Lira Olivares, Janet Lilia', '14/5/2026', 'Lima Centro', 'Apto'],
  ['Niño Suarez, David Joaquin', '14/5/2026', 'Lima Centro', 'Apto'],
  ['Yovera Cavero, Yadira Rosaura', '15/5/2026', 'Lima Norte', 'Apto'],
  ['Aguirre Cruz, Gerardo José María', '15/5/2026', 'Lima Centro', 'Apto'],
];

const iso = (dmy) => {
  const m = (dmy || '').match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : '';
};
const norm = (s) =>
  (s || '').toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

async function main() {
  const login = await fetch(`${APP}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: g('ADMIN_EMAIL') || 'admin@baldecash.com', password: g('ADMIN_PASSWORD') || 'Baldecash2026!' }),
  });
  const cookie = (login.headers.get('set-cookie') || '').match(/bcrt_session=[^;]+/)?.[0];
  if (!cookie) throw new Error('login fallo');

  const list = (await (await fetch(`${APP}/api/engagement/participants`, { headers: { Cookie: cookie } })).json()).data;
  const byNorm = new Map(list.map((p) => [norm(p.name), p]));
  const existing = (await (await fetch(`${APP}/api/bienestar/examenes`, { headers: { Cookie: cookie } })).json()).data;
  const seen = new Set(existing.map((e) => `${e.collaboratorId}|${e.examDate}`));

  let ok = 0;
  const unmatched = [];
  for (const [name, date, sede, resultado] of DATA) {
    let p = byNorm.get(norm(name));
    if (!p) {
      const key = norm(name.split(',')[0]);
      p = list.find((x) => norm(x.name).startsWith(key));
    }
    if (!p) { unmatched.push(name); continue; }
    const examDate = iso(date);
    if (seen.has(`${p.id}|${examDate}`)) { process.stdout.write('='); continue; }
    const r = await fetch(`${APP}/api/bienestar/examenes`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({
        collaboratorId: p.id,
        collaboratorName: p.name,
        examDate,
        sede,
        status: 'Programado',
        resultado,
      }),
    });
    if (r.ok) { ok++; process.stdout.write('.'); }
    else { process.stdout.write('x'); console.log('\nERR', name, r.status, (await r.text()).slice(0, 120)); }
  }
  console.log(`\nCreados: ${ok}/${DATA.length}`);
  if (unmatched.length) console.log('Sin match:', unmatched.join(' | '));
}
main().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
