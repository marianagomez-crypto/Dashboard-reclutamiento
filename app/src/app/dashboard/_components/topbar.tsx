'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { LogOut, Moon, Sun, RefreshCw } from 'lucide-react';
import { useTheme } from 'next-themes';
import { toast } from 'sonner';
import { Button } from '@/components/ui/button';
import { GlobalSearch } from './global-search';
import {
  Avatar,
  AvatarFallback,
} from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { Badge } from '@/components/ui/badge';
import { initials } from '@/lib/utils';
import type { SessionPayload } from '@/lib/auth/session';
import { NotificationCenter } from './notification-center';

export function Topbar({ session }: { session: SessionPayload }) {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const [syncing, setSyncing] = React.useState(false);

  async function logout() {
    await fetch('/api/auth/logout', { method: 'POST' });
    toast.success('Sesion cerrada');
    router.push('/login');
    router.refresh();
  }

  async function syncAirtable() {
    setSyncing(true);
    try {
      const res = await fetch('/api/sync', { method: 'POST' });
      const json = await res.json();
      if (json.ok) toast.success('Sincronizacion completada', { description: json.detail });
      else toast.warning('Sincronizacion en modo mock', { description: json.detail });
      router.refresh();
    } catch {
      toast.error('Error de sincronizacion');
    } finally {
      setSyncing(false);
    }
  }

  return (
    <header className="sticky top-0 z-20 flex h-16 items-center gap-3 border-b border-border bg-background/70 px-4 backdrop-blur-xl lg:px-8">
      <div className="ml-12 flex-1 lg:ml-0">
        <GlobalSearch />
      </div>

      <div className="flex items-center gap-1.5">
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={syncAirtable}
              disabled={syncing}
              aria-label="Sincronizar"
            >
              <RefreshCw className={syncing ? 'animate-spin' : ''} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Sincronizar con Airtable</TooltipContent>
        </Tooltip>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
              aria-label="Cambiar tema"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Cambiar tema</TooltipContent>
        </Tooltip>

        <NotificationCenter />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="ml-1 flex items-center gap-2 rounded-full p-1 pr-3 transition hover:bg-muted/60"
            >
              <Avatar className="h-8 w-8">
                <AvatarFallback>{initials(session.name)}</AvatarFallback>
              </Avatar>
              <div className="hidden text-left lg:block">
                <p className="text-sm font-semibold leading-tight">{session.name}</p>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  {session.role}
                </p>
              </div>
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="text-sm font-semibold text-foreground">
                  {session.name}
                </span>
                <span className="text-xs font-normal text-muted-foreground">
                  {session.email}
                </span>
                <Badge variant="blue" className="mt-2 w-fit text-[10px] uppercase">
                  {session.role}
                </Badge>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={() => router.push('/dashboard/ajustes')}>
              Mi cuenta
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem onClick={logout} className="text-destructive">
              <LogOut className="h-4 w-4" />
              Cerrar sesion
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}

