'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { toast } from 'sonner';
import { Award, Check, Pencil, Plus, Trash2, UserCheck, Users2, X } from 'lucide-react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import type { CatalogItem, CatalogType } from '@/lib/types';
import { useCanMutate, useIsAdmin } from '@/components/auth/role-context';

interface Props {
  initialSeniorities: CatalogItem[];
  initialHiringManagers: CatalogItem[];
  initialRecruiters: CatalogItem[];
}

export function CatalogsPage({
  initialSeniorities,
  initialHiringManagers,
  initialRecruiters,
}: Props) {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-3xl font-bold tracking-tight">Catálogos</h1>
        <p className="text-sm text-muted-foreground">
          Maestros que alimentan los selects de toda la app · cambios sincronizados con Airtable
        </p>
      </div>

      <CatalogCard
        type="seniorities"
        title="Seniorities"
        description="Niveles de experiencia que aparecen al crear/editar una vacante"
        icon={<Award className="h-5 w-5" />}
        initialItems={initialSeniorities}
      />
      <CatalogCard
        type="hiring-managers"
        title="Hiring Managers"
        description="Líderes responsables de las vacantes"
        icon={<UserCheck className="h-5 w-5" />}
        initialItems={initialHiringManagers}
      />
      <CatalogCard
        type="recruiters"
        title="Reclutadores"
        description="Equipo de Talento & Cultura que gestiona los procesos"
        icon={<Users2 className="h-5 w-5" />}
        initialItems={initialRecruiters}
      />
    </div>
  );
}

