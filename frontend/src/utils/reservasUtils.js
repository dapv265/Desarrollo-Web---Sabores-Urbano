import { estadosReserva } from "../data/reservasData";

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


// Duración en minutos entre dos horas. Ej: "13:00" a "14:30" -> 90
export function calcularDuracion(inicio, fin) {
  return convertirHoraAMinutos(fin) - convertirHoraAMinutos(inicio);
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


// Indica si una reserva ocupa la franja que empieza en `hora`
// (desde su inicio hasta antes de su fin).
export function ocupaFranja(reserva, hora) {
  const minutos = convertirHoraAMinutos(hora);

  return (
    convertirHoraAMinutos(reserva.inicio) <= minutos &&
    minutos < convertirHoraAMinutos(reserva.fin)
  );
}


// Reparte las reservas en la grilla del día para dibujarlas como bloques (rowSpan).
// Devuelve un Map con clave "MESA|indiceFila":
//   { tipo: "inicio", reserva, filas }  -> celda donde empieza el bloque
//   { tipo: "cubierta", reserva }       -> celda tapada por el bloque (no se dibuja en escritorio)
// `reservas` debe venir ordenada por prioridad (activas antes que canceladas).
export function distribuirReservas(reservas, horarios) {
  const celdas = new Map();

  for (const reserva of reservas) {
    const filas = horarios
      .map((hora, indice) => (ocupaFranja(reserva, hora) ? indice : -1))
      .filter((indice) => indice >= 0);

    // Solo filas libres y consecutivas desde la primera
    const libres = [];

    for (const indice of filas) {
      const ocupada = celdas.has(`${reserva.mesa}|${indice}`);
      const salto = libres.length > 0 && indice !== libres[libres.length - 1] + 1;

      if (ocupada || salto) break;
      libres.push(indice);
    }

    if (libres.length === 0) continue;

    celdas.set(`${reserva.mesa}|${libres[0]}`, {
      tipo: "inicio",
      reserva,
      filas: libres.length,
    });

    for (const indice of libres.slice(1)) {
      celdas.set(`${reserva.mesa}|${indice}`, { tipo: "cubierta", reserva });
    }
  }

  return celdas;
}


// Texto visible de un estado. Ej: "en-espera" -> "En espera"
export function textoEstado(estado) {
  return estadosReserva.find((item) => item.valor === estado)?.texto ?? estado;
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

// Suma meses y ajusta el día si el mes destino es más corto (31 ene + 1 -> 28 feb)
export function sumarMeses(texto, meses) {
  const fecha = textoAFecha(texto);
  const destino = new Date(fecha.getFullYear(), fecha.getMonth() + meses, 1, 12);
  const ultimoDia = new Date(destino.getFullYear(), destino.getMonth() + 1, 0).getDate();
  destino.setDate(Math.min(fecha.getDate(), ultimoDia));
  return fechaATexto(destino);
}

// Lista de fechas desde `inicio` hasta `fin` (ambas incluidas)
export function fechasEntre(inicio, fin) {
  const fechas = [];

  for (let fecha = inicio; fecha <= fin; fecha = sumarDias(fecha, 1)) {
    fechas.push(fecha);
  }

  return fechas;
}

// Rango de fechas de la vista: un día, la semana (lunes a domingo) o el mes
export function obtenerRangoVista(texto, vista) {
  if (vista === "semana") {
    // getDay(): 0 = domingo; la semana parte el lunes
    const diasDesdeLunes = (textoAFecha(texto).getDay() + 6) % 7;
    const inicio = sumarDias(texto, -diasDesdeLunes);
    return { inicio, fin: sumarDias(inicio, 6) };
  }

  if (vista === "mes") {
    const fecha = textoAFecha(texto);
    return {
      inicio: fechaATexto(new Date(fecha.getFullYear(), fecha.getMonth(), 1, 12)),
      fin: fechaATexto(new Date(fecha.getFullYear(), fecha.getMonth() + 1, 0, 12)),
    };
  }

  return { inicio: texto, fin: texto };
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

// Ej: "lunes 23 de noviembre"
export function formatearDia(texto) {
  return textoAFecha(texto).toLocaleDateString("es-CL", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });
}

// Ej: "noviembre de 2026"
export function formatearMes(texto) {
  return textoAFecha(texto).toLocaleDateString("es-CL", {
    month: "long",
    year: "numeric",
  });
}

// Título de la barra del calendario según la vista
export function formatearTituloVista(texto, vista) {
  let titulo;

  if (vista === "semana") {
    const { inicio, fin } = obtenerRangoVista(texto, vista);
    const opciones = { day: "numeric", month: "long" };
    const mismoMes = inicio.slice(0, 7) === fin.slice(0, 7);
    // Ej: "Semana del 23 al 29 de noviembre de 2026" o "del 30 de noviembre al 6 de diciembre de 2026"
    const textoInicio = mismoMes
      ? String(textoAFecha(inicio).getDate())
      : textoAFecha(inicio).toLocaleDateString("es-CL", opciones);
    const textoFin = textoAFecha(fin).toLocaleDateString("es-CL", opciones);
    titulo = `Semana del ${textoInicio} al ${textoFin} de ${fin.slice(0, 4)}`;
  } else if (vista === "mes") {
    titulo = formatearMes(texto);
  } else {
    titulo = formatearFechaLarga(texto);
  }

  return titulo.charAt(0).toUpperCase() + titulo.slice(1);
}

const DIAS_CORTOS = ["Dom", "Lun", "Mar", "Mié", "Jue", "Vie", "Sáb"];
const MESES_CORTOS = ["ene", "feb", "mar", "abr", "may", "jun", "jul", "ago", "sep", "oct", "nov", "dic"];

// Título corto para pantallas angostas. Ej: "Sáb 14 nov 2026", "9 - 15 nov 2026", "Nov 2026"
export function formatearTituloCorto(texto, vista) {
  const fecha = textoAFecha(texto);
  const mes = MESES_CORTOS[fecha.getMonth()];

  if (vista === "semana") {
    const { inicio, fin } = obtenerRangoVista(texto, vista);
    const fechaInicio = textoAFecha(inicio);
    const fechaFin = textoAFecha(fin);
    const mesInicio = MESES_CORTOS[fechaInicio.getMonth()];
    const mesFin = MESES_CORTOS[fechaFin.getMonth()];
    const textoInicio = mesInicio === mesFin
      ? fechaInicio.getDate()
      : `${fechaInicio.getDate()} ${mesInicio}`;

    return `${textoInicio} - ${fechaFin.getDate()} ${mesFin} ${fechaFin.getFullYear()}`;
  }

  if (vista === "mes") {
    return `${mes.charAt(0).toUpperCase() + mes.slice(1)} ${fecha.getFullYear()}`;
  }

  return `${DIAS_CORTOS[fecha.getDay()]} ${fecha.getDate()} ${mes} ${fecha.getFullYear()}`;
}
