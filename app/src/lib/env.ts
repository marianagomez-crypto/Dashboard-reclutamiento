// Centraliza la lectura de variables de entorno con defaults seguros.
// Si DATA_SOURCE = "airtable" pero falta el token o base, se cae a "mock"
// y registra un warning en consola server.

export type DataSource = 'mock' | 'airtable';

function readDataSource(): DataSource {
  const raw = (process.env.DATA_SOURCE || 'mock').toLowerCase();
  if (raw === 'airtable') {
    if (!process.env.AIRTABLE_TOKEN || !process.env.AIRTABLE_BASE_ID) {
      if (typeof window === 'undefined') {
        console.warn(
          '[env] DATA_SOURCE=airtable pero faltan AIRTABLE_TOKEN/AIRTABLE_BASE_ID — usando mock.',
        );
      }
      return 'mock';
    }
    return 'airtable';
  }
  return 'mock';
}

export const env = {
  dataSource: readDataSource(),
  airtable: {
    token: process.env.AIRTABLE_TOKEN || '',
    baseId: process.env.AIRTABLE_BASE_ID || '',
    tables: {
      candidates: process.env.AIRTABLE_TABLE_CANDIDATES || 'Candidatos',
      vacancies: process.env.AIRTABLE_TABLE_VACANCIES || 'Vacantes',
      stages: process.env.AIRTABLE_TABLE_STAGES || 'Etapas',
      sources: process.env.AIRTABLE_TABLE_SOURCES || 'Fuentes',
      ingresos: process.env.AIRTABLE_TABLE_INGRESOS || 'Ingresos',
      salaryRange: process.env.AIRTABLE_TABLE_SALARY_RANGE || 'Rango salarial',
      reviewTime: process.env.AIRTABLE_TABLE_REVIEW_TIME || 'Tiempo de revision (head)',
    },
  },
  auth: {
    secret:
      process.env.AUTH_SECRET ||
      'dev-only-secret-please-change-me-in-production-environment-now',
    sessionTtl: Number(process.env.AUTH_SESSION_TTL || 28800),
  },
  admin: {
    email: process.env.ADMIN_EMAIL || 'admin@baldecash.com',
    password: process.env.ADMIN_PASSWORD || 'Baldecash2026!',
  },
  app: {
    name: process.env.NEXT_PUBLIC_APP_NAME || 'Baldecash Recruitment',
    url: process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000',
  },
};
