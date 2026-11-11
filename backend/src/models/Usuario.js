const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const { ROLES, ROLES_LOCALES } = require("../constants/roles");

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const usuarioSchema = new mongoose.Schema(
  {
    nombre: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
      match: [EMAIL_PATTERN, "Ingrese un email válido."],
    },
    password: {
      type: String,
      required: true,
      minlength: 8,
      select: false,
    },
    rol: {
      type: String,
      required: true,
      enum: Object.values(ROLES),
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
  { timestamps: true },
);

usuarioSchema.pre("validate", function () {
  if (ROLES_LOCALES.includes(this.rol) && !this.restaurante) {
    this.invalidate(
      "restaurante",
      "Este rol debe estar asociado a un restaurante.",
    );
  }

  if (this.rol === "Administrador General" && this.restaurante) {
    this.invalidate(
      "restaurante",
      "El Administrador General no debe estar asociado a un restaurante.",
    );
  }
});

usuarioSchema.pre("save", async function () {
  if (this.isModified("password")) {
    this.password = await bcrypt.hash(this.password, 12);
  }
});

usuarioSchema.methods.compararPassword = async function (password) {
  if (!this.password) {
    throw new Error(
      "La contraseña no está seleccionada; consulta el usuario con +password.",
    );
  }

  return bcrypt.compare(password, this.password);
};

module.exports =
  mongoose.models.Usuario || mongoose.model("Usuario", usuarioSchema);
