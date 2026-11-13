
import { Reserva, ESTADOS_RESERVA } from '../models/Reserva.js';
import { Mesa } from '../models/Mesa.js';
import {
  HORARIOS_PERMITIDOS,
  REGEX_HORA,
  REGEX_HORA_FIN,
  calcularHoraFinal,
  convertirHoraAMinutos,
  esFechaValida,
  hayCruceDeHorario
} from '../utils/horarios.js';

// Campos que se aceptan desde el body al crear o editar
const CAMPOS_RESERVA = [
  'clienteRut',
  'cliente',
  'telefono',
  'personas',
  'fecha',
  'inicio',
  'fin',
  'mesa',
  'observaciones',
  'estado'
];

// Toma del body solo los campos que pertenecen a una reserva
const tomarCamposReserva = (body) => {
  const datos = {};

  for (const campo of CAMPOS_RESERVA) {
    if (body[campo] !== undefined) {
      datos[campo] = body[campo];
    }
  }

  return datos;
};

// Revisa que la duración (en minutos) sea un entero mayor a 0
const esDuracionValida = (duracion) => {
  const minutos = Number(duracion);

  return Number.isInteger(minutos) && minutos > 0;
};

// Datos básicos de una reserva para informar un conflicto
const resumirReserva = (reserva) => ({
  _id: reserva._id,
  cliente: reserva.cliente,
  clienteRut: reserva.clienteRut,
  mesa: reserva.mesa,
  fecha: reserva.fecha,
  inicio: reserva.inicio,
  fin: reserva.fin,
  estado: reserva.estado
});

// Busca una reserva no cancelada de la misma mesa y fecha que se cruce en horario
const buscarConflicto = async ({ mesa, fecha, inicio, fin, excluirId }) => {
  const filtros = {
    mesa,
    fecha,
    estado: { $ne: 'cancelada' }
  };

  if (excluirId) {
    filtros._id = { $ne: excluirId };
  }

  const reservas = await Reserva.find(filtros).sort({ inicio: 1 });

  return reservas.find((reserva) =>
    hayCruceDeHorario(inicio, fin, reserva.inicio, reserva.fin)
  ) ?? null;
};

// Reglas de negocio al crear, editar o reactivar una reserva.
// Devuelve null si todo está bien, o { status, cuerpo } con el error.
const validarReglasReserva = async (reserva) => {
  // a) La hora de inicio debe estar en los horarios del restaurante
  if (!HORARIOS_PERMITIDOS.includes(reserva.inicio)) {
    return {
      status: 400,
      cuerpo: {
        mensaje: `La hora de inicio ${reserva.inicio} no está dentro de los horarios permitidos`,
        horariosPermitidos: HORARIOS_PERMITIDOS
      }
    };
  }

  // b) La mesa debe existir y no estar fuera de servicio
  const mesa = await Mesa.findOne({ id: reserva.mesa });

  if (!mesa) {
    return {
      status: 404,
      cuerpo: { mensaje: `La mesa ${reserva.mesa} no existe` }
    };
  }

  if (mesa.estado === 'fuera') {
    return {
      status: 400,
      cuerpo: { mensaje: `La mesa ${mesa.id} está fuera de servicio` }
    };
  }

  // c) Las personas no pueden superar la capacidad de la mesa
  if (reserva.personas > mesa.capacidad) {
    return {
      status: 400,
      cuerpo: {
        mensaje: `La mesa ${mesa.id} tiene capacidad para ${mesa.capacidad} personas y la reserva es para ${reserva.personas}`
      }
    };
  }

  // d) No puede cruzarse con otra reserva activa de la misma mesa y fecha
  const conflicto = await buscarConflicto({
    mesa: reserva.mesa,
    fecha: reserva.fecha,
    inicio: reserva.inicio,
    fin: reserva.fin,
    excluirId: reserva._id
  });

  if (conflicto) {
    return {
      status: 409,
      cuerpo: {
        mensaje: `La mesa ${reserva.mesa} ya está reservada el ${reserva.fecha} de ${conflicto.inicio} a ${conflicto.fin} (${conflicto.cliente})`,
        conflicto: resumirReserva(conflicto)
      }
    };
  }

  return null;
};

// Convierte los errores de Mongoose y MongoDB en respuestas JSON
const responderError = (res, error, mensaje) => {
  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: 'Datos de la reserva no válidos',
      errores: Object.values(error.errors).map((detalle) =>
        detalle.name === 'CastError'
          ? `El campo ${detalle.path} tiene un valor no válido`
          : detalle.message
      )
    });
  }

  if (error.code === 11000) {
    return res.status(409).json({
      mensaje: 'Ya existe una reserva activa para esa mesa, fecha y hora de inicio'
    });
  }

  res.status(500).json({
    mensaje,
    error: error.message
  });
};

