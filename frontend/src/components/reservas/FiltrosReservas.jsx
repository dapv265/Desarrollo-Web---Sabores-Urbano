import {
  ListFilter,
  RotateCcw,
  Store,
  UsersRound,
} from "lucide-react";

export default function FiltrosReservas({
  estados,
  onCambiarEstado,
  onLimpiar,
}) {
  return (
    <>
      <section className="seccion-filtro">

        <label htmlFor="restaurante">
          <Store />
          Restaurante
        </label>

        <select id="restaurante">
          <option>Sede Centro</option>
          <option>Sede Norte</option>
          <option>Sede Sur</option>
        </select>

      </section>

      <section className="seccion-filtro">

        <label htmlFor="cantidadPersonas">
          <UsersRound />
          Cantidad de personas
        </label>

        <select id="cantidadPersonas">
          <option value="2">2 personas</option>
          <option value="4">4 personas</option>
          <option value="6">6 personas</option>
          <option value="8">8 personas</option>
        </select>

      </section>

      <section className="seccion-filtro">

        <h3>
          <ListFilter />
          Estado
        </h3>

        {Object.keys(estados).map((estado) => (

          <label
            className="opcion-filtro"
            key={estado}
          >

            <input
              type="checkbox"
              checked={estados[estado]}
              onChange={() =>
                onCambiarEstado(estado)
              }
            />

            <span
              className={`punto-estado ${estado}`}
            />

            {estado === "en-espera"
              ? "En espera"
              : estado.charAt(0).toUpperCase() +
                estado.slice(1)}

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