// Repositorio Airtable real — mapeado al esquema de Baldecash (base appGRC5rRH4m1I8g2).
//
// Auth, actividad, usuarios y notificaciones permanecen LOCALES (modo mock-store),
// porque tu base no tiene tablas de Usuarios/Actividad/Notificaciones.
// Las tablas Candidatos, Vacantes, Etapas, Eventos, Fuentes, Ingresos se leen/escriben en Airtable.

import Airtable, { type FieldSet } from 'airtable';
import { env } from '@/lib/env';
import type {
  ActivityLog,
  Candidate,
  EtapaResultado,
  FinalStatus,
  Fuente,
  Ingreso,
  Modalidad,
  Notification,
  Priority,
  ReviewTime,
  SalaryRange,
  Source,
  Stage,
  StageMovement,
  User,
  Vacancy,
  VacancyStatus,
} from '@/lib/types';
import type {
  CandidateFilter,
  Repository,
  VacancyFilter,
} from './repository';
import { MockRepository } from './mock';

// ============================================================================
// Mapeo de campos (nombre dominio -> nombre Airtable)
// ============================================================================
const F = {
  vacancy: {
    id: 'ID_Vacante',
    title: 'Puesto',
    area: 'Área',
    seniority: 'Seniority',
    recruiter: 'Reclutador',
    hiringManager: 'Hiring Manager',
    openedAt: 'Fecha Apertura',
    closedAt: 'Fecha Cierre',
    status: 'Estado Vacante',
    priority: 'Prioridad',
    modalidad: 'Modalidad',
    positions: 'Cantidad Posiciones',
    reopens: 'Veces Reabierta',
    reopenReason: 'Motivo Reapertura',
  },
  candidate: {
    id: 'ID_Candidato',
    name: 'Nombre Completo',
    email: 'Email',
    phone: 'Teléfono',
    linkedinUrl: 'LinkedIn URL',
    vacancyId: 'ID Vacante',
    source: 'Fuente',
    appliedAt: 'Fecha Postulación',
    recruiter: 'Reclutador',
    stage: 'Etapa Actual',
    finalStatus: 'Estado Final',
    dropReason: 'Motivo Caída',
    hired: 'Contratado',
  },
  stage: {
    id: 'ID Movimiento',
    candidateId: 'ID Candidato',
    vacancyId: 'ID Vacante',
    stage: 'Etapa',
    startedAt: 'Fecha Inicio',
    endedAt: 'Fecha Fin',
    result: 'Resultado',
    comments: 'Comentarios',
  },
  source: {
    sourceId: 'ID Fuentes',
    vacancyId: 'ID VACANTE',
    name: 'Fuente',
    cost: 'Costo Mensual',
    owner: 'Responsable',
  },
  ingreso: {
    candidateId: 'ID Candidato',
    finalSalary: 'Salario final',
    startDate: 'Fecha Ingreso',
    stillEmployed: 'Sigue en Empresa',
    endDate: 'Fecha Salida',
    passedProbation: 'Pasó Periodo Prueba',
    performance: 'Performance',
    leaderComment: 'Comentario Líder',
  },
  salaryRange: {
    vacancyId: 'ID VACANTE',
    min: 'SALARIO MINIMO',
    max: 'SALARIO MAXIMO',
    status: 'Status',
  },
  reviewTime: {
    reviewId: 'ID Revision',
    candidateId: 'ID Candidato',
    cvSentAt: 'Fecha de envio de cv',
    status: 'Status',
  },
};

function str(f: FieldSet, k: string): string | undefined {
  const v = f[k];
  return typeof v === 'string' ? v : v == null ? undefined : String(v);
}
function num(f: FieldSet, k: string): number | undefined {
  const v = f[k];
  return typeof v === 'number' ? v : undefined;
}
function bool(f: FieldSet, k: string): boolean | undefined {
  const v = f[k];
  if (typeof v === 'boolean') return v;
  if (typeof v === 'string') return v.toLowerCase() === 'sí' || v.toLowerCase() === 'si' || v === 'true';
  return undefined;
}

