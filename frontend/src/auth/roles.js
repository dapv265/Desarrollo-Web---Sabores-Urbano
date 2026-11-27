export const ROLES = {
  ADMIN_GENERAL: "Administrador General",
  ADMIN_LOCAL: "Administrador de Local",
  GARZON: "Garzón",
  COCINA: "Cocina",
};

export const ROLES_CLIENTES_LECTURA = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
];

// RF9 y RF10: abrir pedidos y agregar productos (salón)
export const ROLES_PEDIDOS = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
];

// RF11: monitor de cocina
export const ROLES_COCINA = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.COCINA,
];

export const ROLES_CLIENTES_GESTION = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
];

const RUTAS_INICIALES_POR_ROL = {
  [ROLES.ADMIN_GENERAL]: "/mesas",
  [ROLES.ADMIN_LOCAL]: "/mesas",
  [ROLES.GARZON]: "/pedidos",
  [ROLES.COCINA]: "/cocina",
};

// Rutas protegidas a las que se puede volver después de iniciar sesión
const ROLES_POR_RUTA = {
  "/clientes": ROLES_CLIENTES_LECTURA,
  "/pedidos": ROLES_PEDIDOS,
  "/cocina": ROLES_COCINA,
};

export function puedeVisitarRuta(ruta, rol) {
  return Boolean(ROLES_POR_RUTA[ruta]?.includes(rol));
}

export function obtenerRutaInicial(rol) {
  return RUTAS_INICIALES_POR_ROL[rol] ?? null;
}
