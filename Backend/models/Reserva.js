
import mongoose from 'mongoose';
import {
  REGEX_HORA,
  REGEX_HORA_FIN,
  convertirHoraAMinutos,
  esFechaValida
} from '../utils/horarios.js';

export const ESTADOS_RESERVA = [
  'pendiente',
  'confirmada',
  'en-espera',
  'cancelada'
];

const reservaSchema = new mongoose.Schema({
  clienteRut: {
    type: String,
    required: [true, 'El RUT del cliente es obligatorio'],
    trim: true,
    uppercase: true,
    match: [/^\d{1,2}\.\d{3}\.\d{3}-[\dK]$/, 'El RUT debe tener el formato 12.345.678-9 (dígito verificador 0-9 o K)']
  },
  cliente: {
    type: String,
    required: [true, 'El nombre del cliente es obligatorio'],
    trim: true,
    minlength: [2, 'El nombre del cliente debe tener al menos 2 caracteres']
  },
  telefono: {
    type: String,
    required: [true, 'El teléfono es obligatorio'],
    trim: true
  },
  personas: {
    type: Number,
    required: [true, 'La cantidad de personas es obligatoria'],
    min: [1, 'La reserva debe ser para al menos 1 persona'],
    max: [12, 'La reserva no puede superar las 12 personas'],
    validate: {
      validator: Number.isInteger,
      message: 'La cantidad de personas debe ser un número entero'
    }
  },
  // Se guarda como texto "AAAA-MM-DD", igual que en el frontend
  fecha: {
    type: String,
    required: [true, 'La fecha es obligatoria'],
    trim: true,
    validate: {
      validator: esFechaValida,
      message: 'La fecha debe ser una fecha real con formato AAAA-MM-DD'
    }
  },
  inicio: {
    type: String,
    required: [true, 'La hora de inicio es obligatoria'],
    trim: true,
    match: [REGEX_HORA, 'La hora de inicio debe tener el formato HH:mm']
  },
  fin: {
    type: String,
    required: [true, 'La hora de fin es obligatoria (o envíe duracion en minutos)'],
    trim: true,
    match: [REGEX_HORA_FIN, 'La hora de fin debe tener el formato HH:mm'],
    validate: {
      // La hora de fin debe ser posterior a la de inicio
      validator: function (fin) {
        if (!REGEX_HORA.test(this.inicio ?? '')) {
          return true; // El error de inicio ya lo informa su propio validador
        }

        return convertirHoraAMinutos(fin) > convertirHoraAMinutos(this.inicio);
      },
      message: 'La hora de fin debe ser posterior a la hora de inicio'
    }
  },
  // Corresponde al campo `id` del modelo Mesa (ej. "T-01")
  mesa: {
    type: String,
    required: [true, 'La mesa es obligatoria'],
    trim: true,
    uppercase: true,
    match: [/^[A-Za-z]-\d{2}$/, 'La mesa debe tener el formato T-01']
  },
  observaciones: {
    type: String,
    default: '',
    trim: true,
    maxlength: [300, 'Las observaciones no pueden superar los 300 caracteres']
  },
  estado: {
    type: String,
    enum: {
      values: ESTADOS_RESERVA,
      message: 'Estado de reserva no válido'
    },
    default: 'confirmada'
  }
}, {
  timestamps: true,
  collection: 'reservas'
});

// Para listar por día y hora
reservaSchema.index({ fecha: 1, inicio: 1 });

// Para buscar las reservas de un cliente
reservaSchema.index({ clienteRut: 1 });

// Una mesa no puede tener dos reservas activas que empiecen a la misma hora
reservaSchema.index(
  { mesa: 1, fecha: 1, inicio: 1 },
  {
    unique: true,
    partialFilterExpression: {
      estado: { $in: ['pendiente', 'confirmada', 'en-espera'] }
    }
  }
);

export const Reserva = mongoose.model('Reserva', reservaSchema);
