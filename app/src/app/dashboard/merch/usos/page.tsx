import { getRepo } from '@/lib/data/repository';
import { UsosTable } from '../usos-table';
import { GastosExtraTable } from '../gastos-extra-table';

export const metadata = { title: 'Merch · Usos' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [usages, orders, expenses] = await Promise.all([
    repo.listMerchUsages(),
    repo.listPurchaseOrders(),
    repo.listMerchExtraExpenses(),
  ]);

  // Disponible por orden = comprado − usado. Para ocultar del dropdown las que
  // ya no tienen stock.
  const usadoByOrder: Record<string, number> = {};
  for (const u of usages) {
    if (!u.orderId) continue;
    usadoByOrder[u.orderId] = (usadoByOrder[u.orderId] || 0) + (u.quantity || 0);
  }
  const availableByOrder: Record<string, number> = {};
  for (const o of orders) {
    availableByOrder[o.orderId] = (o.qtyOrdered || 0) - (usadoByOrder[o.orderId] || 0);
  }

  // El precio unitario y el monto de cada uso se derivan SIEMPRE de la orden
  // referenciada (fuente de verdad), no del snapshot guardado en el uso —
  // así no se desfasan si la orden cambió de precio. Si la orden no existe o
  // no tiene precio, se conserva el valor guardado.
  const orderByOrderId = new Map(orders.map((o) => [o.orderId, o]));
  const effectiveUsages = usages.map((u) => {
    const o = orderByOrderId.get(u.orderId);
    const orderPrice = o?.unitPrice;
    if (orderPrice === undefined || orderPrice === null) return u;
    const totalAmount =
      u.quantity !== undefined && u.quantity !== null
        ? Math.round(orderPrice * u.quantity * 100) / 100
        : u.totalAmount;
    return { ...u, unitPrice: orderPrice, totalAmount };
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Usos</h1>
        <p className="text-sm text-muted-foreground">
          Consumos de merch y snacks por ocasión · conectado a las órdenes de compra
        </p>
      </div>
      <UsosTable
        initialUsages={effectiveUsages}
        orders={orders}
        availableByOrder={availableByOrder}
        initialExpenses={expenses}
      />

      <div className="pt-2">
        <h2 className="mb-1 font-display text-xl font-bold tracking-tight">
          Gastos extra
        </h2>
        <p className="mb-4 text-sm text-muted-foreground">
          Gastos asociados al merch que no descuentan stock (transporte, envío, etc.)
        </p>
        <GastosExtraTable initialExpenses={expenses} />
      </div>
    </div>
  );
}
