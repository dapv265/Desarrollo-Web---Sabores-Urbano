/* =========================================================
   DATOS DE EJEMPLO
   Estas reservas sirven para mostrar el diseno y validar
   la disponibilidad dentro de la maqueta.
========================================================= */

const reservasDeEjemplo = [
    {
        cliente: "Carlos Martínez",
        mesa: "3",
        fecha: "2024-10-16",
        inicio: "12:00",
        fin: "13:00",
        personas: 4,
        estado: "en-espera"
    },

    {
        cliente: "Valentina Rodríguez",
        mesa: "1",
        fecha: "2024-10-16",
        inicio: "13:00",
        fin: "14:30",
        personas: 2,
        estado: "confirmada"
    },

    {
        cliente: "Ana Torres",
        mesa: "5",
        fecha: "2024-10-16",
        inicio: "13:30",
        fin: "15:00",
        personas: 6,
        estado: "pendiente"
    },

    {
        cliente: "Diego Silva",
        mesa: "2",
        fecha: "2024-10-16",
        inicio: "15:00",
        fin: "16:30",
        personas: 2,
        estado: "cancelada"
    },

    {
        cliente: "Familia López",
        mesa: "4",
        fecha: "2024-10-16",
        inicio: "17:00",
        fin: "19:00",
        personas: 4,
        estado: "confirmada"
    },

    {
        cliente: "Martín Pérez",
        mesa: "1",
        fecha: "2024-10-16",
        inicio: "18:30",
        fin: "20:00",
        personas: 2,
        estado: "pendiente"
    },

    {
        cliente: "Camila González",
        mesa: "5",
        fecha: "2024-10-16",
        inicio: "19:00",
        fin: "21:00",
        personas: 6,
        estado: "en-espera"
    },

    {
        cliente: "Laura y Andrés",
        mesa: "6",
        fecha: "2024-10-16",
        inicio: "20:00",
        fin: "22:00",
        personas: 6,
        estado: "confirmada"
    }
];


/* =========================================================
   ELEMENTOS PRINCIPALES DEL HTML
========================================================= */

const botonAbrirModal =
    document.getElementById("abrirModalReserva");

const modalReserva =
    document.getElementById("modalReserva");

const botonCerrarModal =
    document.getElementById("cerrarModalReserva");

const botonCancelarModal =
    document.getElementById("cancelarModalReserva");

const formularioReserva =
    document.getElementById("formularioReserva");


/* CAMPOS DEL FORMULARIO */

const nombreCliente =
    document.getElementById("nombreCliente");

const telefonoCliente =
    document.getElementById("telefonoCliente");

const personasReserva =
    document.getElementById("personasReserva");

const fechaReserva =
    document.getElementById("fechaReserva");

const horaReserva =
    document.getElementById("horaReserva");

const duracionReserva =
    document.getElementById("duracionReserva");

const mesaReserva =
    document.getElementById("mesaReserva");

const observacionesReserva =
    document.getElementById("observacionesReserva");

const mensajeDisponibilidad =
    document.getElementById("mensajeDisponibilidad");


/* =========================================================
   ABRIR Y CERRAR EL MODAL DE NUEVA RESERVA
========================================================= */

botonAbrirModal.addEventListener(
    "click",
    function () {

        modalReserva.classList.add("activo");

    }
);


botonCerrarModal.addEventListener(
    "click",
    cerrarModal
);


botonCancelarModal.addEventListener(
    "click",
    cerrarModal
);


function cerrarModal() {

    modalReserva.classList.remove("activo");

}


/* Cierra el modal cuando se hace clic sobre el fondo oscuro. */

modalReserva.addEventListener(
    "click",
    function (evento) {

        if (evento.target === modalReserva) {

            cerrarModal();

        }

    }
);


/* =========================================================
   CONVERTIR HORA A MINUTOS
========================================================= */

function convertirHoraAMinutos(hora) {

    const partes = hora.split(":");

    const horas =
        parseInt(partes[0]);

    const minutos =
        parseInt(partes[1]);

    return horas * 60 + minutos;

}


