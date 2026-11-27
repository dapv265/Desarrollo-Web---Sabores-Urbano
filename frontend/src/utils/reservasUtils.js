// Convierte una hora como "13:30" a minutos.
// Ejemplo: 13:30 -> 810 minutos.
export function convertirHoraAMinutos(hora) {
  const [horas, minutos] = hora.split(":").map(Number);

  return horas * 60 + minutos;
}


// Convierte minutos nuevamente a formato HH:mm.
// Ejemplo: 810 -> "13:30".
export function convertirMinutosAHora(minutosTotales) {
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  const horasTexto = horas
    .toString()
    .padStart(2, "0");

  const minutosTexto = minutos
    .toString()
    .padStart(2, "0");

  return `${horasTexto}:${minutosTexto}`;
}


// Calcula la hora final de una reserva
// usando la hora de inicio y su duración en minutos.
export function calcularHoraFinal(horaInicio, duracion) {
  const inicio = convertirHoraAMinutos(horaInicio);

  const fin = inicio + Number(duracion);

  return convertirMinutosAHora(fin);
}


// Comprueba si dos reservas se cruzan en horario.
export function hayCruceDeHorario(
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


export function comprobarDisponibilidadReserva({
  reservas,
  fecha,
  hora,
  mesa,
  duracion,
}) {
  if (!fecha || !hora || !mesa || !duracion) {
    return {
      disponible: false,
      mensaje:
        "Complete fecha, hora, mesa y duracion para comprobar disponibilidad.",
    };
  }

  const numeroMesa = Number(mesa);
  const horaFinal = calcularHoraFinal(hora, duracion);

  const reservaEnConflicto = reservas.find((reserva) => {
    const mismaFecha = reserva.fecha === fecha;
    const mismaMesa = Number(reserva.mesa) === numeroMesa;
    const estaCancelada = reserva.estado === "cancelada";

    return (
      mismaFecha &&
      mismaMesa &&
      !estaCancelada &&
      hayCruceDeHorario(
        hora,
        horaFinal,
        reserva.inicio,
        reserva.fin
      )
    );
  });

  if (reservaEnConflicto) {
    return {
      disponible: false,
      mensaje:
        `Mesa ${numeroMesa} no disponible entre ${hora} y ${horaFinal}.`,
    };
  }

  return {
    disponible: true,
    mensaje:
      `Mesa ${numeroMesa} disponible entre ${hora} y ${horaFinal}.`,
  };
}


// =========================================================
// FECHAS (formato AAAA-MM-DD, igual que el backend)
// =========================================================

const aDosDigitos = (numero) => String(numero).padStart(2, "0");

// Convierte un Date a "AAAA-MM-DD" usando la hora local
export function fechaATexto(fecha) {
  return `${fecha.getFullYear()}-${aDosDigitos(fecha.getMonth() + 1)}-${aDosDigitos(fecha.getDate())}`;
}

// Convierte "AAAA-MM-DD" a Date (hora local, mediodía para evitar saltos de zona horaria)
export function textoAFecha(texto) {
  const [anio, mes, dia] = texto.split("-").map(Number);
  return new Date(anio, mes - 1, dia, 12);
}

export function fechaDeHoy() {
  return fechaATexto(new Date());
}

export function sumarDias(texto, dias) {
  const fecha = textoAFecha(texto);
  fecha.setDate(fecha.getDate() + dias);
  return fechaATexto(fecha);
}

// Ej: "viernes, 16 de octubre de 2026"
export function formatearFechaLarga(texto) {
  return textoAFecha(texto).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}
