'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import * as Popover from '@radix-ui/react-popover';
import {
  Bell,
  CheckCheck,
  CircleAlert,
  CircleCheck,
  Info,
  TriangleAlert,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { cn, relativeTime } from '@/lib/utils';
import type { Notification } from '@/lib/types';

const typeIcon = {
  info: Info,
  success: CircleCheck,
  warning: TriangleAlert,
  error: CircleAlert,
} as const;

const typeColor = {
  info: 'text-brand-blue-500',
  success: 'text-brand-aqua-600',
  warning: 'text-brand-gold-500',
  error: 'text-destructive',
} as const;

export function NotificationCenter() {
  const router = useRouter();
  const [items, setItems] = React.useState<Notification[]>([]);
  const [open, setOpen] = React.useState(false);
  const unread = items.filter((n) => !n.read).length;

  const load = React.useCallback(async () => {
    try {
      const res = await fetch('/api/notifications');
      const json = await res.json();
      setItems(json.data || []);
    } catch {
      /* silent */
    }
  }, []);

  React.useEffect(() => {
    load();
    const t = setInterval(load, 20000);
    return () => clearInterval(t);
  }, [load]);

  async function markAll() {
    await fetch('/api/notifications', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action: 'read-all' }),
    });
    setItems((arr) => arr.map((n) => ({ ...n, read: true })));
  }

  async function openOne(n: Notification) {
    if (!n.read) {
      await fetch('/api/notifications', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'read', id: n.id }),
      });
      setItems((arr) => arr.map((x) => (x.id === n.id ? { ...x, read: true } : x)));
    }
    if (n.href) {
      router.push(n.href);
      setOpen(false);
    }
  }

  return (
    <Popover.Root open={open} onOpenChange={setOpen}>
      <Popover.Trigger asChild>
        <Button variant="ghost" size="icon" className="relative" aria-label="Notificaciones">
          <Bell className="h-4 w-4" />
          {unread > 0 && (
            <motion.span
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              className="absolute right-1.5 top-1.5 flex h-4 min-w-4 items-center justify-center rounded-full bg-gradient-to-br from-brand-gold-400 to-brand-gold-500 px-1 text-[10px] font-bold text-brand-blue-700 ring-2 ring-background"
            >
              {unread > 9 ? '9+' : unread}
            </motion.span>
          )}
          {unread > 0 && (
            <span className="absolute right-1.5 top-1.5 h-4 w-4 animate-ping rounded-full bg-brand-gold-400/60" />
          )}
        </Button>
      </Popover.Trigger>
      <Popover.Portal>
        <Popover.Content
          align="end"
          sideOffset={8}
          asChild
          className="z-50"
        >
          <motion.div
            initial={{ opacity: 0, y: -8, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0 }}
            className="w-[22rem] overflow-hidden rounded-xl border border-border bg-popover shadow-glow"
          >
            <div className="flex items-center justify-between border-b border-border bg-gradient-to-r from-brand-blue-100 to-brand-aqua-100 dark:from-brand-blue-700/30 dark:to-brand-aqua-700/30 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">Notificaciones</p>
                <p className="text-xs text-muted-foreground">
                  {unread > 0 ? `${unread} sin leer` : 'Todo al dia'}
                </p>
              </div>
              {unread > 0 && (
                <Button size="sm" variant="ghost" onClick={markAll}>
                  <CheckCheck className="h-3.5 w-3.5" />
                  Marcar leidas
                </Button>
              )}
            </div>
            <div className="max-h-[28rem] overflow-y-auto scrollbar-thin">
              <AnimatePresence initial={false}>
                {items.length === 0 ? (
                  <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                    No hay notificaciones.
                  </div>
                ) : (
                  items.map((n, i) => {
                    const Icon = typeIcon[n.type];
                    return (
                      <motion.button
                        key={n.id}
                        type="button"
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: i * 0.03 }}
                        onClick={() => openOne(n)}
                        className={cn(
                          'group flex w-full items-start gap-3 border-b border-border/60 px-4 py-3 text-left transition hover:bg-muted/40',
                          !n.read && 'bg-muted/20',
                        )}
                      >
                        <span className={cn('mt-0.5', typeColor[n.type])}>
                          <Icon className="h-4 w-4" />
                        </span>
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <p className="text-sm font-semibold leading-tight">
                              {n.title}
                            </p>
                            {!n.read && (
                              <span className="h-1.5 w-1.5 rounded-full bg-primary" />
                            )}
                          </div>
                          {n.body && (
                            <p className="mt-0.5 text-xs text-muted-foreground">
                              {n.body}
                            </p>
                          )}
                          <p className="mt-1 text-[10px] uppercase tracking-wider text-muted-foreground/70">
                            {relativeTime(n.createdAt)}
                          </p>
                        </div>
                      </motion.button>
                    );
                  })
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </Popover.Content>
      </Popover.Portal>
    </Popover.Root>
  );
}
