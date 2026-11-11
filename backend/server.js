const connectDB = require("./src/config/db");
const app = require("./src/app");

const port = process.env.PORT || 3001;

async function startServer() {
  await connectDB();

  app.listen(port, () => {
    console.log(`Backend escuchando en el puerto ${port}.`);
  });
}

startServer().catch((error) => {
  console.error("Error al iniciar el backend:", error);
  process.exitCode = 1;
});
