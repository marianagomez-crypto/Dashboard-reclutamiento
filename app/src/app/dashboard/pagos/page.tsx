import { getRepo } from '@/lib/data/repository';
import { PagosFijosTable } from './pagos-fijos-table';

export const metadata = { title: 'Pagos · Pagos fijos' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const payments = await repo.listFixedPayments();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Pagos fijos</h1>
        <p className="text-sm text-muted-foreground">
          Pagos mensuales recurrentes · elegí un mes para registrar su estado · editable
        </p>
      </div>
      <PagosFijosTable initialPayments={payments} />
    </div>
  );
}
