import { matchedData } from 'express-validator';

import { Restaurante } from '../models/Restaurante.js';

function escaparRegex(valor) {
  return valor.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

export async function listarRestaurantes(req, res) {
  const filtros = {};
  const { estado, buscar } = req.query;

  if (estado) {
    filtros.estado = estado;
  }

  if (typeof buscar === 'string' && buscar.trim() !== '') {
    const patron = new RegExp(escaparRegex(buscar.trim()), 'i');
    filtros.$or = [
      { codigo: patron },
      { nombre: patron },
      { direccion: patron },
    ];
  }

  const restaurantes = await Restaurante.find(filtros).sort({ codigo: 1 });

  return res.status(200).json({
    success: true,
    total: restaurantes.length,
    data: restaurantes,
  });
}

export async function obtenerRestaurantePorId(req, res) {
  const restaurante = await Restaurante.findById(req.params.id);

  if (!restaurante) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el restaurante solicitado.',
    });
  }

  return res.status(200).json({
    success: true,
    data: restaurante,
  });
}

export async function obtenerRestaurantePorCodigo(req, res) {
  const restaurante = await Restaurante.findOne({
    codigo: req.params.codigo,
  });

  if (!restaurante) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el restaurante solicitado.',
    });
  }

  return res.status(200).json({
    success: true,
    data: restaurante,
  });
}

export async function crearRestaurante(req, res) {
  const data = matchedData(req, { locations: ['body'] });
  const restaurante = new Restaurante(data);

  await restaurante.save();

  return res.status(201).json({
    success: true,
    message: 'Restaurante creado correctamente.',
    data: restaurante,
  });
}

export async function actualizarRestaurante(req, res) {
  const data = matchedData(req, { locations: ['body'] });

  if (Object.keys(data).length === 0) {
    return res.status(400).json({
      success: false,
      message: 'Indica al menos un campo válido para actualizar.',
    });
  }

  const restaurante = await Restaurante.findById(req.params.id);

  if (!restaurante) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el restaurante solicitado.',
    });
  }

  Object.assign(restaurante, data);
  await restaurante.save();

  return res.status(200).json({
    success: true,
    message: 'Restaurante actualizado correctamente.',
    data: restaurante,
  });
}

export async function cambiarEstadoRestaurante(req, res) {
  const { estado } = req.body;

  const restaurante = await Restaurante.findByIdAndUpdate(
    req.params.id,
    { estado },
    { returnDocument: 'after', runValidators: true },
  );

  if (!restaurante) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el restaurante solicitado.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Estado del restaurante actualizado correctamente.',
    data: restaurante,
  });
}

export async function eliminarRestaurante(req, res) {
  const restaurante = await Restaurante.findByIdAndDelete(req.params.id);

  if (!restaurante) {
    return res.status(404).json({
      success: false,
      message: 'No se encontró el restaurante solicitado.',
    });
  }

  return res.status(200).json({
    success: true,
    message: 'Restaurante eliminado correctamente.',
    data: restaurante,
  });
}