// ============================================================================
// Card por catalogo — tabla editable inline + agregar
// ============================================================================
function CatalogCard({
  type,
  title,
  description,
  icon,
  initialItems,
}: {
  type: CatalogType;
  title: string;
  description: string;
  icon: React.ReactNode;
  initialItems: CatalogItem[];
}) {
  const router = useRouter();
  const canMutate = useCanMutate();
  const isAdmin = useIsAdmin();
  const [items, setItems] = React.useState(initialItems);
  React.useEffect(() => {
    setItems(initialItems);
  }, [initialItems]);

  const [newName, setNewName] = React.useState('');
  const [creating, setCreating] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | null>(null);
  const [editingName, setEditingName] = React.useState('');
  const [savingId, setSavingId] = React.useState<string | null>(null);
  const [confirmDelete, setConfirmDelete] = React.useState<CatalogItem | null>(null);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    const name = newName.trim();
    if (!name) return;
    setCreating(true);
    try {
      const res = await fetch(`/api/catalogs/${type}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      setItems((arr) => [...arr, (json as any).data]);
      setNewName('');
      toast.success('Elemento agregado');
      router.refresh();
    } catch (err: any) {
      toast.error(err.message || 'No se pudo crear');
    } finally {
      setCreating(false);
    }
  }

  function startEdit(item: CatalogItem) {
    setEditingId(item.id);
    setEditingName(item.name);
  }

  function cancelEdit() {
    setEditingId(null);
    setEditingName('');
  }

  async function saveEdit(item: CatalogItem) {
    const name = editingName.trim();
    if (!name || name === item.name) {
      cancelEdit();
      return;
    }
    setSavingId(item.id);
    const prev = items;
    setItems((arr) => arr.map((x) => (x.id === item.id ? { ...x, name } : x)));
    try {
      const res = await fetch(`/api/catalogs/${type}/${item.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name }),
      });
      const json = await res.json().catch(() => ({ error: `Error ${res.status}` }));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Actualizado');
      cancelEdit();
      router.refresh();
    } catch (err: any) {
      setItems(prev);
      toast.error(err.message || 'No se pudo actualizar');
    } finally {
      setSavingId(null);
    }
  }

  async function handleDelete() {
    if (!confirmDelete) return;
    const id = confirmDelete.id;
    setConfirmDelete(null);
    const prev = items;
    setItems((arr) => arr.filter((x) => x.id !== id));
    try {
      const res = await fetch(`/api/catalogs/${type}/${id}`, { method: 'DELETE' });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error((json as any).error || 'Error');
      toast.success('Elemento eliminado');
      router.refresh();
    } catch (err: any) {
      setItems(prev);
      toast.error(err.message || 'No se pudo eliminar');
    }
  }

  return (
    <Card>
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-start gap-3">
            <div className="rounded-xl bg-brand-blue-100 p-2 text-brand-blue-700 dark:bg-brand-blue-600/20 dark:text-brand-blue-100">
              {icon}
            </div>
            <div>
              <CardTitle>{title}</CardTitle>
              <CardDescription>{description}</CardDescription>
            </div>
          </div>
          <span className="rounded-full border border-border bg-card px-3 py-1 text-xs font-semibold text-muted-foreground tabular-nums">
            {items.length} {items.length === 1 ? 'elemento' : 'elementos'}
          </span>
        </div>
      </CardHeader>

      <CardContent>
        {/* Tabla */}
        <div className="overflow-hidden rounded-xl border border-border">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="bg-muted/40 text-left">
                <th className="w-32 px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  ID
                </th>
                <th className="px-3 py-2.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Nombre
                </th>
                <th className="w-[88px] px-3 py-2.5 text-right text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody>
              {items.length === 0 ? (
                <tr>
                  <td
                    colSpan={3}
                    className="px-3 py-6 text-center text-sm text-muted-foreground"
                  >
                    No hay elementos. Agregá uno con el formulario abajo.
                  </td>
                </tr>
              ) : (
                items.map((item, i) => {
                  const isEditing = editingId === item.id;
                  const isSaving = savingId === item.id;
                  return (
                    <motion.tr
                      key={item.id}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: Math.min(i * 0.02, 0.2) }}
                      className="border-t border-border transition-colors hover:bg-muted/30"
                    >
                      <td className="whitespace-nowrap px-3 py-2.5 font-mono text-xs text-muted-foreground">
                        {item.id}
                      </td>
                      <td className="px-3 py-2.5">
                        {isEditing ? (
                          <Input
                            autoFocus
                            value={editingName}
                            onChange={(e) => setEditingName(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter') saveEdit(item);
                              if (e.key === 'Escape') cancelEdit();
                            }}
                            disabled={isSaving}
                            className="h-8"
                          />
                        ) : (
                          <span className="font-medium text-foreground">{item.name}</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5">
                        <div className="flex items-center justify-end gap-1">
                          {isEditing ? (
                            <>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7 text-emerald-600 hover:text-emerald-700"
                                onClick={() => saveEdit(item)}
                                disabled={isSaving}
                                aria-label="Guardar"
                              >
                                <Check className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-7 w-7"
                                onClick={cancelEdit}
                                disabled={isSaving}
                                aria-label="Cancelar"
                              >
                                <X className="h-4 w-4" />
                              </Button>
                            </>
                          ) : (
                            <>
                              {canMutate && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7"
                                  onClick={() => startEdit(item)}
                                  aria-label="Editar"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {isAdmin && (
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="h-7 w-7 text-destructive hover:text-destructive"
                                  onClick={() => setConfirmDelete(item)}
                                  aria-label="Eliminar"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
                                </Button>
                              )}
                              {!canMutate && !isAdmin && (
                                <span className="text-xs text-muted-foreground">—</span>
                              )}
                            </>
                          )}
                        </div>
                      </td>
                    </motion.tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Form de creación — solo para usuarios con permiso de mutar */}
        {canMutate && (
          <form onSubmit={handleCreate} className="mt-4 flex items-center gap-2">
            <Input
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder={`Agregar a ${title.toLowerCase()}…`}
              disabled={creating}
            />
            <Button
              type="submit"
              variant="gradient"
              disabled={creating || !newName.trim()}
            >
              <Plus className="h-4 w-4" />
              Agregar
            </Button>
          </form>
        )}
      </CardContent>

      {/* Confirmar eliminar */}
      <Dialog
        open={!!confirmDelete}
        onOpenChange={(v) => !v && setConfirmDelete(null)}
      >
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Eliminar elemento</DialogTitle>
            <DialogDescription>
              ¿Seguro que querés eliminar{' '}
              <span className="font-semibold text-foreground">
                {confirmDelete?.name}
              </span>
              ? Esta acción no se puede deshacer y removerá el elemento de Airtable.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setConfirmDelete(null)}>
              Cancelar
            </Button>
            <Button variant="destructive" onClick={handleDelete}>
              <Trash2 className="h-4 w-4" />
              Eliminar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
