const DEVELOPMENT_PASSWORD = "SaboresDev2026!";
const RESTAURANTE_CENTRO_ID = "672000000000000000000001";
const RESTAURANTE_NORTE_ID = "672000000000000000000002";

// Credenciales fijas únicamente para desarrollo local; no usar en producción.
const usuarioData = [
  {
    nombre: "Administración General Demo",
    email: "admin.general@saboresurbanos.dev",
    password: DEVELOPMENT_PASSWORD,
    rol: "Administrador General",
    restaurante: null,
    activo: true,
  },
  {
    nombre: "Administración Local Demo",
    email: "admin.local@saboresurbanos.dev",
    password: DEVELOPMENT_PASSWORD,
    rol: "Administrador de Local",
    restaurante: RESTAURANTE_CENTRO_ID,
    activo: true,
  },
  {
    nombre: "Garzón Demo",
    email: "garzon@saboresurbanos.dev",
    password: DEVELOPMENT_PASSWORD,
    rol: "Garzón",
    restaurante: RESTAURANTE_CENTRO_ID,
    activo: true,
  },
  {
    nombre: "Cocina Demo",
    email: "cocina@saboresurbanos.dev",
    password: DEVELOPMENT_PASSWORD,
    rol: "Cocina",
    restaurante: RESTAURANTE_NORTE_ID,
    activo: true,
  },
];

module.exports = usuarioData;
