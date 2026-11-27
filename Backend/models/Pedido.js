import mongoose from 'mongoose';

// Un pedido está "abierto" mientras la mesa lo está usando
export const ESTADOS_PEDIDO_ABIERTO = ['Pendiente', 'Preparando', 'Listo'];
export const ESTADOS_PEDIDO = [...ESTADOS_PEDIDO_ABIERTO, 'Pagado', 'Cancelado'];
// 'Borrador': el garzón lo anotó pero aún no envía la comanda; cocina no lo ve
export const ESTADOS_ITEM = ['Borrador', 'Pendiente', 'Preparando', 'Listo'];

const itemPedidoSchema = new mongoose.Schema({
  // Correlativo dentro del pedido (lo asigna el servidor)
  id: {
    type: Number,
    required: true
  },
  productoId: {
    type: Number,
    required: true
  },
  nombre: {
    type: String,
    required: true
  },
  // Precio vigente al momento de agregarlo (RF10, RF8): no cambia si después cambia el menú
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1,
    max: 50
  },
  observaciones: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  estado: {
    type: String,
    enum: ESTADOS_ITEM,
    default: 'Borrador'
  },
  agregadoEn: {
    type: Date,
    default: Date.now
  },
  // Momento en que la comanda con este producto se envió a cocina
  enviadoEn: {
    type: Date,
    default: null
  }
});

const pedidoSchema = new mongoose.Schema({
  mesaId: {
    type: String,
    required: true
  },
  mesaNombre: {
    type: String,
    required: true
  },
  // Local del pedido (RF9): el de la mesa. Null si la mesa aún no tiene local asignado
  restauranteCodigo: {
    type: String,
    default: null
  },
  clienteId: {
    type: Number,
    default: null
  },
  cliente: {
    type: String,
    default: 'Sin especificar'
  },
  // Quién abrió el pedido (trazabilidad)
  garzon: {
    id: { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
    nombre: { type: String, default: '' }
  },
  estado: {
    type: String,
    enum: ESTADOS_PEDIDO,
    default: 'Pendiente'
  },
  // Hora de apertura (HH:mm, hora de Chile). La fecha completa queda en createdAt
  hora: {
    type: String,
    required: true
  },
  items: [itemPedidoSchema],
  total: {
    type: Number,
    default: 0,
    min: 0
  },
  cerradoEn: {
    type: Date,
    default: null
  }
}, {
  timestamps: true,
  collection: 'pedidos'
});

// RF9: una mesa no puede tener más de un pedido abierto, aunque dos garzones lo intenten a la vez
pedidoSchema.index(
  { mesaId: 1 },
  {
    unique: true,
    partialFilterExpression: { estado: { $in: ESTADOS_PEDIDO_ABIERTO } },
    name: 'un_pedido_abierto_por_mesa'
  }
);

export const Pedido = mongoose.model('Pedido', pedidoSchema);
