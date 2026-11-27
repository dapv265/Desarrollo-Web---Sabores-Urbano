import { useCallback, useEffect, useRef, useState } from "react";

import {
  CircleAlert,
  CircleCheck,
  X,
} from "lucide-react";

import HeaderReservas
  from "../components/reservas/HeaderReservas";

import SidebarReservas
  from "../components/reservas/SidebarReservas";

import CalendarioReservas
  from "../components/reservas/CalendarioReservas";

import DetalleReserva
  from "../components/reservas/DetalleReserva";

import ModalReserva
  from "../components/reservas/ModalReserva";

import { horarios } from "../data/reservasData";

import { obtenerMesas } from "../services/mesasService";

import {
  actualizarReserva,
  cambiarEstadoReserva,
  crearReserva as crearReservaApi,
  eliminarReserva,
  obtenerReservas,
  obtenerReservasPorFecha,
} from "../services/reservasService";

import {
  fechaDeHoy,
  fechasEntre,
  formatearTituloCorto,
  formatearTituloVista,
  obtenerRangoVista,
  sumarDias,
  sumarMeses,
  textoEstado,
} from "../utils/reservasUtils";

import "../styles/reservas.css";

const FILTROS_ESTADO_INICIALES = {
  confirmada: true,
  pendiente: true,
  "en-espera": true,
  cancelada: true,
};

// Tiempo que se muestra el aviso de éxito o error
const DURACION_AVISO = 4000;


