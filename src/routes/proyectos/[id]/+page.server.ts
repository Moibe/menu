import { error, fail } from '@sveltejs/kit';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { proyectos, menus } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params }) => {
	const id = Number(params.id);
	if (!Number.isInteger(id)) throw error(404, 'Proyecto no encontrado');

	const proyecto = db.select().from(proyectos).where(eq(proyectos.id, id)).get();
	if (!proyecto) throw error(404, 'Proyecto no encontrado');

	const lista = db
		.select()
		.from(menus)
		.where(eq(menus.proyectoId, id))
		.orderBy(desc(menus.creadoEn))
		.all();

	return { proyecto, menus: lista };
};

export const actions: Actions = {
	agregarMenu: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) return fail(404, { error: 'Proyecto no encontrado' });
		const proyecto = db.select().from(proyectos).where(eq(proyectos.id, id)).get();
		if (!proyecto) return fail(404, { error: 'Proyecto no encontrado' });

		const data = await request.formData();
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!nombre) return fail(400, { error: 'El nombre del menú no puede estar vacío.' });

		db.insert(menus).values({ proyectoId: id, nombre }).run();
		return { success: true };
	},

	renombrarMenu: async ({ request, params }) => {
		const id = Number(params.id);
		if (!Number.isInteger(id)) return fail(404, { error: 'Proyecto no encontrado' });

		const data = await request.formData();
		const menuId = Number(data.get('menuId'));
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!Number.isInteger(menuId)) return fail(400, { error: 'Menú inválido' });
		if (!nombre) return fail(400, { error: 'El nombre del menú no puede estar vacío.' });

		// El menú debe pertenecer a este proyecto.
		const menu = db
			.select()
			.from(menus)
			.where(and(eq(menus.id, menuId), eq(menus.proyectoId, id)))
			.get();
		if (!menu) return fail(404, { error: 'Menú no encontrado' });

		db.update(menus).set({ nombre }).where(eq(menus.id, menuId)).run();
		return { success: true };
	}
};
