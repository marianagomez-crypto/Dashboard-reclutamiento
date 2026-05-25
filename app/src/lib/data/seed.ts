import type {
  ActivityLog,
  Area,
  Candidate,
  FinalStatus,
  Fuente,
  Ingreso,
  Source,
  Stage,
  StageMovement,
  User,
  Vacancy,
} from '@/lib/types';
import {
  AREAS,
  FINAL_STATUSES,
  FUENTES,
  HIRING_MANAGERS,
  PRIORITIES,
  RECRUITERS,
  STAGES,
  VACANCY_STATUSES,
} from '@/lib/types';

const firstNames = [
  'Sofia', 'Mateo', 'Valentina', 'Diego', 'Camila', 'Lucas', 'Ximena',
  'Emiliano', 'Renata', 'Sebastian', 'Isabella', 'Daniel', 'Regina',
  'Leonardo', 'Andrea', 'Bruno', 'Paula', 'Aaron', 'Maria', 'Adrian',
  'Lucia', 'Joaquin', 'Catalina', 'Nicolas', 'Fernanda', 'Tomas',
];

const lastNames = [
  'Lopez', 'Garcia', 'Hernandez', 'Martinez', 'Gonzalez', 'Rodriguez',
  'Perez', 'Sanchez', 'Ramirez', 'Torres', 'Flores', 'Rivera',
  'Mendoza', 'Ortega', 'Castillo', 'Vargas', 'Arias', 'Cruz', 'Reyes',
];

const seniorities = ['Junior', 'Semi-Senior', 'Senior', 'Lead', 'Practicante'];

const positionsByArea: Record<string, string[]> = {
  COBRANZAS: ['Analista de Cobranzas', 'Supervisor de Cobranza', 'Gestor de Cobranza Telefonica'],
  'CONTABILIDAD Y CONTROLLER': ['Analista Contable', 'Controller Financiero', 'Auxiliar Contable'],
  'CONVENCIONES Y ALIANZAS': ['Ejecutivo de Convenios', 'Coordinador de Alianzas'],
  GROWTH: ['Growth Analyst', 'Performance Marketing', 'SEO Specialist'],
  LEGAL: ['Abogado Corporativo', 'Paralegal', 'Compliance Officer'],
  OPERACIONES: ['Coordinador de Operaciones', 'Analista de Procesos'],
  'TALENTO & CULTURA': ['Generalista de RH', 'Business Partner'],
  'TECONOLOGIA Y FINANZAS': ['Backend Engineer', 'Data Engineer', 'Analista Financiero'],
  VENTAS: ['Ejecutivo de Ventas', 'Key Account Manager', 'SDR'],
  'PRODUCT OWNER ': ['Product Owner', 'Product Manager'],
};

