
// Horarios de inicio permitidos para una reserva.
// Son los mismos que usa el frontend (frontend/src/data/reservasData.js).
export const HORARIOS_PERMITIDOS = [
  '12:00',
  '12:30',
  '13:00',
  '13:30',
  '14:00',
  '14:30',
  '15:00',
  '19:00',
  '19:30',
  '20:00',
  '20:30',
  '21:00',
  '21:30',
  '22:00'
];

// Formato de hora HH:mm (00:00 a 23:59).
export const REGEX_HORA = /^([01]\d|2[0-3]):[0-5]\d$/;

// Formato de hora de fin: igual que REGEX_HORA, pero acepta "24:00"
// (por ejemplo, una reserva de 22:00 con 2 horas de duración).
export const REGEX_HORA_FIN = /^(([01]\d|2[0-3]):[0-5]\d|24:00)$/;

// Convierte una hora como "13:30" a minutos.
// Ejemplo: 13:30 -> 810 minutos.
export const convertirHoraAMinutos = (hora) => {
  const [horas, minutos] = hora.split(':').map(Number);

  return horas * 60 + minutos;
};

// Convierte minutos nuevamente a formato HH:mm.
// Ejemplo: 810 -> "13:30".
export const convertirMinutosAHora = (minutosTotales) => {
  const horas = Math.floor(minutosTotales / 60);
  const minutos = minutosTotales % 60;

  const horasTexto = horas.toString().padStart(2, '0');
  const minutosTexto = minutos.toString().padStart(2, '0');

  return `${horasTexto}:${minutosTexto}`;
};

// Calcula la hora final de una reserva
// usando la hora de inicio y su duración en minutos.
export const calcularHoraFinal = (horaInicio, duracion) => {
  const inicio = convertirHoraAMinutos(horaInicio);

  const fin = inicio + Number(duracion);

  return convertirMinutosAHora(fin);
};

// Comprueba si dos reservas se cruzan en horario.
// Misma lógica que frontend/src/utils/reservasUtils.js.
export const hayCruceDeHorario = (
  inicioNueva,
  finNueva,
  inicioExistente,
  finExistente
) => {
  const inicioNuevaMinutos = convertirHoraAMinutos(inicioNueva);
  const finNuevaMinutos = convertirHoraAMinutos(finNueva);
  const inicioExistenteMinutos = convertirHoraAMinutos(inicioExistente);
  const finExistenteMinutos = convertirHoraAMinutos(finExistente);

  return (
    inicioNuevaMinutos < finExistenteMinutos &&
    finNuevaMinutos > inicioExistenteMinutos
  );
};

// Comprueba que un texto "AAAA-MM-DD" sea una fecha real del calendario.
// Ejemplo: "2026-02-30" -> false.
export const esFechaValida = (fecha) => {
  if (typeof fecha !== 'string' || !/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
    return false;
  }

  const [anio, mes, dia] = fecha.split('-').map(Number);
  const fechaCalendario = new Date(Date.UTC(anio, mes - 1, dia));

  return (
    fechaCalendario.getUTCFullYear() === anio &&
    fechaCalendario.getUTCMonth() === mes - 1 &&
    fechaCalendario.getUTCDate() === dia
  );
};
