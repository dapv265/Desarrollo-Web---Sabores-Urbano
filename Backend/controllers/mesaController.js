
import { Mesa } from '../models/Mesa.js';
import { Reserva } from '../models/Reserva.js';
import { Pedido, ESTADOS_PEDIDO_ABIERTO } from '../models/Pedido.js';
import { Restaurante } from '../models/Restaurante.js';

import {
  HORARIOS_PERMITIDOS,
  convertirHoraAMinutos,
  esFechaValida
} from '../utils/horarios.js';

const ESTADOS_MESA = [
  'disponible',
  'reservada',
  'ocupada',
  'limpieza',
  'fuera'
];

const ZONAS_MESA = [
  'Terraza',
  'Salón principal',
  'Barra'
];

// Validar existencia del restaurante
const existeRestaurante = async (codigo) => {
  if (!codigo) return true;

  return Boolean(
    await Restaurante.exists({ codigo })
  );
};

// RF3: Obtener todas las mesas
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

// RF5: Consultar disponibilidad
export const obtenerDisponibilidad = async (req, res) => {
  try {
    const {
      zona,
      capacidad,
      personas,
      fecha,
      hora,
      duracion = '90',
      restauranteCodigo
    } = req.query;

    const filtros = {
      estado: 'disponible'
    };

    // Filtrar por restaurante
    if (restauranteCodigo !== undefined) {
      if (
        typeof restauranteCodigo !== 'string' ||
        !restauranteCodigo.trim()
      ) {
        return res.status(400).json({
          mensaje: 'Código de restaurante no válido'
        });
      }

      const codigo = restauranteCodigo.trim().toUpperCase();

      const restaurante = await Restaurante.findOne({
        codigo
      });

      if (!restaurante) {
        return res.status(404).json({
          mensaje: 'Restaurante no encontrado'
        });
      }

      if (restaurante.estado !== 'Operativo') {
        return res.status(200).json({
          total: 0,
          mesas: []
        });
      }

      filtros.restauranteCodigo = codigo;
    }

    // Filtrar por ubicación
    if (zona) {
      filtros.zona = zona;
    }

    // Filtrar por cantidad de personas
    const cantidad = personas ?? capacidad;

    if (cantidad !== undefined) {
      const capacidadMinima = Number(cantidad);

      if (
        !Number.isInteger(capacidadMinima) ||
        capacidadMinima < 1
      ) {
        return res.status(400).json({
          mensaje: 'La cantidad de personas debe ser un entero positivo'
        });
      }

      filtros.capacidad = {
        $gte: capacidadMinima
      };
    }

    // Validar fecha y horario
    if (fecha !== undefined || hora !== undefined) {

      if (
        typeof fecha !== 'string' ||
        !esFechaValida(fecha)
      ) {
        return res.status(400).json({
          mensaje: 'Debes ingresar una fecha válida'
        });
      }

      if (!HORARIOS_PERMITIDOS.includes(hora)) {
        return res.status(400).json({
          mensaje: 'Debes seleccionar un horario permitido'
        });
      }

      const minutos = Number(duracion);

      if (!Number.isInteger(minutos) || minutos < 1) {
        return res.status(400).json({
          mensaje: 'La duración debe ser un entero positivo'
        });
      }

      const hoyChile = new Intl.DateTimeFormat('en-CA', {
        timeZone: 'America/Santiago',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
      }).format(new Date());

      if (fecha < hoyChile) {
        return res.status(400).json({
          mensaje: 'No puedes consultar una fecha pasada'
        });
      }

      if (fecha > hoyChile) {
        filtros.estado = { $ne: 'fuera' };
      }

      const inicioConsulta = convertirHoraAMinutos(hora);
      const finConsulta = inicioConsulta + minutos;

      if (finConsulta > 1440) {
        return res.status(400).json({
          mensaje: 'La reserva no puede terminar después de medianoche'
        });
      }

      // Consultar reservas activas
      const reservas = await Reserva.find({
        fecha,
        estado: {
          $in: [
            'pendiente',
            'confirmada',
            'en-espera'
          ]
        }
      }).select('mesa inicio fin');

      // Detectar conflictos de horarios
      const mesasNoDisponibles = reservas
        .filter((reserva) => {
          const inicioReserva =
            convertirHoraAMinutos(reserva.inicio);

          const finReserva =
            convertirHoraAMinutos(reserva.fin);

          return (
            inicioConsulta < finReserva &&
            finConsulta > inicioReserva
          );
        })
        .map((reserva) => reserva.mesa);

      filtros.id = {
        $nin: [...new Set(mesasNoDisponibles)]
      };
    }

    const mesas = await Mesa.find(filtros)
      .sort({ numero: 1 });

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

// RF3: Cambiar estado de una mesa
export const actualizarEstadoMesa = async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body;

    if (!ESTADOS_MESA.includes(estado)) {
      return res.status(400).json({
        mensaje: 'Estado de mesa no válido'
      });
    }

    // Una mesa con un pedido abierto sigue ocupada hasta que se cobre o cancele
    if (estado !== 'ocupada') {
      const pedidoAbierto = await Pedido.exists({
        mesaId: id,
        estado: { $in: ESTADOS_PEDIDO_ABIERTO }
      });

      if (pedidoAbierto) {
        return res.status(409).json({
          mensaje: 'La mesa tiene un pedido abierto. Cóbralo o cancélalo en Pedidos para liberarla.'
        });
      }
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

// Validar datos de una mesa
const validarDatosMesa = (body) => {

  const numero = typeof body.numero === 'string'
    ? body.numero.trim().toUpperCase()
    : '';

  const zona = body.zona;
  const capacidad = Number(body.capacidad);
  const estado = body.estado ?? 'disponible';

  let restauranteCodigo = null;

  if (
    body.restauranteCodigo !== undefined &&
    body.restauranteCodigo !== null &&
    body.restauranteCodigo !== ''
  ) {
    if (typeof body.restauranteCodigo !== 'string') {
      return {
        error: 'Código de restaurante no válido'
      };
    }

    restauranteCodigo =
      body.restauranteCodigo.trim().toUpperCase();

    if (!/^[A-Z0-9-]{2,20}$/.test(restauranteCodigo)) {
      return {
        error: 'Código de restaurante no válido'
      };
    }
  }

  if (!/^[A-Z]-\d{2}$/.test(numero)) {
    return {
      error: 'El número debe tener el formato T-01'
    };
  }

  if (!ZONAS_MESA.includes(zona)) {
    return {
      error: 'La zona seleccionada no es válida'
    };
  }

  if (!Number.isInteger(capacidad) || capacidad < 1) {
    return {
      error: 'La capacidad debe ser un entero positivo'
    };
  }

  if (!ESTADOS_MESA.includes(estado)) {
    return {
      error: 'El estado de la mesa no es válido'
    };
  }

  return {
    datos: {
      numero,
      zona,
      capacidad,
      estado,
      restauranteCodigo
    }
  };
};

// RF3: Crear una mesa
export const crearMesa = async (req, res) => {
  try {
    const { datos, error } =
      validarDatosMesa(req.body ?? {});

    if (error) {
      return res.status(400).json({
        mensaje: error
      });
    }

    if (!(await existeRestaurante(datos.restauranteCodigo))) {
      return res.status(404).json({
        mensaje: 'El restaurante seleccionado no existe'
      });
    }

    const existente = await Mesa.findOne({
      $or: [
        { id: datos.numero },
        { numero: datos.numero }
      ]
    });

    if (existente) {
      return res.status(409).json({
        mensaje: 'Ya existe una mesa con ese número o identificador'
      });
    }

    const mesa = await Mesa.create({
      id: datos.numero,
      ...datos
    });

    res.status(201).json({
      mensaje: 'Mesa creada correctamente',
      mesa
    });

  } catch (error) {

    if (error.code === 11000) {
      return res.status(409).json({
        mensaje: 'La mesa ya existe'
      });
    }

    res.status(500).json({
      mensaje: 'Error al crear la mesa',
      error: error.message
    });
  }
};

// RF3: Editar una mesa
export const actualizarMesa = async (req, res) => {
  try {
    const { id } = req.params;
    const mesa = await Mesa.findOne({ id });

    if (!mesa) {
      return res.status(404).json({
        mensaje: 'Mesa no encontrada'
      });
    }

    const body = req.body ?? {};

    const { datos, error } = validarDatosMesa({
      numero: body.numero ?? mesa.numero,
      zona: body.zona ?? mesa.zona,
      capacidad: body.capacidad ?? mesa.capacidad,
      estado: body.estado ?? mesa.estado,
      restauranteCodigo:
        body.restauranteCodigo !== undefined
          ? body.restauranteCodigo
          : mesa.restauranteCodigo
    });

    if (error) {
      return res.status(400).json({
        mensaje: error
      });
    }

    if (!(await existeRestaurante(datos.restauranteCodigo))) {
      return res.status(404).json({
        mensaje: 'El restaurante seleccionado no existe'
      });
    }

    const duplicada = await Mesa.findOne({
      id: { $ne: id },
      $or: [
        { numero: datos.numero },
        { id: datos.numero }
      ]
    });

    if (duplicada) {
      return res.status(409).json({
        mensaje: 'El número pertenece a otra mesa'
      });
    }

    const reservaIncompatible = await Reserva.exists({
      mesa: id,
      estado: { $ne: 'cancelada' },
      personas: { $gt: datos.capacidad }
    });

    if (reservaIncompatible) {
      return res.status(409).json({
        mensaje: 'La capacidad es insuficiente para una reserva existente'
      });
    }

    // Una mesa con un pedido abierto sigue ocupada hasta que se cobre o cancele
    if (datos.estado !== 'ocupada' && mesa.estado === 'ocupada') {
      const pedidoAbierto = await Pedido.exists({
        mesaId: id,
        estado: { $in: ESTADOS_PEDIDO_ABIERTO }
      });

      if (pedidoAbierto) {
        return res.status(409).json({
          mensaje: 'La mesa tiene un pedido abierto. Cóbralo o cancélalo en Pedidos para liberarla.'
        });
      }
    }

    // Proteger asociaciones existentes
    const cambioRestaurante =
      (mesa.restauranteCodigo ?? null) !==
      datos.restauranteCodigo;

    if (cambioRestaurante) {
      const [tieneReservas, tienePedidos] =
        await Promise.all([
          Reserva.exists({ mesa: id }),
          Pedido.exists({ mesaId: id })
        ]);

      if (tieneReservas || tienePedidos) {
        return res.status(409).json({
          mensaje: 'No se puede cambiar el restaurante de una mesa con reservas o pedidos asociados'
        });
      }
    }

    // Mantener identificador interno
    mesa.set(datos);
    await mesa.save();

    res.status(200).json({
      mensaje: 'Mesa actualizada correctamente',
      mesa
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al editar la mesa',
      error: error.message
    });
  }
};

// RF3: Eliminar una mesa
export const eliminarMesa = async (req, res) => {
  try {
    const { id } = req.params;
    const mesa = await Mesa.findOne({ id });

    if (!mesa) {
      return res.status(404).json({
        mensaje: 'Mesa no encontrada'
      });
    }

    const [tieneReservas, tienePedidos] =
      await Promise.all([
        Reserva.exists({ mesa: id }),
        Pedido.exists({ mesaId: id })
      ]);

    if (tieneReservas || tienePedidos) {
      return res.status(409).json({
        mensaje: 'No se puede eliminar una mesa con reservas o pedidos asociados'
      });
    }

    if (['ocupada', 'reservada'].includes(mesa.estado)) {
      return res.status(409).json({
        mensaje: 'No se puede eliminar una mesa ocupada o reservada'
      });
    }

    await Mesa.deleteOne({ id });

    res.status(200).json({
      mensaje: 'Mesa eliminada correctamente'
    });

  } catch (error) {
    res.status(500).json({
      mensaje: 'Error al eliminar la mesa',
      error: error.message
    });
  }
};

