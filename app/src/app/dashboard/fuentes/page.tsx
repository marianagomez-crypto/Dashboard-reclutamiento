import { getRepo } from '@/lib/data/repository';
import { SourcesPage } from './sources-page';
import {
  SourceCostByVacancyChart,
  type SourceCostRow,
} from '@/components/dashboard/charts';
import {
  HiresBySourceChart,
  type HireSourceRow,
  type ChannelHireStat,
} from '@/components/dashboard/source-roi-chart';
import {
  InvestmentAttributionChart,
  type CandidateAttributionRow,
} from '@/components/dashboard/investment-attribution-chart';

export const metadata = { title: 'Fuentes' };
export const dynamic = 'force-dynamic';

// Normaliza nombres de canal para casar la fuente del candidato (ej. "LinkedIn",
// "Referido") con el canal de la tabla Fuentes (ej. "Linkedin", "Referidos").
function normChannel(s?: string): string {
  return (s || '')
    .toLowerCase()
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/s$/, '')
    .trim();
}

export default async function Page() {
  const repo = await getRepo();
  const [sources, vacancies, recruiters, hiringManagers, candidates] =
    await Promise.all([
      repo.listSources(),
      repo.listVacancies(),
      repo.listCatalog('recruiters'),
      repo.listCatalog('hiring-managers'),
      repo.listCandidates(),
    ]);
  // Combina reclutadores + hiring managers para el select de Responsable.
  // Dedup por nombre. Algunos heads pueden ser owners de fuentes (ej. Jorge Morales).
  const ownerOptions = Array.from(
    new Map(
      [...recruiters, ...hiringManagers].map((p) => [p.name, p.name]),
    ).keys(),
  );

  // ---- Datasets de costo por vacante, separados por estado de la vacante ----
  const vacanciesById = new Map(vacancies.map((v) => [v.id, v]));
  function costDataForStatuses(statuses: string[]) {
    const set = new Set(statuses);
    const acc = new Map<string, SourceCostRow>();
    const chSet = new Set<string>();
    for (const s of sources) {
      if (!s.vacancyId) continue;
      const cost = s.monthlyCost || 0;
      if (cost <= 0) continue;
      const v = vacanciesById.get(s.vacancyId);
      if (!set.has(v?.status || '')) continue;
      const row =
        acc.get(s.vacancyId) ||
        ({
          vacancyId: s.vacancyId,
          vacancyTitle: v?.title || s.vacancyId,
          total: 0,
          byChannel: {},
        } as SourceCostRow);
      row.total += cost;
      row.byChannel[s.name] = (row.byChannel[s.name] || 0) + cost;
      chSet.add(s.name);
      acc.set(s.vacancyId, row);
    }
    return { data: Array.from(acc.values()), channels: Array.from(chSet).sort() };
  }
  const costAbiertas = costDataForStatuses(['Abierta']);
  const costCerradasPausa = costDataForStatuses(['Cerrada', 'En Pausa']);

  // ---- Efectividad de inversión: solo contratados ----
  // Por cada contratado: vacante + canal de origen + costo invertido en ese
  // canal para esa vacante (suma de fuentes que matchean vacante+canal).
  // Inversión TOTAL por vacante (suma de todos los canales de esa vacante).
  const vacTotalCost = new Map<string, number>();
  for (const s of sources) {
    if (!s.vacancyId) continue;
    vacTotalCost.set(
      s.vacancyId,
      (vacTotalCost.get(s.vacancyId) || 0) + (s.monthlyCost || 0),
    );
  }

  const hired = candidates.filter(
    (c) => c.finalStatus === 'Contratado' || c.hired === true,
  );
  const hireRows: HireSourceRow[] = hired.map((c) => {
    const v = vacanciesById.get(c.vacancyId || '');
    let channelCost = 0;
    for (const s of sources) {
      if (
        s.vacancyId &&
        s.vacancyId === c.vacancyId &&
        normChannel(s.name) === normChannel(c.source)
      ) {
        channelCost += s.monthlyCost || 0;
      }
    }
    return {
      candidateName: c.name,
      vacancyTitle: v?.title || c.vacancyId || '—',
      vacancyId: c.vacancyId || '—',
      channel: String(c.source || ''),
      invested: channelCost > 0,
      channelCost,
      vacancyTotalCost: vacTotalCost.get(c.vacancyId || '') || 0,
    };
  });
  // Sortea por vacante para agrupar visualmente.
  hireRows.sort((a, b) => a.vacancyTitle.localeCompare(b.vacancyTitle));

  // ---- Inversión vs costo real atribuible, POR PUESTO (vacante con contratación) ----
  // inversion = total invertido en la vacante · atribuible = costo del/los canal(es)
  // que generó la contratación (0 si vino por un canal sin inversión, ej. referidos).
  const attrMap = new Map<
    string,
    {
      vacancyId: string;
      vacancyTitle: string;
      inversion: number;
      channelCosts: Map<string, number>; // canal normalizado -> costo (distinto)
      finalSources: string[];
    }
  >();
  for (const r of hireRows) {
    let row = attrMap.get(r.vacancyId);
    if (!row) {
      row = {
        vacancyId: r.vacancyId,
        vacancyTitle: r.vacancyTitle,
        inversion: r.vacancyTotalCost,
        channelCosts: new Map(),
        finalSources: [],
      };
      attrMap.set(r.vacancyId, row);
    }
    const nc = normChannel(r.channel);
    if (!row.channelCosts.has(nc)) row.channelCosts.set(nc, r.channelCost);
    if (r.channel) row.finalSources.push(r.channel);
  }
  // Totales REALES: la inversión de cada vacante se cuenta una sola vez (aunque
  // tenga varios contratados), y lo atribuible suma los canales distintos que
  // generaron contrataciones en esa vacante.
  const vacanciesWithInvestment = Array.from(attrMap.values()).filter(
    (r) => r.inversion > 0,
  );
  const attributionTotals = {
    inversion: vacanciesWithInvestment.reduce((a, r) => a + r.inversion, 0),
    atribuible: vacanciesWithInvestment.reduce(
      (a, r) => a + Array.from(r.channelCosts.values()).reduce((x, y) => x + y, 0),
      0,
    ),
  };

  // Filas del gráfico: una por candidato contratado cuya vacante tuvo inversión.
  const candidateAttribution: CandidateAttributionRow[] = hireRows
    .filter((r) => r.vacancyTotalCost > 0)
    .map((r, i) => ({
      id: `${r.vacancyId}-${i}`,
      candidateName: r.candidateName,
      vacancyTitle: r.vacancyTitle,
      inversion: r.vacancyTotalCost,
      atribuible: r.channelCost,
      finalSource: r.channel || '—',
    }));

  // Agregado por canal para el gráfico de barras.
  const chAcc = new Map<string, ChannelHireStat>();
  for (const r of hireRows) {
    const key = r.channel || '—';
    const row = chAcc.get(key) || { channel: key, hires: 0, invested: 0 };
    row.hires += 1;
    row.invested += r.invested ? r.channelCost : 0;
    chAcc.set(key, row);
  }
  const hiresByChannel = Array.from(chAcc.values());

  // Inversión por vacante: SOLO vacantes de los contratados (todas, incluso sin
  // datos de inversión). Parte lo que fue al/los canal(es) que contrataron vs
  // el resto. Si no hay costo registrado para la vacante, total = 0 (sin datos).
  const hiredChannelsByVac = new Map<string, Map<string, number>>();
  const titleByVac = new Map<string, string>();
  for (const r of hireRows) {
    titleByVac.set(r.vacancyId, r.vacancyTitle);
    if (r.channelCost <= 0) continue;
    let m = hiredChannelsByVac.get(r.vacancyId);
    if (!m) {
      m = new Map();
      hiredChannelsByVac.set(r.vacancyId, m);
    }
    m.set(normChannel(r.channel), r.channelCost);
  }
  const investmentByVacancy = Array.from(titleByVac.keys()).map((vacancyId) => {
    const total = vacTotalCost.get(vacancyId) || 0;
    const chMap = hiredChannelsByVac.get(vacancyId);
    const canal = chMap
      ? Array.from(chMap.values()).reduce((a, b) => a + b, 0)
      : 0;
    return {
      vacancyTitle: titleByVac.get(vacancyId) || vacancyId,
      total,
      canal,
      otros: Math.max(0, total - canal),
    };
  });

  return (
    <SourcesPage
      initialSources={sources}
      vacancies={vacancies}
      ownerOptions={ownerOptions}
      aboveTable={
        <>
          <InvestmentAttributionChart
            rows={candidateAttribution}
            totals={attributionTotals}
          />
          <HiresBySourceChart
            rows={hireRows}
            byChannel={hiresByChannel}
            investmentByVacancy={investmentByVacancy}
          />
        </>
      }
      belowTable={
        <>
          <SourceCostByVacancyChart
            data={costAbiertas.data}
            channels={costAbiertas.channels}
            title="Costo de fuentes · vacantes abiertas"
            description="Inversión mensual por canal · solo vacantes Abiertas"
            emptyText="Sin fuentes pagas en vacantes abiertas"
          />
          <SourceCostByVacancyChart
            data={costCerradasPausa.data}
            channels={costCerradasPausa.channels}
            title="Costo de fuentes · vacantes cerradas o en pausa"
            description="Inversión mensual por canal · vacantes Cerradas o En Pausa"
            emptyText="Sin fuentes pagas en vacantes cerradas o en pausa"
          />
        </>
      }
    />
  );
}
