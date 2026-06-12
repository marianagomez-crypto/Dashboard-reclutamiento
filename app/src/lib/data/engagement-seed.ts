// Datos semilla de Engagement & Cultura — matriz de eventos.
// Tomados de la base operativa (planilla de participación por evento).

import type {
  EngagementEvent,
  EngagementParticipant,
  ParticipationStatus,
} from '@/lib/types';

// Eventos (columnas de la matriz). Los ids son estables: la participación
// de cada colaborador se indexa por estos ids.
export const SEED_EVENTS: EngagementEvent[] = [
  { id: 'EV0001', name: 'Desayuno con Ruben' },
  { id: 'EV0002', name: 'Dia de la Mujer' },
  { id: 'EV0003', name: 'BaldeCash 2026' },
  { id: 'EV0004', name: 'Dia de la Madre' },
];

// Filas de la matriz: [status, nombre, [participación EV1..EV4]].
const ROWS: Array<
  [string, string, [ParticipationStatus, ParticipationStatus, ParticipationStatus, ParticipationStatus]]
> = [
  ['Cese', 'Aliaga Diaz, Cecilia Maribel', ['Participo', 'No Participo', 'No Participo', 'Participo']],
  ['Activo', 'Chipa Espinoza, Sandra Lizbeth', ['Aun No Participa', 'No Participo', 'No Aplica', 'Participo']],
  ['Activo', 'Estela Roman, Ana Cecilia', ['Aun No Participa', 'No Participo', 'No Participo', 'Participo']],
  ['Activo', 'Ferrer Quijandria, Maria Fernanda', ['Aun No Participa', 'No Participo', 'Participo', 'Participo']],
  ['Activo', 'Mc Gregor Villegas, Stefania', ['Aun No Participa', 'No Participo', 'Participo', 'Participo']],
  ['Activo', 'Mendoza Obregon, Jahayra Mercedes', ['Aun No Participa', 'No Participo', 'No Participo', 'Participo']],
  ['Activo', 'Rojas Tuanama, Luz Bella', ['Aun No Participa', 'No Aplica', 'No Aplica', 'Participo']],
  ['Activo', 'Santamaria Lozada, Monica Almendra', ['Aun No Participa', 'No Participo', 'No Participo', 'Participo']],
  ['Activo', 'Lira Olivares, Janet Lilia', ['Participo', 'No Aplica', 'No Aplica', 'Participo']],
  ['Activo', 'Mariscal Mac Gregor, Consuelo Susana', ['Participo', 'Participo', 'Participo', 'Participo']],
  ['Activo', 'Miyashiro Salinas, Meylin', ['Aun No Participa', 'Participo', 'Participo', 'Participo']],
  ['Activo', 'Garratt De Olazabal, Gretchen', ['Aun No Participa', 'No Participo', 'No Participo', 'Participo']],
  ['Activo', 'Aguirre Cruz, Gerardo José María', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Alvarez Chacon, Silvana Nicole', ['Participo', 'No Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Aniceto Bustiza, Luis Andres', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Arellano Adrianzen, Antonella Valeria', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Atanacio Flores, Sergio Sebastian Alessandro', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Ávila Juarez, Julio Cesar', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Caballero Torero, Haru Ximena Andrea', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Cese', 'Cachay Angulo, Jhahayra', ['Aun No Participa', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Cadenas Jimenez, Yosmar Mailin', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Carrillo Quispe, Richard Brayk', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Activo', 'Condori Anccasi, Fernando', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Cordova Calle, Henry', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Activo', 'Del Río Pérez, Marco Antonio', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Dellan Bravo, Lidymar Aiskel', ['Aun No Participa', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Espinoza Tueros, Pamela Karla', ['Aun No Participa', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Flores Arias, Alessandra Paola', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Gamboa Delgado, Genesis Alejandra', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Garcia Quiroz, Milena Dayan', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Gomez Sheen, Mariana Lucia', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Gonzales Torres, Emilio', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Hagel Berry, Vania Sofia', ['Aun No Participa', 'No Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Hinojosa Estrada, Jorge Dario', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Activo', 'Ledesma Liebana, Carolina', ['Aun No Participa', 'No Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Medina Coriloclla, Leonardo Fidel', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Medina Valencia, Frank Halory', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Mendoza Cabanillas, Edward Johann', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Montenegro Lee, Rubén Angel', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Morales Alayo, Jorge', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Niño Suarez, David Joaquin', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Obando Salcedo, Mónica Del Pilar', ['Aun No Participa', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Palacios Paulet, Rita Elizabeth', ['Aun No Participa', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Palomino Sandoval, Anderson Moises', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Pantoja Huanay, Jose Antonio', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Activo', 'Pereira Santa Maria, Mayra Paola', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Pumatanca Vasquez, Jorge Luis', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Ramos Quispe, Elisban Alberto', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Rengifo Barrientos, Candra Sofia', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Activo', 'Rojas Leaño, Juan Percy', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Sanchez Olivas, Antoni Aldahir', ['Aun No Participa', 'No Aplica', 'Participo', 'No Aplica']],
  ['Activo', 'Tagle Avendaño, Judith Mirian', ['Aun No Participa', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Vasquez Fasabi, Solansh Viviana', ['Aun No Participa', 'No Aplica', 'No Aplica', 'No Aplica']],
  ['Activo', 'Velarde Balarezo, Camila Del Carmen', ['Participo', 'Participo', 'Participo', 'No Aplica']],
  ['Activo', 'Yovera Cavero, Yadira Rosaura', ['Aun No Participa', 'Participo', 'No Participo', 'No Aplica']],
  ['Activo', 'Zavala Milla, Miguel Fernando', ['Participo', 'No Aplica', 'Participo', 'No Aplica']],
];

export const SEED_PARTICIPANTS: EngagementParticipant[] = ROWS.map(
  ([status, name, cells], i) => ({
    id: `EP${String(i + 1).padStart(4, '0')}`,
    name,
    status: status as EngagementParticipant['status'],
    participation: {
      [SEED_EVENTS[0].id]: cells[0],
      [SEED_EVENTS[1].id]: cells[1],
      [SEED_EVENTS[2].id]: cells[2],
      [SEED_EVENTS[3].id]: cells[3],
    },
  }),
);
