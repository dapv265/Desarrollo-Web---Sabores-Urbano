const cors = require("cors");
const express = require("express");

const authRoutes = require("./routes/auth.routes");
const clienteRoutes = require("./routes/cliente.routes");
const { errorHandler, notFound } = require("./middlewares/error.middleware");

const app = express();
const frontendOrigin =
  process.env.FRONTEND_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: frontendOrigin }));
app.use(express.json());
app.use("/api/clientes", clienteRoutes);
app.use("/api/auth", authRoutes);
app.use(notFound);
app.use(errorHandler);

module.exports = app;
