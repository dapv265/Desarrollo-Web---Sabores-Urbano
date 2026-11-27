import mongoose from 'mongoose';

// Cada cambio de precio queda registrado (RF de gestión de precios)
const cambioPrecioSchema = new mongoose.Schema({
  precioAnterior: {
    type: Number,
    required: true,
    min: 0
  },
  precioNuevo: {
    type: Number,
    required: true,
    min: 0
  },
  motivo: {
    type: String,
    default: '',
    trim: true,
    maxlength: 200
  },
  fecha: {
    type: Date,
    default: Date.now
  }
}, { _id: false });

const productoSchema = new mongoose.Schema({
  // Identificador numérico que usan el menú y los ítems de los pedidos (productoId)
  id: {
    type: Number,
    required: true,
    unique: true,
    min: 1
  },
  nombre: {
    type: String,
    required: [true, 'El nombre del producto es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre debe tener al menos 2 caracteres']
  },
  descripcion: {
    type: String,
    default: '',
    trim: true
  },
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [1, 'El precio debe ser mayor a 0']
  },
  categoriaId: {
    type: Number,
    required: [true, 'La categoría es obligatoria'],
    min: 1
  },
  imagen: {
    type: String,
    default: '',
    trim: true
  },
  tiempoPreparacion: {
    type: Number,
    default: 10,
    min: 0
  },
  disponible: {
    type: Boolean,
    default: true
  },
  destacado: {
    type: Boolean,
    default: false
  },
  historialPrecios: {
    type: [cambioPrecioSchema],
    default: []
  }
}, {
  timestamps: true,
  collection: 'productos'
});

export const Producto = mongoose.model('Producto', productoSchema);
