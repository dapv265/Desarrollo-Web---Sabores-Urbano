import {
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

export default function MiniCalendario({
  diaSeleccionado,
  onSeleccionarDia,
}) {
  return (
    <section className="mini-calendario">

      <div className="navegacion-mini-calendario">

        <button
          type="button"
          className="flecha-calendario"
        >
          <ChevronLeft />
        </button>

        <strong>Octubre 2026</strong>

        <button
          type="button"
          className="flecha-calendario"
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

        {Array.from(
          { length: 31 },
          (_, index) => {
            const dia = index + 1;

            return (
              <button
                key={dia}
                type="button"
                className={
                  diaSeleccionado === dia
                    ? "dia-seleccionado"
                    : ""
                }
                onClick={() =>
                  onSeleccionarDia(dia)
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