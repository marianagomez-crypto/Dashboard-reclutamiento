// Interfaz unica de repositorio. Implementaciones: mock (memoria) y airtable.
// Toda la app consume `repo` — cambiar DATA_SOURCE alterna la implementacion.

import { env } from '@/lib/env';
import type {
  ActivityLog,
  Candidate,
  CatalogItem,
  CatalogType,
  Ingreso,
  Notification,
  ReviewTime,
  SalaryRange,
  Source,
  Stage,
  StageMovement,
  User,
  Vacancy,
} from '@/lib/types';

export interface CandidateFilter {
  search?: string;
  stage?: string;
  source?: string;
  vacancyId?: string;
  recruiter?: string;
  finalStatus?: string;
}

export interface VacancyFilter {
  search?: string;
  status?: string;
  area?: string;
  priority?: string;
}

export interface Repository {
  // Users (auth — almacenados localmente, no en Airtable)
  listUsers(): Promise<User[]>;
  getUserByEmail(email: string): Promise<User | null>;
  getUserById(id: string): Promise<User | null>;
  createUser(data: Omit<User, 'id' | 'createdAt'> & { password: string }): Promise<User>;
  updateUser(id: string, patch: Partial<User> & { password?: string }): Promise<User>;
  deleteUser(id: string): Promise<void>;
  recordLogin(id: string): Promise<void>;

  // Candidates
  listCandidates(filter?: CandidateFilter): Promise<Candidate[]>;
  getCandidate(id: string): Promise<Candidate | null>;
  createCandidate(
    data: Omit<Candidate, 'id' | 'recordId' | 'appliedAt'> & { appliedAt?: string },
  ): Promise<Candidate>;
  updateCandidate(id: string, patch: Partial<Candidate>): Promise<Candidate>;
  deleteCandidate(id: string): Promise<void>;
  moveCandidateStage(id: string, stage: Stage): Promise<Candidate>;

  // Vacancies
  listVacancies(filter?: VacancyFilter): Promise<Vacancy[]>;
  getVacancy(id: string): Promise<Vacancy | null>;
  createVacancy(
    data: Omit<Vacancy, 'id' | 'recordId' | 'openedAt'> & { openedAt?: string },
  ): Promise<Vacancy>;
  updateVacancy(id: string, patch: Partial<Vacancy>): Promise<Vacancy>;
  deleteVacancy(id: string): Promise<void>;

  // Stage movements (historial) — editable
  listStageMovements(candidateId?: string): Promise<StageMovement[]>;
  createStageMovement(
    data: Omit<StageMovement, 'id' | 'recordId'> & { id?: string },
  ): Promise<StageMovement>;
  updateStageMovement(
    id: string,
    patch: Partial<StageMovement>,
  ): Promise<StageMovement>;
  deleteStageMovement(id: string): Promise<void>;

  // Sources (canales de adquisicion por vacante) — editable
  listSources(): Promise<Source[]>;
  createSource(data: Omit<Source, 'id'>): Promise<Source>;
  updateSource(recordId: string, patch: Partial<Source>): Promise<Source>;
  deleteSource(recordId: string): Promise<void>;

  // Ingresos (onboarding) — editable
  listIngresos(): Promise<Ingreso[]>;
  createIngreso(data: Omit<Ingreso, 'id'>): Promise<Ingreso>;
  updateIngreso(recordId: string, patch: Partial<Ingreso>): Promise<Ingreso>;
  deleteIngreso(recordId: string): Promise<void>;

  // Rango salarial por vacante — editable
  listSalaryRanges(): Promise<SalaryRange[]>;
  createSalaryRange(
    data: Omit<SalaryRange, 'id'>,
  ): Promise<SalaryRange>;
  updateSalaryRange(
    recordId: string,
    patch: Partial<SalaryRange>,
  ): Promise<SalaryRange>;
  deleteSalaryRange(recordId: string): Promise<void>;

  // Tiempo de revisión por hiring manager / candidato — editable
  listReviewTimes(): Promise<ReviewTime[]>;
  createReviewTime(data: Omit<ReviewTime, 'id'>): Promise<ReviewTime>;
  updateReviewTime(recordId: string, patch: Partial<ReviewTime>): Promise<ReviewTime>;
  deleteReviewTime(recordId: string): Promise<void>;

  // Catalogos maestros (Seniorities, Hiring Managers, Reclutadores)
  listCatalog(type: CatalogType): Promise<CatalogItem[]>;
  createCatalogItem(type: CatalogType, name: string): Promise<CatalogItem>;
  updateCatalogItem(
    type: CatalogType,
    id: string,
    name: string,
  ): Promise<CatalogItem>;
  deleteCatalogItem(type: CatalogType, id: string): Promise<void>;

  // Activity (local, no Airtable)
  listActivity(limit?: number): Promise<ActivityLog[]>;
  logActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>): Promise<void>;

  // Notifications (local)
  listNotifications(): Promise<Notification[]>;
  markNotificationRead(id: string): Promise<void>;
  markAllNotificationsRead(): Promise<void>;
  pushNotification(n: Omit<Notification, 'id' | 'createdAt' | 'read'>): Promise<Notification>;

  // Meta
  source(): 'mock' | 'airtable';
  health(): Promise<{ ok: boolean; detail?: string; source: 'mock' | 'airtable' }>;
}

let _impl: Repository | null = null;

export async function getRepo(): Promise<Repository> {
  if (_impl) return _impl;
  if (env.dataSource === 'airtable') {
    const { AirtableRepository } = await import('./airtable');
    _impl = new AirtableRepository();
  } else {
    const { MockRepository } = await import('./mock');
    _impl = new MockRepository();
  }
  return _impl;
}

export function resetRepoCache() {
  _impl = null;
}
