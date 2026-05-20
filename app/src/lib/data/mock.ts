import bcrypt from 'bcryptjs';
import type {
  ActivityLog,
  Candidate,
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
import { getStore } from './store';
import type {
  CandidateFilter,
  Repository,
  VacancyFilter,
} from './repository';

function uid(prefix: string) {
  return `${prefix}_${Math.random().toString(36).slice(2, 10)}`;
}

function publicUser(u: User): User {
  const { passwordHash: _p, ...rest } = u;
  return rest as User;
}

export class MockRepository implements Repository {
  source(): 'mock' | 'airtable' {
    return 'mock';
  }

  async health() {
    return { ok: true, detail: 'mock-store', source: 'mock' as const };
  }

  // ---- Users ----
  async listUsers() {
    return getStore().users.map(publicUser);
  }

  async getUserByEmail(email: string) {
    return (
      getStore().users.find(
        (u) => u.email.toLowerCase() === email.toLowerCase(),
      ) || null
    );
  }

  async getUserById(id: string) {
    const u = getStore().users.find((x) => x.id === id);
    return u ? publicUser(u) : null;
  }

  async createUser(
    data: Omit<User, 'id' | 'createdAt'> & { password: string },
  ) {
    const store = getStore();
    if (store.users.some((u) => u.email.toLowerCase() === data.email.toLowerCase())) {
      throw new Error('Ya existe un usuario con ese correo.');
    }
    const u: User = {
      id: uid('usr'),
      email: data.email,
      name: data.name,
      role: data.role,
      avatarUrl: data.avatarUrl,
      active: data.active ?? true,
      createdAt: new Date().toISOString(),
      passwordHash: bcrypt.hashSync(data.password, 10),
    };
    store.users.push(u);
    return publicUser(u);
  }

  async updateUser(
    id: string,
    patch: Partial<User> & { password?: string },
  ) {
    const store = getStore();
    const u = store.users.find((x) => x.id === id);
    if (!u) throw new Error('Usuario no encontrado');
    if (patch.email) u.email = patch.email;
    if (patch.name) u.name = patch.name;
    if (patch.role) u.role = patch.role;
    if (typeof patch.active === 'boolean') u.active = patch.active;
    if (patch.avatarUrl !== undefined) u.avatarUrl = patch.avatarUrl;
    if (patch.password) u.passwordHash = bcrypt.hashSync(patch.password, 10);
    return publicUser(u);
  }

  async deleteUser(id: string) {
    const store = getStore();
    store.users = store.users.filter((u) => u.id !== id);
  }

  async recordLogin(id: string) {
    const u = getStore().users.find((x) => x.id === id);
    if (u) u.lastLoginAt = new Date().toISOString();
  }

  // ---- Candidates ----
  async listCandidates(filter?: CandidateFilter) {
    let list = [...getStore().candidates];
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
    if (filter?.vacancyId)
      list = list.filter((c) => c.vacancyId === filter.vacancyId);
    if (filter?.recruiter)
      list = list.filter((c) => c.recruiter === filter.recruiter);
    if (filter?.finalStatus)
      list = list.filter((c) => c.finalStatus === filter.finalStatus);
    return list.sort((a, b) => (a.appliedAt < b.appliedAt ? 1 : -1));
  }

  async getCandidate(id: string) {
    return getStore().candidates.find((c) => c.id === id) || null;
  }

  async createCandidate(
    data: Omit<Candidate, 'id' | 'recordId' | 'appliedAt'> & { appliedAt?: string },
  ) {
    const id = `CAND-${Math.floor(2000 + Math.random() * 8000)}`;
    const c: Candidate = {
      ...data,
      id,
      recordId: `rec_${uid('cand')}`,
      appliedAt: data.appliedAt || new Date().toISOString(),
    };
    getStore().candidates.unshift(c);
    return c;
  }

  async updateCandidate(id: string, patch: Partial<Candidate>) {
    const store = getStore();
    const c = store.candidates.find((x) => x.id === id);
    if (!c) throw new Error('Candidato no encontrado');
    Object.assign(c, patch);
    return c;
  }

  async deleteCandidate(id: string) {
    const store = getStore();
    store.candidates = store.candidates.filter((c) => c.id !== id);
  }

  async moveCandidateStage(id: string, stage: Stage) {
    return this.updateCandidate(id, { stage });
  }

  // ---- Vacancies ----
  async listVacancies(filter?: VacancyFilter) {
    let list = [...getStore().vacancies];
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
    return getStore().vacancies.find((v) => v.id === id) || null;
  }

  async createVacancy(
    data: Omit<Vacancy, 'id' | 'recordId' | 'openedAt'> & { openedAt?: string },
  ) {
    const id = `VAC-${Math.floor(1000 + Math.random() * 9000)}`;
    const v: Vacancy = {
      ...data,
      id,
      recordId: `rec_${uid('vac')}`,
      openedAt: data.openedAt || new Date().toISOString(),
    };
    getStore().vacancies.unshift(v);
    return v;
  }

  async updateVacancy(id: string, patch: Partial<Vacancy>) {
    const v = getStore().vacancies.find((x) => x.id === id);
    if (!v) throw new Error('Vacante no encontrada');
    Object.assign(v, patch);
    return v;
  }

  async deleteVacancy(id: string) {
    const store = getStore();
    store.vacancies = store.vacancies.filter((v) => v.id !== id);
  }

  // ---- Movements ----
  async listStageMovements(candidateId?: string): Promise<StageMovement[]> {
    const list = getStore().movements;
    return candidateId ? list.filter((m) => m.candidateId === candidateId) : list;
  }

  // ---- Sources ----
  async listSources(): Promise<Source[]> {
    return getStore().sources;
  }

  // ---- Ingresos ----
  async listIngresos(): Promise<Ingreso[]> {
    return getStore().ingresos;
  }

  // ---- Salary ranges (stub en mock) ----
  async listSalaryRanges(): Promise<SalaryRange[]> {
    return [];
  }

  // ---- Review times (stub en mock) ----
  async listReviewTimes(): Promise<ReviewTime[]> {
    return [];
  }

  // ---- Activity ----
  async listActivity(limit = 50) {
    return getStore().activity.slice(0, limit);
  }

  async logActivity(entry: Omit<ActivityLog, 'id' | 'createdAt'>) {
    getStore().activity.unshift({
      ...entry,
      id: uid('act'),
      createdAt: new Date().toISOString(),
    });
  }

  // ---- Notifications ----
  async listNotifications() {
    return [...getStore().notifications].sort((a, b) =>
      a.createdAt < b.createdAt ? 1 : -1,
    );
  }

  async markNotificationRead(id: string) {
    const n = getStore().notifications.find((x) => x.id === id);
    if (n) n.read = true;
  }

  async markAllNotificationsRead() {
    getStore().notifications.forEach((n) => (n.read = true));
  }

  async pushNotification(
    n: Omit<Notification, 'id' | 'createdAt' | 'read'>,
  ) {
    const full: Notification = {
      ...n,
      id: uid('notif'),
      createdAt: new Date().toISOString(),
      read: false,
    };
    getStore().notifications.unshift(full);
    return full;
  }
}
