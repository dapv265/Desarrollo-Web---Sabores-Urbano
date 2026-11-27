import {
  CalendarDays,
  CalendarHeart,
  ChevronRight,
} from "lucide-react";

import MiniCalendario from "./MiniCalendario";
import FiltrosReservas from "./FiltrosReservas";

export default function SidebarReservas({
  fechaSeleccionada,
  onSeleccionarFecha,
  estados,
  onCambiarEstado,
  onLimpiar,
}) {
  return (
    <aside className="barra-lateral-reservas">

      <div className="barra-lateral-mini">

        <div className="icono-fecha-lateral">
          <CalendarHeart />
        </div>

        <ChevronRight className="flecha-desplegar" />

      </div>

      <div className="contenido-barra-lateral">

        <div className="titulo-selector-fecha">

          <div className="icono-selector-fecha">
            <CalendarDays />
          </div>

          <div>
            <span>RESERVAS</span>
            <h2>Seleccionar fecha</h2>
          </div>

        </div>

        <MiniCalendario
          fechaSeleccionada={fechaSeleccionada}
          onSeleccionarFecha={onSeleccionarFecha}
        />

        <div className="separador-lateral" />

        <FiltrosReservas
          estados={estados}
          onCambiarEstado={onCambiarEstado}
          onLimpiar={onLimpiar}
        />

      </div>
    </aside>
  );
}