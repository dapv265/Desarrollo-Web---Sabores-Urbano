import {
  Armchair,
  CalendarX2,
  Clock3,
  UsersRound,
} from "lucide-react";

import {
  formatearDia,
  textoEstado,
} from "../../utils/reservasUtils";

// Vista Semana / Mes: reservas agrupadas por día.
// En la semana se muestran los 7 días; en el mes, solo los días con reservas.
export default function ListaReservas({
  dias,
  reservas,
  mostrarDiasVacios,
  reservaSeleccionada,
  onSeleccionarReserva,
}) {
  const grupos = dias
    .map((dia) => ({
      dia,
      reservas: reservas
        .filter((reserva) => reserva.fecha === dia)
        .sort((a, b) =>
          a.inicio.localeCompare(b.inicio) || a.mesa.localeCompare(b.mesa)
        ),
    }))
    .filter((grupo) => mostrarDiasVacios || grupo.reservas.length > 0);

  if (grupos.length === 0) {
    return (
      <div className="lista-reservas-vacia">
        <CalendarX2 />
        <p>No hay reservas en este período.</p>
      </div>
    );
  }

  return (
    <div className="lista-reservas">

      {grupos.map((grupo) => (

        <section key={grupo.dia} className="grupo-dia-reservas">

          <h3>
            <span>
              {formatearDia(grupo.dia)}
            </span>

            <small>
              {grupo.reservas.length === 1
                ? "1 reserva"
                : `${grupo.reservas.length} reservas`}
            </small>
          </h3>

          {grupo.reservas.length === 0 ? (
            <p className="sin-reservas-dia">Sin reservas</p>
          ) : (
            <ul>
              {grupo.reservas.map((reserva) => (
                <li key={reserva._id}>
                  <button
                    type="button"
                    className={
                      "fila-reserva " +
                      reserva.estado +
                      (reservaSeleccionada?._id === reserva._id
                        ? " seleccionada"
                        : "")
                    }
                    onClick={() => onSeleccionarReserva(reserva)}
                  >
                    <span className="fila-reserva-hora">
                      <Clock3 />
                      {reserva.inicio} - {reserva.fin}
                    </span>

                    <span className="fila-reserva-mesa">
                      <Armchair />
                      Mesa {reserva.mesa}
                    </span>

                    <strong className="fila-reserva-cliente">
                      {reserva.cliente}
                    </strong>

                    <span className="fila-reserva-personas">
                      <UsersRound />
                      {reserva.personas}
                    </span>

                    <span className={`etiqueta-estado ${reserva.estado}`}>
                      {textoEstado(reserva.estado)}
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}

        </section>

      ))}

    </div>
  );
}
