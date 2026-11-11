const mongoose = require("mongoose");

const connectDB = require("../config/db");
const Cliente = require("../models/Cliente");
const Usuario = require("../models/Usuario");
const Restaurante = require("../models/Restaurante");
const clienteData = require("../../../data/clienteData");
const usuarioData = require("../../../data/usuarioData");
const restauranteData = require("../../../data/restauranteData");

const CLIENTE_RESTAURANTE_POR_ID = {
  1: "LOC-DEV-01",
  2: "LOC-DEV-02",
  3: "LOC-DEV-03",
  4: "LOC-DEV-01",
  5: "LOC-DEV-02",
};

const USUARIO_RESTAURANTE_POR_EMAIL = {
  "admin.local@saboresurbanos.dev": "LOC-DEV-01",
  "garzon@saboresurbanos.dev": "LOC-DEV-01",
  "cocina@saboresurbanos.dev": "LOC-DEV-02",
};

const ROLES_QUE_REQUIEREN_RESTAURANTE = new Set([
  "Administrador de Local",
  "Garzón",
  "Cocina",
]);

const restaurantesPorCodigo = new Map(
  restauranteData.map((restaurante) => [restaurante.codigo, restaurante._id]),
);

function obtenerIdRestaurante(codigo) {
  const restauranteId = restaurantesPorCodigo.get(codigo);
  if (!restauranteId) {
    throw new Error(`No existe el restaurante configurado con código ${codigo}.`);
  }

  return restauranteId;
}

const clientesParaSeed = clienteData.map((cliente) => {
  const codigoRestaurante = CLIENTE_RESTAURANTE_POR_ID[cliente.id];
  if (!codigoRestaurante) {
    throw new Error(`Falta asignar un restaurante al cliente con id ${cliente.id}.`);
  }

  return {
    ...cliente,
    restaurante: obtenerIdRestaurante(codigoRestaurante),
  };
});

const usuariosParaSeed = usuarioData.map((usuario) => {
  const codigoRestaurante = USUARIO_RESTAURANTE_POR_EMAIL[usuario.email];

  if (ROLES_QUE_REQUIEREN_RESTAURANTE.has(usuario.rol) && !codigoRestaurante) {
    throw new Error(`Falta asignar un restaurante al usuario ${usuario.email}.`);
  }

  if (!ROLES_QUE_REQUIEREN_RESTAURANTE.has(usuario.rol) && codigoRestaurante) {
    throw new Error(`El usuario ${usuario.email} no debe tener un restaurante asignado.`);
  }

  const restauranteId = codigoRestaurante
    ? obtenerIdRestaurante(codigoRestaurante)
    : null;

  if (
    usuario.restaurante &&
    String(usuario.restaurante) !== String(restauranteId)
  ) {
    throw new Error(
      `El restaurante del usuario ${usuario.email} no coincide con su mapeo.`,
    );
  }

  return {
    ...usuario,
    restaurante: restauranteId,
  };
});

async function guardarDocumentos(Model, registros) {
  for (const registro of registros) {
    await new Model(registro).save();
  }
}

async function seed() {
  await connectDB();

  try {
    await Usuario.deleteMany({});
    await Cliente.deleteMany({});
    await Restaurante.deleteMany({});

    await guardarDocumentos(Restaurante, restauranteData);
    await guardarDocumentos(Cliente, clientesParaSeed);
    await guardarDocumentos(Usuario, usuariosParaSeed);

    console.log(
      `Seed completado: ${restauranteData.length} restaurantes, ` +
        `${clientesParaSeed.length} clientes y ${usuariosParaSeed.length} usuarios.`,
    );
  } finally {
    await mongoose.disconnect();
  }
}

seed().catch((error) => {
  console.error("Error al ejecutar el seed:", error);
  process.exitCode = 1;
});
