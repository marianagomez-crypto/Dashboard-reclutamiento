import { getRepo } from '@/lib/data/repository';
import { RheTable } from './rhe-table';

export const metadata = { title: 'Pagos · RHE' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const entries = await repo.listRheEntries();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">RHE</h1>
        <p className="text-sm text-muted-foreground">
          Recibos por honorarios · elegí un mes para registrar el estado de pago de cada
          persona · editable
        </p>
      </div>
      <RheTable initialEntries={entries} />
    </div>
  );
}
