// =============================================================================
// Dominio Baldecash Recruitment (mapeado al Airtable real)
// =============================================================================

export type Role = 'admin' | 'recruiter' | 'viewer';

// ---- Etapas del pipeline ----------------------------------------------------
export type Stage =
  | 'Screening'
  | 'Entrevista T&C'
  | 'Entrevista líder'
  | 'Prueba Tecnica'
  | 'Oferta'
  | 'Ingreso';

export const STAGES: Stage[] = [
  'Screening',
  'Entrevista T&C',
  'Entrevista líder',
  'Prueba Tecnica',
  'Oferta',
  'Ingreso',
];

export const STAGE_COLORS: Record<Stage, string> = {
  Screening: '#98A9DF',
  'Entrevista T&C': '#6873D7',
  'Entrevista líder': '#4453A0',
  'Prueba Tecnica': '#36B7B3',
  Oferta: '#FDCA56',
  Ingreso: '#00A29B',
};

// ---- Estado final del candidato --------------------------------------------
export type FinalStatus = 'En proceso' | 'Contratado' | 'Se cayó' | 'No seleccionado';

export const FINAL_STATUSES: FinalStatus[] = [
  'En proceso',
  'Contratado',
  'Se cayó',
  'No seleccionado',
];

export const FINAL_STATUS_COLORS: Record<FinalStatus, string> = {
  'En proceso': '#6873D7',
  Contratado: '#00A29B',
  'Se cayó': '#D14646',
  'No seleccionado': '#987933',
};

// ---- Vacantes ---------------------------------------------------------------
export type VacancyStatus = 'Abierta' | 'En Pausa' | 'Cerrada';
export const VACANCY_STATUSES: VacancyStatus[] = ['Abierta', 'En Pausa', 'Cerrada'];

export type Priority = 'Alta' | 'Media' | 'Baja';
export const PRIORITIES: Priority[] = ['Alta', 'Media', 'Baja'];

export type Modalidad = 'Hibrido' | 'Presencial';
export const MODALIDADES: Modalidad[] = ['Hibrido', 'Presencial'];

export type Area =
  | 'COBRANZAS'
  | 'CONTABILIDAD Y CONTROLLER'
  | 'CONVENCIONES Y ALIANZAS'
  | 'GROWTH'
  | 'LEGAL'
  | 'OPERACIONES'
  | 'TALENTO & CULTURA'
  | 'TECONOLOGIA Y FINANZAS'
  | 'VENTAS'
  | 'PRODUCT OWNER ';

export const AREAS: Area[] = [
  'COBRANZAS',
  'CONTABILIDAD Y CONTROLLER',
  'CONVENCIONES Y ALIANZAS',
  'GROWTH',
  'LEGAL',
  'OPERACIONES',
  'TALENTO & CULTURA',
  'TECONOLOGIA Y FINANZAS',
  'VENTAS',
  'PRODUCT OWNER ',
];

export type Fuente = 'LinkedIn' | 'Referido' | 'Computrabajo' | 'Bumeran';
export const FUENTES: Fuente[] = ['LinkedIn', 'Referido', 'Computrabajo', 'Bumeran'];

// ---- Motivos de caida (singleSelect en Airtable) ----
export type DropReason =
  | 'No asistió'
  | 'Desistió'
  | 'Fue contratado en otra empresa';

export const DROP_REASONS: DropReason[] = [
  'No asistió',
  'Desistió',
  'Fue contratado en otra empresa',
];

export const DROP_REASON_COLORS: Record<DropReason, string> = {
  'No asistió': '#D14646',
  Desistió: '#D17AA6',
  'Fue contratado en otra empresa': '#36B7B3',
};

export const RECRUITERS = ['Antonella Arellano', 'Mayra Pereira'] as const;
export const HIRING_MANAGERS = [
  'Antonella Arellano',
  'Jorge Morales',
  'Marco Del Rio',
  'Ruben Montenegro',
  'Meylin Miyashiro',
  'Yadira Yovera',
  'Monica Obando',
] as const;

// ---- Resultado de movimiento -----------------------------------------------
export type EtapaResultado = 'Aprobado' | 'Aceptó Oferta' | 'No se presentó';

