const mongoose = require("mongoose");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;
const RUT_PATTERN = /^(?:\d{1,2}(?:\.\d{3}){2}|\d{7,8})-[\dkK]$/;

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
          PHONE_PATTERN.test(value) && value.replace(/\D/g, "").length >= 8,
        message: "Ingrese un teléfono válido.",
      },
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, "Ingrese un email válido."],
    },
    rut: {
      type: String,
      required: true,
      trim: true,
      uppercase: true,
      match: [RUT_PATTERN, "Ingrese un RUT con formato válido."],
    },
    // La colección y las operaciones de reservas quedan para un paso posterior.
    ultimaReserva: {
      type: String,
      default: "Sin reservas previas",
      trim: true,
    },
    estado: {
      type: String,
      enum: ["Activo", "Inactivo"],
      default: "Activo",
    },
    restaurante: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Restaurante",
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

clienteSchema.pre("validate", function () {
  if (this.isModified("estado") && !this.isModified("activo")) {
    this.activo = this.estado === "Activo";
  }
});

module.exports =
  mongoose.models.Cliente || mongoose.model("Cliente", clienteSchema);
