const mongoose = require("mongoose");

const PHONE_PATTERN = /^\+?[0-9][0-9\s().-]*[0-9]$/;

const restauranteSchema = new mongoose.Schema(
  {
    codigo: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      uppercase: true,
    },
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    direccion: {
      type: String,
      required: true,
      trim: true,
    },
    telefono: {
      type: String,
      trim: true,
      validate: {
        validator: (value) =>
          !value ||
          (PHONE_PATTERN.test(value) &&
            value.replace(/\D/g, "").length >= 8),
        message: "Ingrese un teléfono válido.",
      },
    },
    activo: {
      type: Boolean,
      default: true,
    },
  },
  { timestamps: true },
);

module.exports =
  mongoose.models.Restaurante ||
  mongoose.model("Restaurante", restauranteSchema);