/* =========================================================
   CONVERTIR MINUTOS A HORA
========================================================= */

function convertirMinutosAHora(minutosTotales) {

    const horas =
        Math.floor(minutosTotales / 60);

    const minutos =
        minutosTotales % 60;

    const horasTexto =
        horas.toString().padStart(2, "0");

    const minutosTexto =
        minutos.toString().padStart(2, "0");

    return horasTexto + ":" + minutosTexto;

}


/* =========================================================
   CALCULAR HORA FINAL
========================================================= */

function calcularHoraFinal(
    horaInicio,
    duracion
) {

    const inicio =
        convertirHoraAMinutos(horaInicio);

    const fin =
        inicio + parseInt(duracion);

    return convertirMinutosAHora(fin);

}


/* =========================================================
   VALIDAR CRUCE DE HORARIOS
========================================================= */

function hayCruceDeHorario(
    inicioNueva,
    finNueva,
    inicioExistente,
    finExistente
) {

    const inicioNuevaMinutos =
        convertirHoraAMinutos(inicioNueva);

    const finNuevaMinutos =
        convertirHoraAMinutos(finNueva);

    const inicioExistenteMinutos =
        convertirHoraAMinutos(inicioExistente);

    const finExistenteMinutos =
        convertirHoraAMinutos(finExistente);


    return (
        inicioNuevaMinutos < finExistenteMinutos &&
        finNuevaMinutos > inicioExistenteMinutos
    );

}


/* =========================================================
   MOSTRAR MENSAJE DE DISPONIBILIDAD
========================================================= */

function mostrarMensajeDisponibilidad(
    texto,
    tipo
) {

    const textoMensajeDisponibilidad =
        mensajeDisponibilidad.querySelector("span");

    textoMensajeDisponibilidad.textContent =
        texto;


    mensajeDisponibilidad.classList.remove(
        "disponible",
        "no-disponible"
    );


    if (tipo) {

        mensajeDisponibilidad.classList.add(tipo);

    }

}


/* =========================================================
   COMPROBAR SI LA MESA ESTA DISPONIBLE
========================================================= */

function comprobarDisponibilidad() {

    const fecha =
        fechaReserva.value;

    const hora =
        horaReserva.value;

    const mesa =
        mesaReserva.value;

    const duracion =
        duracionReserva.value;


    if (!fecha || !hora || !mesa) {

        mostrarMensajeDisponibilidad(
            "Seleccione fecha, hora y mesa para comprobar disponibilidad.",
            ""
        );

        return false;

    }


    const horaFinal =
        calcularHoraFinal(
            hora,
            duracion
        );


    const conflicto =
        reservasDeEjemplo.find(
            function (reserva) {

                if (
                    reserva.estado === "cancelada"
                ) {

                    return false;

                }


                const mismaFecha =
                    reserva.fecha === fecha;

                const mismaMesa =
                    reserva.mesa === mesa;

                const hayCruce =
                    hayCruceDeHorario(
                        hora,
                        horaFinal,
                        reserva.inicio,
                        reserva.fin
                    );


                return (
                    mismaFecha &&
                    mismaMesa &&
                    hayCruce
                );

            }
        );


    if (conflicto) {

        mostrarMensajeDisponibilidad(
            "La Mesa " +
            mesa +
            " ya está reservada de " +
            conflicto.inicio +
            " a " +
            conflicto.fin +
            ". Seleccione otro horario.",
            "no-disponible"
        );


        return false;

    }


    mostrarMensajeDisponibilidad(
        "¡Perfecto! La Mesa " +
        mesa +
        " está disponible de " +
        hora +
        " a " +
        horaFinal +
        ".",
        "disponible"
    );


    return true;

}


/* =========================================================
   COMPROBAR AL CAMBIAR CAMPOS
========================================================= */

fechaReserva.addEventListener(
    "change",
    comprobarDisponibilidad
);

horaReserva.addEventListener(
    "change",
    comprobarDisponibilidad
);

duracionReserva.addEventListener(
    "change",
    comprobarDisponibilidad
);

mesaReserva.addEventListener(
    "change",
    comprobarDisponibilidad
);