// =============================================================================
// Entidades
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string;
  role: Role;
  avatarUrl?: string;
  active: boolean;
  createdAt: string;
  lastLoginAt?: string;
  passwordHash?: string;
}

export interface Candidate {
  id: string;               // ID_Candidato (singleLineText)
  recordId: string;         // rec... Airtable
  name: string;             // Nombre Completo
  email?: string;           // Email
  phone?: string;           // Teléfono
  linkedinUrl?: string;     // LinkedIn URL
  vacancyId?: string;       // ID Vacante (texto, no link)
  source: Fuente | string;  // Fuente
  appliedAt: string;        // Fecha Postulación
  recruiter?: string;       // Reclutador
  stage: Stage;             // Etapa Actual
  finalStatus: FinalStatus; // Estado Final
  dropReason?: DropReason | string; // Motivo Caída (singleSelect)
  hired?: boolean;          // Contratado
}

export interface Vacancy {
  id: string;               // ID_Vacante
  recordId: string;         // rec...
  title: string;            // Puesto
  area: Area | string;      // Área
  seniority?: string;       // Seniority
  recruiter?: string;       // Reclutador
  hiringManager?: string;   // Hiring Manager
  openedAt: string;         // Fecha Apertura
  closedAt?: string;        // Fecha Cierre
  status: VacancyStatus;    // Estado Vacante
  priority: Priority;       // Prioridad
  modalidad?: Modalidad;    // Modalidad
  positions: number;        // Cantidad Posiciones
  reopens?: number;         // Veces Reabierta
  reopenReason?: string;    // Motivo Reapertura
}

export interface StageMovement {
  id: string;               // ID Movimiento
  recordId: string;
  candidateId: string;      // ID Candidato
  vacancyId: string;        // ID Vacante
  stage: Stage;             // Etapa
  startedAt: string;        // Fecha Inicio
  endedAt?: string;         // Fecha Fin
  result?: EtapaResultado;  // Resultado
  comments?: string;        // Comentarios
}

export interface Source {
  id: string;
  sourceId?: string;        // ID Fuentes
  vacancyId?: string;       // ID VACANTE
  name: string;             // Fuente (singleSelect)
  monthlyCost?: number;     // Costo Mensual
  owner?: string;           // Responsable
}

export interface SalaryRange {
  id: string;
  vacancyId: string;        // ID VACANTE
  min?: number;             // SALARIO MINIMO
  max?: number;             // SALARIO MAXIMO
  status?: string;          // Status
}

export interface ReviewTime {
  id: string;
  reviewId: string;         // ID Revision
  candidateId?: string;     // ID Candidato
  cvSentAt?: string;        // Fecha de envio de cv
  returnedAt?: string;      // Fecha de Retorno de CV
  headName?: string;        // Nombre del Head
}

// Catalogos maestros (Seniorities, Hiring Managers, Reclutadores).
// Comparten estructura: ID propio + nombre + recordId interno de Airtable.
export interface CatalogItem {
  id: string;       // ID propio (S0001, HM0001, R0001)
  recordId: string; // rec... interno de Airtable
  name: string;     // Nombre legible
}

export type CatalogType = 'seniorities' | 'hiring-managers' | 'recruiters';

export interface Ingreso {
  id: string;
  candidateId: string;      // ID Candidato
  finalSalary?: number;     // Salario final
  startDate: string;        // Fecha Ingreso
  stillEmployed?: boolean;  // Sigue en Empresa
  endDate?: string;         // Fecha Salida
  passedProbation?: boolean;// Pasó Periodo Prueba
  performance?: string;     // Performance
  leaderComment?: string;   // Comentario Líder
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  entity: string;
  entityId?: string;
  detail?: string;
  createdAt: string;
}

export interface Notification {
  id: string;
  title: string;
  body?: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
  href?: string;
}

// =============================================================================
// Dashboard
// =============================================================================

export interface DashboardKPI {
  totalCandidates: number;
  newThisWeek: number;
  activeVacancies: number;
  hiresThisMonth: number;
  conversionRate: number;
  avgTimeToHireDays: number;
  trendCandidates: number;
  trendHires: number;
}

export interface SeriesPoint {
  label: string;
  value: number;
}
