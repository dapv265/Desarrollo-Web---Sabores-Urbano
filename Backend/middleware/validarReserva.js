
import { ESTADOS_RESERVA } from '../models/Reserva.js';

// Valida que el :id de la URL sea un ObjectId de MongoDB
export const validarIdReserva = (req, res, next) => {
  const { id } = req.params;

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return res.status(400).json({
      mensaje: 'Formato de ID de reserva no válido'
    });
  }

  next();
};

// Valida que el estado enviado en el body sea uno de los permitidos
export const validarEstadoReserva = (req, res, next) => {
  const { estado } = req.body ?? {};

  if (!ESTADOS_RESERVA.includes(estado)) {
    return res.status(400).json({
      mensaje: 'Estado de reserva no válido',
      estadosPermitidos: ESTADOS_RESERVA
    });
  }

  next();
};
