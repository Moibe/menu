import { fail } from '@sveltejs/kit';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { usuarios, negocios } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

// Por ahora el dueño de todo es el usuario 'default'. Lo creamos la primera vez
// que haga falta y reutilizamos su id en cada request.
function getDefaultUserId(): number {
	const existente = db.select().from(usuarios).where(eq(usuarios.email, 'default')).get();
	if (existente) return existente.id;
	const creado = db
		.insert(usuarios)
		.values({ email: 'default', nombre: 'default' })
		.returning()
		.get();
	return creado.id;
}

export const load: PageServerLoad = async () => {
	const usuarioId = getDefaultUserId();
	const lista = db
		.select()
		.from(negocios)
		.where(eq(negocios.usuarioId, usuarioId))
		.orderBy(desc(negocios.creadoEn))
		.all();
	return { negocios: lista };
};

export const actions: Actions = {
	crear: async ({ request }) => {
		const data = await request.formData();
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!nombre) {
			return fail(400, { error: 'El nombre del negocio no puede estar vacío.' });
		}
		const usuarioId = getDefaultUserId();
		db.insert(negocios).values({ usuarioId, nombre }).run();
		return { success: true };
	},

	renombrarNegocio: async ({ request }) => {
		const data = await request.formData();
		const negocioId = Number(data.get('negocioId'));
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!Number.isInteger(negocioId)) return fail(400, { error: 'Negocio inválido' });
		if (!nombre) return fail(400, { error: 'El nombre del negocio no puede estar vacío.' });

		// El negocio debe ser del usuario 'default'.
		const usuarioId = getDefaultUserId();
		const negocio = db
			.select()
			.from(negocios)
			.where(and(eq(negocios.id, negocioId), eq(negocios.usuarioId, usuarioId)))
			.get();
		if (!negocio) return fail(404, { error: 'Negocio no encontrado' });

		db.update(negocios).set({ nombre }).where(eq(negocios.id, negocioId)).run();
		return { success: true };
	}
};
