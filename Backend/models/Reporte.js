import mongoose from 'mongoose';

export const PERIODO_PATTERN = /^\d{4}-(0[1-9]|1[0-2])$/;

const platoVendidoSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: [true, 'El nombre del plato es obligatorio.'],
      trim: true,
      minlength: [2, 'El nombre del plato debe tener al menos 2 caracteres.'],
      maxlength: [120, 'El nombre del plato no puede superar los 120 caracteres.'],
    },
    categoria: {
      type: String,
      required: [true, 'La categoría del plato es obligatoria.'],
      trim: true,
      minlength: [2, 'La categoría debe tener al menos 2 caracteres.'],
      maxlength: [60, 'La categoría no puede superar los 60 caracteres.'],
    },
    cantidad: {
      type: Number,
      required: [true, 'La cantidad vendida es obligatoria.'],
      min: [1, 'La cantidad vendida debe ser al menos 1.'],
      validate: {
        validator: Number.isInteger,
        message: 'La cantidad vendida debe ser un número entero.',
      },
    },
    totalRecaudado: {
      type: Number,
      required: [true, 'El total recaudado es obligatorio.'],
      min: [0, 'El total recaudado no puede ser negativo.'],
    },
  },
  { _id: true },
);

const reporteSchema = new mongoose.Schema(
  {
    periodo: {
      type: String,
      required: [true, 'El período es obligatorio.'],
      trim: true,
      match: [
        PERIODO_PATTERN,
        'El período debe tener el formato AAAA-MM (ej: 2026-10).',
      ],
    },
    restaurante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurante',
      required: [true, 'El restaurante es obligatorio.'],
    },
    pedidosTotales: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Los pedidos totales no pueden ser negativos.'],
      validate: {
        validator: Number.isInteger,
        message: 'Los pedidos totales deben ser un número entero.',
      },
    },
    ventasTotales: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'Las ventas totales no pueden ser negativas.'],
    },
    tasaOcupacion: {
      type: Number,
      required: true,
      default: 0,
      min: [0, 'La tasa de ocupación no puede ser menor que 0.'],
      max: [100, 'La tasa de ocupación no puede superar 100.'],
    },
    platosMasVendidos: {
      type: [platoVendidoSchema],
      default: [],
    },
    observaciones: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Las observaciones no pueden superar los 500 caracteres.'],
    },
  },
  { timestamps: true, collection: 'reportes' },
);

reporteSchema.index({ periodo: 1, restaurante: 1 }, { unique: true });
reporteSchema.index({ restaurante: 1 });
reporteSchema.index({ periodo: -1 });

export const Reporte =
  mongoose.models.Reporte || mongoose.model('Reporte', reporteSchema);
