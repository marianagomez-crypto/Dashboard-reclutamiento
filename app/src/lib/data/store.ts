// Store mock en memoria — persiste durante el ciclo de vida del proceso.
// Usa un singleton global para sobrevivir HMR en dev.

import bcrypt from 'bcryptjs';
import { env } from '@/lib/env';
import type {
  ActivityLog,
  Candidate,
  CatalogItem,
  Ingreso,
  Notification,
  Source,
  StageMovement,
  User,
  Vacancy,
} from '@/lib/types';
import {
  seedActivity,
  seedCandidates,
  seedIngresos,
  seedSources,
  seedStageMovements,
  seedUsers,
  seedVacancies,
} from './seed';

interface Store {
  users: User[];
  candidates: Candidate[];
  vacancies: Vacancy[];
  movements: StageMovement[];
  sources: Source[];
  ingresos: Ingreso[];
  activity: ActivityLog[];
  notifications: Notification[];
  seniorities: CatalogItem[];
  hiringManagers: CatalogItem[];
  recruiters: CatalogItem[];
}

declare global {
  // eslint-disable-next-line no-var
  var __baldecash_store: Store | undefined;
}

function buildInitial(): Store {
  const users = seedUsers();
  const adminPass = bcrypt.hashSync(env.admin.password, 10);
  const recruiterPass = bcrypt.hashSync('Reclutador2026!', 10);
  users.forEach((u) => {
    if (u.role === 'admin') u.passwordHash = adminPass;
    else u.passwordHash = recruiterPass;
  });
  if (env.admin.email && users[0]) users[0].email = env.admin.email;

  const vacancies = seedVacancies();
  const candidates = seedCandidates(vacancies);
  const movements = seedStageMovements(candidates);
  const sources = seedSources();
  const ingresos = seedIngresos(candidates);
  const activity = seedActivity(users);
  const notifications: Notification[] = [
    {
      id: 'n_welcome',
      title: 'Bienvenido a Baldecash Recruitment',
      body: 'Tu sesion fue creada exitosamente.',
      type: 'success',
      read: false,
      createdAt: new Date().toISOString(),
    },
    {
      id: 'n_sync',
      title: 'Sincronizacion con Airtable',
      body: 'Modo de datos: ' + env.dataSource,
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 600_000).toISOString(),
    },
    {
      id: 'n_pipeline',
      title: '3 candidatos avanzaron a Oferta',
      body: 'Revisa el embudo de reclutamiento.',
      type: 'info',
      read: false,
      createdAt: new Date(Date.now() - 1800_000).toISOString(),
      href: '/dashboard/candidatos',
    },
  ];

  // Seed inicial de catalogos maestros (mismos que estan en Airtable)
  const seniorities: CatalogItem[] = [
    { id: 'S0001', recordId: 'rec_seed_s1', name: 'Junior' },
    { id: 'S0002', recordId: 'rec_seed_s2', name: 'Intermedio' },
    { id: 'S0003', recordId: 'rec_seed_s3', name: 'Senior' },
    { id: 'S0004', recordId: 'rec_seed_s4', name: 'Practicas' },
  ];
  const hiringManagers: CatalogItem[] = [
    { id: 'HM0001', recordId: 'rec_seed_hm1', name: 'Antonella Arellano' },
    { id: 'HM0002', recordId: 'rec_seed_hm2', name: 'Jorge Morales' },
    { id: 'HM0003', recordId: 'rec_seed_hm3', name: 'Marco Del Rio' },
    { id: 'HM0004', recordId: 'rec_seed_hm4', name: 'Ruben Montenegro' },
    { id: 'HM0005', recordId: 'rec_seed_hm5', name: 'Meylin Miyashiro' },
    { id: 'HM0006', recordId: 'rec_seed_hm6', name: 'Yadira Yovera' },
    { id: 'HM0007', recordId: 'rec_seed_hm7', name: 'Monica Obando' },
    { id: 'HM0008', recordId: 'rec_seed_hm8', name: 'Vania Hagel' },
  ];
  const recruiters: CatalogItem[] = [
    { id: 'R0001', recordId: 'rec_seed_r1', name: 'Antonella Arellano' },
    { id: 'R0002', recordId: 'rec_seed_r2', name: 'Mayra Pereira' },
  ];

  return {
    users,
    candidates,
    vacancies,
    movements,
    sources,
    ingresos,
    activity,
    notifications,
    seniorities,
    hiringManagers,
    recruiters,
  };
}

export function getStore(): Store {
  if (!globalThis.__baldecash_store) {
    globalThis.__baldecash_store = buildInitial();
  }
  return globalThis.__baldecash_store;
}
