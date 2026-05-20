import { getRepo } from '@/lib/data/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Activity, CheckCircle2, Clock } from 'lucide-react';
import { formatDate, initials, relativeTime } from '@/lib/utils';
import { STAGE_COLORS } from '@/lib/types';

export const metadata = { title: 'Bitácora' };
export const dynamic = 'force-dynamic';

const RESULT_VARIANT: Record<string, 'success' | 'destructive' | 'outline'> = {
  Aprobado: 'success',
  'Aceptó Oferta': 'success',
  'No se presentó': 'destructive',
};

export default async function Page() {
  const repo = await getRepo();
  const [movements, candidates] = await Promise.all([
    repo.listStageMovements(),
    repo.listCandidates(),
  ]);
  const candidatesById = new Map(candidates.map((c) => [c.id, c]));

  // Movimientos en curso = sin Fecha Fin
  const openMovements = movements
    .filter((m) => !m.endedAt)
    .sort((a, b) => (a.startedAt < b.startedAt ? 1 : -1))
    .slice(0, 50);

  // Movimientos cerrados = con Fecha Fin (historial)
  const closedMovements = movements
    .filter((m) => m.endedAt)
    .sort((a, b) => ((a.endedAt || '') < (b.endedAt || '') ? 1 : -1))
    .slice(0, 50);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Bitácora</h1>
        <p className="text-sm text-muted-foreground">
          {openMovements.length} etapas en curso · {closedMovements.length} cerradas
        </p>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {/* En curso */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-4 w-4 text-brand-blue-500" />
              Etapas en curso
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {openMovements.length === 0 && (
              <p className="text-sm text-muted-foreground">Sin etapas abiertas.</p>
            )}
            {openMovements.map((m) => {
              const cand = candidatesById.get(m.candidateId);
              const name = cand?.name || m.candidateId || '—';
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3 transition hover:shadow-soft"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      Vacante {m.vacancyId || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    <Badge
                      className="border-0 text-white"
                      style={{ backgroundColor: STAGE_COLORS[m.stage] }}
                    >
                      {m.stage}
                    </Badge>
                    {m.startedAt && (
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        desde {relativeTime(m.startedAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>

        {/* Cerradas / historial */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-brand-aqua-600" />
              Etapas cerradas
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {closedMovements.length === 0 && (
              <p className="text-sm text-muted-foreground">
                No hay etapas con fecha de cierre todavía.
              </p>
            )}
            {closedMovements.map((m) => {
              const cand = candidatesById.get(m.candidateId);
              const name = cand?.name || m.candidateId || '—';
              return (
                <div
                  key={m.id}
                  className="flex items-center gap-3 rounded-xl border border-border bg-card/60 p-3"
                >
                  <Avatar className="h-10 w-10">
                    <AvatarFallback>{initials(name)}</AvatarFallback>
                  </Avatar>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold">{name}</p>
                    <p className="truncate text-xs text-muted-foreground">
                      {m.stage} · Vacante {m.vacancyId || '—'}
                    </p>
                  </div>
                  <div className="text-right">
                    {m.result && (
                      <Badge
                        variant={RESULT_VARIANT[m.result] || 'outline'}
                      >
                        {m.result}
                      </Badge>
                    )}
                    {m.endedAt && (
                      <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                        <Clock className="mr-1 inline h-3 w-3" />
                        {formatDate(m.endedAt)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
