import { getRepo } from '@/lib/data/repository';
import { OrdenesCompraPage } from './ordenes-page';

export const metadata = { title: 'Merch · Órdenes de compra' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [orders, usages, productTypes] = await Promise.all([
    repo.listPurchaseOrders(),
    repo.listMerchUsages(),
    repo.listMerchProductTypes(),
  ]);

  // Usado por orden → para saber qué órdenes tienen inventario o están terminadas.
  const usadoByOrder: Record<string, number> = {};
  for (const u of usages) {
    if (!u.orderId) continue;
    usadoByOrder[u.orderId] = (usadoByOrder[u.orderId] || 0) + (u.quantity || 0);
  }

  return (
    <OrdenesCompraPage
      initialOrders={orders}
      productTypeOptions={productTypes.map((p) => p.name)}
      usadoByOrder={usadoByOrder}
    />
  );
}
