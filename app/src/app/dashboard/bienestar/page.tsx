import { getRepo } from '@/lib/data/repository';
import { ExamenesPage } from './examenes-page';
import {
  HechosFaltanDonut,
  InversionPorMesChart,
  ExamenesPorAreaChart,
  FaltanPorAreaChart,
  type AreaExamRow,
  type FaltanAreaRow,
} from '@/components/dashboard/bienestar-charts';
import { EXAM_PRICE_OVER_39, EXAM_PRICE_UNDER_39 } from '@/lib/types';

export const metadata = { title: 'Bienestar & Salud · Exámenes médicos' };
export const dynamic = 'force-dynamic';

function ageFrom(birthIso?: string): number | null {
  if (!birthIso) return null;
  const b = new Date(`${birthIso}T00:00:00Z`);
  if (Number.isNaN(b.getTime())) return null;
  const now = new Date();
  let a = now.getUTCFullYear() - b.getUTCFullYear();
  const md = now.getUTCMonth() - b.getUTCMonth();
  if (md < 0 || (md === 0 && now.getUTCDate() < b.getUTCDate())) a--;
  return a;
}
function priceFor(birthIso?: string): number | null {
  const a = ageFrom(birthIso);
  if (a === null) return null;
  return a >= 40 ? EXAM_PRICE_OVER_39 : EXAM_PRICE_UNDER_39;
}

const MONTHS = [
  { n: 5, label: 'May' },
  { n: 6, label: 'Jun' },
  { n: 7, label: 'Jul' },
  { n: 8, label: 'Ago' },
  { n: 9, label: 'Sep' },
  { n: 10, label: 'Oct' },
  { n: 11, label: 'Nov' },
  { n: 12, label: 'Dic' },
];

export default async function Page() {
  const repo = await getRepo();
  const [exams, participants] = await Promise.all([
    repo.listMedicalExams(),
    repo.listEngagementParticipants(),
  ]);

  const colaboradores = participants.map((p) => ({
    id: p.id,
    name: p.name,
    area: p.area || '',
    birthDate: p.birthDate || '',
    status: p.status,
  }));
  const colById = new Map(colaboradores.map((c) => [c.id, c]));
  const areaOf = (id: string) => colById.get(id)?.area || 'Sin área';

  // ---- Avance: hechos vs faltan (sobre activos) ----
  const examColIds = new Set(exams.map((e) => e.collaboratorId));
  const activos = colaboradores.filter((c) => c.status === 'Activo');
  const hechos = activos.filter((c) => examColIds.has(c.id)).length;
  const faltanList = activos.filter((c) => !examColIds.has(c.id));

  // ---- Faltan por área (con nombres) ----
  const faltanMap = new Map<string, string[]>();
  for (const c of faltanList) {
    const a = c.area || 'Sin área';
    const arr = faltanMap.get(a) || [];
    arr.push(c.name);
    faltanMap.set(a, arr);
  }
  const faltanPorArea: FaltanAreaRow[] = Array.from(faltanMap, ([area, names]) => ({
    area,
    value: names.length,
    names: names.sort((a, b) => a.localeCompare(b)),
  }));

  // ---- Inversión por mes (May–Dic) según fecha de examen ----
  const invByMonth = new Map<number, number>();
  for (const e of exams) {
    if (!e.examDate) continue;
    const month = Number(e.examDate.slice(5, 7));
    const price = priceFor(colById.get(e.collaboratorId)?.birthDate);
    if (price === null) continue;
    invByMonth.set(month, (invByMonth.get(month) || 0) + price);
  }
  const inversionPorMes = MONTHS.map((m) => ({
    mes: m.label,
    total: Math.round((invByMonth.get(m.n) || 0) * 100) / 100,
  }));

  // ---- Exámenes por área (apilado por resultado) ----
  const areaExamMap = new Map<string, AreaExamRow>();
  for (const e of exams) {
    const area = areaOf(e.collaboratorId);
    const row =
      areaExamMap.get(area) ||
      ({
        area,
        Apto: 0,
        'Apto con observaciones': 0,
        'Con observaciones': 0,
      } as AreaExamRow);
    if (e.resultado === 'Apto') row.Apto += 1;
    else if (e.resultado === 'Apto con observaciones') row['Apto con observaciones'] += 1;
    else if (e.resultado === 'Con observaciones') row['Con observaciones'] += 1;
    // Exámenes sin resultado no se cuentan en este gráfico de resultados.
    areaExamMap.set(area, row);
  }
  const examenesPorArea = Array.from(areaExamMap.values());

  const colaboradoresForPage = colaboradores.map(({ id, name, area, birthDate }) => ({
    id,
    name,
    area,
    birthDate,
  }));

  return (
    <ExamenesPage
      initialExams={exams}
      colaboradores={colaboradoresForPage}
      aboveTable={
        <div className="space-y-6">
          <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
            <HechosFaltanDonut hechos={hechos} faltan={faltanList.length} />
            <InversionPorMesChart data={inversionPorMes} />
          </div>
          <ExamenesPorAreaChart data={examenesPorArea} />
          <FaltanPorAreaChart data={faltanPorArea} />
        </div>
      }
    />
  );
}
