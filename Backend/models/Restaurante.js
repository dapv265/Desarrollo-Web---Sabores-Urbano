import mongoose from 'mongoose';

const restauranteSchema = new mongoose.Schema(
  {
    codigo: { type: String, required: true, unique: true }, // ej: "LOC-01"
    nombre: { type: String, required: true },
    direccion: { type: String, required: true },
    telefono: { type: String, required: true },
    horario: { type: String, required: true },
    capacidadMesas: { type: Number, required: true, min: 1 },
    estado: { 
      type: String, 
      enum: ['Operativo', 'En Mantención', 'Cerrado'], 
      default: 'Operativo' 
    }
  },
  { timestamps: true } // Crea automáticamente campos createdAt y updatedAt
);

export const Restaurante = mongoose.model('Restaurante', restauranteSchema);