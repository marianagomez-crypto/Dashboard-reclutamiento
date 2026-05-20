'use client';

import * as React from 'react';
import Link from 'next/link';
import { motion } from 'framer-motion';
import { ArrowLeft, Mail, Send, CheckCircle2 } from 'lucide-react';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Logo } from '@/components/brand/logo';

export function ForgotForm() {
  const [email, setEmail] = React.useState('');
  const [loading, setLoading] = React.useState(false);
  const [sent, setSent] = React.useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await fetch('/api/auth/forgot', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      if (!res.ok) throw new Error('Error');
      setSent(true);
      toast.success('Solicitud enviada');
    } catch {
      toast.error('No se pudo enviar la solicitud');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center lg:hidden">
        <Logo />
      </div>

      <Link
        href="/login"
        className="inline-flex items-center gap-1 text-sm font-medium text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="h-3.5 w-3.5" />
        Volver al login
      </Link>

      {!sent ? (
        <>
          <div className="space-y-1.5">
            <h2 className="font-display text-3xl font-bold tracking-tight text-foreground">
              Recuperar contraseña
            </h2>
            <p className="text-sm text-muted-foreground">
              Te enviaremos un enlace para restablecerla.
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
                  required
                  placeholder="tu@baldecash.com"
                  className="h-11 pl-10"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                />
              </div>
            </div>
            <Button
              type="submit"
              variant="gradient"
              size="lg"
              loading={loading}
              className="h-11 w-full"
            >
              <Send className="h-4 w-4" />
              Enviar enlace
            </Button>
          </form>
        </>
      ) : (
        <motion.div
          initial={{ opacity: 0, scale: 0.96 }}
          animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 py-6 text-center"
        >
          <div className="rounded-full bg-success/15 p-4">
            <CheckCircle2 className="h-8 w-8 text-success" />
          </div>
          <h3 className="text-xl font-semibold text-foreground">Revisa tu correo</h3>
          <p className="text-sm text-muted-foreground">
            Si la cuenta existe, recibirás un enlace para restablecer tu contraseña.
          </p>
        </motion.div>
      )}
    </div>
  );
}
