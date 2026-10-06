import { ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function HeaderReservas() {
  return (
    <header className="cabecera-principal-reservas">
      <div className="titulos-cabecera">
        <span className="etiqueta-reservas">
          GESTIÓN DE RESERVAS
        </span>

        <h1>Calendario de Reservas</h1>
      </div>

      <Link
        to="/"
        className="boton-volver-sitio"
      >
        <ArrowLeft />
        <span>Volver al sitio</span>
      </Link>
    </header>
  );
}