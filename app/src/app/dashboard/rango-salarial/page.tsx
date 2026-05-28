import { getRepo } from '@/lib/data/repository';
import { SalaryRangesPage } from './salary-ranges-page';
import { IngresosTable } from '@/components/dashboard/ingresos-table';
import {
  SalaryComparisonChart,
  type SalaryComparisonRow,
} from '@/components/dashboard/charts';

export const metadata = { title: 'Rango salarial' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [salaryRanges, vacancies, ingresos, candidates] = await Promise.all([
    repo.listSalaryRanges(),
    repo.listVacancies(),
    repo.listIngresos(),
    repo.listCandidates(),
  ]);

  // ---- Dataset para el chart de comparacion salario final vs banda ----
  // Join: Ingreso -> Candidato -> Vacante -> SalaryRange
  const candidatesById = new Map(candidates.map((c) => [c.id, c]));
  const vacanciesById = new Map(vacancies.map((v) => [v.id, v]));
  const rangeByVacancyId = new Map(salaryRanges.map((r) => [r.vacancyId, r]));

  let skipped = 0;
  const comparisonData: SalaryComparisonRow[] = [];
  for (const ing of ingresos) {
    if (typeof ing.finalSalary !== 'number') {
      skipped += 1;
      continue;
    }
    const cand = candidatesById.get(ing.candidateId);
    if (!cand || !cand.vacancyId) {
      skipped += 1;
      continue;
    }
    const range = rangeByVacancyId.get(cand.vacancyId);
    if (!range || typeof range.min !== 'number' || typeof range.max !== 'number') {
      skipped += 1;
      continue;
    }
    const vac = vacanciesById.get(cand.vacancyId);
    comparisonData.push({
      candidateId: ing.candidateId,
      candidateName: cand.name,
      vacancyTitle: vac?.title || cand.vacancyId,
      min: range.min,
      max: range.max,
      final: ing.finalSalary,
    });
  }
  // Ordena: dentro del rango primero, luego abajo, luego arriba, alfabetico
  comparisonData.sort((a, b) => {
    const rank = (r: SalaryComparisonRow) =>
      r.final < r.min ? 1 : r.final > r.max ? 2 : 0;
    const dr = rank(a) - rank(b);
    if (dr !== 0) return dr;
    return a.candidateName.localeCompare(b.candidateName);
  });

  return (
    <>
      <SalaryRangesPage initialRanges={salaryRanges} vacancies={vacancies} />
      <div className="mt-6">
        <SalaryComparisonChart data={comparisonData} skipped={skipped} />
      </div>
      <div className="mt-6">
        <IngresosTable initialIngresos={ingresos} candidates={candidates} />
      </div>
    </>
  );
}
