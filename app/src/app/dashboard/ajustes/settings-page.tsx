'use client';

import * as React from 'react';
import { useTheme } from 'next-themes';
import { CheckCircle2, Database, Moon, Sun, XCircle } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SessionPayload } from '@/lib/auth/session';
import { initials } from '@/lib/utils';

export function SettingsPage({
  session,
  source,
  health,
  appName,
}: {
  session: SessionPayload;
  source: 'mock' | 'airtable';
  health: { ok: boolean; detail?: string };
  appName: string;
}) {
  const { theme, setTheme } = useTheme();
  const [sound, setSound] = React.useState(true);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Ajustes</h1>
        <p className="text-sm text-muted-foreground">Personaliza tu experiencia</p>
      </div>

      <Tabs defaultValue="profile">
        <TabsList>
          <TabsTrigger value="profile">Perfil</TabsTrigger>
          <TabsTrigger value="appearance">Apariencia</TabsTrigger>
          <TabsTrigger value="integrations">Integraciones</TabsTrigger>
          <TabsTrigger value="about">Sobre</TabsTrigger>
        </TabsList>

        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle>Tu perfil</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-4">
                <Avatar className="h-16 w-16">
                  <AvatarFallback className="text-lg">
                    {initials(session.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <p className="text-lg font-semibold">{session.name}</p>
                  <p className="text-sm text-muted-foreground">{session.email}</p>
                  <Badge variant="blue" className="mt-1">
                    {session.role}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="appearance" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Tema</CardTitle>
              <CardDescription>Elige el modo claro u oscuro.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex gap-3">
                {(
                  [
                    { id: 'light', label: 'Claro', Icon: Sun },
                    { id: 'dark', label: 'Oscuro', Icon: Moon },
                    { id: 'system', label: 'Sistema', Icon: Database },
                  ] as const
                ).map(({ id, label, Icon }) => (
                  <Button
                    key={id}
                    variant={theme === id ? 'gradient' : 'outline'}
                    onClick={() => setTheme(id)}
                  >
                    <Icon className="h-4 w-4" />
                    {label}
                  </Button>
                ))}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Notificaciones</CardTitle>
              <CardDescription>Configura como te notificamos.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-center justify-between rounded-lg border border-border p-3">
                <div>
                  <p className="text-sm font-medium">Sonidos</p>
                  <p className="text-xs text-muted-foreground">
                    Reproduce un sonido al recibir notificaciones.
                  </p>
                </div>
                <Switch checked={sound} onCheckedChange={setSound} />
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="integrations">
          <Card>
            <CardHeader>
              <CardTitle>Conexion con Airtable</CardTitle>
              <CardDescription>
                Estado actual de la fuente de datos.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between rounded-xl border border-border bg-card p-4">
                <div className="flex items-center gap-3">
                  <div
                    className={`rounded-xl p-2.5 ${
                      health.ok
                        ? 'bg-gradient-to-br from-brand-aqua-400 to-brand-aqua-600'
                        : 'bg-gradient-to-br from-brand-gold-300 to-brand-gold-500'
                    } text-white`}
                  >
                    {health.ok ? (
                      <CheckCircle2 className="h-5 w-5" />
                    ) : (
                      <XCircle className="h-5 w-5" />
                    )}
                  </div>
                  <div>
                    <p className="font-semibold">
                      Fuente activa:{' '}
                      <span className="uppercase tracking-wider text-primary">
                        {source}
                      </span>
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {health.detail || '—'}
                    </p>
                  </div>
                </div>
                <Badge variant={health.ok ? 'success' : 'warning'}>
                  {health.ok ? 'OK' : 'Atencion'}
                </Badge>
              </div>

              <div className="rounded-xl border border-dashed border-border bg-muted/20 p-4 text-sm">
                <p className="font-semibold mb-2">Como conectar Airtable</p>
                <ol className="list-inside list-decimal space-y-1 text-xs text-muted-foreground">
                  <li>
                    Genera un Personal Access Token en{' '}
                    <span className="font-mono">airtable.com/create/tokens</span>.
                  </li>
                  <li>
                    Otorga los scopes <span className="font-mono">data.records:read</span>,{' '}
                    <span className="font-mono">data.records:write</span>,{' '}
                    <span className="font-mono">schema.bases:read</span>.
                  </li>
                  <li>Agrega tu base al token.</li>
                  <li>
                    Edita <span className="font-mono">.env.local</span> con tu{' '}
                    <span className="font-mono">AIRTABLE_TOKEN</span> y{' '}
                    <span className="font-mono">AIRTABLE_BASE_ID</span> y pon{' '}
                    <span className="font-mono">DATA_SOURCE=airtable</span>.
                  </li>
                  <li>Reinicia el servidor de desarrollo.</li>
                </ol>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="about">
          <Card>
            <CardHeader>
              <CardTitle>{appName}</CardTitle>
              <CardDescription>v1.0.0 · Plataforma de reclutamiento</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm text-muted-foreground">
              <p>Construido para Baldecash con Next.js, Tailwind y Framer Motion.</p>
              <p>Diseno premium · UX moderna · seguridad enterprise.</p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
