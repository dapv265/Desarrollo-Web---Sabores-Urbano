import mongoose from 'mongoose';

import { IDS_CATEGORIAS } from '../constants/categorias.js';

// Comparación de textos sin distinguir mayúsculas (nombre único)
export const COLACION_NOMBRE = Object.freeze({ locale: 'es', strength: 2 });

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
    minlength: [2, 'El nombre debe tener al menos 2 caracteres'],
    maxlength: [80, 'El nombre no puede superar los 80 caracteres']
  },
  descripcion: {
    type: String,
    default: '',
    trim: true,
    maxlength: [300, 'La descripción no puede superar los 300 caracteres']
  },
  // Pesos chilenos (CLP): entero mayor a 0
  precio: {
    type: Number,
    required: [true, 'El precio es obligatorio'],
    min: [1, 'El precio debe ser mayor a 0'],
    validate: {
      validator: Number.isInteger,
      message: 'El precio debe ser un número entero (CLP)'
    }
  },
  // Corresponde a una de las categorías de constants/categorias.js
  categoriaId: {
    type: Number,
    required: [true, 'La categoría es obligatoria'],
    enum: {
      values: IDS_CATEGORIAS,
      message: 'La categoría no existe'
    }
  },
  imagen: {
    type: String,
    default: '',
    trim: true,
    maxlength: [500, 'La ruta de la imagen no puede superar los 500 caracteres']
  },
  // Minutos
  tiempoPreparacion: {
    type: Number,
    default: 10,
    min: [0, 'El tiempo de preparación no puede ser negativo'],
    max: [180, 'El tiempo de preparación no puede superar los 180 minutos'],
    validate: {
      validator: Number.isInteger,
      message: 'El tiempo de preparación debe ser un número entero de minutos'
    }
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

// Nombre único sin distinguir mayúsculas
productoSchema.index(
  { nombre: 1 },
  { unique: true, collation: COLACION_NOMBRE }
);

// Para filtrar el menú por categoría y disponibilidad
productoSchema.index({ categoriaId: 1 });
productoSchema.index({ disponible: 1 });

export const Producto = mongoose.model('Producto', productoSchema);
