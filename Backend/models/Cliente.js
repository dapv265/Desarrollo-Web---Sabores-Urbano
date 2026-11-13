import mongoose from 'mongoose';

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;
const RUT_PATTERN = /^(?:\d{1,2}(?:\.\d{3}){2}|\d{7,8})-[\dkK]$/;

export function normalizarRut(valor) {
  if (typeof valor !== 'string') {
    return valor;
  }

  const limpio = valor.trim().toUpperCase().replace(/\./g, '');
  const match = /^(\d{7,8})-([\dK])$/.exec(limpio);
  if (!match) {
    return valor.trim().toUpperCase();
  }

  const cuerpoFormateado = match[1].replace(/\B(?=(\d{3})+(?!\d))/g, '.');
  return `${cuerpoFormateado}-${match[2]}`;
}

const clienteSchema = new mongoose.Schema(
  {
    id: {
      type: Number,
      required: true,
      min: 1,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      required: true,
      trim: true,
      validate: {
        validator: (value) =>
          PHONE_PATTERN.test(value) && value.replace(/\D/g, '').length >= 8,
        message: 'Ingrese un teléfono válido.',
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, 'Ingrese un email válido.'],
    },
    rut: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      set: normalizarRut,
      match: [RUT_PATTERN, 'Ingrese un RUT con formato válido.'],
    },
    ultimaReserva: {
      type: String,
      default: 'Sin reservas previas',
      trim: true,
    },
    estado: {
      type: String,
      enum: ['Activo', 'Inactivo'],
      default: 'Activo',
    },
    restaurante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Restaurante',
      default: null,
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true, id: false },
);

clienteSchema.index({ id: 1 }, { unique: true });
clienteSchema.index({ email: 1 }, { unique: true });
clienteSchema.index({ rut: 1 }, { unique: true });

clienteSchema.pre('validate', function () {
  if (this.isModified('activo') && !this.isModified('estado')) {
    this.estado = this.activo ? 'Activo' : 'Inactivo';
  } else if (this.isModified('estado') && !this.isModified('activo')) {
    this.activo = this.estado === 'Activo';
  }
});

export const Cliente =
  mongoose.models.Cliente || mongoose.model('Cliente', clienteSchema);