function rand<T>(arr: readonly T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function randomDate(daysBack: number, daysForward = 0): string {
  const offset = Math.floor(Math.random() * (daysBack + daysForward)) - daysForward;
  const d = new Date();
  d.setDate(d.getDate() - offset);
  d.setHours(Math.floor(Math.random() * 24), Math.floor(Math.random() * 60));
  return d.toISOString();
}

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

export function seedUsers(): User[] {
  return [
    {
      id: 'usr_admin',
      email: 'admin@baldecash.com',
      name: 'Administrador Baldecash',
      role: 'admin',
      active: true,
      createdAt: '2026-01-10T10:00:00.000Z',
      lastLoginAt: new Date().toISOString(),
    },
    {
      id: 'usr_recruiter_1',
      email: 'antonella.arellano@baldecash.com',
      name: 'Antonella Arellano',
      role: 'recruiter',
      active: true,
      createdAt: '2026-02-02T12:30:00.000Z',
      lastLoginAt: new Date(Date.now() - 3600_000).toISOString(),
    },
    {
      id: 'usr_recruiter_2',
      email: 'mayra.pereira@baldecash.com',
      name: 'Mayra Pereira',
      role: 'recruiter',
      active: true,
      createdAt: '2026-02-14T09:00:00.000Z',
      lastLoginAt: new Date(Date.now() - 86_400_000).toISOString(),
    },
    {
      id: 'usr_viewer_1',
      email: 'directora@baldecash.com',
      name: 'Direccion Baldecash',
      role: 'viewer',
      active: true,
      createdAt: '2026-03-01T08:00:00.000Z',
    },
  ];
}

export function seedVacancies(): Vacancy[] {
  const out: Vacancy[] = [];
  for (let i = 0; i < 18; i++) {
    const area = rand(AREAS) as Area;
    const positions = positionsByArea[area] || ['Analista'];
    const status =
      Math.random() > 0.75
        ? 'Cerrada'
        : Math.random() > 0.6
          ? 'En Pausa'
          : 'Abierta';
    const openedAt = randomDate(120);
    out.push({
      id: `VAC-${(1000 + i).toString()}`,
      recordId: `rec_${uid('vac')}`,
      title: rand(positions),
      area,
      seniority: rand(seniorities),
      recruiter: rand(RECRUITERS),
      hiringManager: rand(HIRING_MANAGERS),
      openedAt,
      closedAt: status === 'Cerrada' ? randomDate(20) : undefined,
      status: status as Vacancy['status'],
      priority: rand(PRIORITIES),
      modalidad: Math.random() > 0.4 ? 'Hibrido' : 'Presencial',
      positions: 1 + Math.floor(Math.random() * 3),
      reopens: Math.random() > 0.8 ? 1 : 0,
    });
  }
  return out;
}

export function seedCandidates(vacancies: Vacancy[]): Candidate[] {
  const list: Candidate[] = [];
  for (let i = 0; i < 96; i++) {
    const first = rand(firstNames);
    const last = rand(lastNames);
    const vacancy = rand(vacancies);
    const r = Math.random();
    let stage: Stage;
    let finalStatus: FinalStatus;
    if (r < 0.25) {
      stage = 'Screening';
      finalStatus = 'En proceso';
    } else if (r < 0.45) {
      stage = 'Entrevista T&C';
      finalStatus = 'En proceso';
    } else if (r < 0.6) {
      stage = 'Entrevista líder';
      finalStatus = 'En proceso';
    } else if (r < 0.7) {
      stage = 'Prueba Tecnica';
      finalStatus = 'En proceso';
    } else if (r < 0.8) {
      stage = 'Oferta';
      finalStatus = 'En proceso';
    } else if (r < 0.9) {
      stage = 'Ingreso';
      finalStatus = 'Contratado';
    } else {
      stage = rand(STAGES);
      finalStatus = rand(['Se cayó', 'No seleccionado'] as FinalStatus[]);
    }
    list.push({
      id: `CAND-${(2000 + i).toString()}`,
      recordId: `rec_${uid('cand')}`,
      name: `${first} ${last}`,
      vacancyId: vacancy.id,
      source: rand(FUENTES) as Fuente,
      appliedAt: randomDate(90),
      recruiter: rand(RECRUITERS),
      stage,
      finalStatus,
      dropReason: finalStatus === 'Se cayó' ? rand(['Contraoferta', 'Cambio de plan', 'No respondió']) : undefined,
      hired: finalStatus === 'Contratado',
    });
  }
  return list;
}

export function seedStageMovements(candidates: Candidate[]): StageMovement[] {
  const movements: StageMovement[] = [];
  for (const c of candidates) {
    const idx = STAGES.indexOf(c.stage);
    for (let i = 0; i <= idx; i++) {
      const stage = STAGES[i];
      const startedAt = randomDate(60 - i * 5);
      const endedAt = i < idx ? randomDate(40 - i * 5) : undefined;
      movements.push({
        id: `MOV-${uid('mov')}`,
        recordId: `rec_${uid('mov')}`,
        candidateId: c.id,
        vacancyId: c.vacancyId || '',
        stage,
        startedAt,
        endedAt,
        result: i < idx ? 'Aprobado' : undefined,
      });
    }
  }
  return movements;
}


export function seedSources(): Source[] {
  return [
    { id: 'src_1', name: 'LinkedIn', monthlyCost: 8000, owner: 'Antonella Arellano' },
    { id: 'src_2', name: 'Referido', monthlyCost: 0, owner: '—' },
    { id: 'src_3', name: 'Computrabajo', monthlyCost: 1500, owner: 'Mayra Pereira' },
    { id: 'src_4', name: 'Bumeran', monthlyCost: 1200, owner: 'Mayra Pereira' },
  ];
}

export function seedIngresos(candidates: Candidate[]): Ingreso[] {
  const hired = candidates.filter((c) => c.hired);
  return hired.map((c) => ({
    id: uid('ing'),
    candidateId: c.id,
    startDate: randomDate(60),
    stillEmployed: Math.random() > 0.2,
    passedProbation: Math.random() > 0.1,
  }));
}

export function seedActivity(users: User[]): ActivityLog[] {
  const actions = [
    'creo un candidato',
    'actualizo etapa de candidato',
    'sincronizo con Airtable',
    'edito una vacante',
    'envio una oferta',
    'inicio sesion',
    'exporto reporte',
  ];
  const list: ActivityLog[] = [];
  for (let i = 0; i < 40; i++) {
    const u = rand(users);
    list.push({
      id: uid('act'),
      userId: u.id,
      userName: u.name,
      action: rand(actions),
      entity: rand(['candidato', 'vacante', 'sistema'] as const),
      detail: undefined,
      createdAt: randomDate(15),
    });
  }
  return list.sort((a, b) => (a.createdAt < b.createdAt ? 1 : -1));
}
