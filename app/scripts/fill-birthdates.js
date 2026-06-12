// Llena la Fecha de Nacimiento (birthDate) de los colaboradores.
const fs = require('fs');
const path = require('path');
const ENV = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
const g = (k) => (ENV.match(new RegExp(k + '="?([^"\\n]*)')) || [])[1] || '';
const APP = 'http://localhost:3000';

// [nombre, fecha nacimiento d/m/yyyy]
const DATA = [
  ['Aguirre Cruz, Gerardo José María', '14/12/1997'],
  ['Alvarez Chacon, Silvana Nicole', '02/02/2005'],
  ['Aniceto Bustiza, Luis Andres', '14/01/2003'],
  ['Arellano Adrianzen, Antonella Valeria', '08/01/1998'],
  ['Atanacio Flores, Sergio Sebastian Alessandro', '12/02/2002'],
  ['Ávila Juarez, Julio Cesar', '19/04/1991'],
  ['Cadenas Jimenez, Yosmar Mailin', '31/03/1996'],
  ['Condori Anccasi, Fernando', '20/07/2003'],
  ['Del Río Pérez, Marco Antonio', '04/11/1997'],
  ['Dellan Bravo, Lidymar Aiskel', '26/03/1989'],
  ['Espinoza Tueros, Pamela Karla', '16/03/2004'],
  ['Estela Roman, Ana Cecilia', '28/12/1977'],
  ['Ferrer Quijandria, Maria Fernanda', '25/07/1997'],
  ['Flores Arias, Alessandra Paola', '28/04/2001'],
  ['Gamboa Delgado, Genesis Alejandra', '15/09/1991'],
  ['Garcia Quiroz, Milena Dayan', '23/06/1998'],
  ['Garratt De Olazabal, Gretchen', '20/03/1969'],
  ['Gomez Sheen, Mariana Lucia', '12/04/2005'],
  ['Gonzales Torres, Emilio', '08/10/1997'],
  ['Hagel Berry, Vania Sofia', '06/08/2001'],
  ['Hinojosa Estrada, Jorge Dario', '30/08/1994'],
  ['Ledesma Liebana, Carolina', '08/03/1974'],
  ['Mariscal Mac Gregor, Consuelo Susana', '09/03/1973'],
  ['Mc Gregor Villegas, Stefania', '30/08/1986'],
  ['Medina Coriloclla, Leonardo Fidel', '16/05/1997'],
  ['Medina Valencia, Frank Halory', '01/03/1993'],
  ['Mendoza Cabanillas, Edward Johann', '20/11/1989'],
  ['Mendoza Obregon, Jahayra Mercedes', '21/03/1995'],
  ['Miyashiro Salinas, Meylin', '26/05/1981'],
  ['Montenegro Lee, Rubén Angel', '11/10/1976'],
  ['Morales Alayo, Jorge', '16/07/1995'],
  ['Niño Suarez, David Joaquin', '06/11/2003'],
  ['Obando Salcedo, Mónica Del Pilar', '14/11/1981'],
  ['Palacios Paulet, Rita Elizabeth', '28/02/1994'],
  ['Palomino Sandoval, Anderson Moises', '23/01/2001'],
  ['Pereira Santa Maria, Mayra Paola', '02/07/2002'],
  ['Pumatanca Vasquez, Jorge Luis', '11/03/2003'],
  ['Ramos Quispe, Elisban Alberto', '18/06/1990'],
  ['Rojas Leaño, Juan Percy', '12/02/2004'],
  ['Rojas Tuanama, Luz Bella', '29/04/1991'],
  ['Sanchez Olivas, Antoni Aldahir', '28/12/1997'],
  ['Santamaria Lozada, Monica Almendra', '19/03/1994'],
  ['Sarmiento Villanueva, Joseph Antony', '26/05/1999'],
  ['Tagle Avendaño, Judith Mirian', '27/11/2000'],
  ['Vasquez Fasabi, Solansh Viviana', '18/06/2000'],
  ['Velarde Balarezo, Camila Del Carmen', '30/06/2003'],
  ['Yovera Cavero, Yadira Rosaura', '27/10/1983'],
  ['Zavala Milla, Miguel Fernando', '17/05/2001'],
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

  let ok = 0;
  const unmatched = [];
  for (const [name, dob] of DATA) {
    let p = byNorm.get(norm(name));
    if (!p) {
      const key = norm(name.split(',')[0]);
      p = list.find((x) => norm(x.name).startsWith(key));
    }
    const d = iso(dob);
    if (!p || !d) {
      unmatched.push(name);
      continue;
    }
    const r = await fetch(`${APP}/api/engagement/participants/${p.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', Cookie: cookie },
      body: JSON.stringify({ birthDate: d }),
    });
    if (r.ok) { ok++; process.stdout.write('.'); }
    else { process.stdout.write('x'); console.log('\nERR', name, r.status); }
  }
  console.log(`\nActualizados: ${ok}/${DATA.length}`);
  if (unmatched.length) console.log('Sin match:', unmatched.join(' | '));
}
main().catch((e) => { console.error('ERROR', e.message); process.exit(1); });
