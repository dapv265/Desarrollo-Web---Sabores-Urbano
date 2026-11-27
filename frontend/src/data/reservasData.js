// Horarios de inicio permitidos (los mismos que valida el backend en utils/horarios.js)
export const horarios = [
  "12:00",
  "12:30",
  "13:00",
  "13:30",
  "14:00",
  "14:30",
  "15:00",
  "19:00",
  "19:30",
  "20:00",
  "20:30",
  "21:00",
  "21:30",
  "22:00",
];

// Estados de una reserva, en el orden en que se muestran
export const estadosReserva = [
  { valor: "pendiente", texto: "Pendiente" },
  { valor: "confirmada", texto: "Confirmada" },
  { valor: "en-espera", texto: "En espera" },
  { valor: "cancelada", texto: "Cancelada" },
];

// Duraciones que se ofrecen en el modal (minutos)
export const duraciones = [
  { valor: 60, texto: "1 hora" },
  { valor: 90, texto: "1 hora 30 minutos" },
  { valor: 120, texto: "2 horas" },
];

// Filtro de capacidad mínima de las mesas
export const opcionesPersonas = [2, 3, 4, 6, 8];
