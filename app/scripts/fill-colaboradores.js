// Llena DNI, Fecha de Ingreso, Cargo y Área de los colaboradores a partir de los
// datos de la planilla (imágenes). Matchea por nombre contra los registros
// existentes y hace PATCH a /api/engagement/participants/:id.

const fs = require('fs');
const path = require('path');
const ENV = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const getEnv = (k) => {
  const m = ENV.match(new RegExp(k + '="?([^"\\n]*)'));
  return m ? m[1] : '';
};
const APP = 'http://localhost:3000';
const ADMIN_EMAIL = getEnv('ADMIN_EMAIL') || 'admin@baldecash.com';
const ADMIN_PASS = getEnv('ADMIN_PASSWORD') || 'Baldecash2026!';

// [nombre, dni, fecha d/m/yyyy, cargo, area]   ('' = sin dato)
const DATA = [
  ['Palacios Paulet, Rita Elizabeth', '48312257', '2/3/2026', 'Gestor de Cobranzas', 'Cobranzas'],
  ['Cadenas Jimenez, Yosmar Mailin', '4999817', '1/2/2025', 'Gestor de Cobranzas', 'Cobranzas'],
  ['Garcia Quiroz, Milena Dayan', '73479259', '24/9/2025', 'Analista Contable', 'Contabilidad y controller'],
  ['Ramos Quispe, Elisban Alberto', '47163779', '7/7/2025', 'ANALISTA SENIOR DE DATA COBRANZAS Y COMERCIAL', 'Tecnologia y finanzas'],
  ['Dellan Bravo, Lidymar Aiskel', '3691156', '1/3/2025', 'Gestor de Cobranzas', 'Cobranzas'],
  ['Morales Alayo, Jorge', '70374995', '15/10/2024', 'Jefe de Contabilidad y Controller', 'Contabilidad y controller'],
  ['Atanacio Flores, Sergio Sebastian Alessandro', '73455469', '23/1/2026', 'PRACTICANTE DE DATA', 'Tecnologia y finanzas'],
  ['Lira Olivares, Janet Lilia', '42244102', '1/5/2026', 'Gestor de Cobranzas', 'Cobranzas'],
  ['Niño Suarez, David Joaquin', '71377030', '5/1/2026', 'PRACTICANTE DE DATA', 'Tecnologia y finanzas'],
  ['Yovera Cavero, Yadira Rosaura', '42064210', '30/10/2024', 'Jefe de Cobranzas', 'Cobranzas'],
  ['Aguirre Cruz, Gerardo José María', '77152296', '1/1/2024', 'Analista Jr. de Tesorería', 'Tecnologia y finanzas'],
  ['Cordova Calle, Henry', '', '', '', 'Cobranzas'],
  ['Mendoza Obregon, Jahayra Mercedes', '76629622', '23/1/2026', 'Gestor de Cobranzas', 'Cobranzas'],
  ['Aliaga Diaz, Cecilia Maribel', '10280126', '4/8/2025', 'COORDINADORA DE CANALES INSTITUCIONALES', 'Convenciones y alianzas'],
  ['Montenegro Lee, Rubén Angel', '10314652', '1/11/2022', 'CEO', 'Gerencia General'],
  ['Alvarez Chacon, Silvana Nicole', '74128230', '3/2/2026', 'PRACTICANTE DE PROYECTOS', 'Growth'],
  ['Espinoza Tueros, Pamela Karla', '72446968', '9/9/2025', 'ANALISTA DE PROYECTOS', 'Growth'],
  ['Hagel Berry, Vania Sofia', '75166154', '18/11/2024', 'Analista de Growth', 'Growth'],
  ['Flores Arias, Alessandra Paola', '77300009', '13/7/2025', 'ANALISTA JUNIOR DE LEGAL', 'Legal'],
  ['Ávila Juarez, Julio Cesar', '47904012', '1/11/2024', '', 'Operaciones'],
  ['Chipa Espinoza, Sandra Lizbeth', '', '', '', 'Operaciones'],
  ['Estela Roman, Ana Cecilia', '6803507', '11/3/2025', 'GESTOR DE PRE ADMISION', 'Operaciones'],
  ['Ferrer Quijandria, Maria Fernanda', '73114577', '2/2/2026', 'Gestor de Call Center', 'Operaciones'],
  ['Gamboa Delgado, Genesis Alejandra', '3008530', '3/3/2025', 'Supervisor de Logística', 'Operaciones'],
  ['Garratt De Olazabal, Gretchen', '9279737', '1/1/2026', 'GESTOR DE PRE ADMISION', 'Operaciones'],
  ['Hinojosa Estrada, Jorge Dario', '', '', '', 'Operaciones'],
  ['Ledesma Liebana, Carolina', '7886928', '1/4/2024', 'Coordinadora de Proyectos', 'Operaciones'],
  ['Mariscal Mac Gregor, Consuelo Susana', '9851825', '1/8/2022', 'Gerente de Operaciones y T&C', 'Operaciones'],
  ['Mc Gregor Villegas, Stefania', '43866341', '11/3/2025', 'Gestor de Call Center', 'Operaciones'],
  ['Medina Valencia, Frank Halory', '47809627', '16/1/2023', 'Jefe de Admisión', 'Operaciones'],
  ['Mendoza Cabanillas, Edward Johann', '46045998', '1/1/2025', 'Analista Senior de Soporte Técnico', 'Operaciones'],
  ['Miyashiro Salinas, Meylin', '40962708', '6/1/2026', 'SUPERVISOR DE CALL CENTER Y ATENCION AL USUARIO', 'Operaciones'],
  ['Pumatanca Vasquez, Jorge Luis', '74716700', '1/6/2024', 'Analista Jr. de Soporte Técnico', 'Operaciones'],
  ['Rojas Leaño, Juan Percy', '72656783', '10/10/2025', 'Analista Jr. de Soporte Técnico', 'Operaciones'],
  ['Rojas Tuanama, Luz Bella', '47089827', '19/3/2026', 'Gestor de Soporte al Estudiante', 'Operaciones'],
  ['Sanchez Olivas, Antoni Aldahir', '73363801', '2/10/2025', 'PRACTICANTE PROFESIONAL DE LOGISTICA', 'Operaciones'],
  ['Santamaria Lozada, Monica Almendra', '72713224', '1/1/2026', 'GESTOR DE PRE ADMISION', 'Operaciones'],
  ['Tagle Avendaño, Judith Mirian', '75436416', '16/5/2024', 'Practicante Pre de Logística', 'Operaciones'],
  ['Vasquez Fasabi, Solansh Viviana', '', '', '', 'Operaciones'],
  ['Arellano Adrianzen, Antonella Valeria', '72180382', '7/4/2025', 'Analista de Talento y Cultura', 'Talento & Cultura'],
  ['Gomez Sheen, Mariana Lucia', '76412884', '10/2/2025', 'PRACTICANTE PRE PROFESIONAL DE TALENTO & CULTURA', 'Talento & Cultura'],
  ['Pereira Santa Maria, Mayra Paola', '72503891', '1/9/2025', 'Practicante Pro de Talento & Cultura', 'Talento & Cultura'],
  ['Condori Anccasi, Fernando', '73065423', '2/2/2026', 'ANALISTA DE DATA Y RIESGOS', 'Tecnologia y finanzas'],
  ['Del Río Pérez, Marco Antonio', '73276520', '1/1/2022', 'Gerente de TI y Finanzas', 'Tecnologia y finanzas'],
  ['Gonzales Torres, Emilio', '73042541', '1/12/2025', 'FULL STACK DEVELOPER SENIOR', 'Tecnologia y finanzas'],
  ['Medina Coriloclla, Leonardo Fidel', '70401669', '1/3/2024', 'Fullstack developer', 'Tecnologia y finanzas'],
  ['Palomino Sandoval, Anderson Moises', '72329114', '13/5/2025', 'FULL STACK DEVELOPER JUNIOR', 'Tecnologia y finanzas'],
  ['Zavala Milla, Miguel Fernando', '70201698', '18/12/2025', 'PRACTICANTE DE PLATAFORMAS DIGITALES', 'Tecnologia y finanzas'],
  ['Aniceto Bustiza, Luis Andres', '72213928', '5/1/2026', 'Practicante Profesional de Activaciones', 'Ventas'],
  ['Cachay Angulo, Jhahayra', '47738808', '17/2/2026', 'Supervisor de Ventas y Convenios', 'Ventas'],
  ['Obando Salcedo, Mónica Del Pilar', '41152802', '6/5/2024', 'Gerente de Ventas', 'Ventas'],
  ['Velarde Balarezo, Camila Del Carmen', '76785357', '5/1/2026', 'Practicante Profesional de Activaciones', 'Ventas'],
];

