export const ROLES = Object.freeze({
  ADMIN_GENERAL: 'Administrador General',
  ADMIN_LOCAL: 'Administrador de Local',
  GARZON: 'Garzón',
  COCINA: 'Cocina',
});

export const ROLES_LOCALES = Object.freeze([
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
  ROLES.COCINA,
]);

export const ROLES_CONSULTA_CLIENTES = Object.freeze([
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
]);

export const ROLES_GESTION_CLIENTES = Object.freeze([
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
]);
