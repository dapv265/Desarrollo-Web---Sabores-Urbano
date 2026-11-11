const jwt = require("jsonwebtoken");
const { matchedData } = require("express-validator");

const { getJwtConfig } = require("../config/jwt");
const { ROLES, ROLES_LOCALES } = require("../constants/roles");
const Restaurante = require("../models/Restaurante");
const Usuario = require("../models/Usuario");

function usuarioPublico(usuario) {
  return {
    id: usuario._id,
    nombre: usuario.nombre,
    email: usuario.email,
    rol: usuario.rol,
    restaurante: usuario.restaurante || null,
    activo: usuario.activo,
    createdAt: usuario.createdAt,
    updatedAt: usuario.updatedAt,
  };
}

async function login(req, res) {
  const { email, password } = matchedData(req, { locations: ["body"] });
  const usuario = await Usuario.findOne({
    email: email.toLowerCase(),
    activo: true,
  }).select("+password");

  if (!usuario || !(await usuario.compararPassword(password))) {
    return res.status(401).json({
      success: false,
      message: "Correo electrónico o contraseña incorrectos.",
    });
  }

  const { secret, expiresIn } = getJwtConfig();
  const token = jwt.sign(
    {
      rol: usuario.rol,
      restaurante: usuario.restaurante ? String(usuario.restaurante) : null,
    },
    secret,
    {
      algorithm: "HS256",
      subject: String(usuario._id),
      expiresIn,
    },
  );

  return res.status(200).json({
    success: true,
    data: {
      token,
      usuario: usuarioPublico(usuario),
    },
  });
}

async function register(req, res) {
  const data = matchedData(req, { locations: ["body"] });
  let restaurante = null;

  if (ROLES_LOCALES.includes(data.rol)) {
    restaurante = await Restaurante.findOne({
      _id: data.restaurante,
      activo: true,
    }).select("_id");

    if (!restaurante) {
      return res.status(400).json({
        success: false,
        message: "El restaurante indicado no existe o está inactivo.",
      });
    }
  }

  const usuario = new Usuario({
    nombre: data.nombre,
    email: data.email,
    password: data.password,
    rol: data.rol,
    restaurante:
      data.rol === ROLES.ADMIN_GENERAL ? null : restaurante._id,
    activo: true,
  });

  await usuario.save();

  return res.status(201).json({
    success: true,
    data: { usuario: usuarioPublico(usuario) },
  });
}

function perfil(req, res) {
  return res.status(200).json({
    success: true,
    data: { usuario: usuarioPublico(req.user) },
  });
}

module.exports = { login, register, perfil };
