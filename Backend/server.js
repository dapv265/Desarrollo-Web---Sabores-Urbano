
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import mesaRoutes from './routes/mesaRoutes.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Configuración general
app.use(cors());
app.use(express.json());

// Ruta para comprobar que funciona
app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Sabores Urbanos funcionando'
  });
});

// Rutas de RF3 y RF5
app.use('/api/mesas', mesaRoutes);

// Conectar MongoDB e iniciar servidor
const iniciarServidor = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
  });
};

iniciarServidor();
