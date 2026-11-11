const ROLES = Object.freeze({
  ADMIN_GENERAL: "Administrador General",
  ADMIN_LOCAL: "Administrador de Local",
  GARZON: "Garzón",
  COCINA: "Cocina",
});

const ROLES_LOCALES = Object.freeze([
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
  ROLES.COCINA,
]);

const ROLES_CONSULTA_CLIENTES = Object.freeze([
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
  ROLES.GARZON,
]);

const ROLES_GESTION_CLIENTES = Object.freeze([
  ROLES.ADMIN_GENERAL,
  ROLES.ADMIN_LOCAL,
]);

module.exports = {
  ROLES,
  ROLES_LOCALES,
  ROLES_CONSULTA_CLIENTES,
  ROLES_GESTION_CLIENTES,
};
