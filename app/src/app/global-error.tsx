'use client';

import { useEffect } from 'react';

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    // Log a la consola del navegador para diagnóstico
    // (en producción, aquí se enviaría a un servicio tipo Sentry)
    console.error('[GlobalError]', error);
  }, [error]);

  return (
    <html lang="es">
      <body
        style={{
          fontFamily: 'system-ui, sans-serif',
          background: '#F5F7FB',
          color: '#151744',
          minHeight: '100vh',
          margin: 0,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
        }}
      >
        <div
          style={{
            maxWidth: 560,
            width: '100%',
            background: '#fff',
            borderRadius: 20,
            padding: '2.5rem',
            boxShadow: '0 12px 40px -8px rgba(31,41,82,0.15)',
          }}
        >
          <p
            style={{
              fontSize: 11,
              fontWeight: 700,
              letterSpacing: '0.2em',
              textTransform: 'uppercase',
              color: '#D14646',
              margin: 0,
            }}
          >
            Error crítico
          </p>
          <h1 style={{ fontSize: 28, fontWeight: 800, margin: '0.5rem 0 0.75rem' }}>
            Algo se rompió.
          </h1>
          <p style={{ color: '#5a607a', lineHeight: 1.5, margin: 0 }}>
            La aplicación encontró un error inesperado. Puedes intentar recuperar la
            sesión o volver al inicio.
          </p>
          {error?.message && (
            <pre
              style={{
                marginTop: '1rem',
                padding: '0.75rem 1rem',
                background: '#F5F7FB',
                borderRadius: 12,
                fontSize: 12,
                color: '#212469',
                whiteSpace: 'pre-wrap',
                wordBreak: 'break-word',
                overflow: 'auto',
                maxHeight: 200,
              }}
            >
              {error.message}
              {error.digest ? `\n\ndigest: ${error.digest}` : ''}
            </pre>
          )}
          <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              onClick={() => reset()}
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 12,
                border: 'none',
                background: 'linear-gradient(135deg, #31359C, #00A29B)',
                color: '#fff',
                fontWeight: 600,
                cursor: 'pointer',
              }}
            >
              Reintentar
            </button>
            <a
              href="/dashboard"
              style={{
                padding: '0.75rem 1.25rem',
                borderRadius: 12,
                border: '1px solid #d4d8e6',
                color: '#212469',
                fontWeight: 600,
                textDecoration: 'none',
              }}
            >
              Ir al inicio
            </a>
          </div>
        </div>
      </body>
    </html>
  );
}
