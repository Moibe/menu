import { fail } from '@sveltejs/kit';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { menus, negocios, usuarios } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Todos los menús del usuario 'default', con el nombre de su negocio.
	const lista = db
		.select({
			id: menus.id,
			nombre: menus.nombre,
			creadoEn: menus.creadoEn,
			negocioNombre: negocios.nombre
		})
		.from(menus)
		.innerJoin(negocios, eq(menus.negocioId, negocios.id))
		.innerJoin(usuarios, eq(negocios.usuarioId, usuarios.id))
		.where(eq(usuarios.email, 'default'))
		.orderBy(desc(menus.creadoEn))
		.all();

	return { menus: lista };
};

export const actions: Actions = {
	renombrarMenu: async ({ request }) => {
		const data = await request.formData();
		const menuId = Number(data.get('menuId'));
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!Number.isInteger(menuId)) return fail(400, { error: 'Menú inválido' });
		if (!nombre) return fail(400, { error: 'El nombre del menú no puede estar vacío.' });

		// El menú debe pertenecer a un negocio del usuario 'default'.
		const row = db
			.select({ id: menus.id })
			.from(menus)
			.innerJoin(negocios, eq(menus.negocioId, negocios.id))
			.innerJoin(usuarios, eq(negocios.usuarioId, usuarios.id))
			.where(and(eq(menus.id, menuId), eq(usuarios.email, 'default')))
			.get();
		if (!row) return fail(404, { error: 'Menú no encontrado' });

		db.update(menus).set({ nombre }).where(eq(menus.id, menuId)).run();
		return { success: true };
	}
};
