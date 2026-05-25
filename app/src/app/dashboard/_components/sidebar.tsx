'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  LayoutDashboard,
  Users,
  Briefcase,
  Calendar,
  BarChart3,
  ShieldCheck,
  History,
  Settings,
  Menu,
  X,
  KanbanSquare,
  BookMarked,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Logo } from '@/components/brand/logo';
import type { Role } from '@/lib/types';

interface NavItem {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  roles?: Role[];
}

const navItems: NavItem[] = [
  { href: '/dashboard', label: 'Resumen', icon: LayoutDashboard },
  { href: '/dashboard/candidatos', label: 'Candidatos', icon: Users },
  { href: '/dashboard/pipeline', label: 'Pipeline', icon: KanbanSquare },
  { href: '/dashboard/vacantes', label: 'Vacantes', icon: Briefcase },
  { href: '/dashboard/entrevistas', label: 'Bitácora', icon: Calendar },
  { href: '/dashboard/reportes', label: 'Reportes', icon: BarChart3 },
  { href: '/dashboard/actividad', label: 'Actividad', icon: History },
  { href: '/dashboard/catalogos', label: 'Catálogos', icon: BookMarked },
  { href: '/dashboard/admin', label: 'Admin', icon: ShieldCheck, roles: ['admin'] },
  { href: '/dashboard/ajustes', label: 'Ajustes', icon: Settings },
];

export function Sidebar({ role }: { role: Role }) {
  const pathname = usePathname();
  const [open, setOpen] = React.useState(false);

  const items = navItems.filter((it) => !it.roles || it.roles.includes(role));

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen((s) => !s)}
        className="fixed left-4 top-4 z-40 inline-flex h-9 w-9 items-center justify-center rounded-lg border border-border bg-card/80 shadow-soft backdrop-blur lg:hidden"
        aria-label="Abrir menu"
      >
        {open ? <X className="h-4 w-4" /> : <Menu className="h-4 w-4" />}
      </button>

      <aside
        className={cn(
          'fixed inset-y-0 left-0 z-30 w-72 transform border-r border-border bg-card transition-transform duration-300 ease-out lg:translate-x-0',
          open ? 'translate-x-0 shadow-card-elevated lg:shadow-none' : '-translate-x-full lg:translate-x-0',
        )}
      >
        <div className="flex h-full flex-col">
          <div className="flex h-16 items-center px-6 border-b border-border">
            <Link href="/dashboard" className="flex items-center gap-2.5">
              <Logo variant="mark" size={32} />
              <div className="flex flex-col leading-tight">
                <span className="font-display text-base font-bold tracking-tight">
                  Baldecash
                </span>
                <span className="text-[9px] uppercase tracking-[0.25em] text-muted-foreground">
                  Recruitment
                </span>
              </div>
            </Link>
          </div>

          <nav className="flex-1 space-y-1 overflow-y-auto px-3 py-5 scrollbar-thin">
            {items.map((item, i) => {
              const active =
                pathname === item.href ||
                (item.href !== '/dashboard' && pathname.startsWith(item.href));
              const Icon = item.icon;
              return (
                <motion.div
                  key={item.href}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link
                    href={item.href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      'group relative flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-all',
                      active
                        ? 'text-primary'
                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                    )}
                  >
                    {active && (
                      <motion.div
                        layoutId="sidebar-active"
                        className="absolute inset-0 rounded-lg bg-gradient-to-r from-brand-blue-100 to-brand-aqua-100 dark:from-brand-blue-600/20 dark:to-brand-aqua-600/20"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.6 }}
                      />
                    )}
                    <Icon
                      className={cn(
                        'relative h-4 w-4 transition-transform group-hover:scale-110',
                        active && 'text-primary',
                      )}
                    />
                    <span className="relative">{item.label}</span>
                    {active && (
                      <motion.span
                        layoutId="sidebar-dot"
                        className="ml-auto h-1.5 w-1.5 rounded-full bg-primary shadow-glow"
                      />
                    )}
                  </Link>
                </motion.div>
              );
            })}
          </nav>

          <div className="border-t border-border p-4">
            <div className="rounded-xl border border-border bg-gradient-to-br from-brand-blue-100 to-brand-aqua-100 dark:from-brand-blue-600/15 dark:to-brand-aqua-600/15 p-4">
              <p className="text-xs font-semibold text-brand-blue-700 dark:text-brand-blue-100">
                Pro Tip
              </p>
              <p className="mt-1 text-xs text-muted-foreground">
                Conecta Airtable y los KPIs se sincronizaran en tiempo real.
              </p>
            </div>
          </div>
        </div>
      </aside>

      {open && (
        <div
          onClick={() => setOpen(false)}
          className="fixed inset-0 z-20 bg-brand-blue-700/30 backdrop-blur-sm lg:hidden"
        />
      )}
    </>
  );
}
