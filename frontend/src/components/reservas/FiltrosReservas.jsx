import {
  ListFilter,
  RotateCcw,
  UsersRound,
} from "lucide-react";

import {
  estadosReserva,
  opcionesPersonas,
} from "../../data/reservasData";

// El filtro de restaurante se oculta: las mesas aún no tienen restauranteCodigo
export default function FiltrosReservas({
  estados,
  onCambiarEstado,
  personasMinimas,
  onCambiarPersonas,
  onLimpiar,
}) {
  return (
    <>
      <section className="seccion-filtro">

        <label htmlFor="cantidadPersonas">
          <UsersRound />
          Capacidad de la mesa
        </label>

        <select
          id="cantidadPersonas"
          value={personasMinimas}
          onChange={(evento) =>
            onCambiarPersonas(Number(evento.target.value))
          }
        >
          <option value="0">Todas las mesas</option>
          {opcionesPersonas.map((cantidad) => (
            <option key={cantidad} value={cantidad}>
              {cantidad} o más personas
            </option>
          ))}
        </select>

      </section>

      <section className="seccion-filtro">

        <h3>
          <ListFilter />
          Estado
        </h3>

        {estadosReserva.map(({ valor, texto }) => (

          <label
            className="opcion-filtro"
            key={valor}
          >

            <input
              type="checkbox"
              checked={estados[valor]}
              onChange={() =>
                onCambiarEstado(valor)
              }
            />

            <span
              className={`punto-estado ${valor}`}
            />

            {texto}

          </label>

        ))}

      </section>

      <button
        type="button"
        className="boton-limpiar-filtros"
        onClick={onLimpiar}
      >
        <RotateCcw />
        Limpiar filtros
      </button>
    </>
  );
}
