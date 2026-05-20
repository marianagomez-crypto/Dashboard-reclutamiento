'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import {
  Pencil,
  Plus,
  ShieldAlert,
  ShieldCheck,
  Trash2,
  User as UserIcon,
} from 'lucide-react';
import { toast } from 'sonner';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { formatDate, initials, relativeTime } from '@/lib/utils';
import type { Role, User } from '@/lib/types';

const roleVariant: Record<Role, 'destructive' | 'gold' | 'blue'> = {
  admin: 'destructive',
  recruiter: 'gold',
  viewer: 'blue',
};

const roleLabel: Record<Role, string> = {
  admin: 'Administrador',
  recruiter: 'Reclutador',
  viewer: 'Visualizador',
};

export function AdminPage({ initialUsers }: { initialUsers: User[] }) {
  const router = useRouter();
  const [users, setUsers] = React.useState(initialUsers);
  const [creating, setCreating] = React.useState(false);
  const [editing, setEditing] = React.useState<User | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<User | null>(null);

  async function onCreate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const res = await fetch('/api/admin/users', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: data.email,
          name: data.name,
          role: data.role,
          password: data.password,
          active: true,
        }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setUsers((arr) => [json.data, ...arr]);
      setCreating(false);
      toast.success('Usuario creado');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function onUpdate(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!editing) return;
    const fd = new FormData(e.currentTarget);
    const data = Object.fromEntries(fd.entries());
    try {
      const body: any = {
        email: data.email,
        name: data.name,
        role: data.role,
        active: data.active === 'on',
      };
      if (data.password) body.password = data.password;
      const res = await fetch(`/api/admin/users/${editing.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setUsers((arr) => arr.map((u) => (u.id === editing.id ? json.data : u)));
      setEditing(null);
      toast.success('Usuario actualizado');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  async function onDelete() {
    if (!confirmDelete) return;
    try {
      const res = await fetch(`/api/admin/users/${confirmDelete.id}`, {
        method: 'DELETE',
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || 'Error');
      setUsers((arr) => arr.filter((u) => u.id !== confirmDelete.id));
      toast.success('Usuario eliminado');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setConfirmDelete(null);
    }
  }

  async function toggleActive(u: User) {
    try {
      const res = await fetch(`/api/admin/users/${u.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active: !u.active }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error);
      setUsers((arr) => arr.map((x) => (x.id === u.id ? json.data : x)));
      toast.success(`Usuario ${!u.active ? 'activado' : 'desactivado'}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  }

  const stats = {
    total: users.length,
    admins: users.filter((u) => u.role === 'admin').length,
    recruiters: users.filter((u) => u.role === 'recruiter').length,
    inactive: users.filter((u) => !u.active).length,
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-3xl font-bold tracking-tight">
            Panel de administracion
          </h1>
          <p className="text-sm text-muted-foreground">
            Gestiona usuarios, roles y accesos
          </p>
        </div>
        <Button variant="gradient" onClick={() => setCreating(true)}>
          <Plus className="h-4 w-4" />
          Nuevo usuario
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
        <Stat icon={UserIcon} label="Usuarios" value={stats.total} />
        <Stat icon={ShieldCheck} label="Admins" value={stats.admins} accent="aqua" />
        <Stat icon={UserIcon} label="Reclutadores" value={stats.recruiters} accent="gold" />
        <Stat icon={ShieldAlert} label="Inactivos" value={stats.inactive} accent="red" />
      </div>

      <Card className="overflow-hidden">
        <div className="overflow-x-auto scrollbar-thin">
          <table className="w-full text-sm">
            <thead className="bg-muted/40 text-xs uppercase tracking-wider text-muted-foreground">
              <tr>
                <th className="px-4 py-3 text-left">Usuario</th>
                <th className="px-4 py-3 text-left">Rol</th>
                <th className="px-4 py-3 text-left">Estado</th>
                <th className="px-4 py-3 text-left">Ultimo acceso</th>
                <th className="px-4 py-3 text-left">Creado</th>
                <th className="px-4 py-3 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u, i) => (
                <motion.tr
                  key={u.id}
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: i * 0.03 }}
                  className="border-t border-border/60 transition hover:bg-muted/30"
                >
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-3">
                      <Avatar className="h-9 w-9">
                        <AvatarFallback>{initials(u.name)}</AvatarFallback>
                      </Avatar>
                      <div>
                        <p className="font-semibold">{u.name}</p>
                        <p className="text-xs text-muted-foreground">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <Badge variant={roleVariant[u.role]}>{roleLabel[u.role]}</Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="inline-flex items-center gap-2">
                      <Switch
                        checked={u.active}
                        onCheckedChange={() => toggleActive(u)}
                        aria-label="Activo"
                      />
                      <span className="text-xs">
                        {u.active ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {u.lastLoginAt ? relativeTime(u.lastLoginAt) : 'Nunca'}
                  </td>
                  <td className="px-4 py-3 text-xs text-muted-foreground">
                    {formatDate(u.createdAt)}
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setEditing(u)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setConfirmDelete(u)}
                    >
                      <Trash2 className="h-4 w-4 text-destructive" />
                    </Button>
                  </td>
                </motion.tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>

      {/* Crear */}
      <Dialog open={creating} onOpenChange={setCreating}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nuevo usuario</DialogTitle>
            <DialogDescription>
              Se enviara un correo de bienvenida si el SMTP esta configurado.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={onCreate} className="space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="name">Nombre completo</Label>
                <Input id="name" name="name" required minLength={2} />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="email">Correo</Label>
                <Input id="email" name="email" type="email" required />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="role">Rol</Label>
                <Select name="role" defaultValue="recruiter">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Administrador</SelectItem>
                    <SelectItem value="recruiter">Reclutador</SelectItem>
                    <SelectItem value="viewer">Visualizador</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="col-span-2 space-y-1.5">
                <Label htmlFor="password">Contrasena temporal</Label>
                <Input id="password" name="password" type="password" required minLength={8} />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setCreating(false)}>
                Cancelar
              </Button>
              <Button type="submit" variant="gradient">
                <Plus className="h-4 w-4" />
                Crear
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Editar */}
      <Dialog open={!!editing} onOpenChange={(v) => !v && setEditing(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar usuario</DialogTitle>
          </DialogHeader>
          {editing && (
            <form onSubmit={onUpdate} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="e-name">Nombre</Label>
                  <Input id="e-name" name="name" defaultValue={editing.name} required />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-email">Correo</Label>
                  <Input
                    id="e-email"
                    name="email"
                    type="email"
                    defaultValue={editing.email}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="e-role">Rol</Label>
                  <Select name="role" defaultValue={editing.role}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin">Administrador</SelectItem>
                      <SelectItem value="recruiter">Reclutador</SelectItem>
                      <SelectItem value="viewer">Visualizador</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="col-span-2 space-y-1.5">
                  <Label htmlFor="e-password">Nueva contrasena (opcional)</Label>
                  <Input id="e-password" name="password" type="password" minLength={8} />
                </div>
                <div className="col-span-2 flex items-center gap-2">
                  <input
                    id="e-active"
                    name="active"
                    type="checkbox"
                    defaultChecked={editing.active}
                    className="h-4 w-4 rounded border-border text-primary focus:ring-ring"
                  />
                  <Label htmlFor="e-active">Activo</Label>
                </div>
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setEditing(null)}>
                  Cancelar
                </Button>
                <Button type="submit" variant="gradient">
                  Guardar
                </Button>
              </DialogFooter>
            </form>
          )}
        </DialogContent>
      </Dialog>

      <Dialog open={!!confirmDelete} onOpenChange={(v) => !v && setConfirmDelete(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Eliminar usuario</DialogTitle>
            <DialogDescription>
              Esta accion no se puede deshacer.{' '}
              <strong>{confirmDelete?.email}</strong> ya no podra acceder.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={onDelete}>
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

function Stat({
  icon: Icon,
  label,
  value,
  accent = 'blue',
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: number;
  accent?: 'blue' | 'aqua' | 'gold' | 'red';
}) {
  const map = {
    blue: 'from-brand-blue-400 to-brand-blue-600',
    aqua: 'from-brand-aqua-400 to-brand-aqua-600',
    gold: 'from-brand-gold-300 to-brand-gold-500',
    red: 'from-red-400 to-red-600',
  };
  return (
    <Card className="flex items-center gap-3 p-4">
      <div
        className={`rounded-xl bg-gradient-to-br ${map[accent]} p-2.5 text-white shadow-lg`}
      >
        <Icon className="h-5 w-5" />
      </div>
      <div>
        <p className="text-xs uppercase tracking-wider text-muted-foreground">{label}</p>
        <p className="font-display text-2xl font-bold">{value}</p>
      </div>
    </Card>
  );
}
