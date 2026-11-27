// Categorías fijas del menú. Producto guarda el número en `categoriaId`
// (lo usan Menú, Precios y Pedidos).
export const CATEGORIAS_MENU = Object.freeze([
  Object.freeze({ id: 1, nombre: 'Entradas' }),
  Object.freeze({ id: 2, nombre: 'Platos principales' }),
  Object.freeze({ id: 3, nombre: 'Bebidas' }),
  Object.freeze({ id: 4, nombre: 'Postres' }),
  Object.freeze({ id: 5, nombre: 'Ensaladas' })
]);

// Ids válidos para validar categoriaId
export const IDS_CATEGORIAS = Object.freeze(CATEGORIAS_MENU.map((categoria) => categoria.id));

// Busca una categoría por id o por nombre (sin distinguir mayúsculas)
export const buscarCategoria = (valor) => {
  const texto = String(valor ?? '').trim().toLowerCase();

  return CATEGORIAS_MENU.find((categoria) =>
    String(categoria.id) === texto || categoria.nombre.toLowerCase() === texto
  ) ?? null;
};
