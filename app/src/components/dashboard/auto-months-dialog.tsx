'use client';

import * as React from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  DEFAULT_PAYMENT_STATUS,
  PAYMENT_MONTHS,
  PAYMENT_STATUS_COLORS,
  type PaymentStatus,
} from '@/lib/types';
import { cn } from '@/lib/utils';

// Diálogo para marcar en qué meses un pago es "Automatico".
export function AutoMonthsDialog({
  open,
  onOpenChange,
  title,
  status,
  onApply,
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  title?: string;
  status: Record<string, PaymentStatus>;
  // Devuelve solo los meses que cambian (mes -> nuevo estado).
  onApply: (patch: Record<string, PaymentStatus>) => void;
}) {
  const [selected, setSelected] = React.useState<Set<string>>(new Set());

  React.useEffect(() => {
    if (!open) return;
    const s = new Set<string>();
    for (const m of PAYMENT_MONTHS) {
      if (status[m.key] === 'Automatico') s.add(m.key);
    }
    setSelected(s);
  }, [open, status]);

  function toggle(key: string) {
    setSelected((prev) => {
      const n = new Set(prev);
      if (n.has(key)) n.delete(key);
      else n.add(key);
      return n;
    });
  }

  function apply() {
    const patch: Record<string, PaymentStatus> = {};
    for (const m of PAYMENT_MONTHS) {
      const isAuto = selected.has(m.key);
      const wasAuto = status[m.key] === 'Automatico';
      if (isAuto && !wasAuto) patch[m.key] = 'Automatico';
      // Si se destilda un mes que era automático, vuelve a Pendiente.
      else if (!isAuto && wasAuto) patch[m.key] = DEFAULT_PAYMENT_STATUS;
    }
    onApply(patch);
    onOpenChange(false);
  }

  const color = PAYMENT_STATUS_COLORS['Automatico'];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Pago automático por mes</DialogTitle>
          <DialogDescription>
            {title ? `${title} · ` : ''}Marcá los meses en los que este pago es
            automático.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 sm:grid-cols-4">
          {PAYMENT_MONTHS.map((m) => {
            const on = selected.has(m.key);
            return (
              <button
                key={m.key}
                type="button"
                onClick={() => toggle(m.key)}
                aria-pressed={on}
                className={cn(
                  'rounded-lg border px-2 py-2 text-sm font-semibold transition',
                  on
                    ? 'border-transparent text-white shadow-soft'
                    : 'border-border bg-card text-muted-foreground hover:text-foreground',
                )}
                style={on ? { background: color } : undefined}
              >
                {m.label}
              </button>
            );
          })}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancelar
          </Button>
          <Button variant="gradient" onClick={apply}>
            Aplicar
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
