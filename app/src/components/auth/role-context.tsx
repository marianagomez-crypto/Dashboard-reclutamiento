'use client';

import * as React from 'react';
import type { Role } from '@/lib/types';

// Contexto con el rol del usuario autenticado.
// Se popula desde el dashboard layout (Server Component que tiene la session).
const RoleContext = React.createContext<Role>('viewer');

export function RoleProvider({
  role,
  children,
}: {
  role: Role;
  children: React.ReactNode;
}) {
  return <RoleContext.Provider value={role}>{children}</RoleContext.Provider>;
}

export function useRole(): Role {
  return React.useContext(RoleContext);
}

/**
 * true para admin/recruiter, false para viewer.
 * Usar para esconder/deshabilitar acciones de crear/editar/borrar en la UI.
 * (Los endpoints API ya enforce esto a nivel servidor por separado.)
 */
export function useCanMutate(): boolean {
  return React.useContext(RoleContext) !== 'viewer';
}

/**
 * true solo para admin.
 * Usar para acciones que solo el admin puede hacer (ej. eliminar definitivamente).
 */
export function useIsAdmin(): boolean {
  return React.useContext(RoleContext) === 'admin';
}
