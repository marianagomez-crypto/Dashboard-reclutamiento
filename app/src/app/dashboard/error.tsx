'use client';

import { useEffect } from 'react';
import { AlertTriangle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function DashboardError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error('[Dashboard error]', error);
  }, [error]);

  return (
    <div className="rounded-2xl bg-card p-8 shadow-card">
      <div className="mb-3 inline-flex h-10 w-10 items-center justify-center rounded-xl bg-destructive/10 text-destructive">
        <AlertTriangle className="h-5 w-5" />
      </div>
      <h2 className="font-display text-xl font-bold tracking-tight">
        Esta sección no pudo cargar.
      </h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Probablemente un dato de Airtable vino con un formato inesperado. Reintenta o
        revisa la consola del navegador (F12) para ver el detalle.
      </p>
      {error?.message && (
        <pre className="mt-4 max-h-40 overflow-auto rounded-lg bg-muted px-3 py-2 text-xs text-foreground/80">
          {error.message}
          {error.digest ? `\n\ndigest: ${error.digest}` : ''}
        </pre>
      )}
      <div className="mt-5">
        <Button onClick={() => reset()} variant="gradient" size="sm">
          <RotateCw className="h-4 w-4" />
          Reintentar
        </Button>
      </div>
    </div>
  );
}
