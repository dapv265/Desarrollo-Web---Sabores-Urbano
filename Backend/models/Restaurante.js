import mongoose from 'mongoose';

export const ESTADOS_RESTAURANTE = [
  'Operativo',
  'En Mantención',
  'Cerrado',
  'Fuera de Servicio',
];

const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;
const CODIGO_PATTERN = /^[A-Z0-9-]+$/;

const restauranteSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: [true, 'El código del restaurante es obligatorio.'],
      unique: true,
      trim: true,
      uppercase: true,
      minlength: [2, 'El código debe tener al menos 2 caracteres.'],
      maxlength: [20, 'El código no puede superar los 20 caracteres.'],
      match: [
        CODIGO_PATTERN,
        'El código solo puede contener letras, números y guiones (ej: LOC-01).',
      ],
    },
    nombre: {
      type: String,
      required: [true, 'El nombre del restaurante es obligatorio.'],
      trim: true,
      minlength: [2, 'El nombre debe tener al menos 2 caracteres.'],
      maxlength: [120, 'El nombre no puede superar los 120 caracteres.'],
    },
    direccion: {
      type: String,
      required: [true, 'La dirección es obligatoria.'],
      trim: true,
      minlength: [4, 'La dirección debe tener al menos 4 caracteres.'],
      maxlength: [200, 'La dirección no puede superar los 200 caracteres.'],
    },
    telefono: {
      type: String,
      required: [true, 'El teléfono es obligatorio.'],
      trim: true,
      validate: {
        validator: (value) =>
          typeof value === 'string' &&
          PHONE_PATTERN.test(value) &&
          value.replace(/\D/g, '').length >= 8,
        message: 'Ingrese un teléfono válido.',
      },
    },
    horario: {
      type: String,
      required: [true, 'El horario es obligatorio.'],
      trim: true,
      minlength: [3, 'El horario debe tener al menos 3 caracteres.'],
      maxlength: [80, 'El horario no puede superar los 80 caracteres.'],
    },
    capacidadMesas: {
      type: Number,
      required: [true, 'La capacidad de mesas es obligatoria.'],
      min: [1, 'La capacidad de mesas debe ser al menos 1.'],
      validate: {
        validator: Number.isInteger,
        message: 'La capacidad de mesas debe ser un número entero.',
      },
    },
    estado: {
      type: String,
      enum: {
        values: ESTADOS_RESTAURANTE,
        message: 'El estado del restaurante no es válido.',
      },
      default: 'Operativo',
    },
  },
  { timestamps: true, collection: 'restaurantes' },
);

export const Restaurante =
  mongoose.models.Restaurante ||
  mongoose.model('Restaurante', restauranteSchema);
