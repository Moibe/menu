import { fail } from '@sveltejs/kit';
import { and, eq, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { productos, menus, negocios, usuarios } from '$lib/server/db/schema';
import type { Actions, PageServerLoad } from './$types';

export const load: PageServerLoad = async () => {
	// Todos los productos del usuario 'default', con su menú y negocio.
	const lista = db
		.select({
			id: productos.id,
			nombre: productos.nombre,
			precio: productos.precio,
			fotoPrincipal: productos.fotoPrincipal,
			menuId: productos.menuId,
			menuNombre: menus.nombre,
			negocioNombre: negocios.nombre
		})
		.from(productos)
		.innerJoin(menus, eq(productos.menuId, menus.id))
		.innerJoin(negocios, eq(menus.negocioId, negocios.id))
		.innerJoin(usuarios, eq(negocios.usuarioId, usuarios.id))
		.where(eq(usuarios.email, 'default'))
		.orderBy(desc(productos.creadoEn))
		.all();

	return { productos: lista };
};

export const actions: Actions = {
	renombrarProducto: async ({ request }) => {
		const data = await request.formData();
		const productoId = Number(data.get('productoId'));
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!Number.isInteger(productoId)) return fail(400, { error: 'Producto inválido' });
		if (!nombre) return fail(400, { error: 'El nombre del producto no puede estar vacío.' });

		// El producto debe pertenecer a un menú de un negocio del usuario 'default'.
		const row = db
			.select({ id: productos.id })
			.from(productos)
			.innerJoin(menus, eq(productos.menuId, menus.id))
			.innerJoin(negocios, eq(menus.negocioId, negocios.id))
			.innerJoin(usuarios, eq(negocios.usuarioId, usuarios.id))
			.where(and(eq(productos.id, productoId), eq(usuarios.email, 'default')))
			.get();
		if (!row) return fail(404, { error: 'Producto no encontrado' });

		db.update(productos).set({ nombre }).where(eq(productos.id, productoId)).run();
		return { success: true };
	}
};
