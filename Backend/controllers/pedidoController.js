import { Cliente } from '../models/Cliente.js';
import { Mesa } from '../models/Mesa.js';
import {
  Pedido,
  ESTADOS_PEDIDO,
  ESTADOS_PEDIDO_ABIERTO
} from '../models/Pedido.js';
import { Producto } from '../models/Producto.js';
import { Restaurante } from '../models/Restaurante.js';
import { ROLES } from '../constants/roles.js';

// Productos que el garzón todavía puede quitar de la comanda
const ESTADOS_ITEM_QUITABLES = ['Borrador', 'Pendiente'];

// Una mesa en estos estados no puede recibir un pedido nuevo
const ESTADOS_MESA_SIN_PEDIDOS = ['fuera', 'limpieza'];

// Cambios de estado permitidos: estado destino -> estados de origen y roles autorizados
const TRANSICIONES = {
  Preparando: {
    desde: ['Pendiente'],
    roles: [ROLES.COCINA, ROLES.ADMIN_LOCAL, ROLES.ADMIN_GENERAL]
  },
  Listo: {
    desde: ['Pendiente', 'Preparando'],
    roles: [ROLES.COCINA, ROLES.ADMIN_LOCAL, ROLES.ADMIN_GENERAL]
  },
  Pagado: {
    desde: ESTADOS_PEDIDO_ABIERTO,
    roles: [ROLES.GARZON, ROLES.ADMIN_LOCAL, ROLES.ADMIN_GENERAL]
  },
  Cancelado: {
    desde: ESTADOS_PEDIDO_ABIERTO,
    roles: [ROLES.GARZON, ROLES.ADMIN_LOCAL, ROLES.ADMIN_GENERAL]
  }
};

const ROLES_GLOBALES = [ROLES.ADMIN_GENERAL];

class ErrorNegocio extends Error {
  constructor(status, mensaje) {
    super(mensaje);
    this.status = status;
  }
}

const responderError = (res, error, mensajeGenerico) => {
  if (error instanceof ErrorNegocio) {
    return res.status(error.status).json({ mensaje: error.message });
  }

  if (error.name === 'CastError') {
    return res.status(400).json({ mensaje: 'El identificador del pedido no es válido' });
  }

  if (error.name === 'ValidationError') {
    return res.status(400).json({
      mensaje: Object.values(error.errors).map((e) => e.message).join('. ')
    });
  }

  console.error(mensajeGenerico, error);
  return res.status(500).json({ mensaje: mensajeGenerico });
};

const horaActual = () =>
  new Date().toLocaleTimeString('es-CL', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
    timeZone: 'America/Santiago'
  });

// Código del local del usuario (null si es un perfil global)
const codigoRestauranteUsuario = async (usuario) => {
  if (!usuario?.restaurante) return null;
  const restaurante = await Restaurante.findById(usuario.restaurante).select('codigo');
  return restaurante?.codigo ?? null;
};

// Los usuarios de un local solo ven y operan pedidos de su local
// (y los de mesas aún sin local asignado). El Administrador General ve todo.
const filtroPorLocal = async (usuario) => {
  if (ROLES_GLOBALES.includes(usuario.rol)) return {};
  const codigo = await codigoRestauranteUsuario(usuario);
  return codigo ? { restauranteCodigo: { $in: [codigo, null] } } : {};
};

const buscarPedidoDelUsuario = async (id, usuario) => {
  const pedido = await Pedido.findOne({ _id: id, ...(await filtroPorLocal(usuario)) });
  if (!pedido) {
    throw new ErrorNegocio(404, 'Pedido no encontrado');
  }
  return pedido;
};

// Deja la mesa en el estado indicado si ya no tiene pedidos abiertos
const liberarMesa = async (mesaId, estadoFinal) => {
  const quedanPedidosAbiertos = await Pedido.exists({
    mesaId,
    estado: { $in: ESTADOS_PEDIDO_ABIERTO }
  });

  if (!quedanPedidosAbiertos) {
    await Mesa.updateOne({ id: mesaId, estado: 'ocupada' }, { estado: estadoFinal });
  }
};

