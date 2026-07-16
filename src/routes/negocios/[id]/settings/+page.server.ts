import type { Actions, PageServerLoad } from './$types';
import { error, fail, redirect } from '@sveltejs/kit';
import { db } from '$lib/server/db';
import { negocios, usuarios, negocioMembers } from '$lib/server/db/schema';
import { and, asc, eq } from 'drizzle-orm';
import { requireAdmin } from '$lib/server/access';

// Ajustes de negocio — admin-only. Renombrar y membresía (quién puede verlo).
export const load: PageServerLoad = async ({ params, locals }) => {
	requireAdmin(locals.user);

	const id = Number(params.id);
	if (!Number.isInteger(id) || id <= 0) throw error(404, 'Negocio no encontrado');

	const negocio = db.select().from(negocios).where(eq(negocios.id, id)).get();
	if (!negocio) throw error(404, 'Negocio no encontrado');

	const memberRows = db
		.select({ usuarioId: negocioMembers.usuarioId })
		.from(negocioMembers)
		.where(eq(negocioMembers.negocioId, id))
		.all();
	const memberIds = new Set(memberRows.map((r) => r.usuarioId));

	const allUsers = db
		.select({ id: usuarios.id, username: usuarios.username, isAdmin: usuarios.isAdmin })
		.from(usuarios)
		.orderBy(asc(usuarios.username))
		.all();

	// Los admins ya ven todo, así que no se ofrecen como miembros.
	const members = allUsers.filter((u) => memberIds.has(u.id));
	const candidates = allUsers.filter((u) => !u.isAdmin && !memberIds.has(u.id));

	return { negocio, members, candidates };
};

function negocioId(params: { id: string }): number {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Negocio no encontrado');
	return id;
}

export const actions: Actions = {
	rename: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = negocioId(params);
		const fd = await request.formData();
		const nombre = String(fd.get('nombre') ?? '').trim();
		if (!nombre) return fail(400, { nameError: 'El nombre es obligatorio.' });
		db.update(negocios).set({ nombre }).where(eq(negocios.id, id)).run();
		return { renamed: true };
	},

	// Permanente: se lleva en cascada sus menús y productos.
	delete: async ({ params, locals }) => {
		requireAdmin(locals.user);
		const id = negocioId(params);
		db.delete(negocios).where(eq(negocios.id, id)).run();
		throw redirect(303, '/');
	},

	addMember: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = negocioId(params);
		const usuarioId = Number((await request.formData()).get('usuarioId'));
		if (!Number.isInteger(usuarioId)) return fail(400, { memberError: 'Usuario inválido.' });
		db.insert(negocioMembers).values({ negocioId: id, usuarioId }).onConflictDoNothing().run();
		return { memberAdded: true };
	},

	removeMember: async ({ request, params, locals }) => {
		requireAdmin(locals.user);
		const id = negocioId(params);
		const usuarioId = Number((await request.formData()).get('usuarioId'));
		if (!Number.isInteger(usuarioId)) return fail(400, { memberError: 'Usuario inválido.' });
		db
			.delete(negocioMembers)
			.where(and(eq(negocioMembers.negocioId, id), eq(negocioMembers.usuarioId, usuarioId)))
			.run();
		return { memberRemoved: true };
	}
};
