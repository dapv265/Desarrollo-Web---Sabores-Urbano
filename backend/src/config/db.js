const path = require("path");
const mongoose = require("mongoose");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, "../../.env") });

async function connectDB() {
  const mongoUri = process.env.MONGO_URI;
  if (!mongoUri) {
    throw new Error("Define MONGO_URI en backend/.env antes de conectar a MongoDB.");
  }

  await mongoose.connect(mongoUri);
  console.log("Conexión a MongoDB establecida.");
  return mongoose.connection;
}

module.exports = connectDB;
