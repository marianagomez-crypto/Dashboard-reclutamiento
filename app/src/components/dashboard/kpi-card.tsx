'use client';

import * as React from 'react';
import { motion, useMotionValue, useTransform, animate } from 'framer-motion';
import { ArrowDownRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { cn } from '@/lib/utils';

export interface KpiCardProps {
  label: string;
  value: number;
  suffix?: string;
  prefix?: string;
  trend?: number;
  icon: React.ReactNode;
  accent?: 'blue' | 'aqua' | 'gold';
  delay?: number;
  hint?: string;
}

const accentMap = {
  blue: {
    iconBg: 'from-brand-blue-400 to-brand-blue-600',
    bar: 'from-brand-blue-400 to-brand-blue-600',
    tint: 'shadow-tint-blue hover:shadow-glow',
    glowDot: 'bg-brand-blue-500/15',
  },
  aqua: {
    iconBg: 'from-brand-aqua-400 to-brand-aqua-600',
    bar: 'from-brand-aqua-400 to-brand-aqua-600',
    tint: 'shadow-tint-aqua hover:shadow-glow-aqua',
    glowDot: 'bg-brand-aqua-500/15',
  },
  gold: {
    iconBg: 'from-brand-gold-300 to-brand-gold-500',
    bar: 'from-brand-gold-300 to-brand-gold-500',
    tint: 'shadow-tint-gold hover:shadow-glow-gold',
    glowDot: 'bg-brand-gold-400/15',
  },
};

function AnimatedNumber({
  value,
  suffix,
  prefix,
}: {
  value: number;
  suffix?: string;
  prefix?: string;
}) {
  const mv = useMotionValue(0);
  const rounded = useTransform(mv, (v) =>
    Number.isInteger(value) ? Math.round(v).toLocaleString('es-MX') : v.toFixed(1),
  );
  React.useEffect(() => {
    const controls = animate(mv, value, {
      duration: 1.2,
      ease: [0.16, 1, 0.3, 1],
    });
    return controls.stop;
  }, [value, mv]);
  return (
    <>
      {prefix}
      <motion.span>{rounded}</motion.span>
      {suffix && (
        <span className="ml-0.5 text-base font-semibold opacity-70">{suffix}</span>
      )}
    </>
  );
}

export function KpiCard({
  label,
  value,
  suffix,
  prefix,
  trend,
  icon,
  accent = 'blue',
  delay = 0,
  hint,
}: KpiCardProps) {
  const a = accentMap[accent];
  const positive = (trend ?? 0) >= 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.45, delay, ease: [0.16, 1, 0.3, 1] }}
      className="h-full"
    >
      <Card
        className={cn(
          'group relative h-full min-h-[170px] overflow-hidden transition-all duration-300 hover:-translate-y-1',
          a.tint,
        )}
      >
        {/* Top accent bar */}
        <div
          className={cn(
            'absolute inset-x-0 top-0 h-1 bg-gradient-to-r opacity-90',
            a.bar,
          )}
        />
        {/* Glow permanente sutil (esquina) */}
        <div
          aria-hidden
          className={cn(
            'pointer-events-none absolute -right-12 -top-12 h-36 w-36 rounded-full blur-3xl opacity-60 transition-opacity duration-500 group-hover:opacity-100',
            a.glowDot,
          )}
        />

        <div className="relative flex h-full flex-col p-4">
          {/* Fila 1: icono a la izquierda + trend a la derecha */}
          <div className="flex items-center justify-between">
            <div
              className={cn(
                'rounded-lg bg-gradient-to-br p-2 text-white shadow-md ring-1 ring-white/30 [&_svg]:h-4 [&_svg]:w-4',
                a.iconBg,
              )}
            >
              {icon}
            </div>
            {typeof trend === 'number' && (
              <span
                className={cn(
                  'inline-flex shrink-0 items-center gap-0.5 rounded-full px-2 py-0.5 text-[10px] font-bold',
                  positive
                    ? 'bg-success/15 text-success'
                    : 'bg-destructive/15 text-destructive',
                )}
              >
                {positive ? (
                  <ArrowUpRight className="h-3 w-3" />
                ) : (
                  <ArrowDownRight className="h-3 w-3" />
                )}
                {Math.abs(trend)}%
              </span>
            )}
          </div>

          {/* Fila 2: label ocupa todo el ancho */}
          <p
            className="mt-3 text-[11px] font-semibold uppercase leading-tight tracking-wider text-muted-foreground"
            title={label}
          >
            {label}
          </p>

          {/* Fila 3: valor */}
          <p className="mt-1 font-display text-3xl font-bold leading-none tracking-tight tabular-nums text-foreground">
            <AnimatedNumber value={value} prefix={prefix} suffix={suffix} />
          </p>

          {/* Fila 4: hint */}
          {hint && (
            <p className="mt-auto pt-3 text-[10px] font-medium uppercase tracking-wider text-muted-foreground/70">
              {hint}
            </p>
          )}
        </div>
      </Card>
    </motion.div>
  );
}