function isoDate(dmy) {
  if (!dmy) return '';
  const m = dmy.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
  if (!m) return '';
  const dd = m[1].padStart(2, '0');
  const mm = m[2].padStart(2, '0');
  return `${m[3]}-${mm}-${dd}`;
}
function norm(s) {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

async function main() {
  const login = await fetch(`${APP}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email: ADMIN_EMAIL, password: ADMIN_PASS }),
  });
  const cookie = (login.headers.get('set-cookie') || '').match(/bcrt_session=[^;]+/)?.[0];
  if (!cookie) throw new Error('login fallo');

  const list = (await (await fetch(`${APP}/api/engagement/participants`, { headers: { Cookie: cookie } })).json()).data;
  const byNorm = new Map(list.map((p) => [norm(p.name), p]));

  let ok = 0;
  const unmatched = [];
  for (const [name, dni, date, cargo, area] of DATA) {
    let p = byNorm.get(norm(name));
    if (!p) {
      // fallback: match por apellidos + primer nombre (prefijo antes de la coma)
      const key = norm(name.split(',')[0]);
      p = list.find((x) => norm(x.name).startsWith(key));
    }
    if (!p) {
      unmatched.push(name);
      continue;
    }
    const body = {};
    if (dni) body.dni = dni;
    const iso = isoDate(date);
    if (iso) body.hireDate = iso;
    if (cargo) body.position = cargo;
    if (area) body.area = area;
    if (Object.keys(body).length === 0) continue;

    const r = await fetch(`${APP}/api/engagement/participants/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify(body),
    });
    if (r.ok) {
      ok++;
      process.stdout.write('.');
    } else {
      process.stdout.write('x');
      console.log('\nERR', name, r.status, (await r.text()).slice(0, 120));
    }
  }
  console.log(`\nActualizados: ${ok}/${DATA.length}`);
  if (unmatched.length) console.log('Sin match:', unmatched.join(' | '));
}
main().catch((e) => {
  console.error('ERROR', e.message);
  process.exit(1);
});
