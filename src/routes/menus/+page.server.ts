import { fail } from '@sveltejs/kit';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { menus, proyectos, usuarios } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Todos los menús del usuario 'default', con el nombre de su proyecto.
	const lista = db
		.select({
			id: menus.id,
			nombre: menus.nombre,
			creadoEn: menus.creadoEn,
			proyectoNombre: proyectos.nombre
		})
		.from(menus)
		.innerJoin(proyectos, eq(menus.proyectoId, proyectos.id))
		.innerJoin(usuarios, eq(proyectos.usuarioId, usuarios.id))
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

		// El menú debe pertenecer a un proyecto del usuario 'default'.
		const row = db
			.select({ id: menus.id })
			.from(menus)
			.innerJoin(proyectos, eq(menus.proyectoId, proyectos.id))
			.innerJoin(usuarios, eq(proyectos.usuarioId, usuarios.id))
			.where(and(eq(menus.id, menuId), eq(usuarios.email, 'default')))
			.get();
		if (!row) return fail(404, { error: 'Menú no encontrado' });

		db.update(menus).set({ nombre }).where(eq(menus.id, menuId)).run();
		return { success: true };
	}
};