export default function ReservasPage() {

  // =========================================================
  // DATOS DEL BACKEND
  // =========================================================

  // Todas las mesas (incluye las "fuera", que se excluyen al mostrar)
  const [mesas, setMesas] =
    useState([]);

  // Reservas del rango cargado. `clave` indica a qué rango corresponden
  const [datosReservas, setDatosReservas] =
    useState({ clave: null, reservas: [] });

  // Se incrementa para volver a pedir las reservas después de una acción
  const [version, setVersion] =
    useState(0);

  // Error al cargar datos (se mantiene hasta que la carga funcione)
  const [error, setError] =
    useState("");

  // Aviso temporal de éxito o error: { tipo: "exito" | "error", texto }
  const [aviso, setAviso] =
    useState(null);


  // =========================================================
  // FECHA SELECCIONADA (AAAA-MM-DD) Y VISTA
  // =========================================================

  const [
    fechaSeleccionada,
    setFechaSeleccionada,
  ] = useState(fechaDeHoy);

  // Día / Semana / Mes
  const [vista, setVista] =
    useState("dia");

  const rango = obtenerRangoVista(fechaSeleccionada, vista);
  const claveRango = `${vista}:${rango.inicio}:${rango.fin}:${version}`;

  // Mientras la clave cargada no sea la actual, se está cargando
  const cargando = datosReservas.clave !== claveRango;


  // =========================================================
  // RESERVA SELECCIONADA, MODAL Y ACCIONES EN CURSO
  // =========================================================

  const [
    reservaSeleccionada,
    setReservaSeleccionada,
  ] = useState(null);

  // null = cerrado; { reserva } para editar o { valores } para una nueva
  const [modal, setModal] =
    useState(null);

  // null, "eliminar" o "estado-<valor>"
  const [accionEnCurso, setAccionEnCurso] =
    useState(null);


  // =========================================================
  // FILTROS
  // =========================================================

  const [
    estados,
    setEstados,
  ] = useState(FILTROS_ESTADO_INICIALES);

  // Capacidad mínima de las mesas (0 = todas)
  const [personasMinimas, setPersonasMinimas] =
    useState(0);


  // =========================================================
  // CARGA DE MESAS Y RESERVAS
  // =========================================================

  const cargarMesas = useCallback(() => {
    return obtenerMesas()
      .then((mesasApi) => {
        setMesas(mesasApi);
      })
      .catch((err) => {
        setError(err.message);
      });
  }, []);

  useEffect(() => {
    let activo = true;

    obtenerMesas()
      .then((mesasApi) => {
        if (activo) setMesas(mesasApi);
      })
      .catch((err) => {
        if (activo) setError(err.message);
      });

    return () => {
      activo = false;
    };
  }, []);

  // Día: se pide la fecha al backend. Semana/Mes: se piden todas
  // y se filtra el rango en el frontend.
  useEffect(() => {
    let activo = true;

    const { inicio, fin } = obtenerRangoVista(fechaSeleccionada, vista);

    const peticion = vista === "dia"
      ? obtenerReservasPorFecha(inicio)
      : obtenerReservas().then((todas) =>
        todas.filter((reserva) =>
          reserva.fecha >= inicio && reserva.fecha <= fin
        )
      );

    peticion
      .then((reservasApi) => {
        if (!activo) return;
        setDatosReservas({ clave: claveRango, reservas: reservasApi });
        setError("");
      })
      .catch((err) => {
        if (!activo) return;
        // Se guarda la clave para no quedar "cargando" para siempre
        setDatosReservas({ clave: claveRango, reservas: [] });
        setError(err.message);
      });

    return () => {
      activo = false;
    };
  }, [fechaSeleccionada, vista, claveRango]);

  // Alto real del Header del sitio (sticky) para que la vista llene
  // exactamente el resto de la ventana. Se guarda como variable CSS.
  const refPagina = useRef(null);

  useEffect(() => {
    const pagina = refPagina.current;
    const headerSitio = [...document.querySelectorAll("header")]
      .find((elemento) => !elemento.closest(".pagina-reservas"));

    if (!pagina || !headerSitio) return undefined;

    const observador = new ResizeObserver(() => {
      pagina.style.setProperty(
        "--alto-header",
        `${headerSitio.getBoundingClientRect().height}px`
      );
    });

    observador.observe(headerSitio);

    return () => observador.disconnect();
  }, []);

  // El aviso desaparece solo a los 4 segundos
  useEffect(() => {
    if (!aviso) return undefined;

    const temporizador = setTimeout(() => setAviso(null), DURACION_AVISO);

    return () => clearTimeout(temporizador);
  }, [aviso]);

  function recargarReservas() {
    setVersion((actual) => actual + 1);
  }

  function mostrarAviso(tipo, texto) {
    setAviso({ tipo, texto, id: Date.now() });
  }


  // =========================================================
  // NAVEGACIÓN DE FECHAS
  // =========================================================

  function seleccionarFecha(fecha) {
    setFechaSeleccionada(fecha);
    setReservaSeleccionada(null);
  }

  // Avanza o retrocede un día, una semana o un mes según la vista
  function navegar(direccion) {
    if (vista === "mes") {
      seleccionarFecha(sumarMeses(fechaSeleccionada, direccion));
    } else {
      seleccionarFecha(sumarDias(fechaSeleccionada, direccion * (vista === "semana" ? 7 : 1)));
    }
  }

  function cambiarVista(nuevaVista) {
    setVista(nuevaVista);
    setReservaSeleccionada(null);
  }


  // =========================================================
  // FILTROS
  // =========================================================

  function cambiarFiltroEstado(estado) {

    setEstados((anteriores) => ({
      ...anteriores,
      [estado]: !anteriores[estado],
    }));

  }

  function limpiarFiltros() {

    setEstados(FILTROS_ESTADO_INICIALES);
    setPersonasMinimas(0);

  }


  // =========================================================
  // MODAL (NUEVA O EDITAR)
  // =========================================================

  // `valores` opcional: { mesa, hora } al hacer clic en una celda vacía
  function abrirNuevaReserva(valores = {}) {

    // Se recargan las mesas para tener su estado actual
    cargarMesas();
    setModal({ valores: { fecha: fechaSeleccionada, ...valores } });

  }

  function abrirEdicion(reserva) {

    cargarMesas();
    setModal({ reserva });

  }

  const cerrarModal = useCallback(() => {
    setModal(null);
  }, []);


  // =========================================================
  // CREAR O EDITAR (lanza el error al modal para que lo muestre)
  // =========================================================

  async function guardarReserva(datosReserva) {

    if (modal.reserva) {
      const actualizada = await actualizarReserva(modal.reserva._id, datosReserva);
      setReservaSeleccionada(actualizada);
      mostrarAviso("exito", "Reserva actualizada correctamente");
    } else {
      const creada = await crearReservaApi(datosReserva);
      setReservaSeleccionada(creada);
      mostrarAviso("exito", "Reserva creada correctamente");
    }

    setModal(null);

    // Se muestra el día de la reserva guardada
    if (vista === "dia" && datosReserva.fecha !== fechaSeleccionada) {
      setFechaSeleccionada(datosReserva.fecha);
    } else if (vista !== "dia" && (datosReserva.fecha < rango.inicio || datosReserva.fecha > rango.fin)) {
      setFechaSeleccionada(datosReserva.fecha);
    }

    recargarReservas();

  }


  // =========================================================
  // CAMBIAR ESTADO (los 4 estados)
  // =========================================================

  async function cambiarEstado(reserva, estado) {

    setAccionEnCurso(`estado-${estado}`);

    try {
      const actualizada = await cambiarEstadoReserva(reserva._id, estado);
      setReservaSeleccionada(actualizada);
      mostrarAviso("exito", `Reserva marcada como ${textoEstado(estado).toLowerCase()}`);
    } catch (err) {
      // Ej: 409 al reactivar una cancelada cuyo horario ya se ocupó
      mostrarAviso("error", err.message);
    } finally {
      setAccionEnCurso(null);
      recargarReservas();
    }

  }


  // =========================================================
  // ELIMINAR
  // =========================================================

  async function eliminar(reserva) {

    setAccionEnCurso("eliminar");

    try {
      await eliminarReserva(reserva._id);
      setReservaSeleccionada(null);
      mostrarAviso("exito", "Reserva eliminada correctamente");
    } catch (err) {
      mostrarAviso("error", err.message);
    } finally {
      setAccionEnCurso(null);
      recargarReservas();
    }

  }


  // =========================================================
  // FILTRAR MESAS Y RESERVAS
  // =========================================================

  // Solo se excluyen las mesas fuera de servicio; ocupada, reservada
  // o limpieza son estados en tiempo real y se pueden reservar
  const mesasVisibles = mesas.filter(
    (mesa) => mesa.estado !== "fuera" && mesa.capacidad >= personasMinimas
  );

  const idsMesasVisibles = new Set(mesasVisibles.map((mesa) => mesa.id));

  const reservasFiltradas =
    datosReservas.reservas.filter((reserva) =>
      estados[reserva.estado] &&
      (personasMinimas === 0 || idsMesasVisibles.has(reserva.mesa))
    );


  // =========================================================
  // INTERFAZ
  // =========================================================

  return (

    <section className="pagina-reservas" ref={refPagina}>

      {error && (
        <p className="aviso-carga-reservas" role="alert">
          <CircleAlert />
          {error}
        </p>
      )}

      {aviso && (
        <div
          key={aviso.id}
          className={`aviso-reservas ${aviso.tipo}`}
          role={aviso.tipo === "error" ? "alert" : "status"}
        >
          {aviso.tipo === "exito" ? <CircleCheck /> : <CircleAlert />}

          <span>{aviso.texto}</span>

          <button
            type="button"
            onClick={() => setAviso(null)}
            aria-label="Cerrar aviso"
          >
            <X />
          </button>
        </div>
      )}

      <section className="contenedor-reservas">


        {/* ===================================================
            ENCABEZADO
        =================================================== */}

        <HeaderReservas />


        {/* ===================================================
            BARRA LATERAL
        =================================================== */}

        <SidebarReservas

          fechaSeleccionada={
            fechaSeleccionada
          }

          onSeleccionarFecha={
            seleccionarFecha
          }

          estados={
            estados
          }

          onCambiarEstado={
            cambiarFiltroEstado
          }

          personasMinimas={
            personasMinimas
          }

          onCambiarPersonas={
            setPersonasMinimas
          }

          onLimpiar={
            limpiarFiltros
          }

        />


        {/* ===================================================
            CALENDARIO PRINCIPAL
        =================================================== */}

        <CalendarioReservas

          mesas={
            mesasVisibles
          }

          horarios={
            horarios
          }

          titulo={
            formatearTituloVista(fechaSeleccionada, vista)
          }

          tituloCorto={
            formatearTituloCorto(fechaSeleccionada, vista)
          }

          dias={
            fechasEntre(rango.inicio, rango.fin)
          }

          onNavegar={
            navegar
          }

          onIrAHoy={() =>
            seleccionarFecha(fechaDeHoy())
          }

          reservas={
            reservasFiltradas
          }

          cargando={
            cargando
          }

          vista={
            vista
          }

          onCambiarVista={
            cambiarVista
          }

          onNuevaReserva={
            abrirNuevaReserva
          }

          reservaSeleccionada={
            reservaSeleccionada
          }

          onSeleccionarReserva={
            setReservaSeleccionada
          }

        />


        {/* ===================================================
            DETALLE DE LA RESERVA
        =================================================== */}

        <DetalleReserva

          key={
            reservaSeleccionada?._id ?? "sin-reserva"
          }

          reserva={
            reservaSeleccionada
          }

          accionEnCurso={
            accionEnCurso
          }

          onCerrar={() =>
            setReservaSeleccionada(null)
          }

          onCambiarEstado={
            cambiarEstado
          }

          onEditar={
            abrirEdicion
          }

          onEliminar={
            eliminar
          }

        />


      </section>


      {/* =====================================================
          MODAL PARA CREAR O EDITAR UNA RESERVA
      ===================================================== */}

      {/* Se monta al abrirse para que parta con los datos correctos */}
      {modal && (
      <ModalReserva

        mesas={
          mesas
        }

        horarios={
          horarios
        }

        reservaEditar={
          modal.reserva ?? null
        }

        valoresIniciales={
          modal.valores ?? {}
        }

        onCerrar={
          cerrarModal
        }

        onGuardar={
          guardarReserva
        }

      />
      )}


    </section>

  );

}