export class AirtableRepository implements Repository {
  private base: Airtable.Base;
  // Las funciones de auth/actividad/notificaciones siguen siendo locales
  private local = new MockRepository();

  constructor() {
    Airtable.configure({ apiKey: env.airtable.token });
    this.base = Airtable.base(env.airtable.baseId);
  }

  source(): 'mock' | 'airtable' {
    return 'airtable';
  }

  async health() {
    try {
      await this.base(env.airtable.tables.vacancies)
        .select({ pageSize: 1 })
        .firstPage();
      return { ok: true, detail: 'airtable connected', source: 'airtable' as const };
    } catch (e: any) {
      return {
        ok: false,
        detail: `airtable error: ${e?.message || 'unknown'}`,
        source: 'airtable' as const,
      };
    }
  }

  // ---- Helpers ----
  private async selectAll(
    table: string,
    opts: Airtable.SelectOptions<FieldSet> = {},
  ): Promise<Airtable.Record<FieldSet>[]> {
    const all: Airtable.Record<FieldSet>[] = [];
    await this.base(table)
      .select(opts)
      .eachPage((records, next) => {
        all.push(...records);
        next();
      });
    return all;
  }

  // ============================================================
  // Vacantes
  // ============================================================
  private vacancyFromRecord(r: Airtable.Record<FieldSet>): Vacancy {
    const f = r.fields;
    return {
      id: str(f, F.vacancy.id) || r.id,
      recordId: r.id,
      title: str(f, F.vacancy.title) || '—',
      area: str(f, F.vacancy.area) || '',
      seniority: str(f, F.vacancy.seniority),
      recruiter: str(f, F.vacancy.recruiter),
      hiringManager: str(f, F.vacancy.hiringManager),
      openedAt: str(f, F.vacancy.openedAt) || new Date().toISOString(),
      closedAt: str(f, F.vacancy.closedAt),
      status: (str(f, F.vacancy.status) as VacancyStatus) || 'Abierta',
      priority: (str(f, F.vacancy.priority) as Priority) || 'Media',
      modalidad: str(f, F.vacancy.modalidad) as Modalidad | undefined,
      positions: num(f, F.vacancy.positions) ?? 1,
      reopens: num(f, F.vacancy.reopens) ?? 0,
      reopenReason: str(f, F.vacancy.reopenReason),
    };
  }

