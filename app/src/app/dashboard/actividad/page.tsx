import { getRepo } from '@/lib/data/repository';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { initials, relativeTime, formatDate } from '@/lib/utils';

export const metadata = { title: 'Actividad' };
export const dynamic = 'force-dynamic';

export default async function Page() {
  const repo = await getRepo();
  const activity = await repo.listActivity(200);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">
          Registro de actividad
        </h1>
        <p className="text-sm text-muted-foreground">
          Auditoria de cambios y eventos del sistema
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Eventos recientes</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative pl-6">
            <div className="absolute left-3 top-2 bottom-2 w-px bg-border" />
            <ul className="space-y-5">
              {activity.map((a) => (
                <li key={a.id} className="relative">
                  <span className="absolute -left-3.5 top-2 inline-flex h-3 w-3 -translate-x-1/2 rounded-full bg-gradient-to-br from-brand-blue-400 to-brand-aqua-500 ring-4 ring-background" />
                  <div className="flex items-start gap-3">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback>{initials(a.userName)}</AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <p className="text-sm">
                        <span className="font-semibold">{a.userName}</span>{' '}
                        <span className="text-muted-foreground">{a.action}</span>{' '}
                        <Badge variant="outline" className="ml-1">
                          {a.entity}
                        </Badge>
                      </p>
                      {a.detail && (
                        <p className="text-xs text-muted-foreground">{a.detail}</p>
                      )}
                      <p className="mt-0.5 text-[10px] uppercase tracking-wider text-muted-foreground">
                        {relativeTime(a.createdAt)} · {formatDate(a.createdAt, true)}
                      </p>
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
