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

export const ROLES_CLIENTES_GESTION = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
];

const RUTAS_INICIALES_POR_ROL = {
  [ROLES.ADMIN_GENERAL]: "/mesas",
  [ROLES.ADMIN_LOCAL]: "/mesas",
  [ROLES.GARZON]: "/reservas",
  [ROLES.COCINA]: "/cocina",
};

export function obtenerRutaInicial(rol) {
  return RUTAS_INICIALES_POR_ROL[rol] ?? null;
}
