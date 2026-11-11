import mongoose from 'mongoose';

const reporteSchema = new mongoose.Schema(
  {
    periodo: { type: String, required: true }, // ej: "2026-10" (Año-Mes)
    restaurante: { 
      type: mongoose.Schema.Types.ObjectId, 
      ref: 'Restaurante', 
      required: true 
    },
    pedidosTotales: { type: Number, required: true, default: 0 },
    ventasTotales: { type: Number, required: true, default: 0 }, // En números (ej: 8200000, NO "$8.200.000")
    tasaOcupacion: { type: Number, required: true, default: 0 }, // En porcentaje número (ej: 85, NO "85%")
    platosMasVendidos: [
      {
        nombre: { type: String, required: true },
        categoria: { type: String, required: true },
        cantidad: { type: Number, required: true },
        totalRecaudado: { type: Number, required: true }
      }
    ]
  },
  { timestamps: true }
);

export const Reporte = mongoose.model('Reporte', reporteSchema);