  async listVacancies(filter?: VacancyFilter) {
    const records = await this.selectAll(env.airtable.tables.vacancies);
    let list = records
      .map((r) => this.vacancyFromRecord(r))
      .filter((v) => v.title && v.title.trim() !== '' && v.title !== '—');
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (v) =>
          v.title.toLowerCase().includes(q) ||
          v.id.toLowerCase().includes(q) ||
          (v.area || '').toLowerCase().includes(q),
      );
    }
    if (filter?.status) list = list.filter((v) => v.status === filter.status);
    if (filter?.area) list = list.filter((v) => v.area === filter.area);
    if (filter?.priority) list = list.filter((v) => v.priority === filter.priority);
    return list.sort((a, b) => (a.openedAt < b.openedAt ? 1 : -1));
  }

  async getVacancy(id: string) {
    const records = await this.selectAll(env.airtable.tables.vacancies, {
      filterByFormula: `{${F.vacancy.id}} = "${id}"`,
      maxRecords: 1,
    });
    return records[0] ? this.vacancyFromRecord(records[0]) : null;
  }

  async createVacancy(data: any) {
    const newId = `VAC-${Math.floor(1000 + Math.random() * 9000)}`;
    const r = (await this.base(env.airtable.tables.vacancies).create({
      [F.vacancy.id]: data.id || newId,
      [F.vacancy.title]: data.title,
      [F.vacancy.area]: data.area,
      [F.vacancy.seniority]: data.seniority,
      [F.vacancy.recruiter]: data.recruiter,
      [F.vacancy.hiringManager]: data.hiringManager,
      [F.vacancy.openedAt]: data.openedAt || new Date().toISOString().slice(0, 10),
      [F.vacancy.status]: data.status || 'Abierta',
      [F.vacancy.priority]: data.priority || 'Media',
      [F.vacancy.modalidad]: data.modalidad,
      [F.vacancy.positions]: data.positions ?? 1,
    } as any)) as unknown as Airtable.Record<FieldSet>;
    return this.vacancyFromRecord(r);
  }

  async updateVacancy(id: string, patch: Partial<Vacancy>) {
    const found = await this.findVacancyRecordId(id);
    if (!found) throw new Error('Vacante no encontrada');
    const fields: Record<string, any> = {};
    if (patch.title !== undefined) fields[F.vacancy.title] = patch.title;
    if (patch.area !== undefined) fields[F.vacancy.area] = patch.area;
    if (patch.seniority !== undefined) fields[F.vacancy.seniority] = patch.seniority;
    if (patch.recruiter !== undefined) fields[F.vacancy.recruiter] = patch.recruiter;
    if (patch.hiringManager !== undefined) fields[F.vacancy.hiringManager] = patch.hiringManager;
    if (patch.openedAt !== undefined) fields[F.vacancy.openedAt] = patch.openedAt;
    if (patch.closedAt !== undefined) fields[F.vacancy.closedAt] = patch.closedAt;
    if (patch.status !== undefined) fields[F.vacancy.status] = patch.status;
    if (patch.priority !== undefined) fields[F.vacancy.priority] = patch.priority;
    if (patch.modalidad !== undefined) fields[F.vacancy.modalidad] = patch.modalidad;
    if (patch.positions !== undefined) fields[F.vacancy.positions] = patch.positions;
    const r = (await this.base(env.airtable.tables.vacancies).update(
      found,
      fields,
    )) as unknown as Airtable.Record<FieldSet>;
    return this.vacancyFromRecord(r);
  }

  async deleteVacancy(id: string) {
    const found = await this.findVacancyRecordId(id);
    if (found) await this.base(env.airtable.tables.vacancies).destroy(found);
  }

  private async findVacancyRecordId(id: string): Promise<string | null> {
    const records = await this.selectAll(env.airtable.tables.vacancies, {
      filterByFormula: `{${F.vacancy.id}} = "${id}"`,
      maxRecords: 1,
    });
    return records[0]?.id ?? null;
  }

  // ============================================================
  // Candidatos
  // ============================================================
  private candidateFromRecord(r: Airtable.Record<FieldSet>): Candidate {
    const f = r.fields;
    return {
      id: str(f, F.candidate.id) || r.id,
      recordId: r.id,
      name: str(f, F.candidate.name) || '—',
      email: str(f, F.candidate.email),
      phone: str(f, F.candidate.phone),
      linkedinUrl: str(f, F.candidate.linkedinUrl),
      vacancyId: str(f, F.candidate.vacancyId),
      source: (str(f, F.candidate.source) as Fuente) || 'LinkedIn',
      appliedAt: str(f, F.candidate.appliedAt) || new Date().toISOString(),
      recruiter: str(f, F.candidate.recruiter),
      stage: (str(f, F.candidate.stage) as Stage) || 'Screening',
      finalStatus: (str(f, F.candidate.finalStatus) as FinalStatus) || 'En proceso',
      dropReason: str(f, F.candidate.dropReason),
      hired: bool(f, F.candidate.hired),
    };
  }

  async listCandidates(filter?: CandidateFilter) {
    const records = await this.selectAll(env.airtable.tables.candidates);
    let list = records
      .map((r) => this.candidateFromRecord(r))
      // Filtra ghost records: registros vacíos en Airtable (sin nombre real)
      .filter((c) => c.name && c.name.trim() !== '' && c.name !== '—');
    if (filter?.search) {
      const q = filter.search.toLowerCase();
      list = list.filter(
        (c) =>
          c.name.toLowerCase().includes(q) ||
          c.id.toLowerCase().includes(q) ||
          (c.recruiter || '').toLowerCase().includes(q),
      );
    }
    if (filter?.stage) list = list.filter((c) => c.stage === filter.stage);
    if (filter?.source) list = list.filter((c) => c.source === filter.source);
    if (filter?.vacancyId) list = list.filter((c) => c.vacancyId === filter.vacancyId);
    if (filter?.recruiter) list = list.filter((c) => c.recruiter === filter.recruiter);
    if (filter?.finalStatus) list = list.filter((c) => c.finalStatus === filter.finalStatus);
    return list.sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
  }

  async getCandidate(id: string) {
    const records = await this.selectAll(env.airtable.tables.candidates, {
      filterByFormula: `{${F.candidate.id}} = "${id}"`,
      maxRecords: 1,
    });
    return records[0] ? this.candidateFromRecord(records[0]) : null;
  }

  async createCandidate(data: any) {
    const newId = `CAND-${Math.floor(2000 + Math.random() * 8000)}`;
    const r = (await this.base(env.airtable.tables.candidates).create({
      [F.candidate.id]: data.id || newId,
      [F.candidate.name]: data.name,
      [F.candidate.vacancyId]: data.vacancyId,
      [F.candidate.source]: data.source,
      [F.candidate.appliedAt]: data.appliedAt || new Date().toISOString().slice(0, 10),
      [F.candidate.recruiter]: data.recruiter,
      [F.candidate.stage]: data.stage || 'Screening',
      [F.candidate.finalStatus]: data.finalStatus || 'En proceso',
    } as any)) as unknown as Airtable.Record<FieldSet>;
    return this.candidateFromRecord(r);
  }

  async updateCandidate(id: string, patch: Partial<Candidate>) {
    const found = await this.findCandidateRecordId(id);
    if (!found) throw new Error('Candidato no encontrado');
    const fields: Record<string, any> = {};
    if (patch.name !== undefined) fields[F.candidate.name] = patch.name;
    if (patch.vacancyId !== undefined) fields[F.candidate.vacancyId] = patch.vacancyId;
    if (patch.source !== undefined) fields[F.candidate.source] = patch.source;
    if (patch.appliedAt !== undefined) fields[F.candidate.appliedAt] = patch.appliedAt;
    if (patch.recruiter !== undefined) fields[F.candidate.recruiter] = patch.recruiter;
    if (patch.stage !== undefined) fields[F.candidate.stage] = patch.stage;
    if (patch.finalStatus !== undefined) fields[F.candidate.finalStatus] = patch.finalStatus;
    if (patch.dropReason !== undefined) fields[F.candidate.dropReason] = patch.dropReason;
    if (patch.hired !== undefined) fields[F.candidate.hired] = patch.hired ? 'Sí' : 'No';
    const r = (await this.base(env.airtable.tables.candidates).update(
      found,
      fields,
    )) as unknown as Airtable.Record<FieldSet>;
    return this.candidateFromRecord(r);
  }

  async deleteCandidate(id: string) {
    const found = await this.findCandidateRecordId(id);
    if (found) await this.base(env.airtable.tables.candidates).destroy(found);
  }

  async moveCandidateStage(id: string, stage: Stage) {
    return this.updateCandidate(id, { stage });
  }

  private async findCandidateRecordId(id: string): Promise<string | null> {
    const records = await this.selectAll(env.airtable.tables.candidates, {
      filterByFormula: `{${F.candidate.id}} = "${id}"`,
      maxRecords: 1,
    });
    return records[0]?.id ?? null;
  }

  // ============================================================
  // Etapas
  // ============================================================
  private movementFromRecord(r: Airtable.Record<FieldSet>): StageMovement {
    const f = r.fields;
    return {
      id: str(f, F.stage.id) || r.id,
      recordId: r.id,
      candidateId: str(f, F.stage.candidateId) || '',
      vacancyId: str(f, F.stage.vacancyId) || '',
      stage: (str(f, F.stage.stage) as Stage) || 'Screening',
      startedAt: str(f, F.stage.startedAt) || '',
      endedAt: str(f, F.stage.endedAt),
      result: str(f, F.stage.result) as EtapaResultado | undefined,
      comments: str(f, F.stage.comments),
    };
  }

  async listStageMovements(candidateId?: string) {
    const opts: Airtable.SelectOptions<FieldSet> = candidateId
      ? { filterByFormula: `{${F.stage.candidateId}} = "${candidateId}"` }
      : {};
    const records = await this.selectAll(env.airtable.tables.stages, opts);
    return records.map((r) => this.movementFromRecord(r));
  }

  // ============================================================
  // Fuentes (costo por canal por vacante)
  // ============================================================
  async listSources(): Promise<Source[]> {
    const records = await this.selectAll(env.airtable.tables.sources);
    return records.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        sourceId: str(f, F.source.sourceId),
        vacancyId: str(f, F.source.vacancyId),
        name: str(f, F.source.name) || '—',
        monthlyCost: num(f, F.source.cost),
        owner: str(f, F.source.owner),
      };
    });
  }

  // ============================================================
  // Ingresos
  // ============================================================
  async listIngresos(): Promise<Ingreso[]> {
    const records = await this.selectAll(env.airtable.tables.ingresos);
    return records.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        candidateId: str(f, F.ingreso.candidateId) || '',
        finalSalary: num(f, F.ingreso.finalSalary),
        startDate: str(f, F.ingreso.startDate) || '',
        stillEmployed: bool(f, F.ingreso.stillEmployed),
        endDate: str(f, F.ingreso.endDate),
        passedProbation: bool(f, F.ingreso.passedProbation),
        performance: str(f, F.ingreso.performance),
        leaderComment: str(f, F.ingreso.leaderComment),
      };
    });
  }

  // ============================================================
  // Rango salarial por vacante
  // ============================================================
  async listSalaryRanges(): Promise<SalaryRange[]> {
    const records = await this.selectAll(env.airtable.tables.salaryRange);
    return records.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        vacancyId: str(f, F.salaryRange.vacancyId) || '',
        min: num(f, F.salaryRange.min),
        max: num(f, F.salaryRange.max),
        status: str(f, F.salaryRange.status),
      };
    });
  }

  // ============================================================
  // Tiempo de revisión (head)
  // ============================================================
  async listReviewTimes(): Promise<ReviewTime[]> {
    const records = await this.selectAll(env.airtable.tables.reviewTime);
    return records.map((r) => {
      const f = r.fields;
      return {
        id: r.id,
        reviewId: str(f, F.reviewTime.reviewId) || r.id,
        candidateId: str(f, F.reviewTime.candidateId),
        cvSentAt: str(f, F.reviewTime.cvSentAt),
        status: str(f, F.reviewTime.status),
      };
    });
  }

  // ============================================================
  // Delegados a la capa local (auth + activity + notif)
  // ============================================================
  listUsers() { return this.local.listUsers(); }
  getUserByEmail(e: string) { return this.local.getUserByEmail(e); }
  getUserById(i: string) { return this.local.getUserById(i); }
  createUser(d: any) { return this.local.createUser(d); }
  updateUser(i: string, p: any) { return this.local.updateUser(i, p); }
  deleteUser(i: string) { return this.local.deleteUser(i); }
  recordLogin(i: string) { return this.local.recordLogin(i); }

  listActivity(limit?: number) { return this.local.listActivity(limit); }
  logActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>) { return this.local.logActivity(entry); }

  listNotifications() { return this.local.listNotifications(); }
  markNotificationRead(id: string) { return this.local.markNotificationRead(id); }
  markAllNotificationsRead() { return this.local.markAllNotificationsRead(); }
  pushNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>) {
    return this.local.pushNotification(n);
  }
}
