import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

// Carpeta donde se guardan los datos del MongoDB local de respaldo.
// Queda fuera de OneDrive para evitar bloqueos de archivos al sincronizar.
const CARPETA_DATOS_LOCAL =
  process.env.MONGO_DATA_DIR ||
  path.join(os.homedir(), '.sabores-urbanos', 'mongo-data');

let servidorLocal = null;

const iniciarMongoLocal = async () => {
  const { MongoMemoryServer } = await import('mongodb-memory-server');

  fs.mkdirSync(CARPETA_DATOS_LOCAL, { recursive: true });

  const opciones = {
    dbName: 'sabores_urbanos',
    dbPath: CARPETA_DATOS_LOCAL,
    storageEngine: 'wiredTiger'
  };

  // Intenta usar el puerto estándar; si está ocupado, usa uno libre.
  servidorLocal = await MongoMemoryServer.create({
    instance: { ...opciones, port: 27017, ip: '127.0.0.1' }
  }).catch(() => MongoMemoryServer.create({ instance: opciones }));

  return `${servidorLocal.getUri()}sabores_urbanos`;
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    try {
      const uri = await iniciarMongoLocal();
      const conn = await mongoose.connect(uri);
      console.log(
        `MongoDB Conectado (Local persistente en ${CARPETA_DATOS_LOCAL}): ${conn.connection.host}`
      );
    } catch (errorLocal) {
      console.error(`Error al conectar a MongoDB: ${error.message}`);
      console.error(`Error al iniciar MongoDB local: ${errorLocal.message}`);
      process.exit(1);
    }
  }
};

// Cierra la conexión y el MongoDB local (si se inició) para liberar los archivos.
export const disconnectDB = async () => {
  await mongoose.disconnect();

  if (servidorLocal) {
    await servidorLocal.stop({ doCleanup: false });
    servidorLocal = null;
  }
};