// GET /api/pedidos?estado=Pendiente,Preparando
export const obtenerPedidos = async (req, res) => {
  try {
    const filtros = await filtroPorLocal(req.user);

    if (req.query.estado) {
      const estados = String(req.query.estado).split(',').filter((e) => ESTADOS_PEDIDO.includes(e));
      filtros.estado = { $in: estados };
    }

    const pedidos = await Pedido.find(filtros).sort({ createdAt: -1 });

    // Cocina no ve los productos que el garzón aún no envía
    if (req.user.rol === ROLES.COCINA) {
      return res.status(200).json(
        pedidos.map((pedido) => {
          const datos = pedido.toObject();
          datos.items = datos.items.filter((item) => item.estado !== 'Borrador');
          return datos;
        })
      );
    }

    res.status(200).json(pedidos);
  } catch (error) {
    responderError(res, error, 'Error al obtener los pedidos');
  }
};

// POST /api/pedidos  { mesaId, clienteId? }  (RF9)
export const crearPedido = async (req, res) => {
  try {
    const { mesaId, clienteId } = req.body ?? {};

    if (!mesaId) {
      throw new ErrorNegocio(400, 'Debes seleccionar una mesa');
    }

    const mesa = await Mesa.findOne({ id: mesaId });

    if (!mesa) {
      throw new ErrorNegocio(404, 'La mesa seleccionada no existe');
    }

    const codigoUsuario = await codigoRestauranteUsuario(req.user);
    if (
      !ROLES_GLOBALES.includes(req.user.rol) &&
      mesa.restauranteCodigo &&
      codigoUsuario &&
      mesa.restauranteCodigo !== codigoUsuario
    ) {
      throw new ErrorNegocio(403, 'La mesa pertenece a otro local');
    }

    if (ESTADOS_MESA_SIN_PEDIDOS.includes(mesa.estado)) {
      throw new ErrorNegocio(
        409,
        `La mesa ${mesa.numero} no puede recibir pedidos (estado: ${mesa.estado})`
      );
    }

    let cliente = null;
    if (clienteId !== undefined && clienteId !== null && clienteId !== '') {
      cliente = await Cliente.findOne({ id: Number(clienteId) }).select('id nombre');
      if (!cliente) {
        throw new ErrorNegocio(404, 'El cliente seleccionado no existe');
      }
    }

    let nuevoPedido;
    try {
      nuevoPedido = await Pedido.create({
        mesaId: mesa.id,
        mesaNombre: mesa.numero,
        // El pedido pertenece al local de la mesa (no al de quien lo abre)
        restauranteCodigo: mesa.restauranteCodigo || null,
        clienteId: cliente?.id ?? null,
        cliente: cliente?.nombre ?? 'Sin especificar',
        garzon: { id: req.user._id, nombre: req.user.nombre },
        estado: 'Pendiente',
        hora: horaActual(),
        items: [],
        total: 0
      });
    } catch (error) {
      // El índice único impide dos pedidos abiertos para la misma mesa
      if (error.code === 11000) {
        throw new ErrorNegocio(409, `La mesa ${mesa.numero} ya tiene un pedido abierto`);
      }
      throw error;
    }

    // La mesa pasa a ocupada. Si esto falla, se deshace el pedido para no dejar datos cruzados
    try {
      await Mesa.updateOne({ id: mesa.id }, { estado: 'ocupada' });
    } catch (error) {
      await Pedido.deleteOne({ _id: nuevoPedido._id });
      throw error;
    }

    res.status(201).json(nuevoPedido);
  } catch (error) {
    responderError(res, error, 'Error al crear el pedido');
  }
};

