import { fail } from '@sveltejs/kit';
import { eq, inArray, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { negocios } from '$lib/server/db/schema';
import { requireAdmin, memberNegocioIds, canSeeNegocio } from '$lib/server/access';
import type { Actions, PageServerLoad } from './$types';

// Home: negocios que el usuario en sesión puede ver (admins: todos; usuarios
// normales: solo los que tengan asignados como miembro).
export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	let scope;
	if (!user.isAdmin) {
		const ids = memberNegocioIds(user.id);
		if (ids.length === 0) return { negocios: [] };
		scope = inArray(negocios.id, ids);
	}
	const lista = db
		.select()
		.from(negocios)
		.where(scope)
		.orderBy(desc(negocios.creadoEn))
		.all();
	return { negocios: lista };
};

export const actions: Actions = {
	// Crear negocio: admin-only (como crear proyecto en shape_up). El negocio nace
	// sin miembros; el admin asigna quién lo ve desde /negocios/[id]/settings.
	crear: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const data = await request.formData();
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!nombre) {
			return fail(400, { error: 'El nombre del negocio no puede estar vacío.' });
		}
		db.insert(negocios).values({ nombre }).run();
		return { success: true };
	},

	// Renombrar: admin-only (es "ajuste" del negocio, no contenido del día a día).
	renombrarNegocio: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const data = await request.formData();
		const negocioId = Number(data.get('negocioId'));
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!Number.isInteger(negocioId)) return fail(400, { error: 'Negocio inválido' });
		if (!nombre) return fail(400, { error: 'El nombre del negocio no puede estar vacío.' });
		if (!canSeeNegocio(locals.user, negocioId)) return fail(404, { error: 'Negocio no encontrado' });

		db.update(negocios).set({ nombre }).where(eq(negocios.id, negocioId)).run();
		return { success: true };
	}
};
