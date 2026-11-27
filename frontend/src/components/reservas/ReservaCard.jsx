import { Users } from "lucide-react";

import { textoEstado } from "../../utils/reservasUtils";

export default function ReservaCard({
  reserva,
  onSeleccionar,
}) {
  const textoPersonas =
    `${reserva.personas} ${reserva.personas === 1 ? "persona" : "personas"}`;

  return (
    <article
      className={`reserva ${reserva.estado}`}
      onClick={() => onSeleccionar(reserva)}
      // Texto completo al pasar el mouse (el nombre se corta a 2 líneas)
      title={`${reserva.cliente} · ${reserva.inicio} - ${reserva.fin} · ${textoPersonas} · ${textoEstado(reserva.estado)}`}
      // También se puede abrir con el teclado
      role="button"
      tabIndex={0}
      onKeyDown={(evento) => {
        if (evento.key === "Enter" || evento.key === " ") {
          evento.preventDefault();
          onSeleccionar(reserva);
        }
      }}
    >
      <strong className="nombre-reserva">
        {reserva.cliente}
      </strong>

      <span className="hora-reserva">
        {reserva.inicio} - {reserva.fin}
      </span>

      <small className="cantidad-personas-reserva">
        <Users />

        {textoPersonas}
      </small>

    </article>
  );
}