// POST /api/pedidos/:id/items  { productoId, cantidad, observaciones }  (RF10)
export const agregarProducto = async (req, res) => {
  try {
    const { productoId, observaciones = '' } = req.body ?? {};
    const cantidad = Number(req.body?.cantidad);

    if (!Number.isInteger(cantidad) || cantidad < 1 || cantidad > 50) {
      throw new ErrorNegocio(400, 'La cantidad debe ser un número entero entre 1 y 50');
    }

    if (String(observaciones).length > 200) {
      throw new ErrorNegocio(400, 'Las observaciones no pueden superar los 200 caracteres');
    }

    const pedido = await buscarPedidoDelUsuario(req.params.id, req.user);

    if (!ESTADOS_PEDIDO_ABIERTO.includes(pedido.estado)) {
      throw new ErrorNegocio(409, `El pedido está ${pedido.estado.toLowerCase()} y no admite productos`);
    }

    const producto = await Producto.findOne({ id: Number(productoId) });

    if (!producto) {
      throw new ErrorNegocio(404, 'El producto no existe');
    }

    if (!producto.disponible) {
      throw new ErrorNegocio(409, `${producto.nombre} no está disponible en este momento`);
    }

    const siguienteId = pedido.items.reduce((max, item) => Math.max(max, item.id), 0) + 1;
    const nuevoItem = {
      id: siguienteId,
      productoId: producto.id,
      nombre: producto.nombre,
      // El precio lo pone el servidor desde el menú vigente
      precio: producto.precio,
      cantidad,
      observaciones: String(observaciones).trim(),
      // Queda en la comanda sin enviar: cocina no lo ve hasta que el garzón confirme
      estado: 'Borrador'
    };

    // Operación atómica: agrega el producto sin reemplazar la lista
    // (así no se pisa con lo que esté haciendo cocina al mismo tiempo)
    const actualizado = await Pedido.findOneAndUpdate(
      { _id: pedido._id, estado: { $in: ESTADOS_PEDIDO_ABIERTO } },
      {
        $push: { items: nuevoItem },
        $inc: { total: nuevoItem.precio * nuevoItem.cantidad }
      },
      { new: true, runValidators: true }
    );

    if (!actualizado) {
      throw new ErrorNegocio(409, 'El pedido se cerró mientras agregabas el producto');
    }

    res.status(201).json(actualizado);
  } catch (error) {
    responderError(res, error, 'Error al agregar el producto');
  }
};

// DELETE /api/pedidos/:id/items/:itemId
// Solo se puede quitar un producto que cocina todavía no empezó a preparar
export const quitarProducto = async (req, res) => {
  try {
    const itemId = Number(req.params.itemId);
    const pedido = await buscarPedidoDelUsuario(req.params.id, req.user);
    const item = pedido.items.find((i) => i.id === itemId);

    if (!item) {
      throw new ErrorNegocio(404, 'El producto no está en el pedido');
    }

    // Se puede quitar si aún no se envió o si cocina todavía no empezó a prepararlo
    if (!ESTADOS_ITEM_QUITABLES.includes(item.estado)) {
      throw new ErrorNegocio(409, `${item.nombre} ya está ${item.estado.toLowerCase()} en cocina y no se puede quitar`);
    }

    const actualizado = await Pedido.findOneAndUpdate(
      {
        _id: pedido._id,
        estado: { $in: ESTADOS_PEDIDO_ABIERTO },
        items: { $elemMatch: { id: itemId, estado: { $in: ESTADOS_ITEM_QUITABLES } } }
      },
      {
        $pull: { items: { id: itemId } },
        $inc: { total: -(item.precio * item.cantidad) }
      },
      { new: true }
    );

    if (!actualizado) {
      throw new ErrorNegocio(409, 'Cocina empezó a preparar el producto; ya no se puede quitar');
    }

    res.status(200).json(actualizado);
  } catch (error) {
    responderError(res, error, 'Error al quitar el producto');
  }
};

// POST /api/pedidos/:id/enviar
// El garzón confirma la comanda: todos los productos sin enviar pasan a cocina de una vez
export const enviarACocina = async (req, res) => {
  try {
    const pedido = await buscarPedidoDelUsuario(req.params.id, req.user);

    if (!ESTADOS_PEDIDO_ABIERTO.includes(pedido.estado)) {
      throw new ErrorNegocio(409, `El pedido está ${pedido.estado.toLowerCase()}`);
    }

    const porEnviar = pedido.items.filter((item) => item.estado === 'Borrador').length;
    if (porEnviar === 0) {
      throw new ErrorNegocio(409, 'No hay productos nuevos para enviar a cocina');
    }

    const cambios = {
      'items.$[borrador].estado': 'Pendiente',
      'items.$[borrador].enviadoEn': new Date()
    };

    // Si cocina ya había terminado lo anterior, el pedido vuelve a quedar pendiente
    if (pedido.estado === 'Listo') {
      cambios.estado = 'Pendiente';
    }

    // Condición atómica: el pedido no cambió de estado entre la lectura y el envío
    const actualizado = await Pedido.findOneAndUpdate(
      { _id: pedido._id, estado: pedido.estado, 'items.estado': 'Borrador' },
      { $set: cambios },
      { new: true, arrayFilters: [{ 'borrador.estado': 'Borrador' }] }
    );

    if (!actualizado) {
      throw new ErrorNegocio(409, 'El pedido cambió recién. Actualiza la pantalla e inténtalo de nuevo.');
    }

    res.status(200).json(actualizado);
  } catch (error) {
    responderError(res, error, 'Error al enviar la comanda a cocina');
  }
};

