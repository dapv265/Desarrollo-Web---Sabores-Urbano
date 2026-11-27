import { useEffect, useState } from "react";

import {
  Armchair,
  Calendar,
  CalendarPlus,
  IdCard,
  Clock,
  HeartHandshake,
  Info,
  MessageSquareText,
  Pencil,
  Phone,
  Timer,
  UserRound,
  UsersRound,
  X,
} from "lucide-react";

import { duraciones } from "../../data/reservasData";

import {
  comprobarDisponibilidadReserva,
  obtenerReservas,
} from "../../services/reservasService";

import {
  calcularDuracion,
  calcularHoraFinal,
  hayCruceDeHorario,
} from "../../utils/reservasUtils";

const MENSAJE_INICIAL =
  "Seleccione fecha, hora y mesa para comprobar disponibilidad.";

const ESTADO_INICIAL_DISPONIBILIDAD = {
  disponible: null,
  mensaje: MENSAJE_INICIAL,
  errores: [],
};

// Estado de la mesa en tiempo real que conviene avisar (igual se puede reservar)
const TEXTO_ESTADO_MESA = {
  ocupada: "ocupada",
  reservada: "reservada",
  limpieza: "en limpieza",
};

// Se monta al abrirse: los valores iniciales se leen solo una vez.
// `reservaEditar` = reserva a editar (modo edición) o null (nueva reserva).
// `valoresIniciales` = { fecha, hora, mesa } para una reserva nueva.
export default function ModalReserva({
  mesas,
  horarios,
  reservaEditar,
  valoresIniciales,
  onCerrar,
  onGuardar,
}) {
  const esEdicion = Boolean(reservaEditar);
  const base = reservaEditar ?? {};

  const duracionInicial = esEdicion
    ? String(calcularDuracion(base.inicio, base.fin))
    : "60";

  const [cliente, setCliente] = useState(base.cliente ?? "");
  const [clienteRut, setClienteRut] = useState(base.clienteRut ?? "");
  const [telefono, setTelefono] = useState(base.telefono ?? "");
  const [personas, setPersonas] = useState(String(base.personas ?? 2));
  const [fecha, setFecha] = useState(base.fecha ?? valoresIniciales.fecha);
  const [hora, setHora] = useState(base.inicio ?? valoresIniciales.hora ?? "");
  const [duracion, setDuracion] = useState(duracionInicial);
  const [mesa, setMesa] = useState(base.mesa ?? valoresIniciales.mesa ?? "");
  const [observaciones, setObservaciones] =
    useState(base.observaciones ?? "");

  const [comprobando, setComprobando] = useState(false);
  const [guardando, setGuardando] = useState(false);

  const [mensajeDisponibilidad, setMensajeDisponibilidad] =
    useState(ESTADO_INICIAL_DISPONIBILIDAD);

  // Cerrar con la tecla Escape
  useEffect(() => {
    function manejarTecla(evento) {
      if (evento.key === "Escape") onCerrar();
    }

    window.addEventListener("keydown", manejarTecla);
    return () => window.removeEventListener("keydown", manejarTecla);
  }, [onCerrar]);

  // Si la duración guardada no está en la lista (ej. 150 min), se agrega
  const opcionesDuracion = duraciones.some(
    (opcion) => String(opcion.valor) === duracionInicial
  )
    ? duraciones
    : [...duraciones, { valor: Number(duracionInicial), texto: `${duracionInicial} minutos` }];

  // Mesas con capacidad suficiente. Las "fuera" no se ofrecen,
  // salvo la mesa actual de la reserva que se edita (para no dejar el campo vacío).
  const mesasAptas = mesas.filter(
    (item) =>
      item.capacidad >= Number(personas) &&
      (item.estado !== "fuera" || item.id === base.mesa)
  );

  const mesaElegida = mesas.find((item) => item.id === mesa);
  const estadoMesaAhora = TEXTO_ESTADO_MESA[mesaElegida?.estado];

  const enviando = comprobando || guardando;

  // Cambia un campo y borra el resultado anterior de disponibilidad
  function cambiarCampo(setter) {
    return (valor) => {
      setter(valor);
      setMensajeDisponibilidad(ESTADO_INICIAL_DISPONIBILIDAD);
    };
  }

  function cambiarPersonas(valor) {
    cambiarCampo(setPersonas)(valor);

    // Si la mesa elegida ya no alcanza, se deselecciona
    const actual = mesas.find((item) => item.id === mesa);
    if (actual && actual.capacidad < Number(valor)) {
      setMesa("");
    }
  }

  // En edición, el backend puede informar como conflicto a la misma reserva.
  // Si es así, se revisa que no haya OTRA reserva que se cruce.
  async function revisarConflictoPropio(resultado) {
    const horaFinal = calcularHoraFinal(hora, duracion);

    const reservasMesa = await obtenerReservas({ fecha, mesa });

    const otra = reservasMesa.find(
      (item) =>
        item._id !== reservaEditar._id &&
        item.estado !== "cancelada" &&
        hayCruceDeHorario(hora, horaFinal, item.inicio, item.fin)
    );

    if (otra) {
      return {
        ...resultado,
        mensaje: `Mesa ${mesa} no disponible entre ${hora} y ${horaFinal} (${otra.cliente}).`,
        conflicto: otra,
      };
    }

    return {
      disponible: true,
      mensaje: `Mesa ${mesa} disponible entre ${hora} y ${horaFinal}.`,
      conflicto: null,
    };
  }

  async function comprobarDisponibilidad() {
    if (!fecha || !hora || !mesa) {
      const resultado = {
        disponible: false,
        mensaje: "Complete fecha, hora y mesa para comprobar disponibilidad.",
        errores: [],
      };
      setMensajeDisponibilidad(resultado);
      return resultado;
    }

    setComprobando(true);

    try {
      let resultado = await comprobarDisponibilidadReserva({
        fecha,
        inicio: hora,
        duracion,
        mesa,
        personas,
      });

      if (
        esEdicion &&
        !resultado.disponible &&
        resultado.conflicto?._id === reservaEditar._id
      ) {
        resultado = await revisarConflictoPropio(resultado);
      }

      const final = { ...resultado, errores: [] };
      setMensajeDisponibilidad(final);
      return final;
    } catch (error) {
      const resultado = {
        disponible: false,
        mensaje: error.message,
        errores: error.errores ?? [],
      };
      setMensajeDisponibilidad(resultado);
      return resultado;
    } finally {
      setComprobando(false);
    }
  }

  async function manejarSubmit(evento) {
    evento.preventDefault();

    const resultado =
      await comprobarDisponibilidad();

    // Una reserva cancelada no ocupa la mesa, así que se puede guardar igual
    const ocupaMesa = !esEdicion || reservaEditar.estado !== "cancelada";

    if (!resultado.disponible && ocupaMesa) {
      return;
    }

    const datosReserva = {
      clienteRut: clienteRut.trim().toUpperCase(),
      cliente: cliente.trim(),
      telefono: telefono.trim(),
      personas: Number(personas),
      fecha,
      inicio: hora,
      duracion: Number(duracion),
      mesa,
      observaciones: observaciones.trim(),
    };

    // Las nuevas parten confirmadas; al editar se mantiene el estado actual
    if (!esEdicion) {
      datosReserva.estado = "confirmada";
    }

    setGuardando(true);

    try {
      // Si todo sale bien, el padre cierra (desmonta) el modal
      await onGuardar(datosReserva);
    } catch (error) {
      setMensajeDisponibilidad({
        disponible: false,
        mensaje: error.message,
        errores: error.errores ?? [],
      });
      setGuardando(false);
    }
  }

  return (
    <div
      className="fondo-modal activo"
      onClick={(evento) => {
        if (evento.target === evento.currentTarget && !guardando) {
          onCerrar();
        }
      }}
    >
      <section
        className="modal-reserva"
        role="dialog"
        aria-modal="true"
        aria-labelledby="tituloModalReserva"
      >

        <div className="encabezado-modal">

          <div className="titulo-modal">

            <div className="icono-modal">
              {esEdicion ? <Pencil /> : <CalendarPlus />}
            </div>

            <div>
              <h2 id="tituloModalReserva">
                {esEdicion ? "Editar reserva" : "Nueva reserva"}
              </h2>

              <p>
                {esEdicion
                  ? "Modifica los datos y comprueba la disponibilidad."
                  : "Registra los datos del cliente y comprueba la disponibilidad."}
              </p>
            </div>

          </div>

          <button
            type="button"
            onClick={onCerrar}
            disabled={guardando}
            aria-label="Cerrar"
          >
            <X />
          </button>

        </div>

        <form
          className="formulario-reserva"
          onSubmit={manejarSubmit}
        >

          <div className="grupo-formulario campo-completo">

            <label htmlFor="nombreCliente">
              <UserRound />
              Cliente
            </label>

            <input
              id="nombreCliente"
              type="text"
              placeholder="Nombre del cliente"
              value={cliente}
              onChange={(evento) =>
                setCliente(evento.target.value)
              }
              minLength={2}
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="rutCliente">
              <IdCard />
              RUT
            </label>

            <input
              id="rutCliente"
              type="text"
              placeholder="12.345.678-9"
              pattern="\d{1,2}\.\d{3}\.\d{3}-[\dkK]"
              title="Formato 12.345.678-9"
              value={clienteRut}
              onChange={(evento) =>
                setClienteRut(evento.target.value)
              }
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="telefonoCliente">
              <Phone />
              Teléfono
            </label>

            <input
              id="telefonoCliente"
              type="tel"
              placeholder="+56 9..."
              value={telefono}
              onChange={(evento) =>
                setTelefono(evento.target.value)
              }
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="personasReserva">
              <UsersRound />
              Personas
            </label>

            <select
              id="personasReserva"
              value={personas}
              onChange={(evento) =>
                cambiarPersonas(evento.target.value)
              }
            >
              {Array.from({ length: 12 }, (_, index) => index + 1).map((cantidad) => (
                <option key={cantidad} value={cantidad}>
                  {cantidad} {cantidad === 1 ? "persona" : "personas"}
                </option>
              ))}
            </select>

          </div>

          <div className="grupo-formulario">

            <label htmlFor="fechaReserva">
              <Calendar />
              Fecha
            </label>

            <input
              id="fechaReserva"
              type="date"
              value={fecha}
              onChange={(evento) =>
                cambiarCampo(setFecha)(evento.target.value)
              }
              required
            />

          </div>

          <div className="grupo-formulario">

            <label htmlFor="horaReserva">
              <Clock />
              Hora
            </label>

            <select
              id="horaReserva"
              value={hora}
              onChange={(evento) =>
                cambiarCampo(setHora)(evento.target.value)
              }
              required
            >
              <option value="">Seleccione hora</option>
              {horarios.map((horario) => (
                <option key={horario} value={horario}>
                  {horario}
                </option>
              ))}
            </select>

          </div>

          <div className="grupo-formulario">

            <label htmlFor="duracionReserva">
              <Timer />
              Duración
            </label>

            <select
              id="duracionReserva"
              value={duracion}
              onChange={(evento) =>
                cambiarCampo(setDuracion)(evento.target.value)
              }
            >
              {opcionesDuracion.map((opcion) => (
                <option key={opcion.valor} value={opcion.valor}>
                  {opcion.texto}
                </option>
              ))}
            </select>

          </div>

          <div className="grupo-formulario">

            <label htmlFor="mesaReserva">
              <Armchair />
              Mesa
            </label>

            <select
              id="mesaReserva"
              value={mesa}
              onChange={(evento) =>
                cambiarCampo(setMesa)(evento.target.value)
              }
              required
            >
              <option value="">Seleccione mesa</option>
              {mesasAptas.map((item) => (
                <option key={item.id} value={item.id}>
                  Mesa {item.numero} - {item.zona} - {item.capacidad} personas
                  {item.estado === "fuera" ? " (fuera de servicio)" : ""}
                </option>
              ))}
            </select>

          </div>

          {/* El estado de la mesa es en tiempo real: no impide reservar otro horario */}
          {estadoMesaAhora && (
            <p className="aviso-mesa-ahora campo-completo">
              <Info />
              La mesa {mesa} está {estadoMesaAhora} en este momento.
              Puedes reservarla igual si el horario elegido está libre.
            </p>
          )}

          <div className="grupo-formulario campo-completo">

            <label htmlFor="observacionesReserva">
              <MessageSquareText />
              Observaciones
            </label>

            <textarea
              id="observacionesReserva"
              rows="3"
              maxLength={300}
              placeholder="Ej: mesa cerca de la ventana"
              value={observaciones}
              onChange={(evento) =>
                setObservaciones(
                  evento.target.value
                )
              }
            />

          </div>

          <div
            className={
              "mensaje-disponibilidad campo-completo " +
              (
                mensajeDisponibilidad.disponible === true
                  ? "disponible"
                  : mensajeDisponibilidad.disponible === false
                    ? "no-disponible"
                    : ""
              )
            }
            role="status"
          >
            <span>
              {mensajeDisponibilidad.mensaje}
            </span>

            {/* Detalle de los errores de validación del backend */}
            {mensajeDisponibilidad.errores?.length > 0 && (
              <ul className="lista-errores-reserva">
                {mensajeDisponibilidad.errores.map((error) => (
                  <li key={error}>{error}</li>
                ))}
              </ul>
            )}
          </div>

          <div className="acciones-modal campo-completo">

            <button
              type="button"
              onClick={onCerrar}
              disabled={guardando}
            >
              Cancelar
            </button>

            <button
              type="button"
              className="boton-cambiar-mesa"
              onClick={comprobarDisponibilidad}
              disabled={enviando}
            >
              {comprobando && !guardando
                ? "Comprobando..."
                : "Comprobar disponibilidad"}
            </button>

            <button
              type="submit"
              className="boton-confirmar-reserva"
              disabled={enviando}
            >
              <HeartHandshake />

              {guardando
                ? "Guardando..."
                : esEdicion
                  ? "Guardar cambios"
                  : "Confirmar reserva"}
            </button>

          </div>

        </form>

      </section>
    </div>
  );
}
