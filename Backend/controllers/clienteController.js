import { matchedData } from 'express-validator';

import {
  ROLES,
  ROLES_CONSULTA_CLIENTES,
  ROLES_GESTION_CLIENTES,
} from '../constants/roles.js';
import { Cliente } from '../models/Cliente.js';
import { Restaurante } from '../models/Restaurante.js';

function respuestaNoPermitida(res) {
  return res.status(403).json({
    success: false,
    message: 'No tienes permisos para gestionar clientes de otro restaurante.',
  });
}

function alcanceRestaurante(usuario) {
  if (usuario.rol === ROLES.ADMIN_GENERAL) {
    return {};
  }

  if (
    ROLES_CONSULTA_CLIENTES.includes(usuario.rol) &&
    usuario.restaurante
  ) {
    return { restaurante: usuario.restaurante._id || usuario.restaurante };
  }

  return null;
}

function puedeGestionarClientes(usuario) {
  return ROLES_GESTION_CLIENTES.includes(usuario.rol);
}

function restauranteEnviado(data) {
  return Object.prototype.hasOwnProperty.call(data, 'restaurante');
}

async function validarRestauranteGlobal(res, restauranteId) {
  if (restauranteId === null || restauranteId === undefined) {
    return null;
  }

  const restaurante = await Restaurante.findOne({
    _id: restauranteId,
    estado: { $ne: 'Cerrado' },
  }).select('_id');

  if (!restaurante) {
    res.status(400).json({
      success: false,
      message: 'El restaurante indicado no existe o está cerrado.',
    });
    return undefined;
  }

  return restaurante._id;
}

export async function listar(req, res) {
  const alcance = alcanceRestaurante(req.user);
  if (!alcance) {
    return respuestaNoPermitida(res);
  }

  const clientes = await Cliente.find(alcance).sort({ id: 1 });
  return res.status(200).json({ success: true, data: clientes });
}

export async function obtenerPorId(req, res) {
  const alcance = alcanceRestaurante(req.user);
  if (!alcance) {
    return respuestaNoPermitida(res);
  }

  const cliente = await Cliente.findOne({
    id: Number(req.params.id),
    ...alcance,
  });

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el cliente solicitado.',
    });
  }

  return res.status(200).json({ success: true, data: cliente });
}

export async function crear(req, res) {
  if (!puedeGestionarClientes(req.user)) {
    return respuestaNoPermitida(res);
  }

  const data = matchedData(req, { locations: ['body'] });
  let restauranteId = null;

  if (req.user.rol === ROLES.ADMIN_GENERAL) {
    if (restauranteEnviado(data)) {
      restauranteId = await validarRestauranteGlobal(res, data.restaurante);
      if (res.headersSent) {
        return;
      }
    }
  } else {
    if (restauranteEnviado(data) || !req.user.restaurante) {
      return respuestaNoPermitida(res);
    }

    restauranteId = req.user.restaurante._id || req.user.restaurante;
  }

  const ultimoCliente = await Cliente.findOne().sort({ id: -1 }).select('id');
  const cliente = new Cliente({
    ...data,
    id: (ultimoCliente?.id || 0) + 1,
    restaurante: restauranteId,
  });

  await cliente.save();

  return res.status(201).json({ success: true, data: cliente });
}

export async function actualizar(req, res) {
  if (!puedeGestionarClientes(req.user)) {
    return respuestaNoPermitida(res);
  }

  const data = matchedData(req, { locations: ['body'] });
  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Indica al menos un campo válido para actualizar.',
    });
  }

  const alcance = alcanceRestaurante(req.user);
  if (!alcance) {
    return respuestaNoPermitida(res);
  }

  if (req.user.rol !== ROLES.ADMIN_GENERAL && restauranteEnviado(data)) {
    return respuestaNoPermitida(res);
  }

  const cliente = await Cliente.findOne({
    id: Number(req.params.id),
    ...alcance,
  });

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el cliente solicitado.',
    });
  }

  if (
    req.user.rol === ROLES.ADMIN_GENERAL &&
    restauranteEnviado(data)
  ) {
    const restauranteId = await validarRestauranteGlobal(
      res,
      data.restaurante,
    );
    if (res.headersSent) {
      return;
    }
    data.restaurante = restauranteId;
  }

  Object.assign(cliente, data);
  await cliente.save();

  return res.status(200).json({ success: true, data: cliente });
}

export async function eliminar(req, res) {
  if (!puedeGestionarClientes(req.user)) {
    return respuestaNoPermitida(res);
  }

  const alcance = alcanceRestaurante(req.user);
  if (!alcance) {
    return respuestaNoPermitida(res);
  }

  const cliente = await Cliente.findOne({
    id: Number(req.params.id),
    ...alcance,
  });

  if (!cliente) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el cliente solicitado.',
    });
  }

  cliente.activo = false;
  cliente.estado = 'Inactivo';
  await cliente.save();

  return res.status(200).json({ success: true, data: cliente });
}
