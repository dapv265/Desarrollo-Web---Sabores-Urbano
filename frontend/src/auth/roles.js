export const ROLES = {
  ADMIN_GENERAL: "Administrador General",
  ADMIN_LOCAL: "Administrador de Local",
  GARZON: "Garzón",
  COCINA: "Cocina",
};

export const ROLES_MESAS = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
];

export const ROLES_DISPONIBILIDAD = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
];

export const ROLES_RESERVAS = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
];

export const ROLES_MENU = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
  ROLES.COCINA,
];

export const ROLES_PRECIOS = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
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

export const ROLES_RESTAURANTES = [
  ROLES.ADMIN_GENERAL,
];

export const ROLES_USUARIOS = [
  ROLES.ADMIN_GENERAL,
];

export const ROLES_CLIENTES_LECTURA = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
];

export const ROLES_CLIENTES_GESTION = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
];

export const ROLES_REPORTES = [
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
];

const RUTAS_INICIALES_POR_ROL = {
  [ROLES.ADMIN_GENERAL]: "/mesas",
  [ROLES.ADMIN_LOCAL]: "/mesas",
  [ROLES.GARZON]: "/pedidos",
  [ROLES.COCINA]: "/cocina",
};

// Rutas protegidas y los roles autorizados para cada una
export const ROLES_POR_RUTA = {
  "/mesas": ROLES_MESAS,
  "/disponibilidad": ROLES_DISPONIBILIDAD,
  "/reservas": ROLES_RESERVAS,
  "/menu": ROLES_MENU,
  "/precios": ROLES_PRECIOS,
  "/pedidos": ROLES_PEDIDOS,
  "/cocina": ROLES_COCINA,
  "/restaurantes": ROLES_RESTAURANTES,
  "/usuarios": ROLES_USUARIOS,
  "/clientes": ROLES_CLIENTES_LECTURA,
  "/reportes": ROLES_REPORTES,
};

export const MODULOS_SISTEMA = [
  {
    to: "/mesas",
    label: "Mesas",
    descripcion: "Mapa de salón y estado actual de las mesas.",
    roles: ROLES_MESAS,
  },
  {
    to: "/disponibilidad",
    label: "Disponibilidad",
    descripcion: "Consulta de mesas libres por fecha y horario.",
    roles: ROLES_DISPONIBILIDAD,
  },
  {
    to: "/reservas",
    label: "Reservas",
    descripcion: "Calendario y gestión de reservas de clientes.",
    roles: ROLES_RESERVAS,
  },
  {
    to: "/menu",
    label: "Menú",
    descripcion: "Catálogo de platos, categorías y disponibilidad.",
    roles: ROLES_MENU,
  },
  {
    to: "/precios",
    label: "Precios",
    descripcion: "Control de tarifas e historial de cambios de precio.",
    roles: ROLES_PRECIOS,
  },
  {
    to: "/pedidos",
    label: "Pedidos",
    descripcion: "Toma y seguimiento de órdenes en salón.",
    roles: ROLES_PEDIDOS,
  },
  {
    to: "/cocina",
    label: "Cocina",
    descripcion: "Monitor en tiempo real de comandas en preparación.",
    roles: ROLES_COCINA,
  },
  {
    to: "/restaurantes",
    label: "Restaurantes",
    descripcion: "Administración de locales y sucursales.",
    roles: ROLES_RESTAURANTES,
  },
  {
    to: "/usuarios",
    label: "Usuarios",
    descripcion: "Registro, roles y control de acceso del personal.",
    roles: ROLES_USUARIOS,
  },
  {
    to: "/clientes",
    label: "Clientes",
    descripcion: "Directorio y gestión de clientes registrados.",
    roles: ROLES_CLIENTES_LECTURA,
  },
  {
    to: "/reportes",
    label: "Reportes",
    descripcion: "Indicadores operativos y resumen del local.",
    roles: ROLES_REPORTES,
  },
];

export function puedeVisitarRuta(ruta, rol) {
  if (!ruta || !rol) return false;
  return Boolean(ROLES_POR_RUTA[ruta]?.includes(rol));
}

export function obtenerRutaInicial(rol) {
  return RUTAS_INICIALES_POR_ROL[rol] ?? null;
}
