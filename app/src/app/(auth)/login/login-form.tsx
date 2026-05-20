'use client';

import * as React from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Eye, EyeOff, LogIn, Mail, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/logo';

export function LoginForm({ from }: { from?: string }) {
  const router = useRouter();
  const [email, setEmail] = React.useState('');
  const [password, setPassword] = React.useState('');
  const [show, setShow] = React.useState(false);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      toast.success(`Bienvenido, ${json.user.name}`);
      router.push(from || '/dashboard');
      router.refresh();
    } catch (err: any) {
      setError(err.message);
      toast.error(err.message || 'No se pudo iniciar sesión');
    } finally {
      setLoading(false);
    }
  }

  function fill(em: string, pw: string) {
    setEmail(em);
    setPassword(pw);
  }

  return (
    <div className="space-y-8">
      {/* Logo solo en mobile (en desktop ya está en el shell) */}
      <div className="flex items-center justify-center lg:hidden">
        <Logo />
      </div>

      <div className="space-y-1.5">
        <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
          Iniciar sesión
        </h2>
        <p className="text-sm text-muted-foreground">
          Accede a tu pipeline de reclutamiento.
        </p>
      </div>

      <form onSubmit={onSubmit} className="space-y-5">
        <div className="space-y-1.5">
          <Label htmlFor="email" className="text-foreground">
            Correo
          </Label>
          <div className="relative">
            <Mail className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="email"
              type="email"
              autoComplete="email"
              required
              placeholder="tu@baldecash.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-11 pl-10"
            />
          </div>
        </div>

        <div className="space-y-1.5">
          <div className="flex items-center justify-between">
            <Label htmlFor="password" className="text-foreground">
              Contraseña
            </Label>
            <Link
              href="/forgot-password"
              className="text-xs font-medium text-primary hover:underline"
            >
              ¿La olvidaste?
            </Link>
          </div>
          <div className="relative">
            <Lock className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              id="password"
              type={show ? 'text' : 'password'}
              autoComplete="current-password"
              required
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="h-11 pl-10 pr-10"
            />
            <button
              type="button"
              onClick={() => setShow((s) => !s)}
              className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground transition hover:text-foreground"
              aria-label={show ? 'Ocultar' : 'Mostrar'}
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {error && (
          <motion.p
            initial={{ opacity: 0, y: -4 }}
            animate={{ opacity: 1, y: 0 }}
            className="rounded-md border border-destructive/30 bg-destructive/10 px-3 py-2 text-sm text-destructive"
          >
            {error}
          </motion.p>
        )}

        <Button
          type="submit"
          variant="gradient"
          size="lg"
          loading={loading}
          className="h-11 w-full"
        >
          <LogIn className="h-4 w-4" />
          Entrar
        </Button>
      </form>

      <div className="rounded-xl border border-border bg-muted/40 p-4 text-xs">
        <p className="mb-2.5 flex items-center justify-between font-semibold text-foreground">
          Credenciales demo
          <span className="text-[10px] font-normal text-muted-foreground">
            Click para autocompletar
          </span>
        </p>
        <div className="space-y-2">
          <button
            type="button"
            onClick={() => fill('admin@baldecash.com', 'Baldecash2026!')}
            className="group w-full rounded-lg border border-border bg-background/60 p-2.5 text-left transition hover:border-primary/40 hover:bg-background"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="rounded bg-brand-blue-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-blue-700">
                Administrador
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground opacity-0 transition group-hover:opacity-100">
                ↵ usar
              </span>
            </div>
            <p className="font-mono text-[11px] text-foreground">admin@baldecash.com</p>
            <p className="font-mono text-[11px] text-muted-foreground">Baldecash2026!</p>
          </button>
          <button
            type="button"
            onClick={() => fill('antonella.arellano@baldecash.com', 'Reclutador2026!')}
            className="group w-full rounded-lg border border-border bg-background/60 p-2.5 text-left transition hover:border-primary/40 hover:bg-background"
          >
            <div className="mb-1 flex items-center justify-between">
              <span className="rounded bg-brand-aqua-100 px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider text-brand-aqua-700">
                Reclutador
              </span>
              <span className="text-[9px] uppercase tracking-wider text-muted-foreground opacity-0 transition group-hover:opacity-100">
                ↵ usar
              </span>
            </div>
            <p className="font-mono text-[11px] text-foreground">
              antonella.arellano@baldecash.com
            </p>
            <p className="font-mono text-[11px] text-muted-foreground">Reclutador2026!</p>
          </button>
        </div>
      </div>
    </div>
  );
}