/* =========================================================
   SIMULAR CREACION DE RESERVA
========================================================= */

formularioReserva.addEventListener(
    "submit",
    function (evento) {

        evento.preventDefault();


        const estaDisponible =
            comprobarDisponibilidad();


        if (!estaDisponible) {

            mostrarMensajeDisponibilidad(
                "No se puede crear la reserva porque existe un conflicto de horario.",
                "no-disponible"
            );

            return;

        }


        const horaFinal =
            calcularHoraFinal(
                horaReserva.value,
                duracionReserva.value
            );


        const nuevaReservaDeEjemplo = {

            cliente:
                nombreCliente.value,

            telefono:
                telefonoCliente.value,

            personas:
                parseInt(personasReserva.value),

            fecha:
                fechaReserva.value,

            inicio:
                horaReserva.value,

            fin:
                horaFinal,

            mesa:
                mesaReserva.value,

            observaciones:
                observacionesReserva.value,

            estado:
                "confirmada"

        };


        // Solo se guarda mientras la pagina esta abierta.
        reservasDeEjemplo.push(nuevaReservaDeEjemplo);


        formularioReserva.reset();


        mostrarMensajeDisponibilidad(
            "Seleccione fecha, hora y mesa para comprobar disponibilidad.",
            ""
        );


        cerrarModal();

    }
);


/* =========================================================
   MOSTRAR DETALLE DE UNA RESERVA
========================================================= */

const tarjetasReserva =
    document.querySelectorAll(".reserva");

const detalleCliente =
    document.getElementById("detalleCliente");

const detalleHorario =
    document.getElementById("detalleHorario");

const detallePersonas =
    document.getElementById("detallePersonas");

const detalleMesa =
    document.getElementById("detalleMesa");


tarjetasReserva.forEach(
    function (tarjeta) {

        tarjeta.addEventListener(
            "click",
            function () {

                detalleCliente.textContent =
                    tarjeta.dataset.cliente;

                detalleHorario.textContent =
                    tarjeta.dataset.horario;

                detallePersonas.textContent =
                    tarjeta.dataset.personas;

                detalleMesa.textContent =
                    tarjeta.dataset.mesa;

            }
        );

    }
);


/* =========================================================
   MINI CALENDARIO
========================================================= */

const botonesDiasMiniCalendario =
    document.querySelectorAll(
        ".dias-mini-calendario button"
    );


botonesDiasMiniCalendario.forEach(
    function (botonDia) {

        botonDia.addEventListener(
            "click",
            function () {

                botonesDiasMiniCalendario.forEach(
                    function (otroBotonDia) {

                        otroBotonDia.classList.remove(
                            "dia-seleccionado"
                        );

                    }
                );


                botonDia.classList.add(
                    "dia-seleccionado"
                );

            }
        );

    }
);


/* =========================================================
   CAMBIAR BOTON ACTIVO DE VISTA
========================================================= */

const botonesCambioVista =
    document.querySelectorAll(
        ".botones-vista button"
    );


botonesCambioVista.forEach(
    function (botonVista) {

        botonVista.addEventListener(
            "click",
            function () {

                botonesCambioVista.forEach(
                    function (otroBotonVista) {

                        otroBotonVista.classList.remove(
                            "vista-activa"
                        );

                    }
                );


                botonVista.classList.add(
                    "vista-activa"
                );

            }
        );

    }
);


/* =========================================================
   RESTABLECER FILTROS VISUALES
========================================================= */

const botonLimpiarFiltros =
    document.querySelector(
        ".boton-limpiar-filtros"
    );


botonLimpiarFiltros.addEventListener(
    "click",
    function () {

        const casillasFiltroEstado =
            document.querySelectorAll(
                ".opcion-filtro input"
            );


        casillasFiltroEstado.forEach(
            function (casillaFiltro) {

                casillaFiltro.checked = true;

            }
        );


        document.getElementById(
            "restaurante"
        ).selectedIndex = 0;


        document.getElementById(
            "cantidadPersonas"
        ).selectedIndex = 0;

    }
);


