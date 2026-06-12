import { getRepo } from '@/lib/data/repository';
import { StockTable, type StockRow } from '../stock-table';

export const metadata = { title: 'Merch · Stock' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const [orders, usages, productTypes] = await Promise.all([
    repo.listPurchaseOrders(),
    repo.listMerchUsages(),
    repo.listMerchProductTypes(),
  ]);

  // Usado por orden (sumando las cantidades de los usos con ese ID Compra).
  const usadoByOrder = new Map<string, number>();
  for (const u of usages) {
    if (!u.orderId) continue;
    usadoByOrder.set(u.orderId, (usadoByOrder.get(u.orderId) || 0) + (u.quantity || 0));
  }

  const rows: StockRow[] = orders.map((o) => {
    const comprado = o.qtyOrdered || 0;
    const usado = usadoByOrder.get(o.orderId) || 0;
    return {
      orderId: o.orderId,
      article: o.article,
      productType: o.productType,
      comprado,
      usado,
      disponible: comprado - usado,
    };
  });

  return <StockTable rows={rows} productTypeOptions={productTypes.map((p) => p.name)} />;
}