// GET /api/reservas
// Lista las reservas. Filtros opcionales: ?fecha=AAAA-MM-DD, ?estado, ?mesa, ?clienteRut
export const obtenerReservas = async (req, res) => {
  try {
    const { fecha, estado, mesa, clienteRut } = req.query;

    const filtros = {};

    if (fecha) {
      if (!esFechaValida(fecha)) {
        return res.status(400).json({
          mensaje: 'La fecha debe ser una fecha real con formato AAAA-MM-DD'
        });
      }

      filtros.fecha = fecha;
    }

    if (estado) {
      if (!ESTADOS_RESERVA.includes(estado)) {
        return res.status(400).json({
          mensaje: 'Estado de reserva no válido',
          estadosPermitidos: ESTADOS_RESERVA
        });
      }

      filtros.estado = estado;
    }

    if (mesa) {
      filtros.mesa = String(mesa).trim().toUpperCase();
    }

    if (clienteRut) {
      filtros.clienteRut = String(clienteRut).trim().toUpperCase();
    }

    const reservas = await Reserva.find(filtros).sort({ fecha: 1, inicio: 1 });

    res.status(200).json({
      total: reservas.length,
      reservas
    });
  } catch (error) {
    responderError(res, error, 'Error al obtener las reservas');
  }
};

// GET /api/reservas/:id
// Obtiene una reserva por su ID
export const obtenerReservaPorId = async (req, res) => {
  try {
    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    res.status(200).json(reserva);
  } catch (error) {
    responderError(res, error, 'Error al obtener la reserva');
  }
};

// GET /api/reservas/disponibilidad?fecha&inicio&duracion&mesa (o fin en vez de duracion)
// Igual que el botón "Comprobar disponibilidad" del modal del frontend
export const comprobarDisponibilidad = async (req, res) => {
  try {
    const { fecha, inicio, duracion, fin, mesa, personas } = req.query;

    if (!fecha || !inicio || !mesa || (!duracion && !fin)) {
      return res.status(400).json({
        mensaje: 'Complete fecha, inicio, mesa y duracion (o fin) para comprobar disponibilidad'
      });
    }

    if (!esFechaValida(fecha)) {
      return res.status(400).json({
        mensaje: 'La fecha debe ser una fecha real con formato AAAA-MM-DD'
      });
    }

    if (!HORARIOS_PERMITIDOS.includes(inicio)) {
      return res.status(400).json({
        mensaje: `La hora de inicio ${inicio} no está dentro de los horarios permitidos`,
        horariosPermitidos: HORARIOS_PERMITIDOS
      });
    }

    let horaFin = fin;

    if (duracion) {
      if (!esDuracionValida(duracion)) {
        return res.status(400).json({
          mensaje: 'La duración debe ser un número entero de minutos mayor a 0'
        });
      }

      horaFin = calcularHoraFinal(inicio, duracion);
    }

    if (
      !REGEX_HORA_FIN.test(horaFin) ||
      convertirHoraAMinutos(horaFin) <= convertirHoraAMinutos(inicio)
    ) {
      return res.status(400).json({
        mensaje: 'La hora de fin debe tener el formato HH:mm y ser posterior a la hora de inicio'
      });
    }

    const codigoMesa = String(mesa).trim().toUpperCase();
    const mesaEncontrada = await Mesa.findOne({ id: codigoMesa });

    if (!mesaEncontrada) {
      return res.status(404).json({
        mensaje: `La mesa ${codigoMesa} no existe`
      });
    }

    if (mesaEncontrada.estado === 'fuera') {
      return res.status(200).json({
        disponible: false,
        mensaje: `Mesa ${codigoMesa} fuera de servicio.`,
        conflicto: null
      });
    }

    if (personas !== undefined) {
      const cantidad = Number(personas);

      if (!Number.isInteger(cantidad) || cantidad < 1) {
        return res.status(400).json({
          mensaje: 'La cantidad de personas debe ser un número entero positivo'
        });
      }

      if (cantidad > mesaEncontrada.capacidad) {
        return res.status(200).json({
          disponible: false,
          mensaje: `Mesa ${codigoMesa} tiene capacidad para ${mesaEncontrada.capacidad} personas.`,
          conflicto: null
        });
      }
    }

    const conflicto = await buscarConflicto({
      mesa: codigoMesa,
      fecha,
      inicio,
      fin: horaFin
    });

    if (conflicto) {
      return res.status(200).json({
        disponible: false,
        mensaje: `Mesa ${codigoMesa} no disponible entre ${inicio} y ${horaFin}.`,
        conflicto: resumirReserva(conflicto)
      });
    }

    res.status(200).json({
      disponible: true,
      mensaje: `Mesa ${codigoMesa} disponible entre ${inicio} y ${horaFin}.`,
      conflicto: null
    });
  } catch (error) {
    responderError(res, error, 'Error al comprobar disponibilidad');
  }
};