// PATCH /api/pedidos/:id/estado  { estado }  (RF11 y cierre del pedido)
export const cambiarEstadoPedido = async (req, res) => {
  try {
    const { estado } = req.body ?? {};
    const regla = TRANSICIONES[estado];

    if (!regla) {
      throw new ErrorNegocio(400, 'Estado de pedido no válido');
    }

    if (!regla.roles.includes(req.user.rol)) {
      throw new ErrorNegocio(403, `Tu perfil no puede marcar pedidos como ${estado}`);
    }

    const pedido = await buscarPedidoDelUsuario(req.params.id, req.user);

    if (!regla.desde.includes(pedido.estado)) {
      throw new ErrorNegocio(409, `Un pedido ${pedido.estado.toLowerCase()} no puede pasar a ${estado.toLowerCase()}`);
    }

    if (estado === 'Pagado' && pedido.items.length === 0) {
      throw new ErrorNegocio(409, 'No se puede cobrar un pedido sin productos');
    }

    if (estado === 'Pagado' && pedido.items.some((item) => item.estado === 'Borrador')) {
      throw new ErrorNegocio(409, 'Hay productos sin enviar a cocina. Envíalos o quítalos antes de cobrar');
    }

    // Cocina solo avanza pedidos que tengan productos enviados
    if (
      (estado === 'Preparando' || estado === 'Listo') &&
      !pedido.items.some((item) => ['Pendiente', 'Preparando'].includes(item.estado))
    ) {
      throw new ErrorNegocio(409, 'El pedido no tiene productos enviados a cocina');
    }

    if (
      estado === 'Cancelado' &&
      pedido.items.some((item) => !ESTADOS_ITEM_QUITABLES.includes(item.estado)) &&
      req.user.rol === ROLES.GARZON
    ) {
      throw new ErrorNegocio(409, 'Cocina ya empezó este pedido; pide a un administrador que lo cancele');
    }

    const cambios = { estado };
    const opciones = { new: true };

    if (estado === 'Preparando') {
      cambios['items.$[pendiente].estado'] = 'Preparando';
      opciones.arrayFilters = [{ 'pendiente.estado': 'Pendiente' }];
    }

    if (estado === 'Listo') {
      // Los productos sin enviar siguen en borrador
      cambios['items.$[enCocina].estado'] = 'Listo';
      opciones.arrayFilters = [{ 'enCocina.estado': { $in: ['Pendiente', 'Preparando'] } }];
    }

    if (estado === 'Pagado' || estado === 'Cancelado') {
      cambios.cerradoEn = new Date();
    }

    // Condición atómica: solo cambia si nadie lo cambió antes
    const actualizado = await Pedido.findOneAndUpdate(
      { _id: pedido._id, estado: { $in: regla.desde } },
      { $set: cambios },
      opciones
    );

    if (!actualizado) {
      throw new ErrorNegocio(409, 'El pedido cambió de estado recién. Actualiza la pantalla.');
    }

    // Al cobrar, la mesa queda pendiente de limpieza; si se cancela, vuelve a estar disponible
    if (estado === 'Pagado') {
      await liberarMesa(actualizado.mesaId, 'limpieza');
    }
    if (estado === 'Cancelado') {
      await liberarMesa(actualizado.mesaId, 'disponible');
    }

    res.status(200).json(actualizado);
  } catch (error) {
    responderError(res, error, 'Error al cambiar el estado del pedido');
  }
};
