import { error } from '@sveltejs/kit';
import { and, eq } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { negocioMembers } from '$lib/server/db/schema';
import type { SessionUser } from '$lib/server/auth';

// Por ahora todo mutar es admin-only (los usuarios normales son de solo lectura).
export function requireAdmin(user: SessionUser | null): void {
	if (!user?.isAdmin) throw error(403, 'No autorizado');
}

export function isMember(usuarioId: number, negocioId: number): boolean {
	const row = db
		.select({ id: negocioMembers.id })
		.from(negocioMembers)
		.where(and(eq(negocioMembers.usuarioId, usuarioId), eq(negocioMembers.negocioId, negocioId)))
		.get();
	return !!row;
}

// Ids de negocios de los que un usuario no-admin es miembro.
export function memberNegocioIds(usuarioId: number): number[] {
	const rows = db
		.select({ negocioId: negocioMembers.negocioId })
		.from(negocioMembers)
		.where(eq(negocioMembers.usuarioId, usuarioId))
		.all();
	return rows.map((r) => r.negocioId);
}

// True si el usuario puede VER este negocio (admin, o miembro).
export function canSeeNegocio(user: SessionUser | null, negocioId: number): boolean {
	if (!user) return false;
	if (user.isAdmin) return true;
	return isMember(user.id, negocioId);
}
