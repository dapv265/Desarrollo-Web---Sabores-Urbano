import path from 'node:path';
import { fileURLToPath } from 'node:url';

import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { connectDB } from './config/db.js';
import authRoutes from './routes/authRoutes.js';
import clienteRoutes from './routes/clienteRoutes.js';
import mesaRoutes from './routes/mesaRoutes.js';
import pedidoRoutes from './routes/pedidoRoutes.js';
import reporteRoutes from './routes/reporteRoutes.js';
import reservaRoutes from './routes/reservaRoutes.js';
import restauranteRoutes from './routes/restauranteRoutes.js';
import { errorHandler, notFound } from './middleware/errorMiddleware.js';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

const corsOptions = process.env.FRONTEND_ORIGIN
  ? {
      origin: process.env.FRONTEND_ORIGIN.split(',').map((origin) => origin.trim()),
    }
  : undefined;

app.use(cors(corsOptions));
app.use(express.json());

app.get('/', (req, res) => {
  res.json({
    mensaje: 'API Sabores Urbanos funcionando'
  });
});

app.use('/api/auth', authRoutes);
app.use('/api/clientes', clienteRoutes);
app.use('/api/mesas', mesaRoutes);
app.use('/api/pedidos', pedidoRoutes);
app.use('/api/reportes', reporteRoutes);
app.use('/api/reservas', reservaRoutes);
app.use('/api/restaurantes', restauranteRoutes);

app.use(notFound);
app.use(errorHandler);

const iniciarServidor = async () => {
  await connectDB();

  app.listen(PORT, () => {
    console.log(`Servidor funcionando en puerto ${PORT}`);
  });
};

const esEjecucionDirecta =
  process.argv[1] &&
  path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (esEjecucionDirecta) {
  iniciarServidor();
}

export { app, iniciarServidor };
