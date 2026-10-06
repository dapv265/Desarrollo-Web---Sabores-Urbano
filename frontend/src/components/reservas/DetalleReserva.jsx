import {
  Armchair,
  CalendarDays,
  Clock3,
  Phone,
  UsersRound,
  X,
} from "lucide-react";

export default function DetalleReserva({
  reserva,
  onCerrar,
}) {
  if (!reserva) {
    return (
      <aside className="detalle-reserva">

        <div className="encabezado-detalle">
          <h2>Detalle de reserva</h2>
        </div>

        <div className="contenido-detalle">
          <p>
            Selecciona una reserva para ver
            sus detalles.
          </p>
        </div>

      </aside>
    );
  }

  return (
    <aside className="detalle-reserva">

      <div className="encabezado-detalle">

        <h2>Detalle de reserva</h2>

        <button
          type="button"
          className="cerrar-detalle"
          onClick={onCerrar}
        >
          <X />
        </button>

      </div>

      <div
        className={`estado-reserva ${reserva.estado}`}
      >
        {reserva.estado}
      </div>

      <div className="contenido-detalle">

        <div className="avatar-cliente">
          {reserva.cliente
            .split(" ")
            .map((palabra) => palabra[0])
            .slice(0, 2)
            .join("")}
        </div>

        <h3>
          {reserva.cliente}
        </h3>

        <p>
          <CalendarDays />
          {reserva.fecha}
        </p>

        <p>
          <Clock3 />
          {reserva.inicio} - {reserva.fin}
        </p>

        <p>
          <UsersRound />
          {reserva.personas} personas
        </p>

        <p>
          <Armchair />
          Mesa {reserva.mesa}
        </p>

        <p>
          <Phone />
          {reserva.telefono}
        </p>

      </div>

    </aside>
  );
}