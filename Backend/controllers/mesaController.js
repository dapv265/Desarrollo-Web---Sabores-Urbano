
import { Mesa } from '../models/Mesa.js';

// RF3: Obtener todas las mesas para el mapa
export const obtenerMesas = async (req, res) => {
  try {
    const mesas = await Mesa.find().sort({ numero: 1 });

    res.status(200).json(mesas);
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al obtener las mesas',
      error: error.message
    });
  }
};

// RF5: Consultar disponibilidad de mesas
export const obtenerDisponibilidad = async (req, res) => {
  try {
    const { zona, capacidad } = req.query;

    const filtros = {
      estado: 'disponible'
    };

    if (zona) {
      filtros.zona = zona;
    }

    if (capacidad) {
      const capacidadMinima = Number(capacidad);

      if (!Number.isInteger(capacidadMinima) || capacidadMinima < 1) {
        return res.status(400).json({
          mensaje: 'La capacidad debe ser un número entero positivo'
        });
      }

      filtros.capacidad = { $gte: capacidadMinima };
    }

    const mesas = await Mesa.find(filtros).sort({ numero: 1 });

    res.status(200).json({
      total: mesas.length,
      mesas
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al consultar disponibilidad',
      error: error.message
    });
  }
};

// RF3: Cambiar el estado de una mesa
export const actualizarEstadoMesa = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    const estadosPermitidos = [
      'disponible',
      'reservada',
      'ocupada',
      'limpieza',
      'fuera'
    ];

    if (!estadosPermitidos.includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado de mesa no válido'
      });
    }

    const mesa = await Mesa.findOneAndUpdate(
      { id },
      { estado },
      { new: true, runValidators: true }
    );

    if (!mesa) {
      return res.status(404).json({
        mensaje: 'Mesa no encontrada'
      });
    }

    res.status(200).json({
      mensaje: 'Estado actualizado correctamente',
      mesa
    });
  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al actualizar la mesa',
      error: error.message
    });
  }
};
