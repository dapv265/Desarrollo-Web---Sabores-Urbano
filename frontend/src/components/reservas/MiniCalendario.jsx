import { useState } from "react";
import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

import {
  fechaATexto,
  fechaDeHoy,
  textoAFecha,
} from "../../utils/reservasUtils";

export default function MiniCalendario({
  fechaSeleccionada,
  onSeleccionarFecha,
}) {
  // Mes que se está mostrando (puede ser distinto al de la fecha seleccionada)
  const [mesVisible, setMesVisible] = useState(() => {
    const fecha = textoAFecha(fechaSeleccionada);
    return new Date(fecha.getFullYear(), fecha.getMonth(), 1, 12);
  });

  const anio = mesVisible.getFullYear();
  const mes = mesVisible.getMonth();
  const diasDelMes = new Date(anio, mes + 1, 0).getDate();

  // Espacios vacíos antes del día 1 (la semana parte el lunes)
  const espaciosIniciales = (mesVisible.getDay() + 6) % 7;

  const titulo = mesVisible.toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });

  const hoy = fechaDeHoy();

  function cambiarMes(diferencia) {
    setMesVisible(new Date(anio, mes + diferencia, 1, 12));
  }

  return (
    <section className="mini-calendario">

      <div className="navegacion-mini-calendario">

        <button
          type="button"
          className="flecha-calendario"
          onClick={() => cambiarMes(-1)}
          aria-label="Mes anterior"
        >
          <ChevronLeft />
        </button>

        <strong>
          {titulo.charAt(0).toUpperCase() + titulo.slice(1)}
        </strong>

        <button
          type="button"
          className="flecha-calendario"
          onClick={() => cambiarMes(1)}
          aria-label="Mes siguiente"
        >
          <ChevronRight />
        </button>

      </div>

      <div className="dias-mini-calendario">

        <span>Lu</span>
        <span>Ma</span>
        <span>Mi</span>
        <span>Ju</span>
        <span>Vi</span>
        <span>Sá</span>
        <span>Do</span>

        {Array.from({ length: espaciosIniciales }, (_, index) => (
          <span key={`vacio-${index}`} />
        ))}

        {Array.from(
          { length: diasDelMes },
          (_, index) => {
            const dia = index + 1;
            const fecha = fechaATexto(new Date(anio, mes, dia, 12));

            return (
              <button
                key={dia}
                type="button"
                className={
                  fecha === fechaSeleccionada
                    ? "dia-seleccionado"
                    : ""
                }
                title={fecha === hoy ? "Hoy" : undefined}
                style={fecha === hoy && fecha !== fechaSeleccionada ? { fontWeight: 700, textDecoration: "underline" } : undefined}
                onClick={() =>
                  onSeleccionarFecha(fecha)
                }
              >
                {dia}
              </button>
            );
          }
        )}

      </div>
    </section>
  );
}
