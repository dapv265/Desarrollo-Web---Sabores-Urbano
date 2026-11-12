import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI, {
      serverSelectionTimeoutMS: 2000
    });
    console.log(`MongoDB Conectado: ${conn.connection.host}`);
  } catch (error) {
    try {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create({
        instance: { port: 27017, ip: '127.0.0.1', dbName: 'sabores_urbanos' }
      }).catch(() => MongoMemoryServer.create());
      const uri = `${mongod.getUri()}sabores_urbanos`;
      const conn = await mongoose.connect(uri);
      console.log(`MongoDB Conectado (Local en Memoria): ${conn.connection.host}`);
    } catch {
      console.error(`Error al conectar a MongoDB: ${error.message}`);
      process.exit(1);
    }
  }
};
