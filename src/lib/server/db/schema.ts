import { sqliteTable, integer, text, real, index } from 'drizzle-orm/sqlite-core';
import { relations } from 'drizzle-orm';

// Jerarquía del dominio (uno-a-muchos en cascada):
//   usuario ──< negocio ──< menú ──< producto
// Borrar un padre arrastra a todos sus hijos (onDelete: 'cascade').

// Helper: timestamp de creación por defecto = ahora.
const creadoEn = () =>
	integer('creado_en', { mode: 'timestamp' })
		.notNull()
		.$defaultFn(() => new Date());

// 1 usuario tiene varios negocios.
export const usuarios = sqliteTable('usuarios', {
	id: integer('id').primaryKey({ autoIncrement: true }),
	email: text('email').notNull().unique(),
	nombre: text('nombre'),
	creadoEn: creadoEn()
});

// 1 negocio pertenece a un usuario y tiene varios menús.
export const negocios = sqliteTable(
	'negocios',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		usuarioId: integer('usuario_id')
			.notNull()
			.references(() => usuarios.id, { onDelete: 'cascade' }),
		nombre: text('nombre').notNull(),
		descripcion: text('descripcion'),
		creadoEn: creadoEn()
	},
	(t) => [index('negocios_usuario_idx').on(t.usuarioId)]
);

// 1 menú pertenece a un negocio y tiene varios productos.
export const menus = sqliteTable(
	'menus',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		negocioId: integer('negocio_id')
			.notNull()
			.references(() => negocios.id, { onDelete: 'cascade' }),
		nombre: text('nombre').notNull(),
		// Para ordenar los menús dentro del negocio.
		orden: integer('orden').notNull().default(0),
		activo: integer('activo', { mode: 'boolean' }).notNull().default(true),
		creadoEn: creadoEn()
	},
	(t) => [index('menus_negocio_idx').on(t.negocioId)]
);

// 1 producto pertenece a un menú.
export const productos = sqliteTable(
	'productos',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		menuId: integer('menu_id')
			.notNull()
			.references(() => menus.id, { onDelete: 'cascade' }),
		nombre: text('nombre').notNull(),
		descripcion: text('descripcion'),
		precio: real('precio'),
		// Foto principal: URL/ruta. Local hoy (/uploads/…), CDN a futuro (mismo campo).
		fotoPrincipal: text('foto_principal'),
		// Para ordenar los productos dentro del menú.
		orden: integer('orden').notNull().default(0),
		disponible: integer('disponible', { mode: 'boolean' }).notNull().default(true),
		creadoEn: creadoEn()
	},
	(t) => [index('productos_menu_idx').on(t.menuId)]
);

// Fotos adicionales de un producto (además de la principal). Cada una es una
// URL/ruta igual que fotoPrincipal (local hoy, CDN a futuro).
export const productoFotos = sqliteTable(
	'producto_fotos',
	{
		id: integer('id').primaryKey({ autoIncrement: true }),
		productoId: integer('producto_id')
			.notNull()
			.references(() => productos.id, { onDelete: 'cascade' }),
		url: text('url').notNull(),
		orden: integer('orden').notNull().default(0)
	},
	(t) => [index('producto_fotos_producto_idx').on(t.productoId)]
);

// Relaciones para la API de consultas de drizzle (db.query.*.findMany({ with: {...} })).
export const usuariosRelations = relations(usuarios, ({ many }) => ({
	negocios: many(negocios)
}));

export const negociosRelations = relations(negocios, ({ one, many }) => ({
	usuario: one(usuarios, { fields: [negocios.usuarioId], references: [usuarios.id] }),
	menus: many(menus)
}));

export const menusRelations = relations(menus, ({ one, many }) => ({
	negocio: one(negocios, { fields: [menus.negocioId], references: [negocios.id] }),
	productos: many(productos)
}));

export const productosRelations = relations(productos, ({ one, many }) => ({
	menu: one(menus, { fields: [productos.menuId], references: [menus.id] }),
	fotos: many(productoFotos)
}));

export const productoFotosRelations = relations(productoFotos, ({ one }) => ({
	producto: one(productos, { fields: [productoFotos.productoId], references: [productos.id] })
}));
