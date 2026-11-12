import mongoose from 'mongoose';

const itemPedidoSchema = new mongoose.Schema({
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
  precio: {
    type: Number,
    required: true,
    min: 0
  },
  cantidad: {
    type: Number,
    required: true,
    min: 1
  },
  observaciones: {
    type: String,
    default: ''
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Preparando', 'Listo'],
    default: 'Pendiente'
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
  cliente: {
    type: String,
    default: 'Sin especificar'
  },
  estado: {
    type: String,
    enum: ['Pendiente', 'Preparando', 'Listo', 'Pagado'],
    default: 'Pendiente'
  },
  hora: {
    type: String,
    required: true
  },
  items: [itemPedidoSchema],
  total: {
    type: Number,
    default: 0,
    min: 0
  }
}, {
  timestamps: true,
  collection: 'pedidos'
});

export const Pedido = mongoose.model('Pedido', pedidoSchema);

