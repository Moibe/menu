import { fail } from '@sveltejs/kit';
import { eq, inArray, desc } from 'drizzle-orm';
import { db } from '$lib/server/db';
import { productos, menus, negocios } from '$lib/server/db/schema';
import { requireAdmin, memberNegocioIds } from '$lib/server/access';
import type { Actions, PageServerLoad } from './$types';

// Todos los productos que el usuario puede ver (admins: todos; usuarios normales:
// solo los de sus negocios asignados), con su menú y negocio.
export const load: PageServerLoad = async ({ locals }) => {
	const user = locals.user!;
	let scope;
	if (!user.isAdmin) {
		const ids = memberNegocioIds(user.id);
		if (ids.length === 0) return { productos: [] };
		scope = inArray(negocios.id, ids);
	}

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
		.where(scope)
		.orderBy(desc(productos.creadoEn))
		.all();

	return { productos: lista };
};

export const actions: Actions = {
	renombrarProducto: async ({ request, locals }) => {
		requireAdmin(locals.user);
		const data = await request.formData();
		const productoId = Number(data.get('productoId'));
		const nombre = String(data.get('nombre') ?? '').trim();
		if (!Number.isInteger(productoId)) return fail(400, { error: 'Producto inválido' });
		if (!nombre) return fail(400, { error: 'El nombre del producto no puede estar vacío.' });

		const row = db.select({ id: productos.id }).from(productos).where(eq(productos.id, productoId)).get();
		if (!row) return fail(404, { error: 'Producto no encontrado' });

		db.update(productos).set({ nombre }).where(eq(productos.id, productoId)).run();
		return { success: true };
	}
};