// POST /api/reservas
// Crea una reserva. Acepta `fin` o `duracion` en minutos
export const crearReserva = async (req, res) => {
  try {
    const body = req.body ?? {};
    const datos = tomarCamposReserva(body);

    // Si viene la duración, la hora de fin se calcula igual que en el frontend
    if (body.duracion !== undefined) {
      if (!esDuracionValida(body.duracion)) {
        return res.status(400).json({
          mensaje: 'La duración debe ser un número entero de minutos mayor a 0'
        });
      }

      if (REGEX_HORA.test(datos.inicio ?? '')) {
        datos.fin = calcularHoraFinal(datos.inicio, body.duracion);
      }
    }

    const reserva = new Reserva(datos);

    await reserva.validate();

    if (reserva.estado !== 'cancelada') {
      const errorRegla = await validarReglasReserva(reserva);

      if (errorRegla) {
        return res.status(errorRegla.status).json(errorRegla.cuerpo);
      }
    }

    await reserva.save();

    res.status(201).json({
      mensaje: 'Reserva creada correctamente',
      reserva
    });
  } catch (error) {
    responderError(res, error, 'Error al crear la reserva');
  }
};

// PUT /api/reservas/:id
// Edita una reserva. Se pueden enviar solo los campos que cambian (y duracion)
export const actualizarReserva = async (req, res) => {
  try {
    const body = req.body ?? {};
    const datos = tomarCamposReserva(body);

    if (Object.keys(datos).length === 0 && body.duracion === undefined) {
      return res.status(400).json({
        mensaje: 'Envíe al menos un campo para actualizar'
      });
    }

    if (body.duracion !== undefined && !esDuracionValida(body.duracion)) {
      return res.status(400).json({
        mensaje: 'La duración debe ser un número entero de minutos mayor a 0'
      });
    }

    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    const duracionAnterior =
      convertirHoraAMinutos(reserva.fin) - convertirHoraAMinutos(reserva.inicio);

    reserva.set(datos);

    if (REGEX_HORA.test(reserva.inicio ?? '')) {
      if (body.duracion !== undefined) {
        // Nueva duración: se recalcula la hora de fin
        reserva.fin = calcularHoraFinal(reserva.inicio, body.duracion);
      } else if (datos.inicio !== undefined && datos.fin === undefined) {
        // Cambió solo la hora de inicio: se mantiene la duración anterior
        reserva.fin = calcularHoraFinal(reserva.inicio, duracionAnterior);
      }
    }

    await reserva.validate();

    if (reserva.estado !== 'cancelada') {
      const errorRegla = await validarReglasReserva(reserva);

      if (errorRegla) {
        return res.status(errorRegla.status).json(errorRegla.cuerpo);
      }
    }

    await reserva.save();

    res.status(200).json({
      mensaje: 'Reserva actualizada correctamente',
      reserva
    });
  } catch (error) {
    responderError(res, error, 'Error al actualizar la reserva');
  }
};

// PATCH /api/reservas/:id/estado
// Cambia solo el estado. Si se reactiva una reserva cancelada, se revisan las reglas
export const cambiarEstadoReserva = async (req, res) => {
  try {
    const { estado } = req.body;

    const reserva = await Reserva.findById(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    const estabaCancelada = reserva.estado === 'cancelada';

    reserva.estado = estado;

    if (estabaCancelada && estado !== 'cancelada') {
      const errorRegla = await validarReglasReserva(reserva);

      if (errorRegla) {
        return res.status(errorRegla.status).json(errorRegla.cuerpo);
      }
    }

    await reserva.save();

    res.status(200).json({
      mensaje: 'Estado de la reserva actualizado correctamente',
      reserva
    });
  } catch (error) {
    responderError(res, error, 'Error al actualizar el estado de la reserva');
  }
};

// DELETE /api/reservas/:id
// Elimina una reserva
export const eliminarReserva = async (req, res) => {
  try {
    const reserva = await Reserva.findByIdAndDelete(req.params.id);

    if (!reserva) {
      return res.status(404).json({
        mensaje: 'Reserva no encontrada'
      });
    }

    res.status(200).json({
      mensaje: 'Reserva eliminada correctamente',
      reserva
    });
  } catch (error) {
    responderError(res, error, 'Error al eliminar la reserva');
  }
};
